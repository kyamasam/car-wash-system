import { AuthHeroLayout } from "@/components/auth/auth-hero-layout";
import { RegisterCard } from "@/components/auth/register-card";

export const metadata = {
  title: "Create account — CarwashManager",
};

export default function RegisterPage() {
  return (
    <AuthHeroLayout
      heading="Run your car wash with ease."
      subheading="Create your account to manage jobs, workers, customers and M-Pesa payments in one place."
      imageSrc="/images/carwash.jpg"
    >
      <RegisterCard className="w-full max-w-md" />
    </AuthHeroLayout>
  );
}
