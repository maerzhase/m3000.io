export const dynamic = "force-dynamic";

import {
  IconBrandGithubFilled,
  IconBrandLinkedinFilled,
  IconExternalLink,
  IconMailFilled,
} from "@tabler/icons-react";
import Image from "next/image";
import BackgroundShader from "@/components/BackgroundShader";
import { CardDeck } from "@/components/CardDeck";
import { CurrentProjects } from "@/components/CurrentProjects";
import { Hello } from "@/components/Hello";
import { ContentProvider } from "@/components/Overlay/ContentProvider";
import { OverlayTrigger } from "@/components/Overlay/Trigger";
import { ShaderHighlight } from "@/components/ShaderHighlight";
import { Station } from "@/components/Station";
import { Timeline } from "@/components/Timeline";
import { ExternalLink, Link } from "@/components/ui/Link";
import { Text } from "@/components/ui/Text";
import me from "../../public/me.png";

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://m3000.io/#person",
      name: "Markus",
      alternateName: ["m3000", "maerzhase3000", "maerzhase"],
      url: "https://m3000.io",
      image: "https://m3000.io/me.png",
      jobTitle: "Senior Design Engineer",
      description:
        "Porto-based Senior Design Engineer and Full-Stack Developer building modern interfaces, design systems, and tools for the web.",
      homeLocation: {
        "@type": "Place",
        name: "Porto, Portugal",
      },
      sameAs: [
        "https://github.com/maerzhase/",
        "https://linkedin.com/in/maerzhase3000/",
      ],
      alumniOf: [
        {
          "@type": "CollegeOrUniversity",
          name: "University of Applied Science Potsdam",
          url: "https://fh-potsdam.de/",
        },
        {
          "@type": "CollegeOrUniversity",
          name: "University of Arts Zurich",
          url: "https://zhdk.ch/",
        },
      ],
      worksFor: {
        "@type": "Organization",
        name: "fxhash",
        url: "https://fxhash.xyz/",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://m3000.io/#website",
      url: "https://m3000.io",
      name: "m3000.io",
      description:
        "Portfolio of Markus, a Porto-based Senior Design Engineer and Full-Stack Developer.",
      publisher: {
        "@id": "https://m3000.io/#person",
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      <BackgroundShader>
        <ContentProvider>
          <div className="container m-auto min-h-screen gap-16 p-6 sm:p-12">
            <main className="flex flex-col gap-[32px]">
              <ShaderHighlight padding={4} radius={40}>
                <span className="touch-safe-media inline-flex size-20 shrink-0 select-none align-top">
                  <Image
                    src={me}
                    alt="avatar"
                    className="pointer-events-none size-full rounded-full object-cover shadow-2xl dither select-none"
                    placeholder="blur"
                    draggable={false}
                  />
                </span>
              </ShaderHighlight>
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
                Since 2011 I've been working with data and information
                technology—both inside and outside the web. I thrive in modern
                design and coding environments, and when existing tools don't
                quite fit, I build my own.
              </Text>

              <Timeline>
                <Station
                  variant="timeline"
                  current
                  dotIndex={0}
                  year={"2022-Present"}
                  name="fxhash"
                  title="Senior Design Engineer (Full-Stack)"
                >
                  <Text render={<p />}>
                    Since 2022, I've been a{" "}
                    <Text size="1" weight="semibold">
                      Full-Stack Developer
                    </Text>{" "}
                    at <ExternalLink href="///fxhash.xyz">fxhash</ExternalLink>,
                    building the largest open platform for generative art across
                    multiple blockchains.{" "}
                    <OverlayTrigger id="fxhash" variant="plain">
                      <CardDeck />
                    </OverlayTrigger>{" "}
                    fxhash is known for its open, uncurated model that lets
                    artists mint generative works freely, and for pioneering
                    ways to connect code, community, and art in a
                    blockchain-based environment.
                  </Text>
                </Station>

                <Station
                  variant="timeline"
                  dotIndex={1}
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
                    <ExternalLink href="///nand.io">Studio NAND</ExternalLink> —
                    a studio specialized in data visualization, UX, and
                    interactive digital products.{" "}
                    <OverlayTrigger id="nand" variant="plain">
                      <CardDeck />
                    </OverlayTrigger>{" "}
                    I led the design technology team in conceiving and realizing
                    projects that ranged from user-facing digital products to
                    large-scale exhibitions and interactive installations,
                    bridging the gap between concept, design, and
                    implementation.
                  </Text>
                </Station>

                <Station
                  variant="timeline"
                  dotIndex={2}
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
                    and interactive exhibitions. ART+COM uses new media as
                    artistic expression and designs{" "}
                    <ExternalLink href="///artcom.de/?project=river-is" noIcon>
                      immersive spaces and{" "}
                      <span className="whitespace-nowrap">
                        installations
                        <IconExternalLink size="14" className="ml-1" />
                      </span>
                    </ExternalLink>{" "}
                    that engage senses and environments.{" "}
                    <OverlayTrigger id="artcom" variant="plain">
                      <CardDeck />
                    </OverlayTrigger>
                  </Text>
                </Station>

                <Station
                  variant="timeline"
                  dotIndex={3}
                  year={"2010-2015"}
                  name=""
                  title="Education"
                >
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
                      className="dither whitespace-nowrap rounded-md bg-black px-1 text-white"
                    >
                      (Sprache / Algorithmen)
                    </Text>
                    , exploring how algorithmic logic interacts with natural
                    language — a topic that has since become central to modern
                    AI systems such as ChatGPT.
                  </Text>
                </Station>
              </Timeline>
            </main>
            <footer className="mt-8 flex flex-col gap-4">
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
        </ContentProvider>
      </BackgroundShader>
    </>
  );
}
