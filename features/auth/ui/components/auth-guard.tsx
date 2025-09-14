"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";

interface AuthGuardProps {
	children: React.ReactNode;
	redirectTo?: string;
}

export function AuthGuard({ children, redirectTo = "/" }: AuthGuardProps) {
	const { data: session, isPending } = useSession();
	const router = useRouter();

	useEffect(() => {
		// If we have a session and we're not pending, redirect away from auth pages
		if (!isPending && session) {
			router.push(redirectTo);
		}
	}, [session, isPending, router, redirectTo]);

	// If we're checking session status, show nothing (or you could show a loading state)
	if (isPending) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
			</div>
		);
	}

	// If user is signed in, don't render auth forms
	if (session) {
		return null;
	}

	// User is not signed in, show auth forms
	return <>{children}</>;
}
