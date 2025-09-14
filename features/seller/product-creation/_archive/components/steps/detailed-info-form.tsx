"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { countries, getCountryData, TCountryCode } from "countries-list";

import {
	detailsInfoSchema,
	type DetailsInfoInput,
} from "@/features/seller/product-creation/_archive/schemas/details-info";
import { updateDraftProduct } from "@/features/seller/product-creation/_archive/actions/update-draft-product";
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
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

import { DescriptionEditor } from "@/features/seller/product-creation/_archive/components/description-editor";
import { TagInput } from "../tag-input";
import { SpecificationInput } from "../specification-input"; // Import SpecificationInput
import { TEST_SELLER_ID } from "@/features/seller/constants"; // Assuming this is still used or replaced by actual session sellerId

export function AddNewDetailedInfoForm() {
	const router = useRouter();
	const { draftId, setUnsaved, categoryId, hasVariants } = useCreationStore(); // Get categoryId from store

	const [openCountrySelect, setOpenCountrySelect] = useState(false);
	const [searchCountry, setSearchCountry] = useState("");
	const [isPendingTransition, startTransition] = useTransition();

	const form = useForm<DetailsInfoInput>({
		resolver: zodResolver(detailsInfoSchema),
		defaultValues: {
			description: "",
			tags: [],
			specifications: [], // Initialize as empty array
			countryOfOrigin: "",
		},
		mode: "onChange",
	});

	const {
		control,
		handleSubmit,
		formState: { isSubmitting, errors },
		watch,
		trigger,
		setValue, // Added setValue to update form state from SpecificationInput
	} = form;

	useEffect(() => {
		const subscription = watch((value, { name }) => {
			setUnsaved(true);
			// console.log("Form data changed:", name, value);
			// if (name === "specifications") {
			//   console.log("Specifications changed:", value.specifications);
			// }
		});
		return () => subscription.unsubscribe();
	}, [watch, setUnsaved]);

	const { execute: executeUpdateDraftProduct, status: updateDraftStatus } =
		useAction(updateDraftProduct.bind(null, draftId as string), {
			onSuccess: ({ data }) => {
				if (data?.status === "success" && data.productId) {
					toast.success("Product details saved!");
					setUnsaved(false);
					// Navigate to next step (e.g., variants or images)
					// Example: router.push(`/seller-center/products/new/unique/variants?draftProductId=${data.productId}`);
					console.log(
						"Next step would be variants/images for product:",
						data.productId,
					);
					toast.info(
						"Navigation to next step (variants/images) would occur here.",
					);
				} else {
					toast.error("Failed to save details", {
						description: data?.serverError || "An unknown error occurred.",
					});
				}
			},
			onError: (error: any) => {
				toast.error("Failed to save product details", {
					description:
						error.serverError ||
						error.validationErrors ||
						"Please check your input.",
				});
			},
		});

	const onSubmit: SubmitHandler<DetailsInfoInput> = (data) => {
		if (!draftId) {
			toast.error(
				"Draft product ID is missing. Please go back and start over.",
			);
			return;
		}
		console.log("Submitting Detailed Info:", data);
		executeUpdateDraftProduct(data);
	};

	return (
		<Card className="w-full max-w-2xl mx-auto my-8">
			<CardHeader>
				<CardTitle>Detailed Information</CardTitle>
				<CardDescription>
					Provide more specific details about your product.
				</CardDescription>
			</CardHeader>

			<Form {...form}>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
					<CardContent className="space-y-6">
						<FormField
							control={control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Product Description</FormLabel>
									<FormControl>
										<DescriptionEditor
											// sellerId should ideally come from session or context
											sellerId={TEST_SELLER_ID}
											value={field.value ? JSON.parse(field.value) : undefined}
											onChange={(jsonContent) => {
												field.onChange(JSON.stringify(jsonContent));
												trigger("description");
											}}
											placeholder="Provide a comprehensive description..."
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={control}
							name="tags"
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>Product Tags</FormLabel>
									<FormControl>
										<TagInput
											value={field.value || []} // Ensure value is always an array
											onChange={(tags) => {
												field.onChange(tags);
												trigger("tags");
											}}
											placeholder="Add relevant tags (e.g., organic, handmade)"
										/>
									</FormControl>
									<FormDescription>
										Up to 10 tags. Helps customers find your product.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={control}
							name="countryOfOrigin"
							render={({ field }) => (
								<FormItem className="w-full">
									<FormLabel>Country of Origin</FormLabel>
									<Popover
										open={openCountrySelect}
										onOpenChange={setOpenCountrySelect}
									>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant="outline"
													role="combobox"
													aria-expanded={openCountrySelect}
													className={cn(
														"w-full justify-between",
														!field.value && "text-muted-foreground",
													)}
												>
													{field.value
														? getCountryData(field.value as TCountryCode)?.name
														: "Select country..."}
													<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent
											className="w-[--radix-popover-trigger-width] p-0"
											align="start"
										>
											<Command>
												<CommandInput
													placeholder="Search country..."
													value={searchCountry}
													onValueChange={(search) => {
														startTransition(() => setSearchCountry(search));
													}}
												/>
												<CommandList>
													<CommandEmpty>No country found.</CommandEmpty>
													<CommandGroup>
														{Object.keys(countries).map((code) => {
															const country = getCountryData(
																code as TCountryCode,
															);
															if (
																!searchCountry ||
																country.name
																	.toLowerCase()
																	.includes(searchCountry.toLowerCase())
															) {
																return (
																	<CommandItem
																		key={code}
																		value={country.name}
																		onSelect={() => {
																			field.onChange(code);
																			setOpenCountrySelect(false);
																			setSearchCountry("");
																			trigger("countryOfOrigin");
																		}}
																	>
																		<Check
																			className={cn(
																				"mr-2 h-4 w-4",
																				field.value === code
																					? "opacity-100"
																					: "opacity-0",
																			)}
																		/>
																		{country.name}
																	</CommandItem>
																);
															}
															return null;
														})}
													</CommandGroup>
												</CommandList>
											</Command>
										</PopoverContent>
									</Popover>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={control}
							name="specifications"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Product Specifications</FormLabel>
									<FormControl>
										<SpecificationInput
											value={field.value || []} // Ensure value is always an array
											onChange={(specifications) => {
												setValue("specifications", specifications, {
													shouldValidate: true,
													shouldDirty: true,
												});
												// field.onChange(specifications); // This is handled by setValue
												trigger("specifications");
											}}
											categoryId={
												// categoryId ||
												"5e6b346e-bef8-5e7c-b3ab-10b78e14e0d8"
											} // Pass categoryId from store
											// disabled={!categoryId}
										/>
									</FormControl>
									<FormDescription>
										Add relevant specifications based on the selected category.
										{!categoryId &&
											" Select a category first to enable specifications."}
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>

					<CardFooter>
						<Button
							type="submit"
							className="ml-auto"
							disabled={updateDraftStatus === "executing" || isSubmitting}
						>
							{(updateDraftStatus === "executing" || isSubmitting) && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Save and Continue
						</Button>
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
}

export default AddNewDetailedInfoForm;
