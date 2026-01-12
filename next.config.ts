import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
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
    ];
  },
};

export default nextConfig;
