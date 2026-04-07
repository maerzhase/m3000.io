import { CardDeck } from "@/components/CardDeck";
import { Station } from "@/components/Station";
import { OverlayTrigger } from "@/components/Overlay/Trigger";
import { Text } from "@/components/ui/Text";

export function CurrentProjects() {
  return (
    <section className="flex flex-col gap-[32px]">
      {/* biome-ignore lint: using render */}
      <Text weight="semibold" size="3" render={<h2 />}>
        Current Projects
      </Text>
      <Station year="" name="ai11y.m3000.io" title="ai11y">
        <Text render={<p />}>
          An accessibility-first AI tooling project — exploring how language
          models can audit and improve web accessibility compliance.{" "}
          <OverlayTrigger id="ai11y" variant="plain"><CardDeck /></OverlayTrigger>
        </Text>
      </Station>
      <Station year="" name="market.m3000.io" title="market">
        <Text render={<p />}>
          An experimental marketplace interface exploring new patterns for
          browsing and transacting in digital goods contexts.{" "}
          <OverlayTrigger id="market" variant="plain"><CardDeck /></OverlayTrigger>
        </Text>
      </Station>
      <Station year="" name="gems.m3000.io" title="gems">
        <Text render={<p />}>
          A curation and discovery tool — surfacing interesting things from the
          web, organized as a personal collection.{" "}
          <OverlayTrigger id="gems" variant="plain"><CardDeck /></OverlayTrigger>
        </Text>
      </Station>
    </section>
  );
}
