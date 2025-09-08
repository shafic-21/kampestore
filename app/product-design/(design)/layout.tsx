import { StoreProvider } from "@/features/product-design/ui/providers/store-provider";

export default function ProductDesignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StoreProvider>{children}</StoreProvider>;
}
