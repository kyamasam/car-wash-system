import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import type { ExpenseCategory } from "@/types/billing/expense";

export function useExpenseCategories() {
  return useApiQuery<ExpenseCategory[]>("/billing/expense-categories/", {
    queryKey: ["expense-categories"],
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateExpenseCategory() {
  return useApiMutation<ExpenseCategory, { name: string }>({
    method: "POST",
    url: "/billing/expense-categories/",
    invalidateQueries: ["expense-categories"],
  });
}
