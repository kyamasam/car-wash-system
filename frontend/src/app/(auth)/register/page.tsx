import { AuthHeroLayout } from "@/components/auth/auth-hero-layout";
import { RegisterCard } from "@/components/auth/register-card";

export const metadata = {
  title: "Create account — SamfastNetworks",
};

export default function RegisterPage() {
  return (
    <AuthHeroLayout
      heading="Start hosting in minutes."
      subheading="Create your account and deploy your first VPS instance. Pay in KES via M-Pesa."
      imageSrc="/images/servers.webp"
    >
      <RegisterCard className="w-full max-w-md" />
    </AuthHeroLayout>
  );
}
