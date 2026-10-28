import { useCurrentUser } from "@/hooks/auth/use-current-user";
import { useSubscriptionStatus } from "./use-subscription-status";

const MANAGER_ROLES = new Set(["owner", "manager"]);

/** Who may pay for the subscription, and whether the business is in read-only mode. */
export function useSubscriptionAccess() {
  const { data: user } = useCurrentUser();
  const { data: status, isLoading } = useSubscriptionStatus();

  return {
    status,
    isLoading,
    isExpired: status?.status === "expired",
    canManage: MANAGER_ROLES.has(user?.role ?? ""),
    user,
  };
}
