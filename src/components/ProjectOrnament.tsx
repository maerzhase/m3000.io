"use client";

import { useRef } from "react";
import type { Project } from "@/data/projects";
import { useProjectOverlay } from "./ProjectOverlayProvider";

interface ProjectOrnamentProps {
  project: Project;
}

export function ProjectOrnament({ project }: ProjectOrnamentProps) {
  const { open } = useProjectOverlay();
  const ref = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    open(project, {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  };

  return (
    <button
      ref={ref}
      type="button"
      className="project-ornament font-mono"
      onClick={handleClick}
      aria-label={`View project: ${project.title}`}
      style={{ "--ornament-color": project.color } as React.CSSProperties}
    >
      <span className="project-ornament__bracket" aria-hidden="true">[</span>
      <span className="project-ornament__label">{project.title}</span>
      <span className="project-ornament__bracket" aria-hidden="true">]</span>
    </button>
  );
}
