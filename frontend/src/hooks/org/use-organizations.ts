import { useApiQuery } from "@/hooks/use-api";
import type { Organization } from "@/types/org/organization";

interface PaginatedOrganizations {
  count: number;
  next: string | null;
  previous: string | null;
  results: Organization[];
}

export const useOrganizations = () => {
  return useApiQuery<PaginatedOrganizations, Organization[]>("/users/organizations/", {
    queryKey: ["organizations"],
    enabled: typeof window !== "undefined" && !!localStorage.getItem("authToken"),
    select: (data) => data.results,
  });
};
