import { useApiMutation } from "@/hooks/use-api";
import type { OrganizationMember, OrgRole } from "@/types/org/organization";

interface InvitePayload {
  email: string;
  role: OrgRole;
}

export const useInviteMember = (orgSlug: string) => {
  return useApiMutation<OrganizationMember, InvitePayload>({
    method: "POST",
    url: `/users/organizations/${orgSlug}/members/invite/`,
    invalidateQueries: [["org-members", orgSlug]],
  });
};
