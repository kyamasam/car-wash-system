import { useApiMutation } from "@/hooks/use-api";

export const useRemoveMember = (orgSlug: string) => {
  return useApiMutation<void, { memberId: string }>({
    method: "DELETE",
    url: ({ memberId }) => `/users/organizations/${orgSlug}/members/${memberId}/`,
    invalidateQueries: [["org-members", orgSlug]],
  });
};
