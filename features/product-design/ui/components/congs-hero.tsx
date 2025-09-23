"use client";

import {
  Marquee,
  MarqueeContent,
  MarqueeFade,
  MarqueeItem,
} from "@/components/ui/kibo-ui/marquee";
import Image from "next/image";

type Props = {
  images: { url: string; alt: string }[];
};

export const CongsHero = ({ images }: Props) => {
  return (
    <div className="flex size-full items-center justify-center bg-background">
      {/*<Marquee>
        <MarqueeFade side="left" />
        <MarqueeFade side="right" />
        <MarqueeContent>
          {images.map((image, index) => (
            <MarqueeItem className="h-10 w-10" key={index}>
              <Image
                src={image.url}
                alt={image.alt}
                fill
                className="object-contain"
              />
            </MarqueeItem>
          ))}
        </MarqueeContent>
      </Marquee>*/}
    </div>
  );
};
