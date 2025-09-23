"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { InputOTP } from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/trpc/client";

interface OTPVerificationFormProps {
	email: string;
	mode: "login" | "register";
	onBack: () => void;
	onSuccess?: () => void;
	profileData?: {
		name?: string;
		phone?: string;
	};
}

export function OTPVerificationForm({
	email,
	mode,
	onBack,
	onSuccess,
	profileData,
}: OTPVerificationFormProps) {
	const [otp, setOtp] = useState("");
	const [isVerifying, setIsVerifying] = useState(false);
	const [isResending, setIsResending] = useState(false);
	const [error, setError] = useState("");
	const [countdown, setCountdown] = useState(60);
	const [canResend, setCanResend] = useState(false);

	useEffect(() => {
		if (countdown > 0) {
			const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
			return () => clearTimeout(timer);
		} else {
			setCanResend(true);
		}
	}, [countdown]);

	useEffect(() => {
		if (otp.length === 6) {
			handleVerifyOTP();
		}
	}, [otp]);

	const updateUserProfile = trpc.auth.updateUserProfile.useMutation();

	const handleVerifyOTP = async () => {
		if (otp.length !== 6) return;

		setIsVerifying(true);
		setError("");

		try {
			await authClient.signIn.emailOtp({
				email,
				otp,
			});

			// If this is registration mode and we have profile data, update the user profile
			if (
				mode === "register" &&
				profileData &&
				(profileData.name || profileData.phone)
			) {
				try {
					const updateData: { name?: string; phone?: string } = {};

					if (profileData.name) {
						updateData.name = profileData.name;
					}

					if (profileData.phone) {
						// Clean phone number (remove any non-digits)
						updateData.phone = profileData.phone.replace(/\D/g, "");
					}

					await updateUserProfile.mutateAsync(updateData);
				} catch (profileError) {
					// Log profile update error but don't block user flow
					console.error("Failed to update user profile:", profileError);
				}
			}

			if (onSuccess) {
				onSuccess();
			} else {
				window.location.href = "/";
			}
		} catch (error: any) {
			console.error("OTP verification failed:", error);
			setError(error.message || "Invalid verification code. Please try again.");
			setOtp("");
		} finally {
			setIsVerifying(false);
		}
	};

	const handleResendCode = async () => {
		setIsResending(true);
		setError("");

		try {
			const { data, error } = await authClient.emailOtp.sendVerificationOtp({
				email,
				type: "sign-in",
			});

			if (error) {
				setError(error.message || "Failed to resend code. Please try again.");
				return;
			}

			setCountdown(60);
			setCanResend(false);
		} catch (error: any) {
			console.error("Failed to resend code:", error);
			setError(
				error?.message ||
					error?.error?.message ||
					"Failed to resend code. Please try again.",
			);
		} finally {
			setIsResending(false);
		}
	};

	const isLoading = isVerifying || isResending;

	return (
		<div className="w-full max-w-[400px] mx-auto">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: "easeOut" }}
				className="space-y-8"
			>
				<div className="text-center space-y-2">
					<h1 className="text-3xl font-semibold text-foreground">
						Check your email
					</h1>
					<p className="text-muted-foreground text-base">
						We sent a verification code to{" "}
						<span className="font-medium text-foreground">{email}</span>
					</p>
				</div>

				<div className="space-y-6">
					<div className="space-y-4">
						<div className="flex flex-col items-center space-y-2">
							<InputOTP
								value={otp}
								onChange={setOtp}
								maxLength={6}
								disabled={isLoading}
							/>
							{error && (
								<motion.div
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									className="text-sm text-destructive flex items-center mt-2"
								>
									<span className="inline-block w-1 h-1 bg-destructive rounded-full mr-2" />
									{error}
								</motion.div>
							)}
						</div>
					</div>

					<div className="text-center space-y-4">
						<p className="text-sm text-muted-foreground">
							Didn't receive the code?{" "}
							{canResend ? (
								<button
									onClick={handleResendCode}
									disabled={isLoading}
									className="text-foreground font-medium hover:underline disabled:opacity-50"
								>
									{isResending ? "Resending..." : "Resend code"}
								</button>
							) : (
								<span className="text-muted-foreground">
									Resend in {countdown}s
								</span>
							)}
						</p>

						<Button
							variant="ghost"
							onClick={onBack}
							disabled={isLoading}
							className="text-sm"
						>
							<ArrowLeft size={16} className="mr-2" />
							Back to {mode === "login" ? "sign in" : "sign up"}
						</Button>
					</div>
				</div>

				{isVerifying && (
					<div className="flex items-center justify-center">
						<Loader2 size={20} className="animate-spin text-muted-foreground" />
						<span className="ml-2 text-sm text-muted-foreground">
							Verifying code...
						</span>
					</div>
				)}
			</motion.div>
		</div>
	);
}
