"use client";

import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useRegister } from "@/hooks/auth/use-register";
import { useSocialLogin } from "@/hooks/auth/use-social-login";
import { useAuthRedirectStore } from "@/stores/auth-redirect-store";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface RegisterCardProps {
  className?: string;
  registrationTitle?: String;
}

export const RegisterCard = ({ className, registrationTitle }: RegisterCardProps) => {
  const router = useRouter();
  const consumeRedirectUrl = useAuthRedirectStore((s) => s.consumeRedirectUrl);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [registerForm, setRegisterForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const { register, isPending: isRegistering } = useRegister();
  const { loginWithGoogle, isPending: isGooglePending } = useSocialLogin({
    onSuccess: () => router.push(consumeRedirectUrl() ?? "/dashboard"),
  });

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormError(null);
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (registerForm.password !== registerForm.confirm_password) {
      setFormError("Passwords do not match.");
      return;
    }

    if (registerForm.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    try {
      await register({
        first_name: registerForm.first_name,
        last_name: registerForm.last_name,
        email: registerForm.email,
        password: registerForm.password,
      });
      const passwordSet = registerForm.password.length > 0;
      router.push(`/verify-email?email=${encodeURIComponent(registerForm.email)}&password_set=${passwordSet}`);
    } catch (err: any) {
      setFormError(err.message || "Registration failed. Please try again.");
    }
  };

  const handleGoogleSuccess = async (accessToken: string) => {
    await loginWithGoogle(accessToken);
  };

  return (
    <div className={`border-0 shadow-none ${className ?? ""}`}>
      <CardHeader>
        <CardTitle className="py-8">{registrationTitle || 'Create an account'} </CardTitle>

      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input
                id="first_name"
                name="first_name"
                type="text"
                placeholder="Jane"
                value={registerForm.first_name}
                onChange={handleRegisterChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input
                id="last_name"
                name="last_name"
                type="text"
                placeholder="Doe"
                value={registerForm.last_name}
                onChange={handleRegisterChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={registerForm.email}
              onChange={handleRegisterChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={registerForm.password}
                onChange={handleRegisterChange}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm password</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                name="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={registerForm.confirm_password}
                onChange={handleRegisterChange}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isRegistering}>
            {isRegistering ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <CardDescription>
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-purple-600 hover:text-purple-700 hover:underline font-medium"
          >
            Sign in
          </Link>
        </CardDescription>

        <div className="flex items-center space-x-2">
          <Separator className="flex-1" />
          <span className="text-sm text-muted-foreground">OR</span>
          <Separator className="flex-1" />
        </div>

        <GoogleLoginButton
          onSuccess={handleGoogleSuccess}
          variant="outline"
          size="default"
          text="Continue with Google"
          disabled={isGooglePending}
        />
      </CardContent>
    </div>
  );
};
