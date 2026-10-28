"use client";

import * as React from "react";
import { Loader2Icon } from "lucide-react";

import { useBillingStore } from "@/stores/billing-store";
import { Button } from "@/components/ui/button";
import { WriteGuard } from "@/components/subscriptions/write-guard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Job } from "@/types/jobs/job";
import type { PaymentMethod, PaymentType } from "@/types/billing/payment";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "mpesa", label: "M-Pesa" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

const TYPES: { value: PaymentType; label: string }[] = [
  { value: "payment", label: "Payment" },
  { value: "deposit", label: "Deposit" },
  { value: "refund", label: "Refund" },
];

const NEEDS_TRANSACTION_CODE: PaymentMethod[] = ["mpesa", "card", "bank_transfer"];

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface PayJobModalProps {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PayJobModal({ job, open, onOpenChange, onSuccess }: PayJobModalProps) {
  const { createPayment, createPaymentLoading } = useBillingStore();

  const remaining = (
    parseFloat(job.total_amount) - parseFloat(job.amount_paid)
  ).toFixed(2);

  const [amount, setAmount] = React.useState(remaining);
  const [method, setMethod] = React.useState<PaymentMethod>("cash");
  const [type, setType] = React.useState<PaymentType>("payment");
  const [transactionCode, setTransactionCode] = React.useState("");
  const [payerPhone, setPayerPhone] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [paidAt, setPaidAt] = React.useState(() => toLocalDatetimeValue(new Date()));

  React.useEffect(() => {
    if (open) {
      const rem = (parseFloat(job.total_amount) - parseFloat(job.amount_paid)).toFixed(2);
      setAmount(rem);
      setMethod("cash");
      setType("payment");
      setTransactionCode("");
      setPayerPhone("");
      setNotes("");
      setPaidAt(toLocalDatetimeValue(new Date()));
    }
  }, [open, job.total_amount, job.amount_paid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createPayment({
      type,
      method,
      amount,
      transaction_code: transactionCode || undefined,
      payer_phone: payerPhone || undefined,
      paid_at: new Date(paidAt).toISOString(),
      notes: notes || undefined,
      job: job.id,
      branch: job.branch,
    });
    if (result) {
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const showTransactionCode = NEEDS_TRANSACTION_CODE.includes(method);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment — {job.job_number}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pay-amount">Amount</Label>
              <Input
                id="pay-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Balance: {remaining}
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as PaymentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Payment Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
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
              <Label htmlFor="pay-txn">Transaction Code</Label>
              <Input
                id="pay-txn"
                value={transactionCode}
                onChange={(e) => setTransactionCode(e.target.value)}
                placeholder="e.g. QJK2X3ABC4"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-phone">Payer Phone</Label>
            <Input
              id="pay-phone"
              type="tel"
              value={payerPhone}
              onChange={(e) => setPayerPhone(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-at">Paid At</Label>
            <Input
              id="pay-at"
              type="datetime-local"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pay-notes">Notes</Label>
            <Textarea
              id="pay-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              rows={2}
            />
          </div>

          <DialogFooter showCloseButton>
            <WriteGuard>
              <Button type="submit" disabled={createPaymentLoading}>
                {createPaymentLoading ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  "Record Payment"
                )}
              </Button>
            </WriteGuard>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
