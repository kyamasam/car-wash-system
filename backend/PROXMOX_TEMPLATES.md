```sh
#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# CONFIGURATION VARIABLES
# ==============================================================================
TEMPLATE_ID=9003
TEMPLATE_NAME="ubuntu-24-api-clean-template"
STORAGE_POOL="local-lvm"
BRIDGE_NET="vmbr0"
ISO_DIR="/var/lib/vz/template/iso"
IMAGE="${ISO_DIR}/noble-server-cloudimg-amd64.img"

echo "=== 1. CLEANING UP PREVIOUS TEMPLATE ==="
qm stop "$TEMPLATE_ID" --skiplock 1 2>/dev/null || true
qm destroy "$TEMPLATE_ID" --purge 2>/dev/null || true

echo "=== 2. DOWNLOADING FRESH UBUNTU 24.04 IMAGE IF MISSING ==="
mkdir -p "$ISO_DIR"
if [ ! -f "$IMAGE" ]; then
    echo "Downloading raw cloud image..."
    wget -O "$IMAGE" https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img
else
    echo "Image found. Skipping download."
fi

echo "=== 3. INJECTING QEMU GUEST AGENT & LIFITING ROOT LOCKS ==="
apt update && apt install -y libguestfs-tools

# This modifies the base cloud image to run the guest agent immediately on first boot
# and stops cloud-init from destroying or locking out the root environment.
virt-customize -a "$IMAGE" \
  --install qemu-guest-agent \
  --run-command 'systemctl enable qemu-guest-agent' \
  --run-command 'sed -i "s/disable_root: true/disable_root: false/g" /etc/cloud/cloud.cfg' \
  --run-command 'sed -i "s/disable_root: true/disable_root: false/g" /etc/cloud/cloud.cfg.d/*' 2>/dev/null || true

echo "=== 4. CREATING VM SHELL STRUCTURE ==="
qm create "$TEMPLATE_ID" \
  --name "$TEMPLATE_NAME" \
  --memory 1024 \
  --cores 1 \
  --net0 virtio,bridge="${BRIDGE_NET}"

echo "=== 5. IMPORTING DISK LAYER ==="
qm importdisk "$TEMPLATE_ID" "$IMAGE" "$STORAGE_POOL"
qm set "$TEMPLATE_ID" --scsihw virtio-scsi-pci --scsi0 "${STORAGE_POOL}:vm-${TEMPLATE_ID}-disk-0"

echo "=== 6. BINDING CLOUD-INIT DRIVE & CORES ==="
qm set "$TEMPLATE_ID" \
  --ide2 "${STORAGE_POOL}:cloudinit" \
  --bootdisk scsi0 \
  --serial0 socket \
  --vga serial0 \
  --ipconfig0 ip=dhcp \
  --ciuser root \
  --agent enabled=1

echo "=== 7. ENFORCING BOOT SEQUENCE ==="
qm set "$TEMPLATE_ID" --boot order=scsi0

echo "=== 8. CREATING SNIPPETS FOR API FLEXIBILITY ==="
mkdir -p /var/lib/vz/snippets

# This stripped cloud-init user data configures the box to drop traditional password auth
# fallbacks by default, meaning it sits locked down until your API injects access credentials.
cat > /var/lib/vz/snippets/cloud-init-api-clean.yaml << 'EOF'
#cloud-config
disable_root: False
ssh_pwauth: False
EOF

cat > /var/lib/vz/snippets/cloud-init-vendor.yaml << 'EOF'
#cloud-config
{}
EOF

pvesm set local --content vztmpl,iso,snippets
qm set "$TEMPLATE_ID" --cicustom "user=local:snippets/cloud-init-api-clean.yaml,vendor=local:snippets/cloud-init-vendor.yaml"
qm cloudinit update "$TEMPLATE_ID"

echo "=== 9. CONVERTING TO FINAL GOLD TEMPLATE ==="
qm template "$TEMPLATE_ID"
echo "=== SUCCESS: Template ${TEMPLATE_ID} (${TEMPLATE_NAME}) is locked, loaded, and clean! ==="
```

## Validate the Template

Check the Proxmox config layout structure manually:

```bash
qm config 9001
```

Required confirmation lines output:

```text
scsi0: local-lvm:base-9001-disk-0,size=...
ide2: local-lvm:vm-9001-cloudinit,media=cdrom
bootdisk: scsi0
boot: order=scsi0
ipconfig0: ip=dhcp
agent: enabled=1
cicustom: user=local:snippets/cloud-init-root.yaml,vendor=local:snippets/cloud-init-vendor.yaml
template: 1
```

Check block storage status:

```bash
pvesm list local-lvm | grep "9001"
lvs | grep "9001"
```

You should see both the base OS volume snapshot layer and the cloud-init disk.

## Seed Django

From the backend project directory:

```bash
uv run python manage.py migrate

uv run python manage.py init_proxmox \
  --os-slug ubuntu_24_04 \
  --template-id 9001 \
  --template-name "Ubuntu 24.04 Agent Template" \
  --node pve \
  --boot-disk scsi0 \
  --storage local-lvm
```

The provisioner will select this template for order items using the matching
operating system.

## Test a Clone

Create a test clone:

```bash
qm clone 9001 9102 --name ubuntu-24-template-test --full 1
qm resize 9102 scsi0 25G
qm start 9102
```

Check the clone:

```bash
qm config 9102
qm status 9102
```

After the VM boots, test the guest agent:

```bash
qm guest cmd 9102 ping
```

If the agent fails, the package is not installed or not running inside the
guest. Rebuild the template with `virt-customize` or install the package inside
a build VM and convert that VM to a template.

Delete the test VM when done:

```bash
qm stop 9102
qm destroy 9102 --purge
```

## Troubleshooting

### Bootdisk size is zero

The template does not have a real boot disk attached. Check:

```bash
qm config <template_id>
```

If you see `unused0` but no `scsi0`, attach the disk:

```bash
qm set <template_id> --scsi0 local-lvm:vm-<template_id>-disk-0
qm set <template_id> --boot c --bootdisk scsi0
```

If there is no `unused0` and no `scsi0`, import the cloud image again:

```bash
qm importdisk <template_id> /var/lib/vz/template/iso/noble-server-cloudimg-amd64.img local-lvm
qm set <template_id> --scsi0 local-lvm:vm-<template_id>-disk-0
```

### no such logical volume

The VM config references a disk that no longer exists in LVM. Re-import the
cloud image or create a fresh template. Do not rely on stale `unused0` entries.

### Guest Agent not running

This is expected if the VM is stopped. Start the VM:

```bash
qm start <vmid>
qm guest cmd <vmid> ping
```

If it still fails after boot, the Ubuntu image does not have
`qemu-guest-agent` installed and enabled. Bake it into the image with
`virt-customize` before importing the disk.

### Use of uninitialized value in Cloudinit.pm

If Proxmox logs this while generating the cloud-init ISO:

```text
Use of uninitialized value in split at /usr/share/perl5/PVE/QemuServer/Cloudinit.pm line 115.
```

The most common cause in this runbook is a `cicustom` value that only sets
`user=...` and leaves optional vendor data undefined on affected Proxmox
versions. Create an empty vendor-data snippet and attach it with the user-data
snippet:

```bash
cat > /var/lib/vz/snippets/cloud-init-vendor.yaml << 'EOF'
#cloud-config
{}
EOF

qm set <template_id> --cicustom "user=local:snippets/cloud-init-root.yaml,vendor=local:snippets/cloud-init-vendor.yaml"
qm cloudinit update <template_id>
```

If the warning is on an already cloned VM, update the clone as well:

```bash
qm set <vmid> --cicustom "user=local:snippets/cloud-init-root.yaml,vendor=local:snippets/cloud-init-vendor.yaml"
qm cloudinit update <vmid>
```

Upgrading the Proxmox `qemu-server` package also fixes Proxmox releases where
omitted vendor data triggers this warning.

### Provisioner says template is not ready

Run:

```bash
qm config <template_id>
```

The template must have the configured boot disk, usually `scsi0`. The Django
command can validate the same thing:

```bash
uv run python manage.py init_proxmox \
  --os-slug ubuntu_24_04 \
  --template-id <template_id> \
  --node pve \
  --boot-disk scsi0 \
  --storage local-lvm
```

If validation fails, fix the Proxmox template before provisioning customer VMs.
