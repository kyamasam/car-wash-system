"use client";

import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface GoogleLoginButtonProps {
  onSuccess?: (response: any) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  text?: string;
  disabled?: boolean;
}

interface tokenResponse {
  access_token: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
}

export const GoogleLoginButton = (props: GoogleLoginButtonProps) => {
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return null;
  return <GoogleLoginButtonInner {...props} />;
};

const GoogleLoginButtonInner = ({
  onSuccess,
  onError,
  className = "",
  variant = "outline",
  size = "default",
  text = "Continue with Google",
  disabled = false,
}: GoogleLoginButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse: tokenResponse) => {
      setIsLoading(true);
      setError(null);

      try {
        if (tokenResponse.id_token) {
          await onSuccess?.(tokenResponse.id_token);
        } else {
          const response = await fetch(
            "https://www.googleapis.com/oauth2/v3/tokeninfo",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                access_token: tokenResponse.access_token,
              }),
            },
          );

          const tokenInfo = await response.json();

          if (!tokenInfo.email) {
            throw new Error("Failed to get user info from Google");
          }

          await onSuccess?.(tokenResponse.access_token);
        }
      } catch (err: any) {
        const errorMessage =
          err.message || "Google login failed. Please try again.";
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      const errorMessage = "Google login failed. Please try again.";
      setError(errorMessage);
      onError?.(errorMessage);
      console.error("Google login error:", error);
    },
    flow: "implicit",
  });

  const handleClick = () => {
    setError(null);
    googleLogin();
  };

  const isDisabled = disabled || isLoading;

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant={variant}
        size={size}
        className={`w-full ${className}`}
        onClick={handleClick}
        disabled={isDisabled}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {text}
          </>
        )}
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
