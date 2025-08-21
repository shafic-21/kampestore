import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d3vvxc53hv5hl7.cloudfront.net",
      },
    ],
  },
};

export default nextConfig;
