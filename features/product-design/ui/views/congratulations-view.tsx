"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import orderSampleImage from "../../assets/order-sample-image.png";

export function CongratulationsView() {
	const router = useRouter();
	const [listingSlug] = useQueryState("listing");

	// Fetch listing preview data using the slug
	const {
		data: listingPreview,
		isLoading,
		error,
	} = trpc.productDesign.getListingPreviewForSuccess.useQuery(
		{ listing_slug: listingSlug || "" },
		{ enabled: !!listingSlug },
	);

	const previewImages =
		listingPreview?.products.map((pdt) => ({
			url: pdt.previewImageUrl,
			alt: pdt.baseSkuName,
		})) || [];

	const handleShareUrl = async () => {
		if (!listingSlug) return;

		const shareUrl = `${window.location.origin}/listings/${listingSlug}`;

		try {
			await navigator.clipboard.writeText(shareUrl);
			toast.success("URL copied to clipboard!");
		} catch (err) {
			toast.error("Failed to copy URL");
		}
	};

	const handleActivatePromo = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Implement promo code activation logic
		toast.success("Promo code activated successfully!");
	};

	if (!listingSlug) {
		return (
			<div className="max-w-7xl mx-auto container bg-background px-4 py-8">
				<Card>
					<CardHeader>
						<CardTitle>No listing found</CardTitle>
					</CardHeader>
					<CardContent>
						<p>No listing slug provided in the URL.</p>
						<Button
							onClick={() => router.push("/product-design")}
							className="mt-4"
						>
							Start New Design
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="max-w-7xl mx-auto container px-4 py-8">
				<Card>
					<CardHeader>
						<CardTitle>Loading...</CardTitle>
					</CardHeader>
					<CardContent>
						<p>Loading your published listing...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error || !listingPreview) {
		return (
			<div className="max-w-7xl mx-auto container px-4 py-8">
				<Card>
					<CardHeader>
						<CardTitle>Error</CardTitle>
					</CardHeader>
					<CardContent>
						<p>Failed to load listing data. {error?.message}</p>
						<Button
							onClick={() => router.push("/product-design")}
							className="mt-4"
						>
							Start New Design
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Calculate the lowest price from products
	const lowestPrice =
		listingPreview.products.length > 0
			? Math.min(...listingPreview.products.map((product) => product.price))
			: 0;

	return (
		<div className="max-w-7xl mx-auto container px-4 py-12 space-y-16 bg-background pt-20">
			{/* Hero Section */}
			<div className="flex flex-row gap-12 items-center  border-b pb-14">
				{/* Left side - Hero content */}
				<div className="space-y-6 flex-shrink-0">
					<div className="space-y-4">
						<h1 className="text-4xl md:text-5xl font-bold text-foreground">
							Congratulations!
						</h1>
						<p className="text-xl md:text-2xl text-muted-foreground">
							<span className="font-semibold text-foreground">
								{listingPreview.title}
							</span>{" "}
							is now live
						</p>
					</div>

					<div className="flex flex-col sm:flex-row gap-4">
						<Button
							onClick={handleShareUrl}
							size="lg"
							className="flex-1 sm:flex-none"
						>
							Share URL
						</Button>
						<Link
							href={"/product-design/pick"}
							className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
						>
							Create Another Listing
						</Link>
					</div>
				</div>

				{/* Right side - Product carousel */}
				<div className="relative flex gap-2">
					<Carousel>
						<CarouselContent className="-ml-2 md:-ml-4">
							{previewImages.slice(0, 3).map((image) => (
								<CarouselItem className="basis-1/3" key={image.url}>
									<Image
										src={image.url}
										alt={image.alt}
										width={300}
										height={400}
										draggable={false}
									/>
								</CarouselItem>
							))}
						</CarouselContent>
					</Carousel>
				</div>
			</div>

			{/* Boost Your Profits Section */}
			<div className="">
				<h2 className="text-2xl font-medium text-muted-foreground mb-6">
					Boost your profits
				</h2>

				<div className="bg-purple-600 rounded-2xl ">
					<div className="flex gap-8 justify-between items-center">
						{/* Content area - 70% */}
						<div className="md:col-span-7 space-y-4 p-8">
							<h3 className="text-3xl md:text-4xl font-semibold text-white">
								Promote your products and 3x your sales
							</h3>
							<Button>
								Order sample from UGX {lowestPrice.toLocaleString()}
							</Button>
						</div>

						{/* Image area - 30% */}

						<Image
							src={orderSampleImage}
							alt="Order sample"
							height={300}
							width={400}
							className="h-full flex-shrink-0 "
						/>
					</div>
				</div>
			</div>

			{/* Offer a Promo Code Section */}
			{/*<div className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Offer a promo code
          </h2>
          <p className="text-lg text-muted-foreground">
            Boost sales by offering your fans a discount
          </p>
        </div>

        <form onSubmit={handleActivatePromo} className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

            <div className="md:col-span-3 space-y-2">
              <label
                htmlFor="promo-code"
                className="text-sm font-medium text-foreground"
              >
                Code
              </label>
              <Input
                id="promo-code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="EARLYBIRD"
              />
            </div>


            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-foreground">
                Type
              </label>
              <ToggleGroup
                type="single"
                value={discountType}
                onValueChange={(value) => value && setDiscountType(value)}
                className="justify-start"
              >
                <ToggleGroupItem value="%" variant="outline">
                  %
                </ToggleGroupItem>
                <ToggleGroupItem value="UGX" variant="outline">
                  UGX
                </ToggleGroupItem>
              </ToggleGroup>
            </div>


            <div className="md:col-span-2 space-y-2">
              <label
                htmlFor="discount-value"
                className="text-sm font-medium text-foreground"
              >
                Value
              </label>
              <Input
                id="discount-value"
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="10"
              />
            </div>


            <div className="md:col-span-3 space-y-2">
              <label className="text-sm font-medium text-foreground">
                Expiration
              </label>
              <Select value={expiration} onValueChange={setExpiration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 week">1 week</SelectItem>
                  <SelectItem value="2 weeks">2 weeks</SelectItem>
                  <SelectItem value="1 month">1 month</SelectItem>
                </SelectContent>
              </Select>
            </div>


            <div className="md:col-span-2">
              <Button
                type="submit"
                className="w-full"
                disabled={!promoCode || !discountValue}
              >
                Activate
              </Button>
            </div>
          </div>
        </form>


        <p className="text-sm text-muted-foreground">
          Note: Make sure the discount doesn't exceed your profits. This
          promotion will apply to all products in your store.
        </p>
      </div>*/}
		</div>
	);
}
