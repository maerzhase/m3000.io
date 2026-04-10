"use client";

import type { ReactNode } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/Carousel";
import { ExternalLink } from "@/components/ui/Link";
import { Text } from "@/components/ui/Text";
import { OverlayProvider } from "./Context";

function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={`dither bg-gray-800 rounded-sm w-full h-48 ${className ?? ""}`}
    />
  );
}

function StationCarousel() {
  return (
    <div className="relative px-10">
      <Carousel>
        <CarouselContent>
          <CarouselItem>
            <ImagePlaceholder />
          </CarouselItem>
          <CarouselItem>
            <ImagePlaceholder />
          </CarouselItem>
          <CarouselItem>
            <ImagePlaceholder />
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

const overlayContent: Record<string, ReactNode> = {
  fxhash: (
    <div className="flex flex-col gap-4">
      <StationCarousel />
      <Text render={<p />}>
        At fxhash I work as a Full-Stack Developer building and maintaining the
        platform's core infrastructure and user-facing products. fxhash is the
        leading open platform for generative art on the blockchain, enabling
        artists worldwide to mint and distribute algorithmic works. My work
        spans front-end architecture, tooling, and the systems that connect
        on-chain activity with the web experience.
      </Text>
    </div>
  ),
  nand: (
    <div className="flex flex-col gap-4">
      <StationCarousel />
      <Text render={<p />}>
        As Lead Design Technologist at Studio NAND I led a team bridging design
        and engineering across a wide range of projects — from data-driven web
        products to large-scale interactive installations exhibited at museums
        and public spaces globally. I shaped the studio's technical direction,
        introduced new tools and frameworks, and worked closely with designers
        and researchers to realize ambitious, often one-of-a-kind digital
        experiences.
      </Text>
    </div>
  ),
  artcom: (
    <div className="flex flex-col gap-4">
      <StationCarousel />
      <Text render={<p />}>
        At ART+COM Studios I was part of the R&D team prototyping kinetic
        sculptures and interactive media installations. The work involved custom
        hardware control, real-time rendering, and physical computing — building
        the systems that brought large-scale public artworks to life. Notable
        projects include kinetic ceiling installations and immersive spatial
        experiences commissioned by cultural institutions.
      </Text>
    </div>
  ),
  ai11y: (
    <div className="flex flex-col gap-4">
      <ImagePlaceholder />
      <Text render={<p />}>
        ai11y is an accessibility-first AI tooling project — exploring how
        modern language models can be used to audit, improve, and automate
        accessibility compliance in web interfaces.
      </Text>
      <ExternalLink href="https://ai11y.m3000.io">
        Visit ai11y.m3000.io
      </ExternalLink>
    </div>
  ),
  market: (
    <div className="flex flex-col gap-4">
      <ImagePlaceholder />
      <Text render={<p />}>
        market.m3000.io is an experimental marketplace interface — a personal
        project exploring new patterns for browsing, filtering, and transacting
        in digital goods contexts.
      </Text>
      <ExternalLink href="https://market.m3000.io">
        Visit market.m3000.io
      </ExternalLink>
    </div>
  ),
  gems: (
    <div className="flex flex-col gap-4">
      <ImagePlaceholder />
      <Text render={<p />}>
        gems.m3000.io is a curation and discovery tool — a personal project
        built around surfacing interesting things from the web, organized as a
        personal collection.
      </Text>
      <ExternalLink href="https://gems.m3000.io">
        Visit gems.m3000.io
      </ExternalLink>
    </div>
  ),
};

interface ContentProviderProps {
  children: ReactNode;
}

export function ContentProvider({ children }: ContentProviderProps) {
  return <OverlayProvider content={overlayContent}>{children}</OverlayProvider>;
}
