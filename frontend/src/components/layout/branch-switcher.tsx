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
import { useActiveBranch } from "@/contexts/branch-context";
import { cn } from "@/lib/utils";
import type { Branch } from "@/hooks/commons/use-branches";
import { Check, ChevronDown, GitBranch } from "lucide-react";

function getBranchInitials(name: string): string {
  return name
    ?.split(" ")
    ?.slice(0, 2)
    ?.map((w) => w[0]?.toUpperCase() ?? "")
    ?.join("");
}

function BranchAvatar({
  name,
  size = "sm",
  round = false,
}: {
  name: string;
  size?: "sm" | "md";
  round?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center shrink-0 font-bold",
        round ? "rounded-full" : "rounded-md",
        "bg-primary text-primary-foreground",
        size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-[12px]",
      )}
    >
      {getBranchInitials(name)}
    </div>
  );
}

interface BranchSwitcherProps {
  /** "pill" = Material-style rounded field for the mobile top bar */
  variant?: "default" | "pill";
}

export function BranchSwitcher({ variant = "default" }: BranchSwitcherProps) {
  const { activeBranch, branches, switchBranch, isLoading } = useActiveBranch();
  const isPill = variant === "pill";

  if (isLoading) {
    return (
      <Skeleton
        className={isPill ? "h-10 w-full max-w-[260px] rounded-full" : "h-8 w-32 rounded-xl"}
      />
    );
  }

  if (!activeBranch) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-sm font-medium",
          isPill
            ? "h-10 w-full max-w-[260px] justify-center px-3 rounded-full bg-muted"
            : "px-2 py-1.5 rounded-xl border border-border bg-background/60",
        )}
      >
        <GitBranch size={13} className="shrink-0 text-muted-foreground" />
        <span className="text-[13px] text-muted-foreground">No branch</span>
      </div>
    );
  }

  const otherBranches = branches.filter((b) => b.id !== activeBranch.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isPill
              ? "h-10 w-full max-w-[260px] justify-center px-3 rounded-full bg-muted hover:bg-muted/80"
              : "px-2 py-1.5 rounded-[8px] border border-border bg-background/60 hover:bg-muted max-w-[200px]",
          )}
        >
          <BranchAvatar name={activeBranch.name} round={isPill} />
          <span className="truncate text-[13px]">{activeBranch.name}</span>
          <ChevronDown size={12} className="shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={isPill ? "center" : "end"} className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Branches
        </DropdownMenuLabel>

        <BranchItem branch={activeBranch} isActive onSelect={() => {}} />

        {otherBranches.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {otherBranches.map((branch) => (
              <BranchItem
                key={branch.id}
                branch={branch}
                isActive={false}
                onSelect={() => switchBranch(branch)}
              />
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BranchItem({
  branch,
  isActive,
  onSelect,
}: {
  branch: Branch;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <DropdownMenuItem
      className={cn("flex items-center gap-2 cursor-pointer", isActive && "bg-muted")}
      onClick={onSelect}
    >
      <BranchAvatar name={branch.name} />
      <div className="flex-1 min-w-0">
        <span className="block truncate text-[13px]">{branch.name}</span>
        {branch.location && (
          <span className="block truncate text-[11px] text-muted-foreground">{branch.location}</span>
        )}
      </div>
      {isActive && <Check size={13} className="text-primary shrink-0" />}
    </DropdownMenuItem>
  );
}
