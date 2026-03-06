export const dynamic = "force-dynamic";

import {
  IconBrandGithub,
  IconBrandGithubFilled,
  IconBrandLinkedinFilled,
  IconExternalLink,
  IconMailFilled,
} from "@tabler/icons-react";
import Image from "next/image";
import BackgroundShader from "@/components/BackgroundShader";
import { Hello } from "@/components/Hello";
import { ExternalLink, Link } from "@/components/ui/Link";
import { Text } from "@/components/ui/Text";
import me from "../../public/me.png";
import { OverlayTrigger } from "@/components/Overlay/Trigger";
import { OverlayProvider } from "@/components/Overlay/Context";
import { Station } from "@/components/Station";

export default function Home() {
  return (
    <BackgroundShader>
      <OverlayProvider>
        <div className="min-h-screen p-6 gap-16 sm:p-12 container m-auto">
          <main className="flex flex-col gap-[32px] select-none">
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
                Senior Design Engineer & Full-Stack Developer
              </Text>
              .
            </Text>
            {/* biome-ignore lint: using render */}
            <Text size="4" render={<h2 />}>
              Since 2011 I’ve been working with data and information
              technology—both inside and outside the web. I thrive in modern
              design and coding environments, and when existing tools don’t
              quite fit, I build my own.
            </Text>
            <Station
              year={"2022-Present"}
              name="fxhash"
              title="Senior Design Engineer (Full-Stack)"
            >
              <Text render={<p />}>
                Since 2022, I’ve been a{" "}
                <Text size="1" weight="semibold">
                  Full-Stack Developer
                </Text>{" "}
                at <ExternalLink href="///fxhash.xyz">fxhash</ExternalLink>{" "}
                <OverlayTrigger id="fxhash">see more</OverlayTrigger>, building
                the largest open platform for generative art across multiple
                blockchains. fxhash is known for its open, uncurated model that
                lets artists mint generative works freely, and for pioneering
                ways to connect code, community, and art in a blockchain-based
                environment.
              </Text>
            </Station>

            <Station
              year={"2015-2023"}
              name="Studio NAND"
              title="Lead Design Technologist"
            >
              <Text render={<p />}>
                From 2015 to 2023 I was{" "}
                <Text size="1" weight="semibold">
                  Lead Design Technologist
                </Text>{" "}
                at&nbsp;
                <ExternalLink href="///nand.io">Studio NAND</ExternalLink>{" "}
                <OverlayTrigger id="nand">see more</OverlayTrigger>a studio
                specialized in data visualization, UX, and interactive digital
                products. I led the design technology team in conceiving and
                realizing projects that ranged from user-facing digital products
                to large-scale exhibitions and interactive installations,
                bridging the gap between concept, design, and implementation.
              </Text>
            </Station>
            <Station
              year={"2013-2015"}
              name="ART+COM Studios"
              title="RND Developer"
            >
              <Text render={<p />}>
                Designed and built prototypes for{" "}
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
                <ExternalLink href="///artcom.de/?project=river-is" noIcon>
                  immersive spaces and{" "}
                  <span className="whitespace-nowrap">
                    installations
                    <IconExternalLink size="14" className="ml-1" />
                  </span>
                </ExternalLink>
                that engage senses and environments.
                <OverlayTrigger id="artcom">see more</OverlayTrigger>
              </Text>
            </Station>
            <Station title="Education" year={"2010-2015"}>
              <Text render={<p />}>
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
                , exploring how algorithmic logic interacts with natural
                language — a topic that has since become central to modern AI
                systems such as ChatGPT.
              </Text>
            </Station>
          </main>
          <footer className="flex flex-col gap-4 mt-8">
            {/* biome-ignore lint: using render */}
            <Text size="3" render={<h3 />}>
              Interested to collaborate?
            </Text>
            <Text render={<p />}>
              Get in touch via&nbsp;
              <Link href="mailto:hello@m3000.io" external={false}>
                email
                <IconMailFilled size="14" className="ml-1" />
              </Link>
              <br />
              Or check out what I am doing on&nbsp;
              <ExternalLink href="https://github.com/maerzhase/" noIcon>
                GitHub
                <IconBrandGithubFilled size="14" className="ml-1" />
              </ExternalLink>
              <br />
              Connect with me on&nbsp;
              <ExternalLink
                href="https://linkedin.com/in/maerzhase3000/"
                noIcon
              >
                LinkedIn
                <IconBrandLinkedinFilled size="14" className="ml-1" />
              </ExternalLink>
            </Text>
          </footer>
        </div>
      </OverlayProvider>
    </BackgroundShader>
  );
}
