import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/ai11y",
        destination: "https://ai11y.m3000.io",
        permanent: false,
      },
      {
        source: "/gems",
        destination: "https://gems.m3000.io",
        permanent: false,
      },
      {
        source: "/market",
        destination: "https://market.m3000.io",
        permanent: false,
      },
      {
        source: "/symphonie-cinetique",
        destination: "https://artcom.de/en/?project=symphonie-cinetique",
        permanent: false,
      },
      {
        source: "/peakspotting",
        destination: "https://www.nand.io/case-studies/peakspotting",
        permanent: false,
      },
      {
        source: "/spotti",
        destination: "https://www.nand.io/case-studies/spotti",
        permanent: false,
      },
      {
        source: "/futurium",
        destination: "https://www.jonas-loh.com/projects/do-you-like-working",
        permanent: false,
      },
      {
        source: "/fxhash",
        destination: "https://fxhash.xyz",
        permanent: false,
      },
      {
        source: "/soli",
        destination: "https://www.jonas-loh.com/projects/project-soli",
        permanent: false,
      },
      {
        source: "/ucla",
        destination: "https://www.nand.io/case-studies/ucla-energy-atlas",
        permanent: false,
      },
      {
        source: "/blanq",
        destination: "https://www.jonas-loh.com/projects/blanq",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
