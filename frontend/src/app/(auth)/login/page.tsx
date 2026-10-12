"use client";

import { LoginCard } from "@/components/auth/login-card";
import { AuthHeroLayout } from "@/components/auth/auth-hero-layout";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  return (
    <AuthHeroLayout
      heading="Welcome back!"
      subheading="Log in to manage your cloud infrastructure, VPS instances, and billing."
      imageSrc="/images/servers.webp"
    >
      <LoginCard className="w-full max-w-md" onSuccess={() => router.push("/dashboard")} />
    </AuthHeroLayout>
  );
}
