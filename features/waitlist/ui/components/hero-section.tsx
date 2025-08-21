import React from "react";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { HeroHeader } from "./header";
import type { Variants } from "motion/react";
import Image from "next/image";
import { Logo } from "@/components/logo";
import { WaitlistForm } from "@/features/waitlist/ui/components/waitlist-form";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export default function HeroSection() {
  return (
    <>
      {/* <HeroHeader /> */}

      <main className="overflow-hidden [--color-primary-foreground:var(--color-white)] [--color-primary:var(--color-green-600)]">
        <section>
          <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 lg:pt-20">
            <div className="relative z-10 mx-auto max-w-4xl text-center">
              <div className="flex justify-center mb-10">
                <Logo />
              </div>
              <TextEffect
                preset="fade-in-blur"
                speedSegment={0.3}
                as="h1"
                className="text-balance text-4xl sm:text-6xl font-bold md:text-7xl text-foreground"
              >
                Design and earn sweet, sweet cash.
              </TextEffect>
              <TextEffect
                per="line"
                preset="fade-in-blur"
                speedSegment={0.3}
                delay={0.5}
                as="p"
                className="mx-auto mt-6 max-w-2xl text-pretty text-lg lg:text-2xl text-foreground"
              >
                Place your art on quality products, from tees and hoodies to
                mugs, and start selling. It’s fun, easy, and quick to get
                started.
              </TextEffect>

              <AnimatedGroup
                variants={
                  {
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  } as Variants
                }
                className="mt-12 isolate relative"
              >
                <WaitlistForm />

                <div
                  aria-hidden
                  className="bg-radial  relative mx-auto mt-16 max-w-4xl to-transparent to-55% text-left isolate "
                >
                  <Image
                    src="/hero-image.png"
                    alt="logo"
                    width={1000}
                    height={1000}
                    className="w-full h-full object-cover  -z-20 scale-150 sm:scale-100"
                  />
                  {/* <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] mix-blend-overlay [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] dark:opacity-5"></div> */}
                </div>
              </AnimatedGroup>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

const AppComponent = () => {
  return (
    <div className="relative space-y-3 rounded-[1rem] bg-[#F6F6F9] p-4">
      {/* */}
    </div>
  );
};
