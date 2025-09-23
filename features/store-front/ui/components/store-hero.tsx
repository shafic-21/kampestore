import Image from "next/image";
import { getPublicUrl } from "@/lib/r2";
import { cn } from "@/lib/utils";

interface StoreHeroProps {
  bannerR2Key?: string | null;
  bannerAction?: string | null;
  storeName: string;
  className?: string;
}

export function StoreHero({
  bannerR2Key,
  bannerAction,
  storeName,
  className,
}: StoreHeroProps) {
  const bannerUrl = bannerR2Key ? getPublicUrl(bannerR2Key) : null;

  if (!bannerUrl) return;

  return (
    <div className={cn("relative w-full max-w-7xl mx-auto py-8", className)}>
      <div className="relative aspect-[16/4] md:aspect-[16/3] rounded-2xl overflow-hidden">
        <Image
          src={bannerUrl}
          alt={`${storeName} banner`}
          fill
          className="object-cover object-center"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1280px"
        />

        {/* Optional overlay with banner action text */}
        {bannerAction && (
          <div className="absolute inset-0 bg-black/20 flex items-center">
            <div className="w-full p-4 md:p-6">
              <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 md:p-4 max-w-md">
                <p className="text-white text-sm md:text-base font-medium">
                  {bannerAction}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
