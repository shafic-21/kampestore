"use client";

import React, { useState } from "react";
import { Mail, SendHorizontal, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";

export function WaitlistForm() {
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
	const [message, setMessage] = useState("");

	const addToWaitlist = trpc.waitlist.addToWaitlist.useMutation({
		onSuccess: (data) => {
			setStatus("success");
			setMessage(data.message);
			setEmail("");
		},
		onError: (error) => {
			setStatus("error");
			setMessage(error.message || "Something went wrong. Please try again.");
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email.trim()) return;

		setStatus("idle");
		setMessage("");

		addToWaitlist.mutate({ email: email.trim() });
	};

	if (status === "success") {
		return (
			<div className="mx-auto max-w-sm z-50">
				<div className="bg-muted relative flex items-center gap-3 rounded-[calc(var(--radius)+0.5rem)] border-2 p-4 text-muted-foreground">
					<p className="text-sm font-medium">{message}</p>
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="mx-auto max-w-sm z-50">
			<div className="bg-background has-[input:focus]:ring-muted relative grid grid-cols-[1fr_auto] items-center rounded-[calc(var(--radius)+0.5rem)] border pr-2 shadow shadow-zinc-950/5 has-[input:focus]:ring-2">
				<Mail className="pointer-events-none absolute inset-y-0 left-4 my-auto size-4" />

				<input
					placeholder="Join the waitlist"
					className="h-12 w-full bg-transparent pl-12 focus:outline-none"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					disabled={addToWaitlist.isPending}
				/>

				<div className="md:pr-1.5 lg:pr-0">
					<Button
						type="submit"
						aria-label="submit"
						size="sm"
						className="rounded-(--radius)"
						disabled={addToWaitlist.isPending || !email.trim()}
					>
						<span className="hidden md:block">
							{addToWaitlist.isPending ? "Joining..." : "Join "}
						</span>
						<SendHorizontal
							className="relative mx-auto size-5 md:hidden"
							strokeWidth={2}
						/>
					</Button>
				</div>
			</div>

			{status === "error" && (
				<p className="mt-2 text-sm text-red-600 text-center">{message}</p>
			)}
		</form>
	);
}
