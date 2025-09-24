import { LoaderIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
	ResponsiveDialog,
	ResponsiveDialogContent,
	ResponsiveDialogTitle,
	ResponsiveDialogTrigger,
} from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { AddToCartButton } from "./add-to-cart-button";

type Props = {
	productId: string;
};

export const ProductDetailsPreview = ({ productId }: Props) => {
	const [isOpen, setOpen] = useState(false);
	const [activeVariant, setActiveVariant] = useState(0);
	//this is temp
	const [activeSize, setActiveSize] = useState(1);

	const [activeImage, setActiveImage] = useState(0);
	const { data: product, isLoading } =
		trpc.storeFront.getProductDetails.useQuery(
			{
				productId,
			},
			{
				enabled: isOpen,
			},
		);

	return (
		<ResponsiveDialog onOpenChange={setOpen}>
			<ResponsiveDialogTrigger asChild>
				<Button size={"sm"}>Add to Cart</Button>
			</ResponsiveDialogTrigger>
			<ResponsiveDialogContent className="flex flex-col lg:flex-row gap-6 lg:min-w-4xl px-4 ">
				{isLoading || !product ? (
					<div>
						<LoaderIcon className="size-8 animate-spin " />
					</div>
				) : (
					<div className="flex flex-col lg:flex-row gap-12">
						<div className="flex flex-col gap-2 flex-shrink-0">
							{product?.variants[activeVariant]?.images[activeImage]?.url && (
								<Image
									src={
										product?.variants[activeVariant]?.images[activeImage]?.url
									}
									alt={
										product?.title +
										" " +
										product?.variants[activeVariant]?.color.displayName
									}
									width={300}
									height={400}
									className="aspect-square"
								/>
							)}
							<div className="flex">
								{product?.variants[activeVariant]?.images.map(
									(image, index) =>
										image.url && (
											<div
												role="button"
												key={image.url}
												onClick={() => setActiveImage(index)}
												className={cn(
													"size-12 relative isolate rounded-sm overflow-hidden border-2 ",
													index === activeImage
														? "border-muted"
														: "border-black/0",
												)}
											>
												<Image
													key={image.url}
													src={image.url}
													alt={`preview`}
													width={100}
													height={100}
													className="object-contain aspect-square size-12 "
												/>
											</div>
										),
								)}
							</div>
						</div>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<ResponsiveDialogTitle className={"text-2xl"}>
									{product.listingName}
								</ResponsiveDialogTitle>
								<h3 className={"text-xl text-medium text-muted-foreground"}>
									{`${product.title}, ${product.specs.map((i) => i.value).join(", ")}`}
								</h3>
								<p className="text-3xl py-3 border-b border-dashed">
									UGX {product.price}
								</p>
							</div>
							{product?.variants[0]?.color && (
								<h5>
									Color:{" "}
									<span className="bg-muted rounded-sm text-sm px-2 py-1">
										{product.variants[activeVariant].color.displayName}
									</span>
								</h5>
							)}
							<div className="flex flex-wrap gap-2 w-full">
								{" "}
								{product.variants.map(({ color }, index) => (
									<div
										key={color.hexColor}
										role={"button"}
										className="basis-auto size-14 grid place-items-center cursor-pointer"
										onClick={() => setActiveVariant(index)}
									>
										<div
											role="button"
											className={cn(
												"size-12 relative isolate rounded-sm overflow-hidden ring-2 ring-offset-0",
												index === activeVariant
													? "ring-primary"
													: "ring-border",
											)}
										>
											{product.templateUrl && (
												<Image
													src={product.templateUrl}
													alt={"preview"}
													fill
													className="object-contain aspect-square"
													sizes="36px"
												/>
											)}
											<div
												className="absolute -z-10 top-1/2 left-1/2 -translate-1/2 w-[calc(100%-6px)] h-[calc(100%-6px)]"
												style={{ backgroundColor: color.hexColor ?? "" }}
											/>
										</div>
									</div>
								))}
							</div>
							{/*{product?.variants[0]?.size && (*/}
							<h5>
								size:{" "}
								<span className="bg-muted rounded-sm text-sm px-2 py-1">
									{/*{product.variants[activeVariant].size?.displayName}*/}
									{product.sizes[activeSize].value?.displayName}
								</span>
							</h5>
							{/*)}*/}
							<div className="flex flex-wrap gap-2 w-full">
								{" "}
								{product.sizes.map(
									({ value }, index) =>
										value && (
											<Button
												key={value?.code}
												variant="outline"
												// size={"md"}
												className={"uppercase"}
												onClick={() => setActiveSize(index)}
											>
												{value.code}
											</Button>
										),
								)}
							</div>
							<div className="mt-6">
								<AddToCartButton />
							</div>
						</div>
					</div>
				)}
			</ResponsiveDialogContent>
		</ResponsiveDialog>
	);
};
