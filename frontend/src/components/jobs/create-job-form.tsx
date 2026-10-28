"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckIcon,
  Loader2Icon,
  MinusIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
  XIcon,
  UserPlusIcon,
} from "lucide-react";
import Link from "next/link";

import { useApiMutation } from "@/hooks/use-api";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
import { useCustomersStore } from "@/stores/customers-store";
import { useVehiclesStore } from "@/stores/vehicles-store";
import { useWorkersStore } from "@/stores/workers-store";
import { useServicesStore } from "@/stores/services-store";
import { queueJobCardPrint } from "@/lib/print/job-card";
import { useJobCardOptions } from "@/hooks/jobs/use-job-card-options";
import { useCurrentBusiness } from "@/hooks/commons/use-business";

import { SearchCombobox } from "@/components/ui/search-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import { AddWorkerButton } from "@/components/jobs/add-worker-dialog";
import { ServicePriceModal } from "@/components/jobs/service-price-modal";
import type { ServiceLineItem } from "@/components/jobs/service-items-list";

import type { CreateJobPayload, Job } from "@/types/jobs/job";
import type { Customer } from "@/types/customers/customer";
import type { Worker } from "@/types/workers/worker";
import { DIMENSION_UNIT_LABELS, SIZE_UNIT_LABELS } from "@/types/services/service";
import type { Service, ServiceCategory } from "@/types/services/service";

const CATEGORIES: { value: "all" | ServiceCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "vehicle", label: "Vehicle" },
  { value: "carpet", label: "Carpet" },
  { value: "other", label: "Other" },
];

/** Unit price for a line: the per-sale override if set, otherwise the catalog price. */
function effectiveUnitPrice(item: ServiceLineItem, standardPrice: string): number {
  return item.customUnitPrice ?? Number(standardPrice);
}

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
  const [activeCategory, setActiveCategory] = React.useState<"all" | ServiceCategory>("all");
  const [priceModalService, setPriceModalService] = React.useState<Service | null>(null);
  // Raw text of price inputs while typing, so the field can be cleared without snapping back
  const [priceDrafts, setPriceDrafts] = React.useState<Record<string, string>>({});
  // Follows the business default until the user toggles it.
  const { data: business } = useCurrentBusiness();
  const [printCardOverride, setPrintCard] = React.useState<boolean | null>(null);
  const printCard = printCardOverride ?? business?.print_job_card_by_default ?? true;

  // Customer phone search state
  const [phoneQuery, setPhoneQuery] = React.useState("");
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [newCustomerName, setNewCustomerName] = React.useState("");

  // Vehicle plate search state
  const [plateQuery, setPlateQuery] = React.useState("");
  const [newVehiclePlate, setNewVehiclePlate] = React.useState("");

  // Track newly created workers so they appear in dropdown immediately
  const [extraCustomers, setExtraCustomers] = React.useState<Customer[]>([]);
  const [extraWorkers, setExtraWorkers] = React.useState<Worker[]>([]);

  const allCustomers = [...customersAll, ...extraCustomers.filter((ec) => !customersAll.find((c) => c.id === ec.id))];
  const allVehicles = vehiclesAll;
  const allWorkers = [...workersAll, ...extraWorkers.filter((ew) => !workersAll.find((w) => w.id === ew.id))];

  const filteredVehicles = customerId
    ? allVehicles.filter((v) => v.customer === customerId || !v.customer)
    : allVehicles;

  const filteredServices = activeCategory === "all"
    ? servicesAll
    : servicesAll.filter((s) => s.category === activeCategory);

  const selectedCustomer = allCustomers.find((c) => c.id === customerId) ?? null;

  const phoneSearchResults = phoneQuery.length >= 2
    ? allCustomers.filter((c) =>
        c.phone.includes(phoneQuery) ||
        c.name?.toLowerCase().includes(phoneQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const plateSearchResults = plateQuery.length >= 1
    ? filteredVehicles
        .filter((v) => v.plate_number.toLowerCase().includes(plateQuery.toLowerCase()))
        .slice(0, 6)
    : [];

  const workerItems = allWorkers.map((w) => ({
    value: w.id,
    label: w.name,
    sublabel: w.phone ?? undefined,
  }));

  function selectCustomer(customer: Customer) {
    setCustomerId(customer.id);
    setPhoneQuery("");
    setShowCreateForm(false);
    setNewCustomerName("");
  }

  function clearCustomer() {
    setCustomerId("");
    setVehicleId("");
    setNewVehiclePlate("");
    setPlateQuery("");
    setPhoneQuery("");
    setShowCreateForm(false);
    setNewCustomerName("");
  }

  function handleWorkerCreated(worker: Worker) {
    setExtraWorkers((prev) => [worker, ...prev]);
    setWorkerId(worker.id);
  }

  function addServiceWithPrice(service: Service, priceId?: string) {
    const alreadyAdded = serviceItems.some((i) => i.serviceId === service.id);
    if (alreadyAdded) {
      setServiceItems((prev) => prev.filter((i) => i.serviceId !== service.id));
      return;
    }
    setServiceItems((prev) => [
      ...prev,
      {
        serviceId: service.id,
        serviceName: service.name,
        serviceCode: service.code,
        // By-size items start empty so staff must enter the measured size
        quantity: service.unit === "by_size" ? 0 : 1,
        selectedPriceId: priceId,
      },
    ]);
  }

  function handleServiceCardClick(service: Service) {
    const alreadyAdded = serviceItems.some((i) => i.serviceId === service.id);
    if (alreadyAdded) {
      setServiceItems((prev) => prev.filter((i) => i.serviceId !== service.id));
      return;
    }
    if (service.prices.length > 1) {
      setPriceModalService(service);
    } else {
      addServiceWithPrice(service, service.prices[0]?.id);
    }
  }

  function handlePriceSelect(priceId: string) {
    if (!priceModalService) return;
    addServiceWithPrice(priceModalService, priceId);
    setPriceModalService(null);
  }

  function updateQuantity(serviceId: string, delta: number) {
    setServiceItems((prev) =>
      prev.map((item) =>
        item.serviceId === serviceId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  }

  function setDimension(serviceId: string, field: "length" | "width", value: string) {
    const n = Math.max(0, Number(value) || 0);
    setServiceItems((prev) =>
      prev.map((item) => {
        if (item.serviceId !== serviceId) return item;
        const next = { ...item, [field]: n };
        return { ...next, quantity: (next.length ?? 0) * (next.width ?? 0) };
      })
    );
  }

  function setCustomUnitPrice(serviceId: string, value: string) {
    setServiceItems((prev) =>
      prev.map((item) =>
        item.serviceId === serviceId
          ? { ...item, customUnitPrice: value === "" ? undefined : Math.max(0, Number(value) || 0) }
          : item
      )
    );
  }

  function resetCustomUnitPrice(serviceId: string) {
    setServiceItems((prev) =>
      prev.map((item) => (item.serviceId === serviceId ? { ...item, customUnitPrice: undefined } : item))
    );
    clearPriceDraft(serviceId);
  }

  function clearPriceDraft(serviceId: string) {
    setPriceDrafts((prev) => {
      if (!(serviceId in prev)) return prev;
      const next = { ...prev };
      delete next[serviceId];
      return next;
    });
  }

  function removeItem(serviceId: string) {
    setServiceItems((prev) => prev.filter((i) => i.serviceId !== serviceId));
  }

  const total = serviceItems.reduce((sum, item) => {
    const service = servicesAll.find((s) => s.id === item.serviceId);
    const price = service?.prices.find((p) => p.id === item.selectedPriceId);
    return sum + (price ? effectiveUnitPrice(item, price.price) * item.quantity : 0);
  }, 0);

  const getJobCardOptions = useJobCardOptions();

  const { mutate: createJob, isPending } = useApiMutation<Job, CreateJobPayload>({
    method: "POST",
    url: "/jobs/",
    onSuccess: (job) => {
      if (printCard) {
        queueJobCardPrint(
          job,
          getJobCardOptions(job, { workerName: allWorkers.find((w) => w.id === workerId)?.name }),
        );
      }
      router.push("/dashboard/jobs");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (serviceItems.length === 0) return;

    const payload: CreateJobPayload = {
      collection_method: collectionMethod,
      items: serviceItems.map((item) => ({
        service: item.serviceId,
        quantity: String(item.quantity),
        ...(item.length && item.width
          ? { length: String(item.length), width: String(item.width) }
          : {}),
        ...(item.selectedPriceId ? { service_price: item.selectedPriceId } : {}),
        ...(item.customUnitPrice !== undefined
          ? { custom_unit_price: String(item.customUnitPrice) }
          : {}),
      })),
    };

    if (customerId) {
      payload.customer_id = customerId;
    } else if (showCreateForm && phoneQuery.trim()) {
      payload.customer_data = { phone: phoneQuery.trim(), name: newCustomerName.trim() };
    }
    if (vehicleId) payload.vehicle_id = vehicleId;
    else if (newVehiclePlate.trim()) payload.vehicle_data = { plate_number: newVehiclePlate.trim().toUpperCase() };
    if (workerId) payload.worker = workerId;
    if (notes.trim()) payload.notes = notes.trim();
    if (discount.trim()) payload.discount_amount = discount.trim();
    if (collectionMethod === "pickup" && pickupAddress.trim()) {
      payload.pickup_address = pickupAddress.trim();
    }
    if (contactPhone.trim()) payload.contact_phone = contactPhone.trim();

    createJob(payload);
  }

  const canSubmit =
    serviceItems.length > 0 && serviceItems.every((item) => item.quantity > 0) && !isPending;
  const showVehicleSelector = !!customerId || showCreateForm;
  const showSearchResults = !customerId && phoneQuery.length >= 2;

  return (
    <>
      <ServicePriceModal
        service={priceModalService}
        onSelect={handlePriceSelect}
        onClose={() => setPriceModalService(null)}
      />

      <form onSubmit={handleSubmit} className="flex flex-col lg:h-full lg:flex-row lg:overflow-hidden">
        {/* ── Left panel: service grid ── */}
        <div className="flex flex-col border-b lg:flex-1 lg:overflow-hidden lg:border-b-0 lg:border-r">
          {/* Category filter tabs */}
          <div className="flex gap-1 overflow-x-auto border-b px-4 py-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  activeCategory === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Service cards */}
          <div className="p-4 lg:flex-1 lg:overflow-y-auto">
            {servicesAllLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Loading services...
              </div>
            ) : filteredServices.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                No services in this category.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3">
                {filteredServices.map((service) => {
                  const isAdded = serviceItems.some((i) => i.serviceId === service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => handleServiceCardClick(service)}
                      className={cn(
                        "relative flex flex-col items-start gap-1.5 rounded-lg border-2 p-4 text-left transition-all",
                        isAdded
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50 hover:bg-muted/40"
                      )}
                    >
                      {isAdded && (
                        <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <CheckIcon className="size-3" />
                        </span>
                      )}
                      <span className="text-sm font-semibold leading-tight">{service.name}</span>
                      <span className="text-xs text-muted-foreground">{service.code}</span>
                      {service.prices.length > 0 && (
                        <span className="text-xs font-medium text-primary">
                          {service.prices.length === 1
                            ? `KES ${Number(service.prices[0].price).toLocaleString()}`
                            : `${service.prices.length} prices`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel: order summary ── */}
        <div className="flex w-full flex-col lg:w-80 lg:overflow-hidden xl:w-96">
          <div className="lg:flex-1 lg:overflow-y-auto">

            {/* Customer */}
            <div className="border-b p-4 space-y-2">
              <Label>Customer</Label>

              {/* Selected customer chip */}
              {selectedCustomer ? (
                <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedCustomer.name ?? selectedCustomer.phone}
                    </p>
                    {selectedCustomer.name && (
                      <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearCustomer}
                    className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Phone search input */}
                  <div className="relative">
                    <Input
                      placeholder="Search by phone or name..."
                      value={phoneQuery}
                      onChange={(e) => {
                        setPhoneQuery(e.target.value);
                        setShowCreateForm(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (phoneSearchResults.length === 0 && phoneQuery.length >= 2) {
                            setShowCreateForm(true);
                          } else if (phoneSearchResults.length === 1) {
                            selectCustomer(phoneSearchResults[0]);
                          }
                        }
                      }}
                      disabled={customersAllLoading}
                    />
                    {customersAllLoading && (
                      <Loader2Icon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* Search results */}
                  {showSearchResults && (
                    <div className="rounded-md border bg-popover shadow-sm overflow-hidden">
                      {phoneSearchResults.length > 0 ? (
                        <ul>
                          {phoneSearchResults.map((customer) => (
                            <li key={customer.id}>
                              <button
                                type="button"
                                onClick={() => selectCustomer(customer)}
                                className="flex w-full flex-col px-3 py-2 text-left hover:bg-accent transition-colors"
                              >
                                <span className="text-sm font-medium">
                                  {customer.name ?? customer.phone}
                                </span>
                                {customer.name && (
                                  <span className="text-xs text-muted-foreground">{customer.phone}</span>
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="px-3 py-2 text-sm text-muted-foreground">No customer found.</p>
                      )}

                      {/* New customer trigger */}
                      {!showCreateForm && (
                        <div className="border-t">
                          <button
                            type="button"
                            onClick={() => setShowCreateForm(true)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-accent transition-colors"
                          >
                            <UserPlusIcon className="size-4" />
                            New customer
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Inline create form — data sent with job on submit */}
                  {showCreateForm && (
                    <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New customer</span>
                        <button
                          type="button"
                          onClick={() => setShowCreateForm(false)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="new-customer-phone">Phone</Label>
                        <Input
                          id="new-customer-phone"
                          value={phoneQuery}
                          onChange={(e) => setPhoneQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="new-customer-name">
                          Name <span className="text-muted-foreground font-normal">(optional)</span>
                        </Label>
                        <Input
                          id="new-customer-name"
                          value={newCustomerName}
                          onChange={(e) => setNewCustomerName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
                          placeholder="Customer name"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Vehicle — only when customer is selected or creating new customer */}
            {showVehicleSelector && (
              <div className="border-b p-4 space-y-2">
                <Label>Vehicle</Label>

                {/* Selected vehicle chip */}
                {(vehicleId || newVehiclePlate) ? (
                  <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      {vehicleId ? (
                        <p className="text-sm font-medium truncate">
                          {allVehicles.find((v) => v.id === vehicleId)?.plate_number ?? "Vehicle"}
                        </p>
                      ) : (
                        <p className="text-sm font-medium truncate">
                          {newVehiclePlate}{" "}
                          <span className="text-xs font-normal text-muted-foreground">(new)</span>
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setVehicleId(""); setNewVehiclePlate(""); setPlateQuery(""); }}
                      className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <XIcon className="size-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Plate number input */}
                    <div className="relative">
                      <Input
                        placeholder="Type plate number..."
                        value={plateQuery}
                        onChange={(e) => setPlateQuery(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (plateSearchResults.length === 1) {
                              setVehicleId(plateSearchResults[0].id);
                              setPlateQuery("");
                            } else if (plateQuery.trim()) {
                              setNewVehiclePlate(plateQuery.trim());
                              setPlateQuery("");
                            }
                          }
                        }}
                        disabled={vehiclesAllLoading}
                      />
                      {vehiclesAllLoading && (
                        <Loader2Icon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
                      )}
                    </div>

                    {/* Plate search results */}
                    {plateQuery.length >= 1 && (
                      <div className="rounded-md border bg-popover shadow-sm overflow-hidden">
                        {plateSearchResults.length > 0 ? (
                          <ul>
                            {plateSearchResults.map((vehicle) => (
                              <li key={vehicle.id}>
                                <button
                                  type="button"
                                  onClick={() => { setVehicleId(vehicle.id); setPlateQuery(""); }}
                                  className="flex w-full flex-col px-3 py-2 text-left hover:bg-accent transition-colors"
                                >
                                  <span className="text-sm font-medium">{vehicle.plate_number}</span>
                                  {(vehicle.make || vehicle.model) && (
                                    <span className="text-xs text-muted-foreground">
                                      {[vehicle.make, vehicle.model, vehicle.color].filter(Boolean).join(" · ")}
                                    </span>
                                  )}
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-sm text-muted-foreground">No match — press Enter to use this plate</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Selected services */}
            <div className="p-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Selected Services
              </p>

              {serviceItems.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Click a service card to add it here.
                </p>
              ) : (
                <div className="space-y-2">
                  {serviceItems.map((item) => {
                    const service = servicesAll.find((s) => s.id === item.serviceId);
                    const price = service?.prices.find((p) => p.id === item.selectedPriceId);
                    const unitPrice = price ? effectiveUnitPrice(item, price.price) : 0;
                    const isCustom =
                      price !== undefined &&
                      item.customUnitPrice !== undefined &&
                      item.customUnitPrice !== Number(price.price);
                    const priceLabel = price
                      ? `KES ${(unitPrice * item.quantity).toLocaleString()}`
                      : "—";
                    const sizeUnitLabel =
                      service?.unit === "by_size" && service.size_unit
                        ? SIZE_UNIT_LABELS[service.size_unit]
                        : null;
                    const dimensionUnitLabel =
                      service?.unit === "by_size" && service.size_unit
                        ? DIMENSION_UNIT_LABELS[service.size_unit]
                        : null;
                    const area = Number(item.quantity.toFixed(2));

                    return (
                      <div key={item.serviceId} className="space-y-3 rounded-lg border bg-muted/30 p-4">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold leading-tight break-words">{item.serviceName}</p>
                            {price && sizeUnitLabel ? (
                              <p className="text-sm text-muted-foreground">
                                {item.quantity > 0
                                  ? `${item.length} × ${item.width} = ${area.toLocaleString()} ${sizeUnitLabel} × KES ${unitPrice.toLocaleString()} = ${priceLabel}`
                                  : `Enter size · KES ${unitPrice.toLocaleString()} / ${sizeUnitLabel}`}
                              </p>
                            ) : price ? (
                              <p className="text-sm text-muted-foreground capitalize">
                                {price.size_label ?? price.vehicle_category ?? "Default"} · {priceLabel}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">{priceLabel}</p>
                            )}
                            {isCustom && (
                              <p className="text-sm text-amber-600 dark:text-amber-500">
                                Custom price · was{" "}
                                <span className="line-through">KES {Number(price.price).toLocaleString()}</span>
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => {
                              removeItem(item.serviceId);
                              clearPriceDraft(item.serviceId);
                            }}
                            className="text-muted-foreground hover:text-destructive shrink-0"
                          >
                            <Trash2Icon />
                          </Button>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                        {sizeUnitLabel ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <Input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            placeholder="L"
                            aria-label={`Length in ${dimensionUnitLabel}`}
                            value={item.length ? item.length : ""}
                            onChange={(e) => setDimension(item.serviceId, "length", e.target.value)}
                            className="h-9 w-20 text-right text-sm tabular-nums"
                          />
                          <span className="text-sm text-muted-foreground">×</span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            placeholder="W"
                            aria-label={`Width in ${dimensionUnitLabel}`}
                            value={item.width ? item.width : ""}
                            onChange={(e) => setDimension(item.serviceId, "width", e.target.value)}
                            className="h-9 w-20 text-right text-sm tabular-nums"
                          />
                          <span className="text-sm text-muted-foreground">{dimensionUnitLabel}</span>
                        </div>
                        ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() => updateQuantity(item.serviceId, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <MinusIcon />
                          </Button>
                          <span className="w-6 text-center text-base font-medium tabular-nums">
                            {item.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() => updateQuantity(item.serviceId, 1)}
                          >
                            <PlusIcon />
                          </Button>
                        </div>
                        )}
                        {price && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-muted-foreground">KES</span>
                            <Input
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="0.01"
                              aria-label="Unit price"
                              value={
                                priceDrafts[item.serviceId] ??
                                String(item.customUnitPrice ?? Number(price.price))
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                setPriceDrafts((prev) => ({ ...prev, [item.serviceId]: value }));
                                setCustomUnitPrice(item.serviceId, value);
                              }}
                              onBlur={() => clearPriceDraft(item.serviceId)}
                              className={cn(
                                "h-9 w-28 text-right text-sm tabular-nums",
                                isCustom && "border-amber-500"
                              )}
                            />
                            <span className="text-sm text-muted-foreground">
                              {sizeUnitLabel ? `/ ${sizeUnitLabel}` : "each"}
                            </span>
                            {isCustom && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Reset to standard price"
                                onClick={() => resetCustomUnitPrice(item.serviceId)}
                                className="text-muted-foreground"
                              >
                                <RotateCcwIcon />
                              </Button>
                            )}
                          </div>
                        )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="border-t">
              <div className="space-y-4 px-4 py-4">
                {/* Worker */}
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

                {/* Collection method */}
                <div className="space-y-1.5">
                  <Label>Collection Method</Label>
                  <div className="flex gap-3 pt-0.5">
                    {(["walk_in", "pickup"] as const).map((method) => (
                      <label key={method} className="flex cursor-pointer items-center gap-2 text-sm">
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

                {/* Pickup address */}
                {collectionMethod === "pickup" && (
                  <div className="space-y-1.5">
                    <Label>Pickup Address</Label>
                    <Input
                      placeholder="Enter pickup address"
                      value={pickupAddress}
                      onChange={(e) => setPickupAddress(e.target.value)}
                    />
                  </div>
                )}

                {/* Contact phone */}
                <div className="space-y-1.5">
                  <Label>Contact Phone</Label>
                  <Input
                    placeholder="Override contact number"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>

                {/* Discount */}
                <div className="space-y-1.5">
                  <Label>Discount (KES)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <textarea
                    rows={3}
                    placeholder="Any special instructions or notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 resize-none dark:bg-input/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer: total + actions */}
          <div className="sticky bottom-0 z-10 border-t bg-card p-4 space-y-3 lg:static">
            {serviceItems.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-lg font-bold">
                  KES {total.toLocaleString()}
                </span>
              </div>
            )}

            {serviceItems.length === 0 && (
              <p className="text-xs text-destructive text-center">At least one service is required.</p>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="print-job-card"
                checked={printCard}
                onCheckedChange={(checked) => setPrintCard(checked === true)}
              />
              <Label htmlFor="print-job-card" className="cursor-pointer font-normal">
                Print job card
              </Label>
            </div>

            <div className="flex gap-2">
              <Link href="/dashboard/jobs" className="flex-1">
                <Button type="button" variant="outline" className="w-full" size="sm">
                  <ArrowLeftIcon />
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={!canSubmit} className="flex-1">
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
          </div>
        </div>
      </form>
    </>
  );
}
