"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useBranches, type Branch } from "@/hooks/commons/use-branches";

const STORAGE_KEY = "activeBranchId";

interface BranchContextValue {
  activeBranch: Branch | null;
  branches: Branch[];
  switchBranch: (branch: Branch) => void;
  isLoading: boolean;
}

const BranchContext = createContext<BranchContextValue | null>(null);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { data: branches = [], isLoading } = useBranches();
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);

  useEffect(() => {
    if (!branches.length) return;

    const savedId = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    const matched = savedId ? branches.find((b) => b.id === savedId) : null;
    setActiveBranch(matched ?? branches[0]);
  }, [branches]);

  const switchBranch = (branch: Branch) => {
    setActiveBranch(branch);
    localStorage.setItem(STORAGE_KEY, branch.id);
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
