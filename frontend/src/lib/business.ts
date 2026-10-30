import type { Currency } from "@/contexts/currency-context";

export const CURRENCIES: { code: Currency; label: string }[] = [
  { code: "KES", label: "KES — Kenyan Shilling" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
];

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const BRANCH_CODE_MAX_LENGTH = 20;

function businessCodePart(businessName: string): string {
  const words = businessName
    .toUpperCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Z]/g, ""))
    .filter(Boolean);
  const initials = words.slice(0, 4).map((w) => w[0]).join("");
  if (initials.length >= 2) return initials;
  return words[0]?.slice(0, 3) || "BIZ";
}

function branchCodePart(branchName: string): string {
  const words = branchName
    .toUpperCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Z0-9]/g, ""))
    .filter(Boolean);
  if (words.length > 1) return words.slice(0, 4).map((w) => w[0]).join("");
  return words[0]?.slice(0, 4) || "BR";
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6).padEnd(4, "0").toUpperCase();
}

/** e.g. "SCW-WEST-4F9K" — unique-ish, max 20 chars (backend CharField max_length=20). */
export function generateBranchCode(businessName: string, branchName: string): string {
  const biz = businessCodePart(businessName);
  const suffix = randomSuffix();
  // Keep the random suffix intact; shrink the branch part if needed.
  const room = BRANCH_CODE_MAX_LENGTH - biz.length - suffix.length - 2;
  const branch = branchCodePart(branchName).slice(0, Math.max(room, 1));
  return `${biz}-${branch}-${suffix}`.slice(0, BRANCH_CODE_MAX_LENGTH);
}
