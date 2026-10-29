"use client";

import * as React from "react";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { SearchCombobox } from "@/components/ui/search-combobox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Service } from "@/types/services/service";

export interface ServiceLineItem {
  serviceId: string;
  serviceName: string;
  serviceCode: string;
  quantity: number;
  /** By-size dimensions; quantity = length × width */
  length?: number;
  width?: number;
  selectedPriceId?: string;
  /** Per-sale unit price override; falls back to the selected price when unset */
  customUnitPrice?: number;
}

interface ServiceItemsListProps {
  services: Service[];
  loadingServices: boolean;
  items: ServiceLineItem[];
  onChange: (items: ServiceLineItem[]) => void;
}

export function ServiceItemsList({
  services,
  loadingServices,
  items,
  onChange,
}: ServiceItemsListProps) {
  const comboboxItems = services.map((s) => ({
    value: s.id,
    label: s.name,
    sublabel: s.code,
  }));

  function addService(serviceId: string) {
    if (!serviceId) return;
    if (items.some((i) => i.serviceId === serviceId)) return;
    const service = services.find((s) => s.id === serviceId);
    if (!service) return;

    const firstPrice = service.prices[0];
    onChange([
      ...items,
      {
        serviceId: service.id,
        serviceName: service.name,
        serviceCode: service.code,
        quantity: 1,
        selectedPriceId: firstPrice?.id,
      },
    ]);
  }

  function updateQuantity(serviceId: string, delta: number) {
    onChange(
      items.map((item) =>
        item.serviceId === serviceId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  }

  function selectPrice(serviceId: string, priceId: string) {
    onChange(
      items.map((item) =>
        item.serviceId === serviceId ? { ...item, selectedPriceId: priceId } : item
      )
    );
  }

  function removeItem(serviceId: string) {
    onChange(items.filter((i) => i.serviceId !== serviceId));
  }

  const addedIds = new Set(items.map((i) => i.serviceId));
  const availableItems = comboboxItems.filter((i) => !addedIds.has(i.value));

  return (
    <div className="space-y-3">
      <SearchCombobox
        items={availableItems}
        value=""
        onSelect={addService}
        placeholder="Search and add a service..."
        searchPlaceholder="Search services..."
        loading={loadingServices}
        clearable={false}
        emptyText={
          addedIds.size > 0 && availableItems.length === 0
            ? "All services added."
            : "No services found."
        }
      />

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => {
            const service = services.find((s) => s.id === item.serviceId);
            const prices = service?.prices ?? [];

            return (
              <div key={item.serviceId} className="rounded-md border bg-muted/30">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.serviceName}</p>
                    <p className="text-xs text-muted-foreground">{item.serviceCode}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      onClick={() => updateQuantity(item.serviceId, -1)}
                      disabled={item.quantity <= 1}
                    >
                      <MinusIcon />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium tabular-nums">
                      {item.quantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      onClick={() => updateQuantity(item.serviceId, 1)}
                    >
                      <PlusIcon />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeItem(item.serviceId)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2Icon />
                  </Button>
                </div>

                {prices.length > 0 && (
                  <div className="px-3 pb-2.5 flex flex-wrap gap-2">
                    {prices.map((price) => {
                      const isSelected = item.selectedPriceId === price.id;
                      const label = price.size_label ?? price.vehicle_category ?? "Default";
                      return (
                        <button
                          key={price.id}
                          type="button"
                          onClick={() => selectPrice(item.serviceId, price.id)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-foreground hover:bg-muted"
                          )}
                        >
                          {label} · KES {Number(price.price).toLocaleString()}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {items.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No services added yet. Search above to add one.
        </p>
      )}
    </div>
  );
}
