"use client";

import { createContext, useContext, useEffect, useState } from "react";

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

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Currency | null;
    if (stored && ["KES", "USD", "EUR"].includes(stored)) {
      setSelectedCurrencyState(stored);
    }
  }, []);

  // Rates endpoint removed; fall back to fixed USD-based rates (1 USD = rate[target]).
  const rateMap: Record<string, number> = { USD: 1, KES: 130, EUR: 0.92 };

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
    <CurrencyContext.Provider value={{ selectedCurrency, setSelectedCurrency, formatInCurrency, usdToKes, isLoading: false }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}
