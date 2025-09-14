"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Check, X } from "lucide-react";
import {
	generateSlugFromStoreName,
	storeNameSchema,
} from "@/features/creators/lib/validations";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";

// Form schema
const formSchema = z.object({
	storeName: storeNameSchema,
});

type FormData = z.infer<typeof formSchema>;

interface OnboardingViewProps {
	user: {
		id: string;
		name: string;
		email: string;
	};
}

export default function OnboardingView({ user }: OnboardingViewProps) {
	const router = useRouter();
	const [submitError, setSubmitError] = useState<string | undefined>();

	// Form setup with Zod validation
	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			storeName: "",
		},
		mode: "onChange",
	});

	const storeName = form.watch("storeName");

	// Debounce the store name for URL preview (500ms delay)
	const debouncedStoreName = useDebounce(storeName, 500);

	// Generate slug from debounced store name
	const generatedSlug = useMemo(() => {
		if (!debouncedStoreName.trim()) return "";
		return generateSlugFromStoreName(debouncedStoreName);
	}, [debouncedStoreName]);

	// Check slug availability using query with proper enabled state
	const { data: slugAvailability, isLoading: checkingSlug } =
		trpc.creators.checkSlugAvailability.useQuery(
			{ slug: generatedSlug },
			{
				enabled: generatedSlug.length >= 3,
				staleTime: 5000, // Cache for 5 seconds
				refetchOnWindowFocus: false,
			},
		);

	// Create creator mutation
	const createCreatorMutation = trpc.creators.createCreator.useMutation({
		onSuccess: () => {
			router.push("/creator/dashboard");
		},
		onError: (error) => {
			setSubmitError(error.message);
		},
	});

	// Determine status for indicator
	const getStatus = () => {
		if (!generatedSlug || generatedSlug.length < 3) return null;
		if (checkingSlug) return "loading";
		if (slugAvailability?.available) return "success";
		if (slugAvailability && !slugAvailability.available) return "error";
		return null;
	};

	const onSubmit = async (data: FormData) => {
		setSubmitError(undefined);

		if (!generatedSlug || generatedSlug.length < 3) {
			setSubmitError("Store name is too short");
			return;
		}

		if (slugAvailability && !slugAvailability.available) {
			setSubmitError("This store name is already taken");
			return;
		}

		createCreatorMutation.mutate({
			storeName: data.storeName.trim(),
			creatorSlug: generatedSlug,
		});
	};

	const isFormValid =
		form.formState.isValid &&
		generatedSlug.length >= 3 &&
		slugAvailability?.available === true &&
		!checkingSlug;

	const isLoading = createCreatorMutation.isPending;
	const status = getStatus();
	const showUrlPreview = debouncedStoreName.trim().length > 0;

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
				className="w-full mx-auto flex flex-col items-center"
			>
				<div className="space-y-8">
					<div className="text-center space-y-2">
						<h1 className="text-3xl font-semibold text-foreground">
							What should we call your store?
						</h1>

						{/* URL Preview with animation */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="text-muted-foreground text-base"
						>
							<span>kampestore.com/</span>
							<AnimatePresence mode="wait">
								{showUrlPreview ? (
									<motion.span
										key="slug"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										transition={{ duration: 0.2 }}
										className="bg-muted px-2 py-1 rounded-md inline-flex items-center gap-1 ml-1"
									>
										{generatedSlug}
									</motion.span>
								) : (
									<motion.span
										key="placeholder"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										className="bg-muted px-2 py-1 rounded-md"
									>
										your-awesome-store
									</motion.span>
								)}
							</AnimatePresence>
						</motion.div>
					</div>

					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-6 max-w-[400px]"
						>
							<FormField
								control={form.control}
								name="storeName"
								render={({ field }) => (
									<FormItem>
										<FormControl>
											<Input
												{...field}
												type="text"
												placeholder="Enter your store name"
												autoComplete="off"
												maxLength={100}
												className="h-12 text-lg"
											/>
										</FormControl>
										<FormMessage />
										{/* Show taken message if slug is unavailable */}
										{status === "error" && (
											<motion.p
												initial={{ opacity: 0, y: -5 }}
												animate={{ opacity: 1, y: 0 }}
												className="text-sm text-red-500"
											>
												This name is already taken, try another one
											</motion.p>
										)}
									</FormItem>
								)}
							/>

							{/* Error Alert */}
							{submitError && (
								<Alert variant="destructive">
									<AlertDescription>{submitError}</AlertDescription>
								</Alert>
							)}

							<Button
								type="submit"
								disabled={!isFormValid || isLoading}
								className="w-full h-12 text-base font-medium"
							>
								{isLoading ? (
									<>
										<Loader2 size={16} className="animate-spin mr-2" />
										Creating your store...
									</>
								) : (
									"Create store & start selling"
								)}
							</Button>
						</form>
					</Form>
				</div>
			</motion.div>
		</div>
	);
}
