"use client";

import * as React from "react";
import { Loader2Icon, XIcon } from "lucide-react";

import { useBillingStore } from "@/stores/billing-store";
import { useActiveBranch } from "@/contexts/branch-context";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
import {
  useCreateExpenseCategory,
  useExpenseCategories,
} from "@/hooks/billing/use-expense-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchCombobox } from "@/components/ui/search-combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentMethod } from "@/types/billing/payment";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "mpesa", label: "M-Pesa" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

const NEEDS_TRANSACTION_CODE: PaymentMethod[] = [
  "mpesa",
  "card",
  "bank_transfer",
];

function todayValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface RecordExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RecordExpenseModal({
  open,
  onOpenChange,
  onSuccess,
}: RecordExpenseModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Expense</DialogTitle>
        </DialogHeader>
        {/* Mounted only while open, so the form starts fresh each time */}
        <RecordExpenseForm
          onDone={() => {
            onOpenChange(false);
            onSuccess?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function RecordExpenseForm({ onDone }: { onDone: () => void }) {
  const { createExpense, createExpenseLoading } = useBillingStore();
  const { activeBranch, branches } = useActiveBranch();
  const { data: currentUser } = useCurrentUser();

  const { data: categories = [], isLoading: categoriesLoading } =
    useExpenseCategories();
  const createCategory = useCreateExpenseCategory();

  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState<PaymentMethod>("cash");
  const [transactionCode, setTransactionCode] = React.useState("");
  const [receipt, setReceipt] = React.useState<File | null>(null);
  const receiptInputRef = React.useRef<HTMLInputElement>(null);
  const [incurredOn, setIncurredOn] = React.useState(todayValue);
  const [branch, setBranch] = React.useState(activeBranch?.id ?? "");

  const handleCreateCategory = async (label: string) => {
    try {
      const created = await createCategory.mutateAsync({ name: label });
      setCategory(created.id);
    } catch {
      // Error toast is shown by the API layer
    }
  };

  const clearReceipt = () => {
    setReceipt(null);
    if (receiptInputRef.current) receiptInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createExpense({
      name: name.trim() || undefined,
      category: category || undefined,
      description: description.trim() || undefined,
      amount,
      method,
      transaction_code: transactionCode.trim() || undefined,
      receipt: receipt ?? undefined,
      incurred_on: incurredOn,
      branch,
      recorded_by: currentUser?.id,
    });
    if (result) onDone();
  };

  const showTransactionCode = NEEDS_TRANSACTION_CODE.includes(method);
  const recordedByName = currentUser
    ? `${currentUser.first_name} ${currentUser.last_name}`.trim() ||
      currentUser.username
    : "—";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="exp-name">Name</Label>
        <Input
          id="exp-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Diesel for generator"
          maxLength={255}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Category</Label>
        <SearchCombobox
          items={categories.map((c) => ({ value: c.id, label: c.name }))}
          value={category}
          onSelect={setCategory}
          placeholder="Select or create a category"
          searchPlaceholder="Search or type a new category..."
          loading={categoriesLoading}
          emptyText="No categories yet. Type a name to create one."
          onCreate={handleCreateCategory}
          creating={createCategory.isPending}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exp-amount">Amount</Label>
          <Input
            id="exp-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exp-date">Incurred On</Label>
          <Input
            id="exp-date"
            type="date"
            value={incurredOn}
            onChange={(e) => setIncurredOn(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Payment Method</Label>
        <Select
          value={method}
          onValueChange={(v) => setMethod(v as PaymentMethod)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METHODS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showTransactionCode && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="exp-txn">Transaction Code</Label>
          <Input
            id="exp-txn"
            value={transactionCode}
            onChange={(e) => setTransactionCode(e.target.value)}
            placeholder="e.g. QJK2X3ABC4"
            maxLength={100}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>Branch</Label>
        <Select value={branch} onValueChange={setBranch}>
          <SelectTrigger>
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="exp-receipt">Receipt</Label>
        <div className="flex items-center gap-2">
          <Input
            id="exp-receipt"
            ref={receiptInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
          />
          {receipt && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearReceipt}
              aria-label="Remove receipt"
            >
              <XIcon className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="exp-description">Description</Label>
        <Textarea
          id="exp-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional"
          maxLength={255}
          rows={2}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Recorded by{" "}
        <span className="font-medium text-foreground">{recordedByName}</span>
      </p>

      <DialogFooter showCloseButton>
        <Button type="submit" disabled={createExpenseLoading || !branch}>
          {createExpenseLoading ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            "Record Expense"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
