"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useHasAuthToken } from "@/hooks/auth/use-has-auth-token";
import { useCurrentBusiness } from "@/hooks/commons/use-business";

/**
 * Sends users without a business (GET /commons/businesses/current/ -> 404) to /onboarding.
 * Shows a loader until the business resolves so the empty dashboard never flashes.
 * Other errors (network, 5xx) and missing tokens don't block the dashboard.
 */
export function BusinessGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasToken = useHasAuthToken();
  const { isPending, error } = useCurrentBusiness();
  const needsOnboarding = error?.response?.status === 404;

  useEffect(() => {
    if (needsOnboarding) router.replace("/onboarding");
  }, [needsOnboarding, router]);

  // hasToken === null: hydrating. With a token, wait for the business query to settle.
  const waiting = hasToken === null || (hasToken && isPending) || needsOnboarding;

  if (waiting) {
    return (
      <div className="h-dvh flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    );
  }

  return <>{children}</>;
}
