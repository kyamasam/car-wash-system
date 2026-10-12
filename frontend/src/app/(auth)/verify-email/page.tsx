"use client";

import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCheckAccountStatus } from "@/hooks/auth/use-check-account-status";
import { useConfirmAccount, useResendVerification } from "@/hooks/auth/use-register";
import { useSocialLogin } from "@/hooks/auth/use-social-login";
import { useAuthRedirectStore } from "@/stores/auth-redirect-store";
import { CheckCircle2, Clock, Eye, EyeOff, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

type PageState = "loading" | "already_verified" | "form" | "success" | "expired";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") ?? "";
  const tokenParam = searchParams.get("token") ?? "";
  const passwordSetParam = searchParams.get("password_set") === "true";

  const [otp, setOtp] = useState(tokenParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");

  const { confirmAccount, isPending } = useConfirmAccount();
  const { resend, isPending: isResending } = useResendVerification();
  const { emailVerified, isLoading: isCheckingStatus } = useCheckAccountStatus(email);
  const consumeRedirectUrl = useAuthRedirectStore((s) => s.consumeRedirectUrl);

  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);
  const { loginWithGoogle, isPending: isGooglePending } = useSocialLogin({
    onSuccess: () => {
      setPageState("success");
      setTimeout(() => router.push(consumeRedirectUrl() ?? "/"), 1500);
    },
    onError: (err) => setFormError(err),
  });

  useEffect(() => {
    if (isCheckingStatus) return;
    setPageState(emailVerified ? "already_verified" : "form");
  }, [isCheckingStatus, emailVerified]);

  useEffect(() => {
    if (tokenParam) setOtp(tokenParam);
  }, [tokenParam]);

  const handleResend = async () => {
    if (!email || cooldown > 0 || isResending) return;
    try {
      await resend(email);
      setCooldown(60);
      setFormError(null);
    } catch (err: any) {
      if (err.secondsLeft) {
        setCooldown(err.secondsLeft);
      } else {
        setFormError(err.message || "Failed to resend code.");
      }
    }
  };

  const passwordTooShort = password.length > 0 && password.length < 8;
  const passwordMismatch = password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email) {
      setFormError("Email address is missing. Please go back and register again.");
      return;
    }

    if (passwordTooShort) {
      setFormError("Password must be at least 8 characters.");
      return;
    }

    if (password && password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    try {
      const payload = password
        ? { email, otp_code: otp, password, confirm_password: confirmPassword }
        : { email, otp_code: otp };

      const response = await confirmAccount(payload);

      if (response?.access) {
        localStorage.setItem("authToken", response.access);
        if (response.refresh) localStorage.setItem("refreshToken", response.refresh);
        if (response.user) localStorage.setItem("user", JSON.stringify(response.user));
        setPageState("success");
        setTimeout(() => router.push(consumeRedirectUrl() ?? "/"), 1500);
      } else {
        setPageState("success");
        setTimeout(() => router.push(consumeRedirectUrl() ?? "/login?verified=true"), 2000);
      }
    } catch (err: any) {
      const message = err.message || "Verification failed. Please try again.";
      const lower = message.toLowerCase();
      if (lower.includes("expired") || lower.includes("already been used")) {
        setPageState("expired");
      } else {
        setFormError(message);
      }
    }
  };

  if (pageState === "loading") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Checking account status…</p>
        </CardContent>
      </Card>
    );
  }

  if (pageState === "already_verified") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-lg">Email already confirmed</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your account for{" "}
              <span className="font-medium text-foreground">{email}</span> is
              already active.
            </p>
          </div>
          <Button asChild className="w-full mt-2">
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Go to login
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (pageState === "expired") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="font-semibold text-lg">Link expired or already used</p>
            <p className="text-sm text-muted-foreground mt-1">
              This verification link is no longer valid. Please log in and
              request a new verification email.
            </p>
          </div>
          <Button asChild variant="outline" className="w-full mt-2">
            <Link href="/login">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (pageState === "success") {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <Mail className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-lg">Email verified!</p>
            <p className="text-sm text-muted-foreground mt-1">Logging you in…</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
            <Mail className="h-5 w-5 text-purple-600" />
          </div>
          <CardTitle>Verify your email</CardTitle>
        </div>
        <CardDescription>
          We sent a 4-digit code to{" "}
          {email ? (
            <span className="font-medium text-foreground">{email}</span>
          ) : (
            "your email address"
          )}
          .{" "}
          {passwordSetParam
            ? "Enter the code below to verify your email and activate your account."
            : "Enter it below and optionally set a password to complete your account."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification code</Label>
            <Input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              placeholder="1234"
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value);
                setFormError(null);
              }}
              required
              autoFocus
              className="text-center text-2xl tracking-[0.5em] font-mono"
            />
          </div>

          {!passwordSetParam && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Set password{" "}

                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFormError(null);
                    }}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordTooShort && (
                  <p className="text-xs text-destructive">
                    Password must be at least 8 characters.
                  </p>
                )}
              </div>

              {password.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setFormError(null);
                      }}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordMismatch && (
                    <p className="text-xs text-destructive">
                      Passwords do not match.
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPending || passwordTooShort || passwordMismatch}
          >
            {isPending ? "Verifying…" : "Verify account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Didn&apos;t receive a code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isResending}
              className="cursor-pointer text-purple-600 hover:text-purple-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending
                ? "Sending…"
                : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend code"}
            </button>
          </p>

          <div className="relative flex items-center gap-3 my-1">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              or
            </span>
            <Separator className="flex-1" />
          </div>

          <GoogleLoginButton
            text="Continue with Google"
            disabled={isGooglePending}
            onSuccess={loginWithGoogle}
            onError={(err) => setFormError(err)}
          />

          <p className="text-center text-sm text-muted-foreground">
            Wrong email?{" "}
            <Link
              href="/register"
              className="text-purple-600 hover:text-purple-700 hover:underline"
            >
              Go back
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}
