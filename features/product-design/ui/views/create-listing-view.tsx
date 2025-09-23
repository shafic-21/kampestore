"use client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useProductDesignStore } from "../../store";
import { BaseCard } from "../components/base-card";
import { ListingSidePanel } from "../components/listing-side-panel";
import { ListingForm } from "../components/listing-form";

/**
 * ListingView Component
 *
 * Main view for the listing page that provides:
 * - Listing sidebar displaying all products in the current listing
 * - Main content area with product selection grid
 * - Integration with listing store for state management
 *
 * URL: /editor/listing?id=listingId
 */
interface CreateListingViewProps {
  initialSkuId: string;
}

export function CreateListingView({ initialSkuId }: CreateListingViewProps) {
  const catalog = useProductDesignStore((state) => state.bases.catalog);
  const products = Object.values(catalog);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 60)",
        } as React.CSSProperties
      }
    >
      <ListingSidePanel variant="inset" initialSkuId={initialSkuId} />
      <SidebarInset>
        <div className="h-full w-full max-w-7xl mx-auto">
          <div className="h-full flex flex-col">
            <div className="bg-background p-6 space-y-4">
              <div>
                <h1 className="text-2xl font-semibold">
                  Great design. Add it to more products with a single click!
                </h1>
                <p className="text-muted-foreground mt-1">
                  Select a maximum of 15 products to launch them collectively as
                  a 'Listing'.
                </p>
              </div>
            </div>

            {/* Product Grid */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {products.map((product) => (
                    <BaseCard
                      key={product.id}
                      base={{
                        id: product.id,
                        name: product.name,
                        attributes: [],
                        cost: product.cost.toString(),
                        colors: Object.values(product.colors).map((color) => ({
                          id: color.id,
                          hexValue: color.hexValue,
                          displayName: color.displayName,
                        })),
                        totalColors: Object.keys(product.colors).length,
                        displayImageUrl:
                          Object.values(product.previews?.front || {})[0] ||
                          (product.views.front?.template.url as string),
                      }}
                      isPreEditor={false}
                      maxColorsVisible={5}
                      initialSkuId={initialSkuId}
                    />
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
