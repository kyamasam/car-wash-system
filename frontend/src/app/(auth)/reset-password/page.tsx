import { AuthHeroLayout } from "@/components/auth/auth-hero-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthHeroLayout
      heading="Reset your password"
      subheading="Enter a new password for your account."
      imageSrc="/images/servers.webp"
    >
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-6 space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">New password</h2>
          <p className="text-sm text-muted-foreground">
            Choose a strong password to secure your account.
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </AuthHeroLayout>
  );
}
