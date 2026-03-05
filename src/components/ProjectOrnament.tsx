"use client";

import { useRef } from "react";
import type { Project } from "@/data/projects";
import { useProjectOverlay } from "./ProjectOverlayProvider";

interface ProjectOrnamentProps {
  project: Project;
}

export function ProjectOrnament({ project }: ProjectOrnamentProps) {
  const { open, activeId } = useProjectOverlay();
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

  const isActive = activeId === project.id;
  const isDimmed = activeId !== null && !isActive;

  return (
    <button
      ref={ref}
      type="button"
      className="project-ornament font-mono"
      onClick={handleClick}
      aria-label={`View project: ${project.title}`}
      aria-expanded={isActive}
      data-dimmed={isDimmed ? "true" : undefined}
      data-active={isActive ? "true" : undefined}
      style={
        {
          "--ornament-color": project.color,
          // invisible during active state — the morph card is rendering in its place
          opacity: isActive ? 0 : undefined,
        } as React.CSSProperties
      }
    >
      {project.title}
    </button>
  );
}
