"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { authClient, signIn } from "@/lib/auth-client";

interface TokenVerificationFormProps {
  email: string;
  onSuccess?: () => void;
  onResendSuccess?: () => void;
}

export function TokenVerificationForm({
  email,
  onSuccess,
  onResendSuccess,
}: TokenVerificationFormProps) {
  const [token, setToken] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyToken = async () => {
    if (!token.trim()) {
      setError("Please enter the verification token");
      return;
    }

    try {
      setError(null);
      await authClient.magicLink.verify(
        {
          query: {
            token: token.trim(),
            callbackURL: "/",
          },
        },
        {
          onRequest: () => {
            setIsVerifying(true);
          },
          onResponse: () => {
            setIsVerifying(false);
          },
          onSuccess: () => {
            onSuccess?.();
          },
          onError: (ctx) => {
            setError("Invalid or expired token. Please try again.");
          },
        }
      );
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError("Email is required to resend verification");
      return;
    }

    try {
      setError(null);
      await signIn.magicLink(
        {
          email,
        },
        {
          onRequest: () => {
            setIsResending(true);
          },
          onResponse: () => {
            setIsResending(false);
          },
          onSuccess: () => {
            onResendSuccess?.();
          },
          onError: () => {
            setError("Failed to resend email. Please try again.");
          },
        }
      );
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setIsResending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isVerifying) {
      handleVerifyToken();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-lg md:text-xl">Check your email</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          We sent a verification email to{" "}
          <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Click the link in the email, or copy and paste the verification
            token below:
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="token">Verification Token</Label>
          <Input
            id="token"
            type="text"
            placeholder="Paste your verification token here"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isVerifying}
            className="font-mono text-sm"
          />
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleVerifyToken}
            disabled={isVerifying || !token.trim()}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify Token"
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full"
          >
            {isResending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending...
              </>
            ) : (
              "Resend verification email"
            )}
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or try
            resending.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}