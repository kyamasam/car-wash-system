import { useApiQuery } from "@/hooks/use-api";

export interface Branch {
  id: string;
  name: string;
  code: string;
  location: string;
  phone: string;
  business: string;
  is_active: boolean;
}

export function useBranches(userId?: string) {
  return useApiQuery<Branch[], Branch[]>("/commons/branches/all/", {
    queryKey: ["branches", userId],
    select: (data) => data,
    staleTime: 1000 * 60 * 10,
    enabled: !!userId,
  });
}
