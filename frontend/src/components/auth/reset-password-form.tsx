"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiMutation } from "@/hooks/use-api";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

function ResetPasswordContent({ onSuccess }: ResetPasswordFormProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [form, setForm] = useState({
    new_password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  const { mutate, isPending, error, isSuccess } = useApiMutation<any, any>({
    method: "POST",
    url: "/users/auth/reset-password/",
  });

  useEffect(() => {
    if (!token || !email) {
      router.push("/");
    } else {
      setIsValidated(true);
    }
  }, [token, email, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (form.new_password !== form.confirm_password) {
      return;
    }

    mutate(
      {
        token,
        email,
        new_password: form.new_password,
        confirm_password: form.confirm_password,
      },
      {
        onSuccess: () => {
          setTimeout(() => {
            if (onSuccess) {
              onSuccess();
            } else {
              router.push("/");
            }
          }, 2000);
        },
      },
    );
  };

  const passwordsMatch = form.new_password === form.confirm_password;
  const isPasswordValid = form.new_password.length >= 8;

  if (!isValidated) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isSuccess) {
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
        <h3 className="text-lg font-semibold">Password Reset Successful!</h3>
        <p className="text-sm text-muted-foreground">
          Your password has been reset successfully. You can now login with your
          new password.
        </p>
        <Button onClick={() => router.push("/login")} className="w-full">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new_password">New Password</Label>
        <div className="relative">
          <Input
            id="new_password"
            name="new_password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={form.new_password}
            onChange={handleChange}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {form.new_password && !isPasswordValid && (
          <p className="text-xs text-red-500">
            Password must be at least 8 characters
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirm New Password</Label>
        <div className="relative">
          <Input
            id="confirm_password"
            name="confirm_password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            value={form.confirm_password}
            onChange={handleChange}
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {form.confirm_password && !passwordsMatch && (
          <p className="text-xs text-red-500">Passwords do not match</p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {(error as any)?.response?.data?.error ||
              (error as any)?.response?.data?.message ||
              "Failed to reset password"}
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || !passwordsMatch || !isPasswordValid}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting Password...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>
    </form>
  );
}

export const ResetPasswordForm = (props: ResetPasswordFormProps) => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent {...props} />
    </Suspense>
  );
};
