import { useApiMutation } from "@/hooks/use-api";
import type { Organization } from "@/types/org/organization";

type UpdateOrgPayload = Partial<Pick<Organization, "name" | "billing_email" | "tax_id" | "industry" | "location" | "country">>;

export const useUpdateOrg = (orgSlug: string) => {
  return useApiMutation<Organization, UpdateOrgPayload>({
    method: "PATCH",
    url: `/users/organizations/${orgSlug}/`,
    invalidateQueries: [["organizations"]],
  });
};
