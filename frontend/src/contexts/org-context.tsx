"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useOrganizations } from "@/hooks/org/use-organizations";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
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
  const { data: orgs = [], isLoading: orgsLoading } = useOrganizations();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const { mutate: persistCurrentOrg, isPending: isSwitching } = useSetCurrentOrg();

  useEffect(() => {
    if (!orgs.length) return;

    const currentOrgSlug = currentUser?.current_organization?.slug;
    if (currentOrgSlug) {
      const matched = orgs.find((o) => o.slug === currentOrgSlug);
      if (matched) {
        setActiveOrg((prev) => (prev?.id === matched.id ? prev : matched));
        return;
      }
    }

    // Fall back to first org if none persisted
    setActiveOrg((prev) => prev ?? orgs[0]);
  }, [orgs, currentUser?.current_organization?.slug]);

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
        isLoading: orgsLoading || userLoading,
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
