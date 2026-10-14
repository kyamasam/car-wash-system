"use client";

import { ThemeProvider } from "@/components/theme/theme-providers";
import { BranchProvider } from "@/contexts/branch-context";
import { CurrencyProvider } from "@/contexts/currency-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <BranchProvider>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
          </BranchProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
