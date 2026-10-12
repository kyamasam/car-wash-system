"use client";

import { useCurrencyRates } from "@/hooks/commons/use-currency-rates";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Currency = "KES" | "USD" | "EUR";

const CURRENCY_LOCALES: Record<Currency, { locale: string; currency: string }> = {
  KES: { locale: "en-KE", currency: "KES" },
  USD: { locale: "en-US", currency: "USD" },
  EUR: { locale: "de-DE", currency: "EUR" },
};

type CurrencyContextValue = {
  selectedCurrency: Currency;
  setSelectedCurrency: (c: Currency) => void;
  formatInCurrency: (kes: number) => string;
  usdToKes: (usd: number) => number;
  isLoading: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = "sf_currency";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCurrency, setSelectedCurrencyState] = useState<Currency>("KES");
  const { data: rates, isLoading } = useCurrencyRates();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Currency | null;
    if (stored && ["KES", "USD", "EUR"].includes(stored)) {
      setSelectedCurrencyState(stored);
    }
  }, []);

  // rates are stored as "1 USD = rate target_currency", so we need all currencies
  // including KES to do the KES→target conversion: kes * rate[target] / rate[KES]
  const rateMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (rates) {
      for (const r of rates) {
        if (r.is_active) {
          map[r.target_currency] = Number(r.rate);
        }
      }
    }
    return map;
  }, [rates]);

  function setSelectedCurrency(c: Currency) {
    setSelectedCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
  }

  function usdToKes(usd: number): number {
    return usd * (rateMap["KES"] ?? 130);
  }

  function formatInCurrency(kes: number): string {
    const rate = rateMap[selectedCurrency] ?? 1;
    const kesRate = rateMap["KES"] ?? 1;
    // rates are USD-based: 1 USD = rate[target], so KES→target = kes * rate[target] / rate[KES]
    const converted = kes * rate / kesRate;
    const { locale, currency } = CURRENCY_LOCALES[selectedCurrency];
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted);
  }

  return (
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, formatInCurrency, usdToKes, isLoading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}
