"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Service } from "@/types/services/service";

interface ServicePriceModalProps {
  service: Service | null;
  onSelect: (priceId: string) => void;
  onClose: () => void;
}

export function ServicePriceModal({ service, onSelect, onClose }: ServicePriceModalProps) {
  return (
    <Dialog open={!!service} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Price — {service?.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {service?.prices.map((price) => {
            const label = price.size_label ?? price.vehicle_category ?? "Default";
            return (
              <button
                key={price.id}
                type="button"
                onClick={() => onSelect(price.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-lg border-2 p-4",
                  "hover:border-primary hover:bg-primary/5 transition-colors",
                  "text-center capitalize"
                )}
              >
                <span className="text-sm font-medium">{label}</span>
                <span className="text-lg font-bold">
                  KES {Number(price.price).toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
