import { useApiMutation } from "@/hooks/use-api";
import { AxiosError } from "axios";

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface ConfirmAccountPayload {
  email: string;
  otp_code: string;
  password?: string;
  confirm_password?: string;
}

export interface ConfirmAccountResponse {
  access?: string;
  refresh?: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    username: string;
    user_type: string;
    avatar: string | null;
  };
  detail?: string;
}

export const useRegister = () => {
  const mutation = useApiMutation<unknown, RegisterPayload>({
    url: "/users/",
    method: "POST",
  });

  const register = async (payload: RegisterPayload) => {
    try {
      return await mutation.mutateAsync(payload);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.detail || error.message || "Registration failed"
          : error instanceof Error
            ? error.message
            : "An unknown error occurred";
      throw new Error(message);
    }
  };

  return {
    register,
    isPending: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};

export const useResendVerification = () => {
  const mutation = useApiMutation<{ detail: string }, { email: string }>({
    url: "/users/resend-verification/",
    method: "POST",
  });

  const resend = async (email: string) => {
    try {
      return await mutation.mutateAsync({ email });
    } catch (error) {
      const axiosErr = error instanceof AxiosError ? error : null;
      const secondsLeft = axiosErr?.response?.data?.seconds_left as number | undefined;
      const message =
        axiosErr?.response?.data?.detail ||
        axiosErr?.message ||
        "Failed to resend code";
      throw Object.assign(new Error(message), { secondsLeft });
    }
  };

  return { resend, isPending: mutation.isPending };
};

export const useConfirmAccount = () => {
  const mutation = useApiMutation<ConfirmAccountResponse, ConfirmAccountPayload>({
    url: "/users/confirm-account/",
    method: "POST",
  });

  const confirmAccount = async (payload: ConfirmAccountPayload): Promise<ConfirmAccountResponse> => {
    try {
      return await mutation.mutateAsync(payload);
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.detail ||
            error.response?.data?.non_field_errors?.[0] ||
            error.message ||
            "Verification failed"
          : error instanceof Error
            ? error.message
            : "An unknown error occurred";
      throw new Error(message);
    }
  };

  return {
    confirmAccount,
    isPending: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};
