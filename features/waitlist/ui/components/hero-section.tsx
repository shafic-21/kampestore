import React from "react";
import { Mail, SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { HeroHeader } from "./header";
import type { Variants } from "motion/react";
import Image from "next/image";
import { Logo } from "@/components/logo";

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
                className="text-balance text-6xl font-bold md:text-7xl text-background"
              >
                Design and earn sweet, sweet cash.
              </TextEffect>
              <TextEffect
                per="line"
                preset="fade-in-blur"
                speedSegment={0.3}
                delay={0.5}
                as="p"
                className="mx-auto mt-6 max-w-2xl text-pretty text-2xl text-background"
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
                <form action="" className="mx-auto max-w-sm z-50">
                  <div className="bg-background has-[input:focus]:ring-muted relative grid grid-cols-[1fr_auto] items-center rounded-[calc(var(--radius)+0.5rem)] border pr-2 shadow shadow-zinc-950/5 has-[input:focus]:ring-2">
                    <Mail className="pointer-events-none absolute inset-y-0 left-4 my-auto size-4" />

                    <input
                      placeholder="Your mail address"
                      className="h-12 w-full bg-transparent pl-12 focus:outline-none"
                      type="email"
                    />

                    <div className="md:pr-1.5 lg:pr-0">
                      <Button
                        aria-label="submit"
                        size="sm"
                        className="rounded-(--radius)"
                      >
                        <span className="hidden md:block">Join the waitlist</span>
                        <SendHorizonal
                          className="relative mx-auto size-5 md:hidden"
                          strokeWidth={2}
                        />
                      </Button>
                    </div>
                  </div>
                </form>

                <div
                  aria-hidden
                  className="bg-radial  relative mx-auto mt-16 max-w-4xl to-transparent to-55% text-left isolate "
                >
                  <Image
                    src="/hero-image.png"
                    alt="logo"
                    width={1000}
                    height={1000}
                    className="w-full h-full object-cover  -z-20"
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
