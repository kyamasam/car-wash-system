"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Currency, useCurrency } from "@/contexts/currency-context";
import { ChevronDown } from "lucide-react";

const CURRENCIES: { code: Currency; label: string }[] = [
  { code: "KES", label: "KES" },
  { code: "USD", label: "USD" },
  { code: "EUR", label: "EUR" },
];

export function CurrencySwitcher() {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const active = CURRENCIES.find((c) => c.code === selectedCurrency) ?? CURRENCIES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] border border-border text-[13px] font-medium text-foreground hover:bg-muted transition-colors outline-none">
          <span>{active.label}</span>
          <ChevronDown size={12} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[110px]">
        {CURRENCIES.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onSelect={() => setSelectedCurrency(c.code)}
            className="flex items-center gap-2 cursor-pointer"
            data-active={c.code === selectedCurrency}
          >
            <span>{c.label}</span>
            {c.code === selectedCurrency && (
              <span className="ml-auto text-primary text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
