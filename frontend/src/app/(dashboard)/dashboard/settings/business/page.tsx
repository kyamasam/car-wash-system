"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ImageUp, Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Currency } from "@/contexts/currency-context";
import { type Business, useCurrentBusiness, useUpdateBusiness } from "@/hooks/commons/use-business";
import { DEFAULT_JOB_CARD_FOOTER, DEFAULT_RECEIPT_FOOTER } from "@/lib/print/job-card";
import { CURRENCIES, MAX_LOGO_BYTES, getInitials } from "@/lib/business";

export default function BusinessSettingsPage() {
  const { data: business, isLoading } = useCurrentBusiness();

  if (isLoading) {
    return (
      <div className="max-w-xl space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!business) {
    return (
      <p className="text-sm text-muted-foreground">
        Your account is not linked to a business.
      </p>
    );
  }

  // Re-mount the form (resetting its state) whenever the saved business changes.
  const formKey = [
    business.id,
    business.name,
    business.logo,
    business.currency,
    business.print_job_card_by_default,
    business.receipt_footer,
    business.job_card_footer,
  ].join("|");
  return <BusinessForm key={formKey} business={business} />;
}

function BusinessForm({ business }: { business: Business }) {
  const { mutate: updateBusiness, isPending } = useUpdateBusiness();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(business.name ?? "");
  const [currency, setCurrency] = useState<Currency | "">(business.currency ?? "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(business.logo);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [showCurrencyConfirm, setShowCurrencyConfirm] = useState(false);
  const [printJobCardByDefault, setPrintJobCardByDefault] = useState(
    business.print_job_card_by_default ?? true,
  );
  const [receiptFooter, setReceiptFooter] = useState(business.receipt_footer ?? "");
  const [jobCardFooter, setJobCardFooter] = useState(business.job_card_footer ?? "");

  const currencyLocked = !!business.currency;

  // Release object URLs created for local previews.
  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Logo must be an image file.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Logo must be 2 MB or smaller.");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setLogoRemoved(false);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setLogoRemoved(true);
  };

  const save = () => {
    const form = new FormData();
    form.append("name", name);
    if (!currencyLocked && currency) form.append("currency", currency);
    if (logoFile) form.append("logo", logoFile);
    else if (logoRemoved) form.append("logo", "");
    form.append("print_job_card_by_default", String(printJobCardByDefault));
    form.append("receipt_footer", receiptFooter.trim());
    form.append("job_card_footer", jobCardFooter.trim());
    updateBusiness(form, { onSuccess: () => setShowCurrencyConfirm(false) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currencyLocked && currency) {
      setShowCurrencyConfirm(true);
      return;
    }
    save();
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Business profile</h2>
        <p className="text-sm text-muted-foreground">
          Your logo and name appear on job cards and receipts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label>Logo</Label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Business logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">
                  {getInitials(name || business.name)}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageUp size={14} className="mr-2" />
                  {logoPreview ? "Change logo" : "Upload logo"}
                </Button>
                {logoPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={handleRemoveLogo}
                  >
                    <Trash2 size={14} className="mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">PNG, JPG or SVG, up to 2 MB.</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="business-name">Business name</Label>
          <Input
            id="business-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sparkle Car Wash"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Currency</Label>
          <Select
            value={currency}
            onValueChange={(v) => setCurrency(v as Currency)}
            disabled={currencyLocked}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {currencyLocked ? (
              <>
                <Lock size={11} /> Currency is locked and cannot be changed.
              </>
            ) : (
              "Currency cannot be changed after saving."
            )}
          </p>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="print-job-card-by-default"
            checked={printJobCardByDefault}
            onCheckedChange={(checked) => setPrintJobCardByDefault(checked === true)}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label htmlFor="print-job-card-by-default" className="cursor-pointer">
              Print job card by default
            </Label>
            <p className="text-xs text-muted-foreground">
              Pre-checks &quot;Print job card&quot; when creating a new job.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="receipt-footer">Receipt footer</Label>
          <Textarea
            id="receipt-footer"
            value={receiptFooter}
            onChange={(e) => setReceiptFooter(e.target.value)}
            placeholder={DEFAULT_RECEIPT_FOOTER}
            maxLength={500}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Printed at the bottom of every receipt. Leave blank for the default message.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="job-card-footer">Job card footer</Label>
          <Textarea
            id="job-card-footer"
            value={jobCardFooter}
            onChange={(e) => setJobCardFooter(e.target.value)}
            placeholder={DEFAULT_JOB_CARD_FOOTER}
            maxLength={500}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Printed at the bottom of every job card. Leave blank for the default message.
          </p>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>

      <AlertDialog open={showCurrencyConfirm} onOpenChange={setShowCurrencyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Set currency to {currency}?</AlertDialogTitle>
            <AlertDialogDescription>
              All amounts will be recorded in <strong>{currency}</strong>. Once saved, the
              currency cannot be changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                save();
              }}
              disabled={isPending}
            >
              {isPending ? "Saving…" : "Confirm and save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
