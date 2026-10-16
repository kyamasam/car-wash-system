import { useApiMutation } from "@/hooks/use-api";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface SocialLoginResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    username: string;
    user_type: string;
    avatar: string | null;
  };
}

interface GoogleLoginPayload {
  token: string;
}

interface UseSocialLoginOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useSocialLogin = (options?: UseSocialLoginOptions) => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Use your existing useApiMutation hook
  const { mutateAsync } = useApiMutation<
    SocialLoginResponse,
    GoogleLoginPayload
  >({
    method: "POST",
    url: "/users/auth/google/",
    invalidateQueries: [["current-user"]],
  });

  const loginWithGoogle = async (accessToken: string) => {
    setIsPending(true);
    setError(null);

    try {
      const response = await mutateAsync({ token: accessToken });

      const { access, refresh, user } = response;

      // Store tokens and user data
      localStorage.setItem("authToken", access);
      if (refresh) {
        localStorage.setItem("refreshToken", refresh);
      }
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect first; refetches run in the background
      options?.onSuccess?.();
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });

      return response;
    } catch (err) {
      let errorMessage = "Social login failed. Please try again.";

      if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      options?.onError?.(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsPending(false);
    }
  };

  return {
    loginWithGoogle,
    isPending,
    error,
  };
};
