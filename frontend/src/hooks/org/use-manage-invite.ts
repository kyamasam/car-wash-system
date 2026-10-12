import { useApiMutation } from "@/hooks/use-api";
import type { Organization } from "@/types/org/organization";

type InvitationAction = "accept" | "decline";

export const useManageInvite = (token: string) => {
  return useApiMutation<Organization, InvitationAction>({
    // We pass the action (accept/decline) as the "payload" to the mutation
    method: "POST",
    url: (action) => `/users/organizations/invitations/${token}/${action}/`,
    invalidateQueries: [["organizations"]],
  });
};