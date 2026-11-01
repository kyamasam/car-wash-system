import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation, useApiQuery } from "@/hooks/use-api";
import type { CurrentUser } from "@/types/auth/current-user";

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

export interface CreateBranchPayload {
  name: string;
  code: string;
  business: string;
  location?: string;
  phone?: string;
}

export function useCreateBranch() {
  return useApiMutation<Branch, CreateBranchPayload>({
    method: "POST",
    url: "/commons/branches/",
    // The business's first branch becomes the owner's default branch, so refresh the user too.
    invalidateQueries: ["branches", "current-user"],
  });
}

/** Sets the owner's active branch on the server; every branch-scoped query is refetched. */
export function useSwitchBranch() {
  const queryClient = useQueryClient();
  return useApiMutation<CurrentUser, { branch: string }>({
    method: "POST",
    url: "/users/switch-branch/",
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
