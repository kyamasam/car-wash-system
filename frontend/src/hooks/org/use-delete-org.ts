import { useApiMutation } from "@/hooks/use-api";

export const useDeleteOrg = (orgSlug: string) => {
  return useApiMutation<void, void>({
    method: "DELETE",
    url: `/users/organizations/${orgSlug}/`,
    invalidateQueries: [["organizations"]],
  });
};
