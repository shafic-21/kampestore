import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";

// Import images as static assets
import createProductsImage from "@/features/creators/assets/create-new-products.png";
import editStoreImage from "@/features/creators/assets/edit-store.png";
import runSaleImage from "@/features/creators/assets/run a sale.png";

interface QuickActionCard {
  imageSrc: StaticImageData;
  href: string;
  imageAlt: string;
}

const quickActions: QuickActionCard[] = [
  {
    imageSrc: createProductsImage,
    href: "/creator/products/create",
    imageAlt: "Create new products",
  },
  {
    imageSrc: editStoreImage,
    href: "/creator/store/settings",
    imageAlt: "Edit store",
  },
  {
    imageSrc: runSaleImage,
    href: "/creator/promotions",
    imageAlt: "Run a sale",
  },
];

export function QuickActions() {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Quick actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => {
          return (
            <Link key={index} href={action.href}>
              <div className=" duration-200 cursor-pointer rounded-lg overflow-hidden">
                <Image
                  src={action.imageSrc}
                  alt={action.imageAlt}
                  className="w-full h-auto rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                  placeholder="blur"
                  priority={index < 3}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
