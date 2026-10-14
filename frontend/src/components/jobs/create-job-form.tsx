"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";

import { useApiMutation } from "@/hooks/use-api";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
import { useCustomersStore } from "@/stores/customers-store";
import { useVehiclesStore } from "@/stores/vehicles-store";
import { useWorkersStore } from "@/stores/workers-store";
import { useServicesStore } from "@/stores/services-store";

import { SearchCombobox } from "@/components/ui/search-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { AddCustomerButton } from "@/components/jobs/add-customer-dialog";
import { AddVehicleButton } from "@/components/jobs/add-vehicle-dialog";
import { AddWorkerButton } from "@/components/jobs/add-worker-dialog";
import { ServiceItemsList, ServiceLineItem } from "@/components/jobs/service-items-list";

import type { CreateJobPayload, Job } from "@/types/jobs/job";
import type { Customer, Vehicle } from "@/types/customers/customer";
import type { Worker } from "@/types/workers/worker";

export function CreateJobForm() {
  const router = useRouter();
  const { data: currentUser } = useCurrentUser();

  const { customersAll, customersAllLoading, fetchCustomersAll } = useCustomersStore();
  const { vehiclesAll, vehiclesAllLoading, fetchVehiclesAll } = useVehiclesStore();
  const { workersAll, workersAllLoading, fetchWorkersAll } = useWorkersStore();
  const { servicesAll, servicesAllLoading, fetchServicesAll } = useServicesStore();

  React.useEffect(() => {
    fetchCustomersAll();
    fetchVehiclesAll();
    fetchWorkersAll();
    fetchServicesAll();
  }, []);

  // Form state
  const [customerId, setCustomerId] = React.useState("");
  const [vehicleId, setVehicleId] = React.useState("");
  const [workerId, setWorkerId] = React.useState("");
  const [serviceItems, setServiceItems] = React.useState<ServiceLineItem[]>([]);
  const [collectionMethod, setCollectionMethod] = React.useState<"walk_in" | "pickup">("walk_in");
  const [pickupAddress, setPickupAddress] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [discount, setDiscount] = React.useState("");

  // Track newly created items so they appear in the dropdowns immediately
  const [extraCustomers, setExtraCustomers] = React.useState<Customer[]>([]);
  const [extraVehicles, setExtraVehicles] = React.useState<Vehicle[]>([]);
  const [extraWorkers, setExtraWorkers] = React.useState<Worker[]>([]);

  const allCustomers = [...customersAll, ...extraCustomers.filter((ec) => !customersAll.find((c) => c.id === ec.id))];
  const allVehicles = [...vehiclesAll, ...extraVehicles.filter((ev) => !vehiclesAll.find((v) => v.id === ev.id))];
  const allWorkers = [...workersAll, ...extraWorkers.filter((ew) => !workersAll.find((w) => w.id === ew.id))];

  // Filter vehicles by selected customer
  const filteredVehicles = customerId
    ? allVehicles.filter((v) => v.customer === customerId || !v.customer)
    : allVehicles;

  // Combobox items
  const customerItems = allCustomers.map((c) => ({
    value: c.id,
    label: c.name ? `${c.name} (${c.phone})` : c.phone,
    sublabel: c.email ?? undefined,
  }));

  const vehicleItems = filteredVehicles.map((v) => ({
    value: v.id,
    label: v.plate_number,
    sublabel: [v.make, v.model, v.color].filter(Boolean).join(" · ") || undefined,
  }));

  const workerItems = allWorkers.map((w) => ({
    value: w.id,
    label: w.name,
    sublabel: w.phone ?? undefined,
  }));

  function handleCustomerCreated(customer: Customer) {
    setExtraCustomers((prev) => [customer, ...prev]);
    setCustomerId(customer.id);
  }

  function handleVehicleCreated(vehicle: Vehicle) {
    setExtraVehicles((prev) => [vehicle, ...prev]);
    setVehicleId(vehicle.id);
  }

  function handleWorkerCreated(worker: Worker) {
    setExtraWorkers((prev) => [worker, ...prev]);
    setWorkerId(worker.id);
  }

  const { mutate: createJob, isPending } = useApiMutation<Job, CreateJobPayload>({
    method: "POST",
    url: "/jobs/",
    onSuccess: () => {
      router.push("/dashboard/jobs");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (serviceItems.length === 0) {
      return;
    }

    const payload: CreateJobPayload = {
      collection_method: collectionMethod,
      items: serviceItems.map((item) => ({
        service: item.serviceId,
        quantity: String(item.quantity),
        ...(item.selectedPriceId ? { service_price: item.selectedPriceId } : {}),
      })),
    };

    if (customerId) payload.customer_id = customerId;
    if (vehicleId) payload.vehicle_id = vehicleId;
    if (workerId) payload.worker = workerId;
    if (notes.trim()) payload.notes = notes.trim();
    if (discount.trim()) payload.discount_amount = discount.trim();
    if (collectionMethod === "pickup" && pickupAddress.trim()) {
      payload.pickup_address = pickupAddress.trim();
    }
    if (contactPhone.trim()) payload.contact_phone = contactPhone.trim();

    createJob(payload);
  }

  const canSubmit = serviceItems.length > 0 && !isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer + Vehicle */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Customer</Label>
          <SearchCombobox
            items={customerItems}
            value={customerId}
            onSelect={(v) => {
              setCustomerId(v);
              if (!v) setVehicleId("");
            }}
            placeholder="Search customer..."
            loading={customersAllLoading}
            footer={
              <AddCustomerButton
                onCreated={handleCustomerCreated}
              />
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label>Vehicle</Label>
          <SearchCombobox
            items={vehicleItems}
            value={vehicleId}
            onSelect={setVehicleId}
            placeholder="Search vehicle..."
            loading={vehiclesAllLoading}
            footer={
              <AddVehicleButton
                onCreated={handleVehicleCreated}
                defaultCustomerId={customerId || undefined}
              />
            }
          />
        </div>
      </div>

      {/* Services */}
      <div className="space-y-1.5">
        <Label>
          Services <span className="text-destructive">*</span>
        </Label>
        <ServiceItemsList
          services={servicesAll}
          loadingServices={servicesAllLoading}
          items={serviceItems}
          onChange={setServiceItems}
        />
        {serviceItems.length === 0 && (
          <p className="text-xs text-destructive">At least one service is required.</p>
        )}
      </div>

      {/* Worker + Collection method */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Worker</Label>
          <SearchCombobox
            items={workerItems}
            value={workerId}
            onSelect={setWorkerId}
            placeholder="Assign a worker..."
            loading={workersAllLoading}
            footer={
              currentUser?.branch ? (
                <AddWorkerButton
                  onCreated={handleWorkerCreated}
                  branchId={currentUser.branch}
                />
              ) : undefined
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label>Collection Method</Label>
          <div className="flex gap-3 pt-1">
            {(["walk_in", "pickup"] as const).map((method) => (
              <label
                key={method}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="collection_method"
                  value={method}
                  checked={collectionMethod === method}
                  onChange={() => setCollectionMethod(method)}
                  className="accent-primary"
                />
                {method === "walk_in" ? "Walk-in" : "Pickup"}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Pickup address (conditional) */}
      {collectionMethod === "pickup" && (
        <div className="space-y-1.5">
          <Label htmlFor="pickup-address">Pickup Address</Label>
          <Input
            id="pickup-address"
            placeholder="Enter pickup address"
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
          />
        </div>
      )}

      {/* Contact phone + Discount */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-phone">Contact Phone</Label>
          <Input
            id="contact-phone"
            placeholder="Override contact number"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="discount">Discount (KES)</Label>
          <Input
            id="discount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Any special instructions or notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none dark:bg-input/30"
        />
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between border-t pt-4">
        <Link href="/dashboard/jobs">
          <Button type="button" variant="ghost" size="sm">
            <ArrowLeftIcon />
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={!canSubmit} size="lg">
          {isPending ? (
            <>
              <Loader2Icon className="animate-spin" />
              Creating...
            </>
          ) : (
            "Create Job"
          )}
        </Button>
      </div>
    </form>
  );
}
