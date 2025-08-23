"use client";

import { SignupLoginForm } from "@/features/auth/ui/components/signup-login-form";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "signin";

  return (
    <div className="min-h-screen flex">

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          <SignupLoginForm />
        </div>
      </div>
    </div>
  );
}