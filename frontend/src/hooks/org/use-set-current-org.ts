import { useApiMutation } from "@/hooks/use-api";

export const useSetCurrentOrg = () => {
  return useApiMutation<{ detail: string; slug: string }, { slug: string }>({
    method: "POST",
    url: "/users/set-current-organization/",
    invalidateQueries: ["current-user"],
  });
};
