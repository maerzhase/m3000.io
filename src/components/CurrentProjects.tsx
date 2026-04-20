import { Station } from "@/components/Timeline";
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
          models can audit and improve web accessibility compliance.
        </Text>
      </Station>
      <Station year="" name="market.m3000.io" title="market">
        <Text render={<p />}>
          An experimental marketplace interface exploring new patterns for
          browsing and transacting in digital goods contexts.
        </Text>
      </Station>
      <Station year="" name="gems.m3000.io" title="gems">
        <Text render={<p />}>
          A curation and discovery tool — surfacing interesting things from the
          web, organized as a personal collection.
        </Text>
      </Station>
      <Station year="" name="jobnest.m3000.io" title="JobNest">
        <Text render={<p />}>
          A privacy-first job application tracker that helps people stay on top
          of their application progress without compromising their data.
        </Text>
      </Station>
    </section>
  );
}
