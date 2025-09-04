import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      canvas: "./empty.js",
    },
  },
  /* config options here */
  // async redirects() {
  //   return [
  //     {
  //       source: "/",
  //       destination: "/waitlist",
  //       permanent: false,
  //     },
  //   ];
  // },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d3vvxc53hv5hl7.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "files.xapisoft.co",
      },
    ],
  },
};

export default nextConfig;
