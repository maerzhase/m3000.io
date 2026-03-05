"use client";

import { ProjectCard } from "@/components/ProjectCard";
import type { Project } from "@/data/projects";

interface ProjectCardDockProps {
  projects: Project[];
  groupIndex?: number;
}

export function ProjectCardDock({
  projects,
  groupIndex = 0,
}: ProjectCardDockProps) {
  return (
    <div
      className="project-card-dock"
      role="region"
      aria-label="Project showcase"
    >
      {projects.map((project, i) => (
        <ProjectCard key={project.id} project={project} index={i} />
      ))}
    </div>
  );
}
