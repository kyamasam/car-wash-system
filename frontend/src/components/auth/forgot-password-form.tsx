"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiMutation } from "@/hooks/use-api";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const RESEND_COOLDOWN = 60;

interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordForm = ({
  onBackToLogin,
}: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { mutate, isPending, error } = useApiMutation<any, { email: string }>({
    method: "POST",
    url: "/users/auth/forgot-password/",
  });

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(
      { email },
      {
        onSuccess: () => {
          setIsSubmitted(true);
          startCooldown();
        },
      },
    );
  };

  const handleResend = () => {
    if (cooldown > 0 || isPending) return;
    setResendSuccess(false);
    mutate(
      { email },
      {
        onSuccess: () => {
          setResendSuccess(true);
          startCooldown();
        },
      },
    );
  };

  if (isSubmitted) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-full bg-green-100 w-12 h-12 mx-auto flex items-center justify-center">
          <svg
            className="w-6 h-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">Check Your Email</h3>
        <p className="text-sm text-muted-foreground">
          We've sent a password reset link to <strong>{email}</strong>. Please
          check your inbox and follow the instructions to reset your password.
        </p>

        <div className="text-sm text-muted-foreground">
          {isPending ? (
            <span className="flex items-center justify-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Sending...
            </span>
          ) : resendSuccess ? (
            <span className="text-green-600">Email resent successfully!</span>
          ) : cooldown > 0 ? (
            <span>
              Resend available in{" "}
              <span className="font-medium tabular-nums">{cooldown}s</span>
            </span>
          ) : (
            <span>
              Didn't receive it?{" "}
              <button
                type="button"
                onClick={handleResend}
                className="cursor-pointer text-primary underline underline-offset-2 hover:no-underline font-medium"
              >
                Resend email
              </button>
            </span>
          )}
        </div>

        <Button variant="outline" onClick={onBackToLogin} className="w-full">
          Back to Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {(error as any)?.response?.data?.error ||
              "Failed to send reset email"}
          </AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Reset Link"
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        onClick={onBackToLogin}
        className="w-full"
      >
        Back to Login
      </Button>
    </form>
  );
};
