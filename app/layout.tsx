import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppProviders } from "@/lib/providers";
import { cn } from "@/lib/utils";

const sfProDisplay = localFont({
  src: [
    { path: "./fonts/SF-Pro-Display-Regular.woff", weight: "400" },
    { path: "./fonts/SF-Pro-Display-Medium.woff", weight: "500" },
    { path: "./fonts/SF-Pro-Display-Semibold.woff", weight: "600" },
    { path: "./fonts/SF-Pro-Display-Bold.woff", weight: "700" },
  ],
  variable: "--font-sf-pro-display",
});

export const metadata: Metadata = {
  title: "KampeStore",
  description: "the print-on-demand platform for creators to design custom products and sell them online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(`font-sans antialiased bg-red-500`, sfProDisplay.variable)}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
