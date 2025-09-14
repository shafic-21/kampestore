import { AuthHeader } from "@/features/auth/ui/components/auth-header";
import { AuthFooter } from "@/features/auth/ui/components/auth-footer";
import { AuthGuard } from "@/features/auth/ui/components/auth-guard";
import { LoginForm } from "@/features/auth/ui/components/login-form";
import { RegisterForm } from "@/features/auth/ui/components/register-form";
import { redirect } from "next/navigation";

interface AuthPageProps {
	params: Promise<{ mode: string }>;
}

export default async function AuthPage({ params }: AuthPageProps) {
	const { mode } = await params;

	// Safeguard: redirect invalid modes to login
	if (mode !== "login" && mode !== "register") {
		redirect("/auth/login");
	}

	const isLogin = mode === "login";

	return (
		<AuthGuard>
			<div className="min-h-screen flex flex-col">
				<AuthHeader />

				<div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
					<div className="w-full max-w-md">
						{isLogin ? <LoginForm /> : <RegisterForm />}
					</div>
				</div>

				<AuthFooter />
			</div>
		</AuthGuard>
	);
}
