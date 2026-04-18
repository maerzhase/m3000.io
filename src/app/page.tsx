import {
  IconBrandGithubFilled,
  IconBrandLinkedinFilled,
  IconMailFilled,
} from "@tabler/icons-react";
import Image from "next/image";
import BackgroundShader from "@/components/BackgroundShader";
import { Hello } from "@/components/Hello";
import { ContentProvider } from "@/components/Overlay/ContentProvider";
import { ShaderHighlight } from "@/components/ShaderHighlight";
import { InlineStationLink, Station, Timeline } from "@/components/Timeline";
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
        "Leading design engineering across product UX, architecture, and implementation, building platforms, interfaces, and products that turn technical complexity into usable, coherent, and performant systems.",
      homeLocation: {
        "@type": "Place",
        name: "Porto, Portugal",
      },
      knowsAbout: [
        "Design systems",
        "Product engineering",
        "Frontend architecture",
        "Full-stack development",
        "Generative art platforms",
        "Creative technology",
      ],
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
      hasOccupation: {
        "@type": "Occupation",
        name: "Senior Design Engineer",
        occupationLocation: {
          "@type": "City",
          name: "Porto",
        },
      },
      memberOf: [
        {
          "@type": "Organization",
          name: "fxhash",
          url: "https://fxhash.xyz/",
        },
        {
          "@type": "Organization",
          name: "Studio NAND",
          url: "https://nand.io/",
        },
        {
          "@type": "Organization",
          name: "ART+COM Studios",
          url: "https://artcom.de/",
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://m3000.io/#website",
      url: "https://m3000.io",
      name: "m3000.io",
      description:
        "Portfolio of Markus (m3000), Senior Design Engineer working across product UX, architecture, and implementation.",
      publisher: {
        "@id": "https://m3000.io/#person",
      },
      inLanguage: "en",
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
          <main className="container m-auto flex min-h-screen flex-col gap-16 p-6 sm:p-12">
            <section className="flex flex-col gap-[32px]">
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
                <Hello />. I am Markus — <br />
                (Berlin
                <Text render={<sup />} size="1" weight="medium">
                  DE
                </Text>{" "}
                ↔ Porto
                <Text render={<sup />} size="1" weight="medium">
                  PT
                </Text>
                ) based <br className="hidden sm:inline" />
                <Text size="5" weight="semibold">
                  Senior Design Engineer & Full-Stack Developer
                </Text>
                .
              </Text>
              {/* biome-ignore lint: using render */}
              <Text size="4" render={<h2 />}>
                Leading design engineering across product UX, architecture, and
                implementation — building platforms, interfaces, and products
                that turn technical complexity into usable, coherent, and
                performant systems.
              </Text>

              <div className="-mt-2">
                <Timeline>
                  <Station
                    variant="timeline"
                    timelineMode="release"
                    dotIndex={0}
                    startYear={2026}
                    endYear={2026}
                    year="2026"
                    title="Open Source Projects"
                  >
                    <Text render={<p />} className="max-w-[70ch]">
                      In 2026 I began releasing a growing set of open source
                      projects that reflect the way I like to work: close to
                      products, systems, and real constraints. They include{" "}
                      <InlineStationLink
                        href="https://ai11y.m3000.io"
                        pointId="ai11y"
                      >
                        ai11y
                      </InlineStationLink>
                      , a structured UI context layer for AI agents that makes
                      existing interfaces understandable and actionable;{" "}
                      <InlineStationLink
                        href="https://market.m3000.io"
                        pointId="market"
                      >
                        market-ui
                      </InlineStationLink>
                      , a design system for interfaces shaped by price, time,
                      and competition, built for transactions, auctions, and
                      dynamic marketplace logic; and{" "}
                      <InlineStationLink
                        href="https://gems.m3000.io"
                        pointId="gems"
                      >
                        hashed-gems
                      </InlineStationLink>
                      , a React avatar component and hosted image API for
                      generating deterministic gemstone avatars from any string
                      seed.
                    </Text>
                  </Station>

                  <Station
                    variant="timeline"
                    current
                    dotIndex={1}
                    startYear={2022}
                    endYear={new Date().getFullYear()}
                    year={"2022-2026"}
                    name={
                      <ExternalLink href="///fxhash.xyz" size="2">
                        fxhash
                      </ExternalLink>
                    }
                    title={
                      <>
                        Senior Design Engineer{" "}
                        <span className="whitespace-nowrap">(Full-Stack)</span>
                      </>
                    }
                  >
                    <Text render={<p />}>
                      Built and scaled the largest open multi-chain generative
                      art platform,{" "}
                      <u>
                        used by 25k+ artists and collectors, enabling the
                        creation of over 2M artworks and $100M+ in sales.
                      </u>
                      &nbsp;The focus was on making complex on-chain
                      interactions intuitive without hiding their underlying
                      mechanics — developing performant interfaces, reusable UI
                      systems, and evolving the architecture into a unified
                      monorepo to improve scalability, maintainability, and
                      developer experience.
                    </Text>
                  </Station>

                  <Station
                    variant="timeline"
                    dotIndex={2}
                    startYear={2015}
                    endYear={2023}
                    year={"2015-2023"}
                    name={
                      <ExternalLink href="///nand.io" size="2">
                        Studio NAND
                      </ExternalLink>
                    }
                    title="Design Engineer → Lead Design Engineer"
                  >
                    <Text render={<p />}>
                      Building at the intersection of design and engineering,
                      delivered interactive systems for cultural and enterprise
                      clients, translating complex UX and data-heavy interfaces
                      into scalable, production-ready applications used in
                      real-world decision-making.{" "}
                      <u>
                        Shaped technical architecture, design systems, and
                        developer workflows across projects, and progressed into
                        a lead role, helping grow the team from 4 to 12.
                      </u>
                    </Text>
                  </Station>

                  <Station
                    variant="timeline"
                    dotIndex={3}
                    startYear={2013}
                    endYear={2015}
                    year={"2013-2015"}
                    name={
                      <ExternalLink href="///artcom.de" size="2">
                        ART+COM Studios
                      </ExternalLink>
                    }
                    title="R&D Developer"
                  >
                    <Text render={<p />}>
                      Working across software, hardware, and spatial design, I
                      designed and built interactive installations and kinetic
                      sculptures for public exhibitions. The work was hands-on
                      and experimental, turning conceptual ideas into
                      technically viable systems. I developed real-time,
                      performance-sensitive software driving physical
                      installations, and built pipelines connecting sensors,
                      kinetic modules, and rendering systems, in close
                      collaboration with designers and engineers.
                    </Text>
                  </Station>

                  <Station
                    variant="timeline"
                    dotIndex={4}
                    startYear={2010}
                    endYear={2015}
                    year={"2010-2015"}
                    name={
                      <>
                        <ExternalLink href="///fh-potsdam.de/" size="2">
                          FHP
                        </ExternalLink>
                        <Text size="1" className="px-2">
                          and
                        </Text>
                        <ExternalLink href="///zhdk.ch" size="2">
                          ZHdK
                        </ExternalLink>
                      </>
                    }
                    title="Education: Interface + Interaction Design"
                  >
                    <Text render={<p />}>
                      Graduating in 2015 in Interface + Interaction Design, I
                      focused on how interfaces help people understand and
                      navigate complex systems. My thesis{" "}
                      <Text
                        weight="semibold"
                        className="dither whitespace-nowrap rounded-md bg-black px-1 text-white"
                      >
                        (Sprache / Algorithmen)
                      </Text>{" "}
                      explored how algorithmic logic shapes natural language, a
                      line of thinking that has since become central to modern
                      AI systems.
                    </Text>
                  </Station>
                </Timeline>
              </div>
            </section>
            <footer className="mt-16 flex flex-col gap-4">
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
          </main>
        </ContentProvider>
      </BackgroundShader>
    </>
  );
}
