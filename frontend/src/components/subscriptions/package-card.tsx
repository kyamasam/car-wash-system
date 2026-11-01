"use client";

import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BILLING_PERIOD_DAYS,
  FEATURE_LABELS,
  PERIOD_LABELS,
  formatPrice,
  getOfferedPeriods,
  getPeriodPrice,
  type FeatureCode,
  type Package,
} from "@/types/subscriptions/subscription";

interface PackageCardProps {
  pkg: Package;
  isCurrent?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}

export function PackageCard({ pkg, isCurrent, selected, onSelect }: PackageCardProps) {
  const periods = getOfferedPeriods(pkg);
  const features = pkg.features.filter((f): f is FeatureCode => f in FEATURE_LABELS);

  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e) => onSelect && (e.key === "Enter" || e.key === " ") && onSelect()}
      className={cn(
        "rounded-xl border bg-card p-4 space-y-3 transition-colors",
        onSelect && "cursor-pointer hover:border-primary/60",
        selected && "border-primary ring-1 ring-primary",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{pkg.name}</h3>
          {pkg.description && <p className="text-sm text-muted-foreground">{pkg.description}</p>}
        </div>
        {isCurrent && <Badge variant="secondary">Current</Badge>}
      </div>

      {periods.length === 0 ? (
        <p className="text-sm text-muted-foreground">Plans coming soon.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {periods.map((p) => (
            <li key={p} className="flex justify-between gap-2">
              <span className="text-muted-foreground">{PERIOD_LABELS[p]}</span>
              <span className="font-medium">
                {formatPrice(getPeriodPrice(pkg, p)!, pkg.currency)}
                <span className="text-muted-foreground font-normal"> / {BILLING_PERIOD_DAYS[p]}d</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {features.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm pt-2 border-t border-border">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-1.5">
              <Check className="size-3.5 text-primary shrink-0" />
              {FEATURE_LABELS[f]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
