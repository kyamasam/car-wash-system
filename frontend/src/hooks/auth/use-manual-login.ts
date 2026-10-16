// import { useApiMutation } from "@/hooks/use-api";
// import { AxiosError } from "axios";
// import { useQueryClient } from "@tanstack/react-query";
// import type { LoginPayload, LoginResponse } from "@/types/auth/manual-login";
// import {  useRouter } from "next/navigation";

// export const useLogin = (onSuccess?: () => void) => {
//   const queryClient = useQueryClient();
//   const router = useRouter();

//   const mutation = useApiMutation<LoginResponse, LoginPayload>(
//     "/token/",
//     "POST",
//     {
//       onSuccess: (data) => {
//         localStorage.setItem("authToken", data?.access);
//         queryClient.invalidateQueries({ queryKey: ["current-user"] });
//         router.push("/dashboard");
//         onSuccess?.();
//       },
//       onError: (error: AxiosError<any>) => {
//         const message =
//           error.response?.data?.detail || error.message || "Login failed";

//         console.error(message);
//       },
//     },
//   );

//   const login = (payload: LoginPayload) => {
//     mutation.mutate(payload);
//   };

//   return {
//     login,
//     isPending: mutation.isPending,
//     isError: mutation.isError,
//     isSuccess: mutation.isSuccess,
//     error: mutation.error,
//   };
// };


import { useApiMutation } from "@/hooks/use-api";
import { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import type { LoginPayload, LoginResponse } from "@/types/auth/manual-login";
import { useRouter } from "next/navigation";

const decodeJwtPayload = (token: string): Record<string, unknown> => {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
};

export const useLogin = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useApiMutation<LoginResponse, LoginPayload>({
    url: "/users/token/",
    method: "POST",
  });

  const login = async (payload: LoginPayload) => {
    try {
      const response = await mutation.mutateAsync(payload);

      if (!response?.access) {
        throw new Error("No access token received");
      }

      localStorage.setItem("authToken", response.access);

      const claims = decodeJwtPayload(response.access);
      if (!claims.email_verified) {
        const email = (claims.email as string) || payload.email;
        router.push(`/verify-email?email=${encodeURIComponent(email)}&password_set=true`);
        return response;
      }

      // Redirect first; refetches run in the background
      onSuccess?.();
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
      return response;
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.detail || error.message || "Login failed"
          : error instanceof Error
            ? error.message
            : "An unknown error occurred";

      console.error(message);
      throw new Error(message);
    }
  };

  return {
    login,
    isPending: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};
