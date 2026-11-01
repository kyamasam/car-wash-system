"use client";

import { LoginCard } from "@/components/auth/login-card";
import { AuthHeroLayout } from "@/components/auth/auth-hero-layout";
import { useCurrentUser } from "@/hooks/auth/use-current-user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useCurrentUser();

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  return (
    <AuthHeroLayout
      heading="Welcome back!"
      subheading="Log in to manage your car wash jobs, workers, and payments."
      imageSrc="/images/carwash.jpg"
    >
      <LoginCard className="w-full max-w-md" />
    </AuthHeroLayout>
  );
}
