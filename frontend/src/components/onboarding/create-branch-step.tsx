"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AxiosError } from "axios";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Business } from "@/hooks/commons/use-business";
import { type CreateBranchPayload, useCreateBranch } from "@/hooks/commons/use-branches";
import { generateBranchCode } from "@/lib/business";
import { cn } from "@/lib/utils";

interface Props {
  business: Business;
}

/** True when the backend rejected the branch code (e.g. unique constraint). */
function isCodeConflict(error: AxiosError): boolean {
  const data = error.response?.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== "object") return false;
  if ("code" in data) return true;
  const text = JSON.stringify(data).toLowerCase();
  return text.includes("code") && (text.includes("unique") || text.includes("exists"));
}

export function CreateBranchStep({ business }: Props) {
  const router = useRouter();
  const { mutate: createBranch, isPending } = useCreateBranch();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [code, setCode] = useState(() => generateBranchCode(business.name, ""));
  const retriedRef = useRef(false);

  const handleNameChange = (value: string) => {
    setName(value);
    setCode(generateBranchCode(business.name, value));
  };

  const submit = (payload: CreateBranchPayload) => {
    createBranch(payload, {
      onSuccess: () => router.replace("/dashboard"),
      onError: (error) => {
        if (retriedRef.current || !isCodeConflict(error)) return;
        retriedRef.current = true;
        const nextCode = generateBranchCode(business.name, payload.name);
        setCode(nextCode);
        submit({ ...payload, code: nextCode });
      },
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    retriedRef.current = false;
    const payload: CreateBranchPayload = { name: trimmedName, code, business: business.id };
    if (location.trim()) payload.location = location.trim();
    if (phone.trim()) payload.phone = phone.trim();
    submit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Add your first branch</h1>
        <p className="text-sm text-muted-foreground">
          Jobs, workers and reports are tracked per branch for{" "}
          <span className="font-medium text-foreground">{business.name}</span>.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="branch-name">Branch name</Label>
        <Input
          id="branch-name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Westlands"
          className="h-11"
          autoFocus
          required
        />
        <p className="text-xs text-muted-foreground">
          Branch code: <span className="font-mono">{code}</span>
        </p>
      </div>

      <Button
        type="button"
        variant="ghost"
        className="h-10 -ml-3 text-muted-foreground"
        aria-expanded={showMore}
        aria-controls="branch-more-options"
        onClick={() => setShowMore((v) => !v)}
      >
        <ChevronDown
          size={16}
          className={cn("mr-1 transition-transform", showMore && "rotate-180")}
        />
        {showMore ? "Show less" : "Show more"}
      </Button>

      {showMore && (
        <div id="branch-more-options" className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="branch-location">Location</Label>
            <Input
              id="branch-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Waiyaki Way, Nairobi"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="branch-phone">Phone</Label>
            <Input
              id="branch-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712 345 678"
              className="h-11"
            />
          </div>
        </div>
      )}

      <Button type="submit" className="h-11 w-full" disabled={isPending || !name.trim()}>
        {isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
        {isPending ? "Creating branch…" : "Finish setup"}
      </Button>
    </form>
  );
}
