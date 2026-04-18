import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://m3000.io"),
  title: "Senior Design Engineer | Markus (m3000)",
  description:
    "Senior Design Engineer building product UX, design systems, and full-stack platforms for complex digital products. Formerly at fxhash, Studio NAND, and ART+COM Studios.",
  applicationName: "m3000.io",
  alternates: {
    canonical: "https://m3000.io",
  },
  keywords: [
    "Markus",
    "m3000",
    "Senior Design Engineer",
    "Design Engineer",
    "Full-stack developer",
    "Product engineering",
    "Design systems",
    "Frontend architecture",
    "Generative art",
    "fxhash",
    "Studio NAND",
    "ART+COM Studios",
    "Interaction Design",
    "Portfolio",
    "maerzhase3000",
  ],
  authors: [{ name: "Markus", url: "https://m3000.io" }],
  creator: "Markus",
  publisher: "Markus",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://m3000.io",
    title: "Senior Design Engineer | Markus (m3000)",
    description:
      "Senior Design Engineer focused on product UX, design systems, and full-stack platforms for complex digital products.",
    siteName: "m3000.io",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Senior Design Engineer | Markus (m3000)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Senior Design Engineer | Markus (m3000)",
    description:
      "Senior Design Engineer focused on product UX, design systems, and full-stack platforms for complex digital products.",
    images: ["/opengraph-image"],
    creator: "@maerzhase3000",
  },
  category: "portfolio",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
