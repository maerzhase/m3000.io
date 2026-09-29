import type { Metadata } from "next";

const title = "Cat’s 41st birthday";
const description = "Light the candles and make a wish.";

export const metadata: Metadata = {
  title,
  description,
  authors: [{ name: "m3000" }],
  alternates: { canonical: "https://m3000.io/bday" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://m3000.io/bday",
    title,
    description,
    siteName: "A birthday wish for Cat",
    images: [
      {
        url: "/bday/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Six cats and a birthday cake with 41 candles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/bday/opengraph-image"],
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      nosnippet: true,
    },
  },
};

export default function BdayLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
