"use client";

import * as React from "react";

import { useServicesStore } from "@/stores/services-store";
import type { Service } from "@/types/services/service";
import type { ServiceCategory, ServiceUnit } from "@/types/services/service";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service;
  onSaved: () => void;
}

export function ServiceDialog({ open, onOpenChange, service, onSaved }: ServiceDialogProps) {
  const { createService, updateService } = useServicesStore();

  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [codeManuallyEdited, setCodeManuallyEdited] = React.useState(false);
  const [category, setCategory] = React.useState<ServiceCategory>("vehicle");
  const [unit, setUnit] = React.useState<ServiceUnit>("per_job");
  const [isActive, setIsActive] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setName(service?.name ?? "");
      setCode(service?.code ?? "");
      setCodeManuallyEdited(!!service);
      setCategory(service?.category ?? "vehicle");
      setUnit(service?.unit ?? "per_job");
      setIsActive(service?.is_active ?? true);
      setError(null);
    }
  }, [open, service]);

  function generateCode(value: string) {
    return value
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!codeManuallyEdited) {
      setCode(generateCode(value));
    }
  }

  function handleCodeChange(value: string) {
    setCode(value);
    setCodeManuallyEdited(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError("Name and code are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim(), code: code.trim(), category, unit, is_active: isActive };
      if (service) {
        await updateService(service.id, payload);
      } else {
        await createService(payload);
      }
      onSaved();
      onOpenChange(false);
    } catch {
      setError("Failed to save service. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{service ? "Edit Service" : "New Service"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="svc-name">Name</Label>
            <Input
              id="svc-name"
              placeholder="e.g. Full Wash"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="svc-code">Code</Label>
            <Input
              id="svc-code"
              placeholder="e.g. FULL_WASH"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ServiceCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="carpet">Carpet</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={(v) => setUnit(v as ServiceUnit)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_job">Per Job</SelectItem>
                  <SelectItem value="per_item">Per Item</SelectItem>
                  <SelectItem value="by_size">By Size</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="svc-active"
              checked={isActive}
              onCheckedChange={(v) => setIsActive(!!v)}
            />
            <Label htmlFor="svc-active" className="cursor-pointer">
              Active
            </Label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter showCloseButton>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : service ? "Save Changes" : "Create Service"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
