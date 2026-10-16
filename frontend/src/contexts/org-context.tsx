"use client";

import { createContext, useContext, useState } from "react";
import { useSetCurrentOrg } from "@/hooks/org/use-set-current-org";
import type { Organization } from "@/types/org/organization";

interface OrgContextValue {
  activeOrg: Organization | null;
  setActiveOrg: (org: Organization) => void;
  switchOrg: (org: Organization) => void;
  orgs: Organization[];
  isLoading: boolean;
  isSwitching: boolean;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const orgs: Organization[] = [];
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const { mutate: persistCurrentOrg, isPending: isSwitching } = useSetCurrentOrg();

  const switchOrg = (org: Organization) => {
    setActiveOrg(org);
    persistCurrentOrg({ slug: org.slug });
  };

  return (
    <OrgContext.Provider
      value={{
        activeOrg,
        setActiveOrg,
        switchOrg,
        orgs,
        isLoading: false,
        isSwitching,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useActiveOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useActiveOrg must be used inside OrgProvider");
  return ctx;
}
