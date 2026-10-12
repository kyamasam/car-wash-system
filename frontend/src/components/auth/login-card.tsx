"use client";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { ManualForm } from "@/components/auth/manual-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSocialLogin } from "@/hooks/auth/use-social-login";
import Link from "next/link";
import { useState } from "react";

interface LoginCardProps {
  onSuccess?: () => void;
  className?: string;
}

export const LoginCard = ({ onSuccess, className }: LoginCardProps) => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { loginWithGoogle, isPending: isGooglePending } = useSocialLogin({
    onSuccess,
  });

  const handleGoogleSuccess = async (accessToken: string) => {
    await loginWithGoogle(accessToken);
  };

  return (
    <Card className={`border-0 shadow-none ${className ?? ""}`}>
      <CardHeader>
        <CardTitle className="py-4">
          {showForgotPassword ? "Reset Password" : "Login"}
        </CardTitle>
        <CardDescription>
          {showForgotPassword
            ? "Enter your email to receive a password reset link"
            : ""}
        </CardDescription>

      </CardHeader>

      <CardContent className="space-y-4">
        {showForgotPassword ? (
          <ForgotPasswordForm
            onBackToLogin={() => setShowForgotPassword(false)}
          />
        ) : (
          <>
            <ManualForm
              onSuccess={onSuccess}
              onForgotPassword={() => setShowForgotPassword(true)}
            />


            <div className="flex items-center space-x-2">
              <Separator className="flex-1" />
              <span className="text-sm text-muted-foreground">OR</span>
              <Separator className="flex-1" />
            </div>

            <div className="space-y-2">
              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                variant="outline"
                size="default"
                text="Continue with Google"
                disabled={isGooglePending}
              />
            </div>
            {!showForgotPassword && (
              <p className="text-sm text-muted-foreground pt-1">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-primary font-medium hover:underline"
                >
                  Create one
                </Link>
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
