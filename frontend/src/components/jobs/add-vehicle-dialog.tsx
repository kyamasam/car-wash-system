"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";
import { useApiMutation } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import type { Vehicle, VehicleCategory } from "@/types/customers/customer";

const VEHICLE_CATEGORIES: { value: VehicleCategory; label: string }[] = [
  { value: "saloon", label: "Saloon" },
  { value: "suv", label: "SUV" },
  { value: "pickup", label: "Pickup" },
  { value: "matatu", label: "Matatu" },
  { value: "lorry", label: "Lorry" },
  { value: "other", label: "Other" },
];

interface AddVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (vehicle: Vehicle) => void;
  defaultCustomerId?: string;
}

interface VehiclePayload {
  plate_number: string;
  vehicle_category: VehicleCategory | "";
  make: string;
  model: string;
  color: string;
  customer?: string;
}

export function AddVehicleDialog({
  open,
  onOpenChange,
  onCreated,
  defaultCustomerId,
}: AddVehicleDialogProps) {
  const [form, setForm] = React.useState<VehiclePayload>({
    plate_number: "",
    vehicle_category: "",
    make: "",
    model: "",
    color: "",
  });

  const { mutate, isPending } = useApiMutation<Vehicle, VehiclePayload>({
    method: "POST",
    url: "/customers/vehicles/",
    onSuccess: (data) => {
      onCreated(data);
      onOpenChange(false);
      setForm({ plate_number: "", vehicle_category: "", make: "", model: "", color: "" });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: VehiclePayload = { ...form };
    if (defaultCustomerId) payload.customer = defaultCustomerId;
    mutate(payload);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="v-plate">Plate Number <span className="text-destructive">*</span></Label>
            <Input
              id="v-plate"
              placeholder="e.g. KCA 123A"
              value={form.plate_number}
              onChange={(e) =>
                setForm((f) => ({ ...f, plate_number: e.target.value.toUpperCase() }))
              }
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={form.vehicle_category}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, vehicle_category: v as VehicleCategory }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="v-make">Make</Label>
              <Input
                id="v-make"
                placeholder="e.g. Toyota"
                value={form.make}
                onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-model">Model</Label>
              <Input
                id="v-model"
                placeholder="e.g. Corolla"
                value={form.model}
                onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-color">Color</Label>
            <Input
              id="v-color"
              placeholder="e.g. White"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Add Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddVehicleButton({
  onCreated,
  defaultCustomerId,
}: {
  onCreated: (vehicle: Vehicle) => void;
  defaultCustomerId?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent"
      >
        <PlusIcon className="size-4" />
        Add new vehicle
      </button>
      <AddVehicleDialog
        open={open}
        onOpenChange={setOpen}
        onCreated={onCreated}
        defaultCustomerId={defaultCustomerId}
      />
    </>
  );
}
