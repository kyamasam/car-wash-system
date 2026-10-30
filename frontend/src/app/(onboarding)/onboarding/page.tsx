"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateBranchStep } from "@/components/onboarding/create-branch-step";
import { CreateBusinessStep } from "@/components/onboarding/create-business-step";
import { OnboardingSteps } from "@/components/onboarding/onboarding-steps";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
import { useHasAuthToken } from "@/hooks/auth/use-has-auth-token";
import { useBranches } from "@/hooks/commons/use-branches";
import { useCurrentBusiness } from "@/hooks/commons/use-business";

export default function OnboardingPage() {
  const router = useRouter();
  const hasToken = useHasAuthToken();
  const { data: business, isPending: isBusinessPending } = useCurrentBusiness();
  const { data: user, isPending: isUserPending } = useCurrentUser();
  const { data: branches, isPending: isBranchesPending } = useBranches(
    business ? user?.id : undefined,
  );
  const alreadyOnboarded = !!business && !!branches?.length;

  useEffect(() => {
    if (hasToken === false) router.replace("/login");
  }, [hasToken, router]);

  useEffect(() => {
    if (alreadyOnboarded) router.replace("/dashboard");
  }, [alreadyOnboarded, router]);

  const loading =
    !hasToken ||
    isBusinessPending ||
    (!!business && (isUserPending || (!!user && isBranchesPending))) ||
    alreadyOnboarded;

  return (
    <div className="space-y-6">
      <OnboardingSteps current={business ? 1 : 0} />
      <Card className="py-0">
        <CardContent className="p-5 sm:p-8">
          {loading ? (
            <div className="space-y-4" aria-busy="true">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-md" />
              ))}
            </div>
          ) : business ? (
            <CreateBranchStep business={business} />
          ) : (
            <CreateBusinessStep />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
