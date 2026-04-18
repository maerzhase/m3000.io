import type { Metadata } from "next";
import Image from "next/image";
import me from "../../../public/me.png";

export const metadata: Metadata = {
  title: "Avatar OG Asset",
  description: "256x256 avatar render for OG image asset capture.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AvatarOgPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-black p-8">
      <div className="size-64 overflow-hidden bg-black">
        <Image
          src={me}
          alt="Markus avatar"
          width={256}
          height={256}
          className="pointer-events-none size-full rounded-full object-cover dither select-none"
          placeholder="blur"
          draggable={false}
          priority
        />
      </div>
    </main>
  );
}
