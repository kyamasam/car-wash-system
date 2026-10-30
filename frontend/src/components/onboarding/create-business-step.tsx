"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
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
import { LogoUploadField } from "@/components/onboarding/logo-upload-field";
import type { Currency } from "@/contexts/currency-context";
import { useCreateBusiness } from "@/hooks/commons/use-business";
import { CURRENCIES } from "@/lib/business";
import { DEFAULT_JOB_CARD_FOOTER, DEFAULT_RECEIPT_FOOTER } from "@/lib/print/job-card";
import { cn } from "@/lib/utils";

export function CreateBusinessStep() {
  const { mutate: createBusiness, isPending } = useCreateBusiness();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<Currency>("KES");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [printJobCardByDefault, setPrintJobCardByDefault] = useState(true);
  const [receiptFooter, setReceiptFooter] = useState("");
  const [jobCardFooter, setJobCardFooter] = useState("");

  // Release object URLs created for local previews.
  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const form = new FormData();
    form.append("name", trimmedName);
    form.append("currency", currency);
    if (logoFile) form.append("logo", logoFile);
    form.append("print_job_card_by_default", String(printJobCardByDefault));
    form.append("receipt_footer", receiptFooter.trim());
    form.append("job_card_footer", jobCardFooter.trim());
    // On success the ["business","current"] query refetches and the page advances to step 2.
    createBusiness(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Set up your business</h1>
        <p className="text-sm text-muted-foreground">
          Your logo and name appear on job cards and receipts.
        </p>
      </div>

      <LogoUploadField
        preview={logoPreview}
        fallbackName={name}
        onSelect={(file) => {
          setLogoFile(file);
          setLogoPreview(URL.createObjectURL(file));
        }}
        onRemove={() => {
          setLogoFile(null);
          setLogoPreview(null);
        }}
      />

      <div className="space-y-2">
        <Label htmlFor="business-name">Business name</Label>
        <Input
          id="business-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Sparkle Car Wash"
          className="h-11"
          autoFocus
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Currency</Label>
        <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Currency cannot be changed later.</p>
      </div>

      <Button
        type="button"
        variant="ghost"
        className="h-10 -ml-3 text-muted-foreground"
        aria-expanded={showMore}
        aria-controls="business-more-options"
        onClick={() => setShowMore((v) => !v)}
      >
        <ChevronDown
          size={16}
          className={cn("mr-1 transition-transform", showMore && "rotate-180")}
        />
        {showMore ? "Show less" : "Show more"}
      </Button>

      {showMore && (
        <div id="business-more-options" className="space-y-5">
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
        </div>
      )}

      <Button type="submit" className="h-11 w-full" disabled={isPending || !name.trim()}>
        {isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
        {isPending ? "Creating business…" : "Continue"}
      </Button>
    </form>
  );
}
