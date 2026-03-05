export const dynamic = "force-dynamic";

import {
  IconBrandGithubFilled,
  IconBrandLinkedinFilled,
  IconExternalLink,
  IconMailFilled,
} from "@tabler/icons-react";
import Image from "next/image";
import BackgroundShader from "@/components/BackgroundShader";
import { Hello } from "@/components/Hello";
import { ProjectOrnament } from "@/components/ProjectOrnament";
import { ProjectOverlayProvider } from "@/components/ProjectOverlayProvider";
import { ExternalLink, Link } from "@/components/ui/Link";
import { Text } from "@/components/ui/Text";
import { projectGroups } from "@/data/projects";
import me from "../../public/me.png";

export default function Home() {
  const fxhash = projectGroups.find((g) => g.id === "fxhash");
  const nand = projectGroups.find((g) => g.id === "nand");
  const artcom = projectGroups.find((g) => g.id === "artcom");
  const thesis = projectGroups.find((g) => g.id === "thesis");

  const fxhashPlatform = fxhash?.projects.find((p) => p.id === "fxhash-platform");
  const fxhashMint = fxhash?.projects.find((p) => p.id === "fxhash-mint");
  const nandDataviz = nand?.projects.find((p) => p.id === "nand-dataviz");
  const nandUx = nand?.projects.find((p) => p.id === "nand-ux");
  const artcomKinetic = artcom?.projects.find((p) => p.id === "artcom-kinetic");
  const artcomImmersive = artcom?.projects.find((p) => p.id === "artcom-immersive");
  const thesisSprache = thesis?.projects.find((p) => p.id === "thesis-sprache");

  return (
    <ProjectOverlayProvider>
      <BackgroundShader>
        <div id="page-content" className="min-h-screen p-6 gap-16 sm:p-12 container m-auto">
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
                Full-Stack Developer & Design Technologist
              </Text>
              .
            </Text>
            <Text size="4">
              Since 2011 I've been working with data and information
              technology—both inside and outside the web. I thrive in modern
              design and coding environments, and when existing tools don't quite
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
              {thesisSprache && (
                <>
                  {" "}
                  <ProjectOrnament project={thesisSprache} />
                </>
              )}
              , exploring how algorithmic logic interacts with natural language —
              a topic that has since become central to modern AI systems such as
              ChatGPT.
            </Text>
            <Text>
              Since 2022, I've been a{" "}
              <Text size="1" weight="semibold">
                Full-Stack Developer
              </Text>{" "}
              at <ExternalLink href="///fxhash.xyz">fxhash</ExternalLink>,
              building the largest open platform{" "}
              {fxhashPlatform && <ProjectOrnament project={fxhashPlatform} />}
              {" "}for generative art across multiple blockchains. fxhash is
              known for its open, uncurated model that lets artists mint
              generative works freely{" "}
              {fxhashMint && <ProjectOrnament project={fxhashMint} />}
              , and for pioneering ways to connect code, community, and art in a
              blockchain-based environment.
            </Text>
            <Text>
              From 2015 to 2023 I was{" "}
              <Text size="1" weight="semibold">
                Lead Design Technologist
              </Text>{" "}
              at&nbsp;
              <ExternalLink href="///nand.io">Studio NAND</ExternalLink> a
              studio specialized in data visualization{" "}
              {nandDataviz && <ProjectOrnament project={nandDataviz} />}
              , UX, and interactive digital products{" "}
              {nandUx && <ProjectOrnament project={nandUx} />}
              . I led the design technology team in conceiving and realizing
              projects that ranged from user-facing digital products to
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
              where I designed and built prototypes for kinetic sculptures{" "}
              {artcomKinetic && <ProjectOrnament project={artcomKinetic} />}
              {" "}and interactive exhibitions. ART+COM uses new media as
              artistic expression and designs immersive spaces and
              installations{" "}
              {artcomImmersive && <ProjectOrnament project={artcomImmersive} />}
              {" "}that engage senses and environments.
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
      </BackgroundShader>
    </ProjectOverlayProvider>
  );
}
