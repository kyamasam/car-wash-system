"use client";

import * as React from "react";
import { BanknoteIcon, ExternalLinkIcon, PlusIcon, ReceiptIcon } from "lucide-react";

import { useBillingStore } from "@/stores/billing-store";
import { useActiveBranch } from "@/contexts/branch-context";
import { RecordExpenseModal } from "@/components/billing/record-expense-modal";
import { Button } from "@/components/ui/button";
import { WriteGuard } from "@/components/subscriptions/write-guard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaymentMethod } from "@/types/billing/payment";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  mpesa: "M-Pesa",
  card: "Card",
  bank_transfer: "Bank Transfer",
};

const METHOD_VARIANT: Record<PaymentMethod, React.ComponentProps<typeof Badge>["variant"]> = {
  cash: "secondary",
  mpesa: "default",
  card: "outline",
  bank_transfer: "outline",
};

const PAGE_SIZE = 10;

export default function ExpensesPage() {
  const { expensesList, expensesListLoading, fetchExpenses } = useBillingStore();
  const { branches } = useActiveBranch();

  const [page, setPage] = React.useState(1);
  const [modalOpen, setModalOpen] = React.useState(false);

  React.useEffect(() => {
    fetchExpenses({ page });
  }, [page, fetchExpenses]);

  const expenses = expensesList?.results ?? [];
  const totalCount = expensesList?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? "—";

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track money spent running the business.
          </p>
        </div>
        <WriteGuard>
          <Button onClick={() => setModalOpen(true)}>
            <PlusIcon className="size-4" />
            Record Expense
          </Button>
        </WriteGuard>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BanknoteIcon className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Spent (this page)</p>
            <p className="text-lg font-semibold">
              {totalSpent.toLocaleString("en-KE", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ReceiptIcon className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="text-lg font-semibold">{totalCount}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      {expensesListLoading ? (
        <div className="rounded-xl border border-border p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ReceiptIcon className="size-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No expenses yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Record rent, supplies, repairs and other costs to see them here.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Method</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Transaction Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Branch</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(expense.incurred_on).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{expense.name || expense.category_detail?.name || "Expense"}</p>
                    {expense.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{expense.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold tabular-nums">
                    {parseFloat(expense.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant={METHOD_VARIANT[expense.method]} className="text-xs">
                      {METHOD_LABEL[expense.method]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {expense.transaction_code ?? <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {branchName(expense.branch)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {expense.receipt && (
                      <a href={expense.receipt} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="text-xs">
                          Receipt
                          <ExternalLinkIcon className="size-3" />
                        </Button>
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || expensesListLoading}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || expensesListLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <RecordExpenseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => fetchExpenses({ page })}
      />
    </div>
  );
}
