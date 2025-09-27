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
  title: "m3000.io — Design engineering",
  description:
    "Portfolio of Markus (m3000), developer & designer. Full-stack at fxhash (generative art, blockchain). Former Lead Design Technologist at Studio NAND and interaction designer at ART+COM Studios. Graduate in Interaction Design with a thesis on computer linguistics — years before the rise of LLMs and ChatGPT.",
  keywords: [
    "Markus",
    "Developer Berlin",
    "Developer Porto",
    "Developer Portugal",
    "Designer Berlin",
    "Designer Porto",
    "Designer Portugal",
    "Design engineering Berlin",
    "Design engineering Porto",
    "Design engineering Portugal",
    "Full-stack developer",
    "Generative art",
    "fxhash",
    "Studio NAND",
    "ART+COM Studios",
    "Interaction Design",
    "Computer Linguistics",
    "Portfolio",
    "maerzhase",
    "maerzhase3000",
  ],
  authors: [{ name: "m3000" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://m3000.io",
    title: "m3000.io — Design engineering",
    description:
      "Developer & Designer. Building at fxhash, leading generative art across blockchains. Former Studio NAND & ART+COM. Graduate thesis on computer linguistics — years before the rise of before LLMS and ChatGPT.",
    siteName: "m3000.io — Design engineering",
    images: [
      {
        url: "https://m3000.io/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "m3000.io — Design engineering",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "m3000.io — Design engineering",
    description:
      "Developer & Designer. Building at fxhash, leading generative art across blockchains. Former Studio NAND & ART+COM. Graduate thesis on computer linguistics — years before the rise of before LLMS and ChatGPT.",
    images: ["https://m3000.io/og-image.jpg"],
    creator: "@maerzhase3000",
  },
  category: "portfolio",
  robots: {
    index: true,
    follow: true,
    nocache: false,
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
      </body>
    </html>
  );
}
