import { useApiQuery } from "@/hooks/use-api";
import type { OrganizationMember } from "@/types/org/organization";

export const useOrgMembers = (orgSlug: string | undefined) => {
  return useApiQuery<OrganizationMember[]>(
    `/users/organizations/${orgSlug}/members/`,
    {
      queryKey: ["org-members", orgSlug],
      enabled: !!orgSlug,
    },
  );
};
