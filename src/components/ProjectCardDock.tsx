"use client";

import { ProjectCard } from "@/components/ProjectCard";
import type { Project } from "@/data/projects";

// Rotation presets for scattered card layouts
const ROTATION_SETS = [
  [-2.5, 1.8],
  [1.5, -2.2],
  [-1.8, 2.5],
  [-1, 0],
];

interface ProjectCardDockProps {
  projects: Project[];
  groupIndex?: number;
}

export function ProjectCardDock({
  projects,
  groupIndex = 0,
}: ProjectCardDockProps) {
  const rotations = ROTATION_SETS[groupIndex % ROTATION_SETS.length];

  return (
    <div className="project-card-dock" role="region" aria-label="Project showcase">
      {projects.map((project, i) => (
        <ProjectCard
          key={project.id}
          project={project}
          index={i}
          rotation={rotations[i % rotations.length]}
        />
      ))}
    </div>
  );
}
