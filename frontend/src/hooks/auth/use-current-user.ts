import { useApiQuery } from "@/hooks/use-api";
import type { CurrentUser } from "@/types/auth/current-user";

export const useCurrentUser = () => {
  const query = useApiQuery<CurrentUser>("/users/get-current-user/", {
    queryKey: ["current-user"],
    enabled: typeof window !== "undefined" && !!localStorage.getItem("authToken"),
  });

  return {
    ...query,
    isAuthenticated: !!query.data,
  };
};
