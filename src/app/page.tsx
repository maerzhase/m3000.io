import Background from "@/components/Background";
import { Hello } from "@/components/Hello";
import { Button } from "@/components/ui/Button";
import { Link } from "@/components/ui/Link";
import { Text } from "@/components/ui/Text";
import { IconEyeFilled, IconMailFilled } from "@tabler/icons-react";
import Image from "next/image";
import me from "../../public/me.png";

export default function Home() {
  return (
    <Background>
      <div className="min-h-screen p-8 gap-16 sm:p-20 container m-auto">
        <main className="flex flex-col gap-[32px]">
          <Image
            src={me}
            alt="avatar"
            className="rounded-full size-20 object-cover shadow-2xl dither"
            placeholder="blur"
          />
          <Text asChild size="6">
            <h1>
              <Hello />. I am Markus — <br />a <s>Berlin</s> Porto-based{" "}
              <Text size="6" weight="medium">
                Full-Stack Developer
              </Text>{" "}
              &{" "}
              <Text size="6" weight="medium">
                Design Technologist
              </Text>
              .
            </h1>
          </Text>
          <Text size="4">
            Since 2011 I’ve been working with data and information
            technology—both inside and outside the web. I thrive in modern
            design and coding environments, and when existing tools don’t quite
            fit, I build my own.
          </Text>
          <Text>
            I studied interaction design at{" "}
            <Link
              external
              target="_blank"
              rel="noopener noreferrer"
              href="///fh-potsdam.de/"
            >
              University of Applied Science Potsdam
            </Link>{" "}
            and{" "}
            <Link target="_blank" rel="noopener noreferrer" href="///zhdk.ch">
              University of Arts Zürich
            </Link>
            .
          </Text>
          <Text>
            Since 2023, I’ve been a{" "}
            <Text size="1" as="span" weight="medium">
              Full-Stack Developer
            </Text>{" "}
            at{" "}
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href="///fxhash.xyz"
            >
              fxhash
            </Link>
            , building the largest open platforms for generative art across
            multiple blockchains. fxhash is known for its open, uncurated model
            that lets artists mint generative works freely, and for pioneering
            ways to connect code, community, and art in a blockchain-based
            environment.
          </Text>
          <Text>
            From 2015 to 2023 I was{" "}
            <Text size="1" as="span" weight="medium">
              Lead Design Technologist
            </Text>{" "}
            at&nbsp;
            <Link target="_blank" rel="noopener noreferrer" href="///nand.io">
              Studio NAND
            </Link>{" "}
            a Berlin studio specialized in data visualization, UX, AI tools, and
            interactive digital products. I led the design technology team in
            conceiving and realizing projects that ranged from user-facing
            digital products to large-scale exhibitions and interactive
            installations, bridging the gap between concept, design, and
            implementation.{" "}
            <Text
              size="1"
              className="inline-flex gap-1 items-center text-secondary hover:scale-105 transition-transform cursor-default"
            >
              ⟶ <IconEyeFilled size={14} />
            </Text>
          </Text>
          <Text>
            From 2013 to 2015 I was at{" "}
            <Link target="_blank" rel="noopener noreferrer" href="///artcom.de">
              ART+COM Studios
            </Link>{" "}
            where I designed and built prototypes for{" "}
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href="///artcom.de/en/project/symphonie-cinetique/"
            >
              kinetic sculptures
            </Link>{" "}
            and interactive exhibitions. ART+COM uses new media as artistic
            expression and designs{" "}
            <Link href="///artcom.de/?project=river-is">
              immersive spaces and installations
            </Link>{" "}
            that engage senses and environments.
          </Text>
        </main>
        <footer className="flex flex-col gap-[32px] mt-8">
          <Text size="2">Interested to collaborate?</Text>
          <Text>
            Get in touch via&nbsp;
            <Link href="mailto:hello@m3000.io" external={false}>
              email <IconMailFilled size={14} />{" "}
            </Link>
            .
            <br />
            Or check out what I am doing on&nbsp;
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/maerzhase/"
            >
              GitHub
            </Link>
            .
          </Text>
        </footer>
      </div>
    </Background>
  );
}
