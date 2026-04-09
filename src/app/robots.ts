import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/bday"],
      },
    ],
    sitemap: "https://m3000.io/sitemap.xml",
    host: "https://m3000.io",
  };
}
