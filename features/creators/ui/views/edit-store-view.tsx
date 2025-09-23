"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getPublicUrl } from "@/lib/r2";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";

const editStoreFormSchema = z.object({
	storeName: z.string().min(1, "Store name is required"),
	description: z.string().optional(),
	logo: z.instanceof(File).optional(),
	banner: z.instanceof(File).optional(),
	displaySocialLinks: z.boolean(),
});

type EditStoreFormData = z.infer<typeof editStoreFormSchema>;

// Helper function to convert File to base64
async function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = (error) => reject(error);
	});
}

export const EditStoreView = () => {
	const { data: creatorProfile } = trpc.creators.getMyCreatorProfile.useQuery();

	const form = useForm<EditStoreFormData>({
		resolver: zodResolver(editStoreFormSchema),
		defaultValues: {
			storeName: creatorProfile?.storeName || "",
			description: creatorProfile?.description || "",
			displaySocialLinks: creatorProfile?.displaySocialsOnStore ?? true,
		},
	});

	const updateStoreMutation = trpc.creators.updateStore.useMutation({
		onSuccess: () => {
			toast.success("Store updated successfully!");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const logoInputId = useId();
	const bannerInputId = useId();

	const watchedLogo = form.watch("logo");
	const watchedBanner = form.watch("banner");
	const watchedValues = form.watch();

	const isSubmitting = updateStoreMutation.isPending;

	const originalValues = useMemo(
		() => ({
			storeName: creatorProfile?.storeName || "",
			description: creatorProfile?.description || "",
			displaySocialLinks: creatorProfile?.displaySocialsOnStore ?? true,
			logo: undefined,
			banner: undefined,
		}),
		[creatorProfile],
	);

	const isDirty = useMemo(() => {
		if (!creatorProfile) return false;

		return (
			watchedValues.storeName !== originalValues.storeName ||
			watchedValues.description !== originalValues.description ||
			watchedValues.displaySocialLinks !== originalValues.displaySocialLinks ||
			watchedValues.logo !== undefined ||
			watchedValues.banner !== undefined
		);
	}, [watchedValues, originalValues, creatorProfile]);

	const currentLogoUrl = creatorProfile?.logoR2Key
		? getPublicUrl(creatorProfile.logoR2Key)
		: null;
	const currentBannerUrl = creatorProfile?.bannerR2Key
		? getPublicUrl(creatorProfile.bannerR2Key)
		: null;

	const logoPreviewUrl = watchedLogo
		? URL.createObjectURL(watchedLogo)
		: currentLogoUrl;
	const bannerPreviewUrl = watchedBanner
		? URL.createObjectURL(watchedBanner)
		: currentBannerUrl;

	useEffect(() => {
		if (creatorProfile) {
			form.reset(originalValues);
		}
	}, [creatorProfile, form, originalValues]);

	const resetToOriginal = () => {
		form.reset(originalValues);
	};

	const onSubmit = async (data: EditStoreFormData) => {
		try {
			// Convert files to base64 if present
			const payload: any = {
				storeName: data.storeName,
				description: data.description,
				displaySocialsOnStore: data.displaySocialLinks,
			};

			if (data.logo) {
				const logoBase64 = await fileToBase64(data.logo);
				payload.logo = {
					data: logoBase64,
					type: data.logo.type,
					name: data.logo.name,
				};
			}

			if (data.banner) {
				const bannerBase64 = await fileToBase64(data.banner);
				payload.banner = {
					data: bannerBase64,
					type: data.banner.type,
					name: data.banner.name,
				};
			}

			await updateStoreMutation.mutateAsync(payload);
		} catch (error) {
			console.error("Failed to update store:", error);
		}
	};
	return (
		<div className="max-w-7xl mx-auto p-6">
			<div className="mb-8 flex justify-between border-b pb-8">
				<div>
					<h1 className="text-3xl font-semibold text-foreground">
						Customise Store
					</h1>
					<p className="text-muted-foreground mt-2">
						Personalize your store with banners, logos, and custom branding.
					</p>
				</div>
				{creatorProfile?.storeSlug && (
					<Link
						href={`/stores/${creatorProfile.storeSlug}`}
						className={cn(
							buttonVariants({ variant: "secondary", size: "lg" }),
							isSubmitting && "pointer-events-none opacity-50",
						)}
					>
						View Store
					</Link>
				)}
			</div>

			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-6 max-w-2xl"
				>
					<FormField
						control={form.control}
						name="storeName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Store Name</FormLabel>
								<FormControl>
									<Input placeholder="Enter your store name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Store Description</FormLabel>
								<FormControl>
									<Textarea
										placeholder="Tell customers about your store..."
										className="min-h-[120px]"
										{...field}
									/>
								</FormControl>
								<FormDescription>
									This will appear on your store page to help customers
									understand what you offer.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="logo"
						render={({ field: { onChange, value, ...fieldWithoutValue } }) => (
							<FormItem>
								<FormLabel>Store Logo </FormLabel>
								<FormControl>
									<div className="space-y-3">
										<input
											id={logoInputId}
											type="file"
											accept="image/*"
											className="sr-only"
											onChange={(e) => {
												const file = e.target.files?.[0];
												onChange(file);
											}}
											{...fieldWithoutValue}
										/>

										{logoPreviewUrl ? (
											<div className="space-y-3">
												<div className="relative w-32 aspect-square overflow-hidden rounded-lg border">
													<Image
														src={logoPreviewUrl}
														alt="Logo preview"
														width={200}
														height={200}
														className="h-20 aspect-square object-cover object-center"
													/>
												</div>
												<div className="flex gap-2">
													<label
														htmlFor={logoInputId}
														className={cn(
															buttonVariants({
																variant: "outline",
																size: "sm",
															}),
															"cursor-pointer",
														)}
													>
														Change
													</label>
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={() => onChange(undefined)}
													>
														Remove
													</Button>
												</div>
											</div>
										) : (
											<label
												htmlFor={logoInputId}
												className={cn(
													buttonVariants({ variant: "outline", size: "sm" }),
													"cursor-pointer",
												)}
											>
												Upload Logo
											</label>
										)}
									</div>
								</FormControl>
								<FormDescription>
									Upload a square logo (minimum 98x98 pixels). This will appear
									on your store page.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="banner"
						render={({ field: { onChange, value, ...fieldWithoutValue } }) => (
							<FormItem>
								<FormLabel>Store Banner</FormLabel>
								<FormControl>
									<div className="space-y-3">
										<input
											id={bannerInputId}
											type="file"
											accept="image/*"
											className="sr-only"
											onChange={(e) => {
												const file = e.target.files?.[0];
												onChange(file);
											}}
											{...fieldWithoutValue}
										/>

										{bannerPreviewUrl ? (
											<div className="space-y-3">
												<Image
													src={bannerPreviewUrl}
													alt="Banner preview"
													height={200}
													width={300}
													className="h-20 w-auto object-cover"
												/>

												<div className="flex gap-2">
													<label
														htmlFor={bannerInputId}
														className={cn(
															buttonVariants({
																variant: "outline",
																size: "sm",
															}),
															"cursor-pointer",
														)}
													>
														Change
													</label>
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={() => onChange(undefined)}
													>
														Remove
													</Button>
												</div>
											</div>
										) : (
											<label
												htmlFor={bannerInputId}
												className={cn(
													buttonVariants({ variant: "outline", size: "sm" }),
													"cursor-pointer",
												)}
											>
												Upload Banner
											</label>
										)}
									</div>
								</FormControl>
								<FormDescription>
									Upload a banner image (minimum 2048x1152 pixels, maximum 6MB).
									This will be displayed prominently on your store.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="displaySocialLinks"
						render={({ field }) => (
							<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
								<div className="space-y-0.5">
									<FormLabel className="text-base">
										Display Social Links
									</FormLabel>
									<FormDescription>
										Show social media links on your store page.
									</FormDescription>
								</div>
								<FormControl>
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
							</FormItem>
						)}
					/>

					<div className="flex gap-4 pt-6">
						<Button type="submit" size="lg" disabled={!isDirty || isSubmitting}>
							{isSubmitting ? "Saving..." : "Save Changes"}
						</Button>

						<Button
							type="button"
							variant="outline"
							size="lg"
							disabled={!isDirty || isSubmitting}
							onClick={resetToOriginal}
						>
							Cancel
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
};
