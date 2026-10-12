import { useApiMutation } from "@/hooks/use-api";

export const useCancelInvite = (orgSlug: string) => {
  return useApiMutation<void, { memberId: string }>({
    method: "POST",
    url: ({ memberId }) => `/users/organizations/${orgSlug}/members/${memberId}/cancel-invite/`,
    invalidateQueries: [["org-members", orgSlug]],
  });
};
