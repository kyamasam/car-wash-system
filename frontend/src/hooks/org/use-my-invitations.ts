import { useApiQuery } from "@/hooks/use-api";
import type { PendingInvitation } from "@/types/org/organization";

export const useMyInvitations = () => {
  return useApiQuery<PendingInvitation[]>("/users/my-invitations/", {
    queryKey: ["my-invitations"],
    staleTime: 30_000,
  });
};
