"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { InsetLabelInput } from "./inset-lable-input";
import { OTPVerificationForm } from "./otp-verification-form";
import {
  emailSchema,
  phoneSchema,
  fullNameSchema,
} from "../../lib/validations";
import { signIn, authClient } from "@/lib/auth-client";
import { trpc } from "@/trpc/client";
import Link from "next/link";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    phone?: string;
    fullName?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTPForm, setShowOTPForm] = useState(false);

  const handleEmailChange = (value: string) => {
    setEmail(value);

    const emailValidation = emailSchema.safeParse(value);
    if (!emailValidation.success && value) {
      setErrors((prev) => ({
        ...prev,
        email: emailValidation.error.errors[0].message,
      }));
    } else {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePhoneChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    setPhone(cleanValue);

    const phoneValidation = phoneSchema.safeParse(cleanValue);
    if (!phoneValidation.success && cleanValue) {
      setErrors((prev) => ({
        ...prev,
        phone: phoneValidation.error.errors[0].message,
      }));
    } else {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const handleFullNameChange = (value: string) => {
    setFullName(value);

    const nameValidation = fullNameSchema.safeParse(value);
    if (!nameValidation.success && value) {
      setErrors((prev) => ({
        ...prev,
        fullName: nameValidation.error.errors[0].message,
      }));
    } else {
      setErrors((prev) => ({ ...prev, fullName: undefined }));
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (error) {
      console.error("Google sign in failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const { data, error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });

      if (error) {
        setErrors((prev) => ({
          ...prev,
          email: error.message || "Failed to send verification code. Please try again.",
        }));
        return;
      }

      if (data) {
        setShowOTPForm(true);
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
      setErrors((prev) => ({
        ...prev,
        email:
          error?.message || 
          error?.error?.message ||
          "Failed to send verification code. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToForm = () => {
    setShowOTPForm(false);
  };

  const isFormValid =
    emailSchema.safeParse(email).success &&
    phoneSchema.safeParse(phone).success &&
    fullNameSchema.safeParse(fullName).success;

  const isLoading = isSubmitting;

  if (showOTPForm) {
    return (
      <OTPVerificationForm
        email={email}
        mode="register"
        onBack={handleBackToForm}
        profileData={{
          name: fullName,
          phone: phone,
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-[400px] mx-auto">
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">
            Start earning for free
          </h1>
          <p className="text-muted-foreground text-base">
            Create your account and join thousands of creators.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-12 text-base font-medium"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 256 262"
                  className="mr-2"
                >
                  <path
                    fill="#4285F4"
                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                  />
                  <path
                    fill="#34A853"
                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                  />
                  <path
                    fill="#FBBC05"
                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                  />
                  <path
                    fill="#EB4335"
                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                  />
                </svg>
              )}
              Sign up with Google
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

            <div className="space-y-4">
              <InsetLabelInput
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
                disabled={isLoading}
                error={errors.email}
              />

              <InsetLabelInput
                label="Mobile phone number"
                type="tel"
                placeholder="Mobile phone number"
                value={phone}
                onChange={handlePhoneChange}
                prefix="+256"
                isPhoneInput={true}
                error={errors.phone}
              />

              <InsetLabelInput
                label="Full name"
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={handleFullNameChange}
                error={errors.fullName}
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            <p className="text-sm text-muted-foreground text-center">
              By continuing you agree to the{" "}
              <a
                href="#"
                className="underline hover:text-foreground transition-colors"
              >
                Terms
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="underline hover:text-foreground transition-colors"
              >
                Privacy Policy
              </a>
            </p>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : null}
              Sign up
            </Button>
          </motion.div>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-foreground font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
