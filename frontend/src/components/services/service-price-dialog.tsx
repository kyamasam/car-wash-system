"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServicesStore } from "@/stores/services-store";
import type { CommissionType, ServiceCategory, ServicePrice } from "@/types/services/service";

interface ServicePriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceId: string;
  serviceCategory: ServiceCategory;
  price?: ServicePrice;
  onSaved: () => void;
}

export function ServicePriceDialog({
  open,
  onOpenChange,
  serviceId,
  serviceCategory,
  price,
  onSaved,
}: ServicePriceDialogProps) {
  const { createServicePrice, updateServicePrice } = useServicesStore();

  const [vehicleCategory, setVehicleCategory] = React.useState("");
  const [sizeLabel, setSizeLabel] = React.useState("");
  const [priceValue, setPriceValue] = React.useState("");
  const [commissionValue, setCommissionValue] = React.useState("");
  const [commissionType, setCommissionType] = React.useState<CommissionType>("fixed");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setVehicleCategory(price?.vehicle_category ?? "");
      setSizeLabel(price?.size_label ?? "");
      setPriceValue(price?.price ?? "");
      setCommissionValue(price?.commission_value ?? "");
      setCommissionType(price?.commission_type ?? "fixed");
      setError(null);
    }
  }, [open, price]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!priceValue.trim() || !commissionValue.trim()) {
      setError("Price and commission value are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        service: serviceId,
        vehicle_category: vehicleCategory.trim() || undefined,
        size_label: sizeLabel.trim() || undefined,
        price: priceValue.trim(),
        commission_value: commissionValue.trim(),
        commission_type: commissionType,
      };
      if (price) {
        await updateServicePrice(price.id, payload);
      } else {
        await createServicePrice(payload);
      }
      onSaved();
      onOpenChange(false);
    } catch {
      setError("Failed to save price. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{price ? "Edit Price" : "Add Price"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {serviceCategory === "vehicle" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sp-vcat">Vehicle Category</Label>
              <Input
                id="sp-vcat"
                placeholder="e.g. saloon, suv…"
                value={vehicleCategory}
                onChange={(e) => setVehicleCategory(e.target.value)}
              />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sp-size">Size Label</Label>
            <Input
              id="sp-size"
              placeholder="e.g. small, large…"
              value={sizeLabel}
              onChange={(e) => setSizeLabel(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sp-price">Price</Label>
            <Input
              id="sp-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sp-comm">Commission</Label>
              <Input
                id="sp-comm"
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
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter showCloseButton>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : price ? "Save Changes" : "Add Price"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
