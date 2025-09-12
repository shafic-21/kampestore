"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useProductDesignStore } from "../../store";
import { ExitEditorButton } from "./exit-editor";
import { ListingProductCard } from "./listing-product-card";

export function ListingSidePanel({ ...props }) {
  const router = useRouter();

  // Get listing data from store using individual selectors
  const listingId = useProductDesignStore((state) => state.listing.id);
  const products = useProductDesignStore((state) => state.listing.products);
  const hasProducts = useProductDesignStore((state) => state.hasProducts());

  /**
   * Navigate to continue flow with listing
   */
  const handleContinue = async () => {
    if (!listingId) return;

    // Navigate to next step (details page)
    router.push(`/product-design/details/${listingId}`);
  };

  /**
   * Navigate back to styles/listing page
   */
  const handleBackToEditor = () => { };

  return (
    <Sidebar
      collapsible="none"
      className="px-4 h-full bg-transparent w-fit"
      // style={{ width: "400px" }}
      {...props}
    >
      <SidebarContent className="bg-transparent py-6">
        <ScrollArea className="h-full w-full">
          <Card className="w-md">
            <CardHeader>
              <CardTitle>Your product Listing</CardTitle>
              <CardDescription className="w-full flex justify-between">
                <span> {products.length} product(s) selects</span><span className="font-semibold">Max. 15</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {products.map((product) => (
                <ListingProductCard
                  key={product.baseSkuId}
                  product={product}
                  listingId={listingId}
                />
              ))}
            </CardContent>
          </Card>
        </ScrollArea>
      </SidebarContent>

      {/* Footer Actions */}
      {hasProducts && (
        <SidebarFooter className="p-4 space-y-2">
          <Button
            onClick={handleContinue}
            className="w-full"
            disabled={!hasProducts}
          >
            Continue to Details
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
