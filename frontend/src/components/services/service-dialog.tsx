"use client";

import * as React from "react";

import { useServicesStore } from "@/stores/services-store";
import type { Service } from "@/types/services/service";
import { SIZE_UNIT_LABELS } from "@/types/services/service";
import type { CommissionType, ServiceCategory, ServiceUnit, SizeUnit } from "@/types/services/service";
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
  const { createService, updateService, createServicePrice } = useServicesStore();

  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [codeManuallyEdited, setCodeManuallyEdited] = React.useState(false);
  const [category, setCategory] = React.useState<ServiceCategory>("vehicle");
  const [unit, setUnit] = React.useState<ServiceUnit>("per_job");
  const [sizeUnit, setSizeUnit] = React.useState<SizeUnit>("sq_ft");
  const [rate, setRate] = React.useState("");
  const [commissionValue, setCommissionValue] = React.useState("");
  const [commissionType, setCommissionType] = React.useState<CommissionType>("fixed");
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
      setSizeUnit(service?.size_unit ?? "sq_ft");
      setRate("");
      setCommissionValue("");
      setCommissionType("fixed");
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
    const isBySize = unit === "by_size";
    const withRate = isBySize && !service;
    if (withRate && (!rate.trim() || !commissionValue.trim())) {
      setError("Rate and commission are required for By Size services.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        category,
        unit,
        size_unit: isBySize ? sizeUnit : null,
        is_active: isActive,
      };
      if (service) {
        await updateService(service.id, payload);
      } else {
        const created = await createService(payload);
        if (withRate) {
          try {
            await createServicePrice({
              service: created.id,
              price: rate.trim(),
              commission_value: commissionValue.trim(),
              commission_type: commissionType,
            });
          } catch {
            onSaved();
            setError("Service created, but the rate failed to save. Add it from the service's prices.");
            return;
          }
        }
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
          {unit === "by_size" && (
            <div className="flex flex-col gap-4 rounded-md border bg-muted/30 p-3">
              <div className="flex flex-col gap-1.5">
                <Label>Measured in</Label>
                <Select value={sizeUnit} onValueChange={(v) => setSizeUnit(v as SizeUnit)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SIZE_UNIT_LABELS) as SizeUnit[]).map((u) => (
                      <SelectItem key={u} value={u}>
                        {SIZE_UNIT_LABELS[u]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!service && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="svc-rate">Rate per {SIZE_UNIT_LABELS[sizeUnit]}</Label>
                    <Input
                      id="svc-rate"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="svc-comm">Commission</Label>
                      <Input
                        id="svc-comm"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={commissionValue}
                        onChange={(e) => setCommissionValue(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Type</Label>
                      <Select
                        value={commissionType}
                        onValueChange={(v) => setCommissionType(v as CommissionType)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Amount</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
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
