import { useApiMutation } from "@/hooks/use-api";
import type { OrganizationMember, OrgRole } from "@/types/org/organization";

export const useChangeMemberRole = (orgSlug: string) => {
  return useApiMutation<OrganizationMember, { memberId: string; role: OrgRole }>({
    method: "PATCH",
    url: ({ memberId }) => `/users/organizations/${orgSlug}/members/${memberId}/`,
    invalidateQueries: [["org-members", orgSlug]],
  });
};
