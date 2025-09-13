"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProductDesignStore } from "../../store";
import { ExitEditorButton } from "./exit-editor";
import { ListingProductCard } from "./listing-product-card";
import { ListingForm } from "./listing-form";
import { trpc } from "@/trpc/client";
import { useSession } from "@/lib/auth-client";

interface ListingSidePanelProps {
  initialSkuId: string;
  [key: string]: any; // For other props like variant
}

export function ListingSidePanel({ initialSkuId, ...props }: ListingSidePanelProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const { data: session } = useSession();

  // Get listing data from store using individual selectors
  const listingId = useProductDesignStore((state) => state.listing.id);
  const products = useProductDesignStore((state) => state.listing.products);
  const hasProducts = useProductDesignStore((state) => state.hasProducts());
  const title = useProductDesignStore((state) => state.listing.title);
  const description = useProductDesignStore(
    (state) => state.listing.description,
  );
  const designs = useProductDesignStore((state) => state.listing.designs);

  // Get store actions
  const clearListing = useProductDesignStore((state) => state.clearListing);
  const resetEditor = useProductDesignStore((state) => state.resetEditor);

  // Get current user's creator profile
  const { data: creatorProfile, isLoading: creatorLoading } =
    trpc.creators.getMyCreatorProfile.useQuery(undefined, {
      enabled: !!session?.user?.id,
    });

  /**
   * Publish the listing with mockup generation
   */
  const handlePublish = async () => {
    if (!title || !hasProducts) {
      console.error("Cannot publish: missing title or products");
      return;
    }

    if (!session?.user?.id) {
      console.error("User not authenticated");
      router.push("/auth/login");
      return;
    }

    if (!creatorProfile?.id) {
      console.error("Creator profile not found");
      router.push("/creator/setup");
      return;
    }

    setIsPublishing(true);

    try {
      const result = await trpc.productDesign.publishListing.mutate({
        creatorId: creatorProfile.id,
        listing: {
          title,
          description: description || undefined,
          designs: designs || {},
          products: products.map((p) => ({
            baseSkuId: p.baseSkuId,
            price: p.price,
            colors: p.colors,
            featuredColorId: p.featuredColorId,
          })),
        },
      });

      console.log("Listing published successfully:", result);

      // Clear store and redirect to published listing
      clearListing();
      resetEditor();
      router.push(result.url);
    } catch (error) {
      console.error("Failed to publish listing:", error);
      // TODO: Add toast notification
    } finally {
      setIsPublishing(false);
    }
  };

  /**
   * Navigate back to styles/listing page
   */
  const handleBackToEditor = () => {};

  return (
    <Sidebar
      collapsible="none"
      className="px-4 h-full bg-transparent w-fit"
      // style={{ width: "400px" }}
      {...props}
    >
      <SidebarContent className="bg-transparent py-6">
        <Tabs defaultValue="products" className="w-fit overflow-hidden">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <Card className="w-md">
            <TabsContent value="products">
              <CardHeader>
                <CardTitle>Your product Listing</CardTitle>
                <CardDescription className="w-full flex justify-between">
                  <span> {products.length} product(s) selects</span>
                  <span className="font-semibold">Max. 15</span>
                </CardDescription>
              </CardHeader>
              <ScrollArea className="h-full w-md mt-8">
                <CardContent className="flex flex-col gap-4">
                  {products.map((product) => (
                    <ListingProductCard
                      key={product.baseSkuId}
                      product={product}
                      listingId={listingId}
                      initialSkuId={initialSkuId}
                    />
                  ))}
                </CardContent>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="details">
              {" "}
              {/*<Card className="w-md">*/}
              <CardHeader>
                <CardTitle>Listing Details</CardTitle>
                <CardDescription className="w-full flex justify-between">
                  Add a title and description to your product listing.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ListingForm />
              </CardContent>
              {/*</Card>*/}
            </TabsContent>
            <CardFooter>
              <Button
                onClick={handlePublish}
                className="w-full"
                disabled={
                  !hasProducts ||
                  !title ||
                  isPublishing ||
                  creatorLoading ||
                  !session?.user?.id ||
                  !creatorProfile?.id
                }
              >
                {isPublishing
                  ? "Publishing..."
                  : creatorLoading
                    ? "Loading..."
                    : !session?.user?.id
                      ? "Login Required"
                      : !creatorProfile?.id
                        ? "Setup Required"
                        : "Publish listing"}
              </Button>
            </CardFooter>
          </Card>
        </Tabs>
      </SidebarContent>
    </Sidebar>
  );
}
