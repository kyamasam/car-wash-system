import { CurrentUser } from "@/types/auth/current-user";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Job data transformation utilities

export const formatSalary = (salary: { min: number; max: number; currency: string; salary_type?: string | null }): string => {
  const format = (val: number) => {
    if (val >= 1000) return `${Math.round(val / 1000)}k`;
    return val.toString();
  };
  const period = salary.salary_type === "monthly" ? "/mo" : salary.salary_type === "yearly" ? "/yr" : "";
  return `${salary.currency}${format(salary.min)} - ${format(salary.max)}${period ? ` ${period}` : ""}`;
};

export const mapWorkModeToDisplay = (mode: string): string => {
  const map: Record<string, string> = {
    remote: "Remote",
    hybrid: "Hybrid",
    on_site: "On-site"
  };
  return map[mode] || mode;
};

export const mapExperienceLevelToDisplay = (level: string): string => {
  const map: Record<string, string> = {
    entry_level: "Entry Level",
    associate: "Associate",
    mid_level: "Mid Level",
    senior: "Senior",
    manager: "Manager"
  };
  return map[level] || level;
};

export const mapRoleTypeToDisplay = (type: string): string => {
  const map: Record<string, string> = {
    full_time: "Full Time",
    internship: "Internship"
  };
  return map[type] || type;
};

export function deadlineInfo(
  dateStr: string | null | undefined,
): { label: string; className: string } | null {
  if (!dateStr) return null;
  const days = Math.floor(
    (new Date(dateStr).getTime() - Date.now()) / 86400000,
  );
  if (days < 0)
    return {
      label: "Deadline passed",
      className: "bg-red-50 text-red-600 border-red-200",
    };
  if (days === 0)
    return {
      label: "Closes today",
      className: "bg-red-50 text-red-600 border-red-200",
    };
  if (days <= 3)
    return {
      label: `${days}d left`,
      className: "bg-orange-50 text-orange-600 border-orange-200",
    };
  if (days <= 7)
    return {
      label: `${days}d left`,
      className: "bg-amber-50 text-amber-600 border-amber-200",
    };
  if (days <= 14)
    return {
      label: `${days}d left`,
      className: "bg-yellow-50 text-yellow-700 border-yellow-200",
    };
  return {
    label: `${days}d left`,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export const getUserInitials = (currentUser: CurrentUser) =>
    (() => {
        const first = currentUser?.first_name?.[0] || "";
        const last = currentUser?.last_name?.[0] || "";
        
        if (!first && !last) {
            return currentUser?.username?.slice(0, 2).toUpperCase() || "?";
        }
    console.log("first", first, last)
        
        return `${first}${last}`.toUpperCase();
    })();
