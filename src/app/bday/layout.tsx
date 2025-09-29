import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "cat's 40s birthday suprise",
  description: "cat's 40s birthday suprise",
  authors: [{ name: "m3000" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://m3000.io/bday",
    title: "cat's 40s birthday suprise",
    description: "cat's 40s birthday suprise",
    siteName: "cat's 40s birthday suprise",
    images: [
      {
        url: "https://m3000.io/bday-image.jpg",
        width: 1200,
        height: 630,
        alt: "m3000.io — Design engineering",
      },
    ],
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
  return <>{children}</>;
}
