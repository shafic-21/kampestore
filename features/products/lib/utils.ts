import type { BaseProductCard, ProductCategory } from "../types";

export function formatUgxCurrency(amount: bigint): string {
  return `UGX ${amount.toLocaleString('en-UG')}`;
}

export function generateMockProducts(): BaseProductCard[] {
  return [
    {
      id: "1",
      code: "AS-4062",
      name: "Women's Relaxed Crop Tee",
      description: "Short body, dropped shoulders, neck ribbing",
      cost: 21750n,
      category: { id: "apparel", name: "Apparel", slug: "apparel" },
      colors: [
        { id: "white", hexColor: "#FFFFFF", displayName: "White" },
        { id: "black", hexColor: "#000000", displayName: "Black" },
        { id: "navy", hexColor: "#1E3A8A", displayName: "Navy" },
        { id: "purple", hexColor: "#7C3AED", displayName: "Purple" },
        { id: "red", hexColor: "#DC2626", displayName: "Red" },
        { id: "pink", hexColor: "#EC4899", displayName: "Pink" },
        { id: "green", hexColor: "#059669", displayName: "Green" },
        { id: "yellow", hexColor: "#D97706", displayName: "Yellow" },
      ],
      totalColors: 8,
      heroImageUrl: "/placeholder-crop-tee.jpg"
    },
    {
      id: "2", 
      code: "CC-1717",
      name: "Classic Heavyweight T-Shirt",
      description: "Relaxed Fit, 100% Ring-Spun Cotton",
      cost: 20110n,
      category: { id: "apparel", name: "Apparel", slug: "apparel" },
      colors: [
        { id: "maroon", hexColor: "#7F1D1D", displayName: "Maroon" },
        { id: "brown", hexColor: "#92400E", displayName: "Brown" },
        { id: "teal", hexColor: "#0F766E", displayName: "Teal" },
        { id: "slate", hexColor: "#475569", displayName: "Slate" },
        { id: "gray", hexColor: "#6B7280", displayName: "Gray" },
        { id: "orange", hexColor: "#EA580C", displayName: "Orange" },
      ],
      totalColors: 14,
      heroImageUrl: "/placeholder-classic-tee.jpg"
    },
    {
      id: "3",
      code: "BC-3001", 
      name: "Classic Unisex Jersey T-Shirt",
      description: "Classic, 100% Airlume Combed and Ring-Spun Cotton",
      cost: 17450n,
      category: { id: "apparel", name: "Apparel", slug: "apparel" },
      colors: [
        { id: "charcoal", hexColor: "#374151", displayName: "Charcoal" },
        { id: "gold", hexColor: "#F59E0B", displayName: "Gold" },
        { id: "royal", hexColor: "#1D4ED8", displayName: "Royal Blue" },
        { id: "forest", hexColor: "#065F46", displayName: "Forest" },
        { id: "burgundy", hexColor: "#991B1B", displayName: "Burgundy" },
        { id: "coral", hexColor: "#F97316", displayName: "Coral" },
      ],
      totalColors: 18,
      heroImageUrl: "/placeholder-jersey-tee.jpg"
    },
    {
      id: "4",
      code: "HT-2500",
      name: "Heavy Cotton T-Shirt", 
      description: "Boxy fit, 100% Carded Cotton",
      cost: 31500n,
      category: { id: "apparel", name: "Apparel", slug: "apparel" },
      colors: [
        { id: "sage", hexColor: "#84CC16", displayName: "Sage" },
        { id: "lavender", hexColor: "#8B5CF6", displayName: "Lavender" },
        { id: "mint", hexColor: "#10B981", displayName: "Mint" },
        { id: "cream", hexColor: "#FEF3C7", displayName: "Cream" },
        { id: "rose", hexColor: "#F43F5E", displayName: "Rose" },
        { id: "sky", hexColor: "#0EA5E9", displayName: "Sky Blue" },
      ],
      totalColors: 10,
      heroImageUrl: "/placeholder-heavy-tee.jpg"
    }
  ];
}

export function generateMockCategories(): ProductCategory[] {
  return [
    {
      id: "digital",
      name: "Digital",
      slug: "digital", 
      imageUrl: "/placeholder-digital.jpg",
      productCount: 45
    },
    {
      id: "apparel",
      name: "Apparel",
      slug: "apparel",
      imageUrl: "/placeholder-apparel.jpg", 
      productCount: 89
    },
    {
      id: "accessories",
      name: "Accessories",
      slug: "accessories",
      imageUrl: "/placeholder-accessories.jpg",
      productCount: 34
    },
    {
      id: "new-to-spring",
      name: "New To Spring",
      slug: "new-to-spring",
      imageUrl: "/placeholder-spring.jpg",
      productCount: 12
    },
    {
      id: "conscious-collection", 
      name: "Conscious Collection",
      slug: "conscious-collection",
      imageUrl: "/placeholder-conscious.jpg",
      productCount: 28
    },
    {
      id: "home",
      name: "Home",
      slug: "home", 
      imageUrl: "/placeholder-home.jpg",
      productCount: 67
    }
  ];
}