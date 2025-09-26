"force dynamic";

import {
  IconExternalLink,
  IconEyeFilled,
  IconMailFilled,
} from "@tabler/icons-react";
import Image from "next/image";
import Background from "@/components/Background";
import { Hello } from "@/components/Hello";
import { ExternalLink, Link } from "@/components/ui/Link";
import { Text } from "@/components/ui/Text";
import me from "../../public/me.png";

export default function Home() {
  return (
    <Background>
      <div className="min-h-screen p-8 gap-16 sm:p-12 container m-auto">
        <main className="flex flex-col gap-[32px]">
          <Image
            src={me}
            alt="avatar"
            className="rounded-full size-20 object-cover shadow-2xl dither"
            placeholder="blur"
          />
          {/* biome-ignore lint: using render */}
          <Text render={<h1 />} size="6">
            <Hello />. I am Markus — <br />a <s>Berlin</s> Porto-based{" "}
            <Text size="5" weight="semibold">
              Full-Stack Developer
            </Text>{" "}
            &{" "}
            <Text size="5" weight="semibold">
              Design Technologist
            </Text>
            .
          </Text>
          <Text size="4">
            Since 2011 I’ve been working with data and information
            technology—both inside and outside the web. I thrive in modern
            design and coding environments, and when existing tools don’t quite
            fit, I build my own.
          </Text>
          <Text>
            I studied{" "}
            <Text weight="semibold" size="1">
              interaction design
            </Text>{" "}
            at{" "}
            <ExternalLink href="///fh-potsdam.de/">
              University of Applied Science Potsdam
            </ExternalLink>{" "}
            and{" "}
            <ExternalLink href="///zhdk.ch">
              University of Arts Zürich
            </ExternalLink>
            , graduating in 2015 with a thesis on computer linguistics{" "}
            <Text
              weight="semibold"
              className="dither text-white bg-black rounded-md px-1 whitespace-nowrap"
            >
              (Sprache / Algorithmen)
            </Text>
            , exploring how algorithmic logic interacts with natural language —
            long before the rise of large language models such as ChatGPT.
          </Text>
          <Text>
            Since 2022, I’ve been a{" "}
            <Text size="1" weight="semibold">
              Full-Stack Developer
            </Text>{" "}
            at <ExternalLink href="///fxhash.xyz">fxhash</ExternalLink>,
            building the largest open platforms for generative art across
            multiple blockchains. fxhash is known for its open, uncurated model
            that lets artists mint generative works freely, and for pioneering
            ways to connect code, community, and art in a blockchain-based
            environment.
          </Text>
          <Text>
            From 2015 to 2023 I was{" "}
            <Text size="1" weight="semibold">
              Lead Design Technologist
            </Text>{" "}
            at&nbsp;
            <ExternalLink href="///nand.io">Studio NAND</ExternalLink> a studio
            specialized in data visualization, UX, and interactive digital
            products. I led the design technology team in conceiving and
            realizing projects that ranged from user-facing digital products to
            large-scale exhibitions and interactive installations, bridging the
            gap between concept, design, and implementation.
          </Text>
          <Text>
            From 2013 to 2015 I was at{" "}
            <ExternalLink href="///artcom.de" noIcon>
              ART+COM{" "}
              <span className="whitespace-nowrap">
                Studios
                <IconExternalLink size="14" className="ml-1" />
              </span>
            </ExternalLink>{" "}
            where I designed and built prototypes for{" "}
            <ExternalLink
              href="///artcom.de/en/project/symphonie-cinetique/"
              noIcon
            >
              kinetic{" "}
              <span className="whitespace-nowrap">
                sculptures
                <IconExternalLink size="14" className="ml-1" />
              </span>
            </ExternalLink>{" "}
            and interactive exhibitions. ART+COM uses new media as artistic
            expression and designs{" "}
            <ExternalLink href="///artcom.de/?project=river-is">
              immersive spaces and installations
            </ExternalLink>{" "}
            that engage senses and environments.
          </Text>
        </main>
        <footer className="flex flex-col gap-4 mt-8">
          <Text size="3">Interested to collaborate?</Text>
          <Text>
            Get in touch via&nbsp;
            <Link href="mailto:hello@m3000.io" external={false}>
              email
              <IconMailFilled size="14" className="ml-1" />
            </Link>
            <br />
            Or check out what I am doing on&nbsp;
            <ExternalLink href="https://github.com/maerzhase/">
              GitHub
            </ExternalLink>
          </Text>
        </footer>
      </div>
    </Background>
  );
}
