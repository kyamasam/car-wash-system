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

function BranchAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  return (
    <div
      className={cn(
        "rounded-md flex items-center justify-center shrink-0 font-bold",
        "bg-primary text-primary-foreground",
        size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-[12px]",
      )}
    >
      {getBranchInitials(name)}
    </div>
  );
}

export function BranchSwitcher() {
  const { activeBranch, branches, switchBranch, isLoading } = useActiveBranch();

  if (isLoading) {
    return <Skeleton className="h-8 w-32 rounded-xl" />;
  }

  if (!activeBranch) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 rounded-xl",
          "border border-border bg-background/60",
          "text-sm font-medium",
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
            "flex items-center gap-1.5 px-2 py-1.5 rounded-[8px]",
            "border border-border bg-background/60",
            "text-sm font-medium transition-colors",
            "hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "max-w-[200px]",
          )}
        >
          <BranchAvatar name={activeBranch.name} />
          <span className="truncate text-[13px]">{activeBranch.name}</span>
          <ChevronDown size={12} className="shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
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
