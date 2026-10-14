import { useApiQuery } from "@/hooks/use-api";

export interface Branch {
  id: string;
  name: string;
  code: string;
  location: string;
}

interface PaginatedBranches {
  count: number;
  results: Branch[];
}

export function useBranches() {
  return useApiQuery<PaginatedBranches, Branch[]>("/commons/branches/", {
    queryKey: ["branches"],
    select: (data) => data.results,
    staleTime: 1000 * 60 * 10,
    enabled: typeof window !== "undefined" && !!localStorage.getItem("authToken"),
  });
}
