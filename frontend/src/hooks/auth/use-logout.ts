import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("authToken");
    queryClient.setQueryData(["current-user"], null);
    router.push("/");
  };

  return { logout };
};
