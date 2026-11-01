"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
import { useBranches, useSwitchBranch, type Branch } from "@/hooks/commons/use-branches";

const STORAGE_KEY = "activeBranchId";

interface BranchContextValue {
  activeBranch: Branch | null;
  branches: Branch[];
  switchBranch: (branch: Branch) => void;
  isLoading: boolean;
}

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  // Subscribing to current-user re-renders this provider after login, which enables the branches query.
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const { data: branches = [], isLoading: isBranchesLoading } = useBranches(user?.id);
  const isLoading = isUserLoading || isBranchesLoading;
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);
  const { mutate: persistBranch } = useSwitchBranch();
  const userBranchId = user?.branch ?? null;

  useEffect(() => {
    if (!branches.length) {
      setActiveBranch(null);
      return;
    }

    // The server-side branch decides where jobs go and what data is scoped to, so it wins.
    const savedId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const preferredId = userBranchId ?? savedId;
    const matched = preferredId ? branches.find((b) => b.id === preferredId) : null;
    setActiveBranch(matched ?? branches[0]);
  }, [branches, userBranchId]);

  const switchBranch = (branch: Branch) => {
    const apply = () => {
      setActiveBranch(branch);
      localStorage.setItem(STORAGE_KEY, branch.id);
    };
    if (user?.role === "owner") {
      persistBranch({ branch: branch.id }, { onSuccess: apply });
    } else {
      apply();
    }
  };

  return (
    <BranchContext.Provider value={{ activeBranch, branches, switchBranch, isLoading }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useActiveBranch(): BranchContextValue {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useActiveBranch must be used inside BranchProvider");
  return ctx;
}
