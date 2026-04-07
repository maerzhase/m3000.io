import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "cat's 40s birthday surprise",
  description: "cat's 40s birthday surprise",
  authors: [{ name: "m3000" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://m3000.io/bday",
    title: "cat's 40s birthday surprise",
    description: "cat's 40s birthday surprise",
    siteName: "cat's 40s birthday surprise",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
