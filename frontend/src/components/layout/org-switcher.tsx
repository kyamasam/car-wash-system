"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveOrg } from "@/contexts/org-context";
import { cn } from "@/lib/utils";
import type { Organization } from "@/types/org/organization";
import { Building2, Check, ChevronDown, Loader2, Plus } from "lucide-react";

function getOrgInitials(name: string): string {
  return name
    ?.split(" ")
    ?.slice(0, 2)
    ?.map((w) => w[0]?.toUpperCase() ?? "")
    ?.join("");
}

function OrgAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  return (
    <div
      className={cn(
        "rounded-md flex items-center justify-center shrink-0 font-bold",
        "bg-primary text-primary-foreground",
        size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-[12px]",
      )}
    >
      {getOrgInitials(name)}
    </div>
  );
}

export function OrgSwitcher() {
  const { activeOrg, orgs, switchOrg, isLoading, isSwitching } = useActiveOrg();

  if (isLoading) {
    return <Skeleton className="h-8 w-32 rounded-xl" />;
  }

  if (!activeOrg) {
    return (
      <button
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 rounded-xl",
          "border border-border bg-background/60",
          "text-sm font-medium transition-colors",
          "hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        onClick={() => (window.location.href = "/dashboard/settings/org")}
      >
        <Plus size={13} className="shrink-0 text-muted-foreground" />
        <span className="text-[13px] text-muted-foreground">New org</span>
      </button>
    );
  }

  const otherOrgs = orgs.filter((o) => o.id !== activeOrg.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-2 py-1.5 rounded-[8px]",
            "border border-border bg-background/60",
            "text-sm font-medium transition-colors",
            "hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "max-w-[200px]",
          )}
          disabled={isSwitching}
        >
          <OrgAvatar name={activeOrg.name} />
          <span className="truncate text-[13px]">{activeOrg.name}</span>
          {isSwitching ? (
            <Loader2 size={12} className="shrink-0 text-muted-foreground animate-spin" />
          ) : (
            <ChevronDown size={12} className="shrink-0 text-muted-foreground" />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Organizations
        </DropdownMenuLabel>

        {/* Active org */}
        <OrgItem org={activeOrg} isActive onSelect={() => { }} />

        {/* Other orgs */}
        {otherOrgs.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {otherOrgs.map((org) => (
              <OrgItem
                key={org.id}
                org={org}
                isActive={false}
                onSelect={() => switchOrg(org)}
              />
            ))}
          </>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-xs text-muted-foreground gap-2"
          onClick={() => (window.location.href = "/dashboard/settings/org")}
        >
          <Building2 size={13} />
          Manage organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OrgItem({
  org,
  isActive,
  onSelect,
}: {
  org: Organization;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      className={cn("flex items-center gap-2 cursor-pointer", isActive && "bg-muted")}
      onClick={onSelect}
    >
      <OrgAvatar name={org.name} />
      <span className="flex-1 truncate text-[13px]">{org.name}</span>
      {isActive && <Check size={13} className="text-primary shrink-0" />}
    </DropdownMenuItem>
  );
}
