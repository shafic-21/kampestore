"use client";
import { useQueryState } from "nuqs";
import { trpc } from "@/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { toast } from "sonner";
import orderSampleImage from "../../assets/order-sample-image.png";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export function CongratulationsView() {
  const router = useRouter();
  const [listingSlug] = useQueryState("listing");

  // Promo code form state
  const [promoCode, setPromoCode] = useState("EARLYBIRD");
  const [discountType, setDiscountType] = useState("%");
  const [discountValue, setDiscountValue] = useState("");
  const [expiration, setExpiration] = useState("1 month");

  // Fetch listing preview data using the slug
  const { data: listingPreview, isLoading, error } = trpc.productDesign.getListingPreviewForSuccess.useQuery(
    { listing_slug: listingSlug || "" },
    { enabled: !!listingSlug }
  );

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
      <div className="max-w-7xl mx-auto container px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>No listing found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No listing slug provided in the URL.</p>
            <Button onClick={() => router.push("/product-design")} className="mt-4">
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
            <Button onClick={() => router.push("/product-design")} className="mt-4">
              Start New Design
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate the lowest price from products
  const lowestPrice = listingPreview.products.length > 0
    ? Math.min(...listingPreview.products.map(product => product.price))
    : 0;

  return (
    <div className="max-w-7xl mx-auto container px-4 py-12 space-y-16">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[600px]">
        {/* Left side - Hero content */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Congratulations!
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">
              <span className="font-semibold text-foreground">{listingPreview.title}</span> is now live
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
            <Button
              onClick={() => router.push("/product-design")}
              variant="outline"
              size="lg"
              className="flex-1 sm:flex-none"
            >
              Create Another Listing
            </Button>
          </div>
        </div>

        {/* Right side - Product carousel */}
        <div className="relative">
          <Carousel className="w-full">
            <CarouselContent>
              {listingPreview.products.map((product) => (
                <CarouselItem key={product.id}>
                  <div className="flex aspect-square items-center justify-center p-6">
                    <div className="w-full h-full relative bg-gray-100 rounded-lg overflow-hidden">
                      {product.previewImageUrl ? (
                        <Image
                          src={product.previewImageUrl}
                          alt={product.baseSkuName}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Preview Available
                        </div>
                      )}
                      {/* Product info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-4">
                        <h3 className="font-medium text-sm">{product.baseSkuName}</h3>
                        <p className="text-xs">UGX {product.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>

          {/* Product count indicator */}
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              {listingPreview.products.length} product{listingPreview.products.length !== 1 ? 's' : ''} in this listing
            </p>
          </div>
        </div>
      </div>

      {/* Boost Your Profits Section */}
      <div className="space-y-8">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground">
          Boost your profits
        </h2>

        <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-violet-600 rounded-2xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-10 gap-8 items-center">
            {/* Content area - 70% */}
            <div className="md:col-span-7 space-y-4">
              <h3 className="text-2xl md:text-3xl font-bold text-white">
                Promote your products and 3x your sales
              </h3>
              <p className="text-lg md:text-xl text-purple-100">
                Order sample from UGX {lowestPrice.toLocaleString()}
              </p>
            </div>

            {/* Image area - 30% */}
            <div className="md:col-span-3 flex justify-center">
              <div className="relative w-32 h-32 md:w-40 md:h-40">
                <Image
                  src={orderSampleImage}
                  alt="Order sample"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 128px, 160px"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offer a Promo Code Section */}
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Offer a promo code
          </h2>
          <p className="text-lg text-muted-foreground">
            Boost sales by offering your fans a discount
          </p>
        </div>

        <form onSubmit={handleActivatePromo} className="space-y-6">
          {/* Form inputs - responsive grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Code input */}
            <div className="md:col-span-3 space-y-2">
              <label htmlFor="promo-code" className="text-sm font-medium text-foreground">
                Code
              </label>
              <Input
                id="promo-code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="EARLYBIRD"
              />
            </div>

            {/* Discount type toggle */}
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

            {/* Value input */}
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="discount-value" className="text-sm font-medium text-foreground">
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

            {/* Expiration select */}
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

            {/* Submit button */}
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

        {/* Note */}
        <p className="text-sm text-muted-foreground">
          Note: Make sure the discount doesn't exceed your profits. This promotion will apply to all products in your store.
        </p>
      </div>
    </div>
  );
}