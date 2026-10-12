#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# CONFIGURATION VARIABLES
# ==============================================================================
TEMPLATE_ID=9003
TEMPLATE_NAME="ubuntu-24-sfnetworks-template"
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

echo "=== 3. INJECTING GUEST AGENT & BAKING SF NETWORKS BRANDING ==="
apt update && apt install -y libguestfs-tools

# Create the staging MOTD file on the Proxmox host
cat << 'EOF' > /tmp/00-provider-branding
#!/bin/sh
echo "\033[1;36m" # Changes terminal color to a vibrant Cyan
cat << "BANNER"
 ▗▄▄▖▗▄▄▄▖    ▗▖  ▗▖▗▄▄▄▖▗▄▄▄▖▗▖ ▗▖ ▗▄▖ ▗▄▄▖ ▗▖ ▗▖ ▗▄▄▖
▐▌   ▐▌       ▐▛▚▖▐▌▐▌     █  ▐▌ ▐▌▐▌ ▐▌▐▌ ▐▌▐▌▗▞▘▐▌   
 ▝▀▚▖▐▛▀▀▘    ▐▌ ▝▜▌▐▛▀▀▘  █  ▐▌ ▐▌▐▌ ▐▌▐▛▀▚▖▐▛▚▖  ▝▀▚▖
▗▄▄▞▘▐▌       ▐▌  ▐▌▐▙▄▄▖  █  ▐▙█▟▌▝▚▄▞▘▐▌ ▐▌▐▌ ▐▌▗▄▄▞▘

BANNER
echo "\033[0m" # Resets terminal text color
echo " Welcome to your high-performance SF NETWORKS virtual server!"
echo " sfnetworks.com"
echo " ------------------------------------------------------------"
EOF

# Use virt-customize to inject the agent, root configs, and branding layout
virt-customize -a "$IMAGE" \
  --install qemu-guest-agent \
  --run-command 'systemctl enable qemu-guest-agent' \
  --run-command 'sed -i "s/disable_root: true/disable_root: false/g" /etc/cloud/cloud.cfg' \
  --run-command 'sed -i "s/disable_root: true/disable_root: false/g" /etc/cloud/cloud.cfg.d/*' \
  --copy-in /tmp/00-provider-branding:/etc/update-motd.d/ \
  --chmod 0755:/etc/update-motd.d/00-provider-branding \
  --run-command 'chmod -x /etc/update-motd.d/10-help-text' \
  --run-command 'chmod -x /etc/update-motd.d/50-motd-news' \
  --run-command 'chmod -x /etc/update-motd.d/88-esm-announce' 2>/dev/null || true

# Clean up temporary staging asset
rm -f /tmp/00-provider-branding

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
echo "=== SUCCESS: SF NETWORKS Template ${TEMPLATE_ID} is ready! ==="