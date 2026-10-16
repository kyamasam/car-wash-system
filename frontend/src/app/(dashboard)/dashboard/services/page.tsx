"use client";

import {
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  TagIcon,
  Trash2Icon,
  WrenchIcon,
} from "lucide-react";
import * as React from "react";

import { ServiceDialog } from "@/components/services/service-dialog";
import { ServicePriceDialog } from "@/components/services/service-price-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
import { useServicesStore } from "@/stores/services-store";
import { SIZE_UNIT_LABELS } from "@/types/services/service";
import type { Service, ServiceCategory, ServicePrice } from "@/types/services/service";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  vehicle: "Vehicle",
  carpet: "Carpet",
  other: "Other",
};

export default function ServicesPage() {
  const { data: currentUser } = useCurrentUser();
  const { servicesList, servicesListLoading, fetchServicesList, deleteService, deleteServicePrice } =
    useServicesStore();

  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<ServiceCategory | "">("");
  const [page, setPage] = React.useState(1);

  // service create/edit dialog
  const [serviceDialogOpen, setServiceDialogOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | undefined>();

  // prices management dialog
  // Store only the id and derive the service from the latest list, so the
  // dialog reflects prices as soon as the list is refetched
  const [pricesDialogServiceId, setPricesDialogServiceId] = React.useState<string | null>(null);
  const pricesDialogService =
    servicesList?.results.find((s) => s.id === pricesDialogServiceId) ?? null;

  // price create/edit dialog
  const [priceDialogOpen, setPriceDialogOpen] = React.useState(false);
  const [editingPrice, setEditingPrice] = React.useState<ServicePrice | undefined>();

  const debouncedSearch = useDebounce(search, 300);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category]);

  React.useEffect(() => {
    fetchServicesList({
      search: debouncedSearch || undefined,
      category: category || undefined,
      page,
    });
  }, [debouncedSearch, category, page]);

  function reload() {
    fetchServicesList({
      search: debouncedSearch || undefined,
      category: category || undefined,
      page,
    });
  }

  async function handleDeleteService(service: Service) {
    if (!confirm(`Delete service "${service.name}"? This cannot be undone.`)) return;
    try {
      await deleteService(service.id);
      reload();
    } catch {
      // error toast handled by axios interceptor
    }
  }

  async function handleDeletePrice(price: ServicePrice) {
    if (!confirm("Delete this price? This cannot be undone.")) return;
    try {
      await deleteServicePrice(price.id);
      reload();
    } catch {
      // error toast handled by axios interceptor
    }
  }

  function openEditService(service: Service) {
    setEditingService(service);
    setServiceDialogOpen(true);
  }

  function openNewService() {
    setEditingService(undefined);
    setServiceDialogOpen(true);
  }

  function openPricesDialog(service: Service) {
    setPricesDialogServiceId(service.id);
  }

  function openAddPrice() {
    setEditingPrice(undefined);
    setPriceDialogOpen(true);
  }

  function openEditPrice(price: ServicePrice) {
    setEditingPrice(price);
    setPriceDialogOpen(true);
  }

  function handlePriceSaved() {
    reload();
  }

  const services = servicesList?.results ?? [];
  const totalCount = servicesList?.count ?? 0;
  const pageSize = 10;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the services your car wash offers.
          </p>
        </div>
        <Button onClick={openNewService}>
          <PlusIcon />
          New Service
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 w-full sm:max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={category || "all"}
          onValueChange={(v) => setCategory(v === "all" ? "" : (v as ServiceCategory))}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="vehicle">Vehicle</SelectItem>
            <SelectItem value="carpet">Carpet</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        {servicesListLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <WrenchIcon className="size-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {search || category ? "No services match your filters" : "No services yet"}
            </p>
            {!search && !category && (
              <>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Add your first service to get started.
                </p>
                <Button size="sm" onClick={openNewService}>
                  <PlusIcon />
                  Add Service
                </Button>
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Unit</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Prices</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map((service) => (
                <tr key={service.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                        {service.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{service.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden sm:table-cell">
                    {service.code}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_LABELS[service.category]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell capitalize">
                    {service.unit.replace("_", " ")}
                    {service.unit === "by_size" && service.size_unit && ` (${SIZE_UNIT_LABELS[service.size_unit]})`}
                  </td>
                  <td className="px-4 py-3">
                    {service.prices.length === 0 ? (
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => { openPricesDialog(service); setTimeout(openAddPrice, 50); }}
                      >
                        <PlusIcon className="size-3.5" />
                        Create Pricing
                      </Button>
                    ) : (
                      <div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => openPricesDialog(service)}
                        >
                          <TagIcon className="size-3.5" />
                          {service.prices.length} {service.prices.length === 1 ? "price" : "prices"}
                          </Button>
                          
                        <Button
                            variant={'outline'}
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => { openPricesDialog(service); setTimeout(openAddPrice, 50); }}
                        >
                          <PlusIcon className="size-3.5" />
                          Add Pricing
                        </Button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <Badge
                      variant={service.is_active ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {service.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant={'outline'} size="sm" onClick={() => openEditService(service)}>
                      <PencilIcon className="size-3 mr-2" />
                      Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontalIcon className="size-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditService(service)}>
                          <PencilIcon className="size-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openPricesDialog(service)}>
                          <TagIcon className="size-4 mr-2" />
                          Manage Prices
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteService(service)}
                        >
                          <Trash2Icon className="size-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of{" "}
            {totalCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || servicesListLoading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || servicesListLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit service dialog */}
      <ServiceDialog
        open={serviceDialogOpen}
        onOpenChange={setServiceDialogOpen}
        service={editingService}
        onSaved={reload}
      />

      {/* Prices management dialog */}
      <Dialog
        open={!!pricesDialogService}
        onOpenChange={(open) => {
          if (!open) setPricesDialogServiceId(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Prices — {pricesDialogService?.name}
            </DialogTitle>
          </DialogHeader>

          {pricesDialogService && (
            <>
              {pricesDialogService.prices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <TagIcon className="size-8 text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No prices yet for this service.</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    Add a price to make this service available for jobs.
                  </p>
                  <Button size="sm" onClick={openAddPrice}>
                    <PlusIcon />
                    Create Pricing
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Vehicle Cat.</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Size</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Price</th>
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">Commission</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pricesDialogService.prices.map((p) => (
                        <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-2 capitalize">
                            {p.vehicle_category ?? <span className="text-muted-foreground/50">—</span>}
                          </td>
                          <td className="px-3 py-2">
                            {p.size_label ?? <span className="text-muted-foreground/50">—</span>}
                          </td>
                          <td className="px-3 py-2 font-medium">
                            {p.price}
                            {pricesDialogService.unit === "by_size" && pricesDialogService.size_unit && (
                              <span className="text-xs font-normal text-muted-foreground">
                                {" "}/ {SIZE_UNIT_LABELS[pricesDialogService.size_unit]}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {p.commission_value}{" "}
                            <span className="text-xs">({p.commission_type})</span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                onClick={() => openEditPrice(p)}
                              >
                                <PencilIcon className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-destructive hover:text-destructive"
                                onClick={() => handleDeletePrice(p)}
                              >
                                <Trash2Icon className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <DialogFooter>
                <Button size="sm" onClick={openAddPrice}>
                  <PlusIcon />
                  Add Price
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create / Edit price dialog */}
      {pricesDialogService && (
        <ServicePriceDialog
          open={priceDialogOpen}
          onOpenChange={setPriceDialogOpen}
          serviceId={pricesDialogService.id}
          serviceCategory={pricesDialogService.category}
          serviceUnit={pricesDialogService.unit}
          sizeUnit={pricesDialogService.size_unit}
          price={editingPrice}
          onSaved={handlePriceSaved}
        />
      )}
    </div>
  );
}
