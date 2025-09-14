"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import {
	basicInfoSchema,
	type BasicInfoInput,
} from "@/features/seller/product-creation/_archive/schemas/basic-info";
import { createDraftProduct } from "@/features/seller/product-creation/_archive/actions/create-draft-product";
import { useCreationStore } from "@/features/seller/product-creation/_archive/store/use-creation-store";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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

import { CascadingCategorySelect } from "@/features/categories/components/cascading-category-select";
import { CreatableBrandCombobox } from "@/features/brands/components/creatable-brand-combobox";
import { TEST_SELLER_ID } from "@/features/seller/constants";

export function AddNewBasicInfoForm() {
	const router = useRouter();
	const {
		setDraft: setDraftIdInStore,
		setUnsaved,
		setCategory: setCategoryIdInStore,
	} = useCreationStore();

	// 3. Correct useForm type signature
	const form = useForm<BasicInfoInput>({
		resolver: zodResolver(basicInfoSchema),
		defaultValues: {
			title: "",
			leafCategoryId: "",
			brandId: undefined,
			gtin: "",
			hasVariants: false, // This is now optional in the type
			// description: "",
			highlights: [], // This is now optional in the type
		},
		mode: "onChange",
	});

	const {
		control,
		handleSubmit,
		formState: { isSubmitting },
		setValue,
		watch,
		trigger,
	} = form;

	// Set unsaved flag on any field change
	useEffect(() => {
		const subscription = watch(() => setUnsaved(true));
		return () => subscription.unsubscribe();
	}, [watch, setUnsaved]);

	// 4. useAction typed correctly
	const { execute: executeCreateDraftProduct, status: createDraftStatus } =
		useAction(createDraftProduct, {
			onSuccess: ({ data }) => {
				console.log("server data", data);

				if (data?.status === "success" && data.draftId && data.categoryId) {
					toast.success("Draft product created!");
					setDraftIdInStore(data.draftId);
					setCategoryIdInStore(data.categoryId);
					setUnsaved(false);
					router.push(
						`/seller-center/products/new/unique/detailed-info?draftProductId=${data.draftId}`,
					);
				} else if (data?.duplicates && data?.duplicates.length > 0) {
					toast.warning("Potential duplicate products found.", {
						description: `Consider selling one of these: ${data.duplicates
							.map((d) => d.title)
							.join(", ")}`,
					});
					// You may want to handle UI for duplicates here
					console.warn("Duplicates found:", data.duplicates);
				} else {
					toast.error("Failed to create draft", {
						description: data?.serverError || "An unknown error occurred.",
					});
				}
			},
			onError: (error: any) => {
				// error shape depends on action - fallback to serverError or validationErrors
				toast.error("Failed to create draft product", {
					description:
						error.serverError ||
						error.validationErrors ||
						"Please check your input.",
				});
			},
		});

	// 5. Strongly type submit handler
	const onSubmit: SubmitHandler<BasicInfoInput> = (data) => {
		console.log("Client form data", data);
		executeCreateDraftProduct(data);
		console.log(
			"Client form data after execution, and status",
			data,
			createDraftStatus,
		);
	};

	// Highlights local state logic
	const [currentHighlights, setCurrentHighlights] = useState<string[]>([]);
	const [newHighlightText, setNewHighlightText] = useState("");

	const addHighlight = () => {
		const cleanHighlight = newHighlightText.trim();
		if (
			cleanHighlight &&
			!currentHighlights.includes(cleanHighlight) &&
			currentHighlights.length < 10
		) {
			const updatedHighlights = [...currentHighlights, cleanHighlight];
			setCurrentHighlights(updatedHighlights);
			setValue("highlights", updatedHighlights, { shouldValidate: true });
			setNewHighlightText("");
		} else if (currentHighlights.length >= 10) {
			toast.error("Maximum 10 highlights allowed.");
		}
	};

	const removeHighlight = (index: number) => {
		const updatedHighlights = currentHighlights.filter((_, i) => i !== index);
		setCurrentHighlights(updatedHighlights);
		setValue("highlights", updatedHighlights, { shouldValidate: true });
	};

	return (
		<Card className="w-full max-w-2xl mx-auto my-8">
			<CardHeader>
				<CardTitle>Product Information</CardTitle>
				<CardDescription>
					Enter the basic details for your new product.
				</CardDescription>
			</CardHeader>

			<Form {...form}>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<CardContent className="space-y-6">
						{/* Product Title */}
						<FormField
							control={control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Product Title</FormLabel>
									<FormControl>
										<Input
											placeholder="e.g. Kampe Premium Coffee Beans"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Category */}
						<FormField
							control={control}
							name="leafCategoryId"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>Category</FormLabel>
									<CascadingCategorySelect
										onLeafCategorySelect={(categoryId, path) => {
											field.onChange(categoryId);

											trigger("leafCategoryId");
										}}
										initialLeafCategoryId={field.value}
									/>

									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Brand */}
						<FormField
							control={control}
							name="brandId"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>Brand</FormLabel>
									<CreatableBrandCombobox
										initialBrandId={field.value}
										onBrandSelect={(brandId) => {
											field.onChange(brandId);
											trigger("brandId");
										}}
									/>
									<FormDescription>
										Select an existing brand or type to create a new one.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* GTIN */}
						<FormField
							control={control}
							name="gtin"
							render={({ field }) => (
								<FormItem>
									<FormLabel>GTIN (Barcode)</FormLabel>
									<FormControl>
										<Input placeholder="e.g. 1234567890123" {...field} />
									</FormControl>
									<FormDescription>
										Global Trade Item Number (UPC, EAN, ISBN). Optional.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Highlights */}
						<div className="space-y-2">
							<FormLabel>Product Highlights</FormLabel>
							{currentHighlights.length > 0 && (
								<ul className="space-y-2 my-3 list-disc">
									{currentHighlights.map((highlight, index) => (
										<li
											key={index}
											className="flex items-start bg-muted-foreground/10 rounded-md p-2 gap-2 group"
										>
											<span className="flex-1 text-sm text-foreground">
												{highlight}
											</span>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
												onClick={() => removeHighlight(index)}
											>
												<Trash2 className="h-4 w-4 text-muted-foreground" />
											</Button>
										</li>
									))}
								</ul>
							)}
							<div className="flex gap-2">
								<Input
									value={newHighlightText}
									onChange={(e) => setNewHighlightText(e.target.value)}
									placeholder="e.g. Organic, Hand-made"
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											addHighlight();
										}
									}}
								/>
								<Button
									type="button"
									variant="secondary"
									onClick={addHighlight}
								>
									Add
								</Button>
							</div>

							<FormField
								control={control}
								name="highlights"
								render={() => <FormMessage />} // For validation message
							/>
						</div>

						{/* Has Variants */}
						<FormField
							control={control}
							name="hasVariants"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">
											Product has variants?
										</FormLabel>
										<FormDescription>
											Check if this product comes in different options like size
											or color.
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

						{/* Description */}
						{/* <FormField
              control={control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detailed Description</FormLabel>
                  <FormControl>
                    <DescriptionEditor
                      sellerId={TEST_SELLER_ID}
                      value={field.value ? JSON.parse(field.value) : undefined}
                      onChange={(jsonContent) =>
                        field.onChange(JSON.stringify(jsonContent))
                      }
                      placeholder="Provide a comprehensive description..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
					</CardContent>

					<CardFooter>
						<Button
							type="submit"
							className="ml-auto"
							disabled={createDraftStatus === "executing" || isSubmitting}
						>
							{createDraftStatus === "executing" ||
								(isSubmitting && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								))}
							Save and Continue
						</Button>
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
}

export default AddNewBasicInfoForm;
