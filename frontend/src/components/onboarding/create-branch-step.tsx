"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { ChevronDown, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Business } from "@/hooks/commons/use-business";
import { type CreateBranchPayload, useCreateBranch } from "@/hooks/commons/use-branches";
import { generateBranchCode } from "@/lib/business";
import { cn } from "@/lib/utils";

interface Props {
  business: Business;
  /** Lets the page hold off its "already onboarded" redirect until every branch is saved. */
  onSubmittingChange?: (submitting: boolean) => void;
}

interface BranchDraft {
  key: number;
  name: string;
  location: string;
  phone: string;
  code: string;
  showMore: boolean;
}

/** True when the backend rejected the branch code (e.g. unique constraint). */
function isCodeConflict(error: AxiosError): boolean {
  const data = error.response?.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== "object") return false;
  if ("code" in data) return true;
  const text = JSON.stringify(data).toLowerCase();
  return text.includes("code") && (text.includes("unique") || text.includes("exists"));
}

interface BranchFieldsProps {
  draft: BranchDraft;
  index: number;
  removable: boolean;
  onChange: (patch: Partial<BranchDraft>) => void;
  onNameChange: (value: string) => void;
  onRemove: () => void;
}

function BranchFields({ draft, index, removable, onChange, onNameChange, onRemove }: BranchFieldsProps) {
  const id = (field: string) => `branch-${field}-${draft.key}`;

  return (
    <div className={cn("space-y-5", index > 0 && "border-t pt-5")}>
      {removable && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Branch {index + 1}</span>
          {index > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              aria-label={`Remove branch ${index + 1}`}
              onClick={onRemove}
            >
              <X size={16} />
            </Button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor={id("name")}>Branch name</Label>
        <Input
          id={id("name")}
          value={draft.name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Westlands"
          className="h-11"
          autoFocus
          required={index === 0}
        />
        <p className="text-xs text-muted-foreground">
          Branch code: <span className="font-mono">{draft.code}</span>
        </p>
      </div>

      <Button
        type="button"
        variant="ghost"
        className="h-10 -ml-3 text-muted-foreground"
        aria-expanded={draft.showMore}
        aria-controls={id("more")}
        onClick={() => onChange({ showMore: !draft.showMore })}
      >
        <ChevronDown
          size={16}
          className={cn("mr-1 transition-transform", draft.showMore && "rotate-180")}
        />
        {draft.showMore ? "Show less" : "Show more"}
      </Button>

      {draft.showMore && (
        <div id={id("more")} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor={id("location")}>Location</Label>
            <Input
              id={id("location")}
              value={draft.location}
              onChange={(e) => onChange({ location: e.target.value })}
              placeholder="Waiyaki Way, Nairobi"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={id("phone")}>Phone</Label>
            <Input
              id={id("phone")}
              type="tel"
              inputMode="tel"
              value={draft.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              placeholder="0712 345 678"
              className="h-11"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function CreateBranchStep({ business, onSubmittingChange }: Props) {
  const router = useRouter();
  const { mutateAsync: createBranch } = useCreateBranch();

  const nextKeyRef = useRef(1);
  const newDraft = (key: number): BranchDraft => ({
    key,
    name: "",
    location: "",
    phone: "",
    code: generateBranchCode(business.name, ""),
    showMore: false,
  });

  const [drafts, setDrafts] = useState<BranchDraft[]>(() => [newDraft(0)]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const isPending = progress !== null;

  const updateDraft = (key: number, patch: Partial<BranchDraft>) =>
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const removeDraft = (key: number) => setDrafts((prev) => prev.filter((d) => d.key !== key));

  const addDraft = () => {
    const draft = newDraft(nextKeyRef.current++);
    setDrafts((prev) => [...prev, draft]);
  };

  const createWithRetry = async (payload: CreateBranchPayload, key: number) => {
    try {
      await createBranch(payload);
    } catch (error) {
      if (!isCodeConflict(error as AxiosError)) throw error;
      const nextCode = generateBranchCode(business.name, payload.name);
      updateDraft(key, { code: nextCode });
      await createBranch({ ...payload, code: nextCode });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const toCreate = drafts.filter((d) => d.name.trim());
    if (!drafts[0]?.name.trim() || isPending) return;

    onSubmittingChange?.(true);
    setProgress({ done: 0, total: toCreate.length });
    try {
      for (const [i, draft] of toCreate.entries()) {
        const payload: CreateBranchPayload = {
          name: draft.name.trim(),
          code: draft.code,
          business: business.id,
        };
        if (draft.location.trim()) payload.location = draft.location.trim();
        if (draft.phone.trim()) payload.phone = draft.phone.trim();
        await createWithRetry(payload, draft.key);
        // Saved branches drop out of the form so a retry won't duplicate them.
        setDrafts((prev) => {
          const rest = prev.filter((d) => d.key !== draft.key);
          return rest.length ? rest : prev;
        });
        setProgress({ done: i + 1, total: toCreate.length });
      }
      router.replace("/dashboard");
    } catch {
      // Error toast is shown by the API layer; keep the remaining drafts for a retry.
      setProgress(null);
      onSubmittingChange?.(false);
    }
  };

  const multiple = drafts.length > 1;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">
          {multiple ? "Add your branches" : "Add your first branch"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Jobs, workers and reports are tracked per branch for{" "}
          <span className="font-medium text-foreground">{business.name}</span>.
        </p>
      </div>

      {drafts.map((draft, index) => (
        <BranchFields
          key={draft.key}
          draft={draft}
          index={index}
          removable={multiple}
          onChange={(patch) => updateDraft(draft.key, patch)}
          onNameChange={(value) =>
            updateDraft(draft.key, { name: value, code: generateBranchCode(business.name, value) })
          }
          onRemove={() => removeDraft(draft.key)}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full border-dashed bg-transparent text-muted-foreground hover:text-foreground"
        onClick={addDraft}
        disabled={isPending}
      >
        <Plus size={16} className="mr-2" />
        Add another branch
      </Button>

      <Button type="submit" className="h-11 w-full" disabled={isPending || !drafts[0]?.name.trim()}>
        {isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
        {isPending
          ? progress.total > 1
            ? `Creating branches… (${Math.min(progress.done + 1, progress.total)}/${progress.total})`
            : "Creating branch…"
          : "Finish setup"}
      </Button>
    </form>
  );
}
