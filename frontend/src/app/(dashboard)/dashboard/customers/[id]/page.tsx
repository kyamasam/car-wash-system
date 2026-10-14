"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, Loader2Icon, Trash2Icon, PlusIcon, CarIcon } from "lucide-react";

import { useCustomersStore } from "@/stores/customers-store";
import { useVehiclesStore } from "@/stores/vehicles-store";
import { AddVehicleDialog } from "@/components/jobs/add-vehicle-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { UpdateCustomerPayload, Vehicle } from "@/types/customers/customer";

const VEHICLE_CATEGORY_LABELS: Record<string, string> = {
  saloon: "Saloon",
  suv: "SUV",
  pickup: "Pickup",
  matatu: "Matatu",
  lorry: "Lorry",
  other: "Other",
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const {
    currentCustomer,
    currentCustomerLoading,
    currentCustomerError,
    fetchCustomerById,
    updateCustomer,
    deleteCustomer,
  } = useCustomersStore();

  const { vehiclesList, vehiclesListLoading, fetchVehiclesList, deleteVehicle } = useVehiclesStore();

  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  const [addVehicleOpen, setAddVehicleOpen] = React.useState(false);
  const [vehicleToDelete, setVehicleToDelete] = React.useState<Vehicle | null>(null);
  const [isDeletingVehicle, setIsDeletingVehicle] = React.useState(false);

  React.useEffect(() => {
    fetchCustomerById(id);
    fetchVehiclesList({ customer: id });
  }, [id]);

  React.useEffect(() => {
    if (currentCustomer) {
      setForm({
        name: currentCustomer.name ?? "",
        phone: currentCustomer.phone,
        email: currentCustomer.email ?? "",
        notes: currentCustomer.notes ?? "",
      });
      setDirty(false);
    }
  }, [currentCustomer]);

  function handleChange(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setDirty(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: UpdateCustomerPayload = {
        name: form.name || null,
        phone: form.phone,
        email: form.email || null,
        notes: form.notes || null,
      };
      await updateCustomer(id, payload);
      setDirty(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteCustomer(id);
      router.push("/dashboard/customers");
    } finally {
      setIsDeleting(false);
    }
  }

  function handleVehicleCreated(vehicle: Vehicle) {
    fetchVehiclesList({ customer: id });
    void vehicle;
  }

  async function handleDeleteVehicle() {
    if (!vehicleToDelete) return;
    setIsDeletingVehicle(true);
    try {
      await deleteVehicle(vehicleToDelete.id);
      fetchVehiclesList({ customer: id });
      setVehicleToDelete(null);
    } finally {
      setIsDeletingVehicle(false);
    }
  }

  if (currentCustomerLoading) {
    return (
      <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (currentCustomerError || !currentCustomer) {
    return (
      <div className="flex flex-col gap-4 p-3 sm:p-6">
        <Link href="/dashboard/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeftIcon />
            Back to Customers
          </Button>
        </Link>
        <p className="text-sm text-destructive">
          {currentCustomerError ?? "Customer not found."}
        </p>
      </div>
    );
  }

  const vehicles = vehiclesList?.results ?? [];

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/customers">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeftIcon className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {currentCustomer.name ?? currentCustomer.phone}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Customer profile</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2Icon className="size-4" />
          Delete
        </Button>
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="rounded-xl border border-border p-5 space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Basic information</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="phone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                placeholder="e.g. 0712345678"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Customer name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="customer@email.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="Any notes about this customer..."
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Added {new Date(currentCustomer.created_at).toLocaleDateString()}
          </p>
          <Button type="submit" disabled={!dirty || isSaving || !form.phone.trim()}>
            {isSaving ? (
              <>
                <Loader2Icon className="animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>

      {/* Vehicles */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <CarIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Vehicles</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setAddVehicleOpen(true)}>
            <PlusIcon />
            Add Vehicle
          </Button>
        </div>

        {vehiclesListLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CarIcon className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No vehicles added yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/20">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plate</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Make / Model</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Color</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium">{vehicle.plate_number}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {vehicle.vehicle_category ? (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {VEHICLE_CATEGORY_LABELS[vehicle.vehicle_category] ?? vehicle.vehicle_category}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {vehicle.color ?? <span className="text-muted-foreground/50">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setVehicleToDelete(vehicle)}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete customer confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{currentCustomer.name ?? currentCustomer.phone}</strong> permanently? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete vehicle confirmation */}
      <AlertDialog open={!!vehicleToDelete} onOpenChange={(open) => !open && setVehicleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>{vehicleToDelete?.plate_number}</strong> from this customer? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteVehicle}
              disabled={isDeletingVehicle}
            >
              {isDeletingVehicle ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add vehicle dialog */}
      <AddVehicleDialog
        open={addVehicleOpen}
        onOpenChange={setAddVehicleOpen}
        onCreated={handleVehicleCreated}
        defaultCustomerId={id}
      />
    </div>
  );
}
