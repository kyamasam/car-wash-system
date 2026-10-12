import { useApiQuery } from "@/hooks/use-api";

interface AccountStatusResponse {
  email_verified: boolean;
}

export const useCheckAccountStatus = (email: string) => {
  const { data, isLoading } = useApiQuery<AccountStatusResponse>(
    `/users/check-status/?email=${encodeURIComponent(email)}`,
    {
      queryKey: ["check-account-status", email],
      enabled: !!email,
    },
  );

  return {
    emailVerified: data?.email_verified ?? false,
    isLoading,
  };
};
