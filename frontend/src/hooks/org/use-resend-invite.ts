import { useApiMutation } from "@/hooks/use-api";
import type { OrganizationMember } from "@/types/org/organization";

export const useResendInvite = (orgSlug: string) => {
  return useApiMutation<OrganizationMember, { memberId: string }>({
    method: "POST",
    url: ({ memberId }) => `/users/organizations/${orgSlug}/members/${memberId}/resend-invite/`,
    invalidateQueries: [["org-members", orgSlug]],
  });
};
