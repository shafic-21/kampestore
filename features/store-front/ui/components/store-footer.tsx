import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

interface StoreFooterProps {
  storeName: string;
  displaySocialsOnStore: boolean;
  socialLinks: {
    xUrl?: string | null;
    instagramUrl?: string | null;
    facebookUrl?: string | null;
    tiktokUrl?: string | null;
  };
  className?: string;
}

export function StoreFooter({
  storeName,
  displaySocialsOnStore,
  socialLinks,
  className,
}: StoreFooterProps) {
  const socialIcons = [
    {
      name: "X (Twitter)",
      url: socialLinks.xUrl,
      iconPath: "/icons/x.svg",
    },
    {
      name: "Instagram",
      url: socialLinks.instagramUrl,
      iconPath: "/icons/instagram.svg",
    },
    {
      name: "Facebook",
      url: socialLinks.facebookUrl,
      iconPath: "/icons/facebook.svg",
    },
    {
      name: "TikTok",
      url: socialLinks.tiktokUrl,
      iconPath: "/icons/tiktok.svg",
    },
  ];

  const activeSocialLinks = socialIcons.filter(social => social.url);

  return (
    <footer className={cn("border-t bg-foreground py-12", className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-8 text-center">
          {/* Store Name */}
          <div>
            <h2 className="text-2xl font-bold text-background">{storeName}</h2>
          </div>

          {/* Links Section */}
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-8">
            <Link
              href="/contact"
              className="text-background/70 hover:text-background transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/refund-policy"
              className="text-background/70 hover:text-background transition-colors"
            >
              Refund Policy
            </Link>
          </div>

          {/* Social Media Links */}
          {displaySocialsOnStore && activeSocialLinks.length > 0 && (
            <div className="flex space-x-6">
              {activeSocialLinks.map((social) => {
                return (
                  <Link
                    key={social.name}
                    href={social.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-background/70 hover:text-background transition-colors"
                    aria-label={`Visit our ${social.name} page`}
                  >
                    <Image
                      src={social.iconPath}
                      alt={social.name}
                      width={20}
                      height={20}
                      className="h-5 w-5"
                    />
                  </Link>
                );
              })}
            </div>
          )}

          {/* Powered by Kampe */}
          <div className="flex items-center space-x-2 text-sm text-background/70">
            <span>Powered by</span>
            <Logo src="/logo/full-logo-white.svg" className="h-6" />

          </div>
        </div>
      </div>
    </footer>
  );
}
