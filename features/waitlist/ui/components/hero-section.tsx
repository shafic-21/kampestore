import React from "react";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { HeroHeader } from "./header";
import type { Variants } from "motion/react";
import Image from "next/image";
import { Logo } from "@/components/logo";
import { WaitlistForm } from "@/features/waitlist/ui/components/waitlist-form";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";

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

      <main className=" min-h-screen [--color-primary-foreground:var(--color-white)] [--color-primary:var(--color-green-600)]">
        <section>
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
            className="isolate relative"
          >
            <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-20 lg:pt-12">
              <div className="relative z-10 mx-auto max-w-4xl text-center">
                <div className="flex justify-center mb-10">
                  <Logo />
                </div>

                <div
                  className={cn(
                    "group rounded-full border border-black/5 bg-white text-base text-white transition-all ease-in  w-fit mx-auto"
                  )}
                >
                  <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
                    <span>✨ Launching soon!</span>
                    <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                  </AnimatedShinyText>
                </div>
                <TextEffect
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  as="h1"
                  className="text-balance text-4xl font-bold md:text-6xl text-foreground mt-4"
                >
                  Design and earn sweet, sweet cash.
                </TextEffect>
                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.5}
                  as="p"
                  className="mx-auto mt-4 max-w-2xl text-pretty text-lg lg:text-2xl text-foreground mb-6"
                >
                  Place your art on quality products, from tees and hoodies to
                  mugs, and start selling. It’s fun, easy, and quick to get
                  started.
                </TextEffect>
                <WaitlistForm />

                <div
                  aria-hidden
                  className="w-full bg-secondary rounded-2xl pt-4 px-4 mt-12 overflow-hidden"
                >
                  <Image
                    src="/hero-image.png"
                    alt="logo"
                    width={1000}
                    height={1000}
                    className="w-full h-full object-cover  -z-20 scale-120 sm:scale-100"
                  />
                </div>
              </div>
            </div>
          </AnimatedGroup>
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
