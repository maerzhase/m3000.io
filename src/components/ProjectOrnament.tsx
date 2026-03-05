"use client";

import { useRef } from "react";
import type { Project } from "@/data/projects";
import { useProjectOverlay } from "./ProjectOverlayProvider";

interface ProjectOrnamentProps {
  project: Project;
}

export function ProjectOrnament({ project }: ProjectOrnamentProps) {
  const { open, close, activeId } = useProjectOverlay();
  const ref = useRef<HTMLButtonElement>(null);

  const isActive = activeId === project.id;
  const isDimmed = activeId !== null && !isActive;

  const handleClick = () => {
    if (isActive) {
      close();
      return;
    }
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();

    // Hide ornament synchronously — before React re-renders or GSAP fires.
    // The MorphCard starts at this exact rect, so hiding it here creates
    // a seamless handoff: ornament disappears, card appears in same spot.
    ref.current.style.opacity = "0";
    ref.current.style.pointerEvents = "none";

    open(project, { top: rect.top, left: rect.left, width: rect.width, height: rect.height }, ref.current);
  };

  return (
    <button
      ref={ref}
      type="button"
      className="project-ornament"
      onClick={handleClick}
      aria-label={`View project: ${project.title}`}
      aria-expanded={isActive}
      data-dimmed={isDimmed ? "true" : undefined}
      style={{
        "--ornament-color": project.color,
      } as React.CSSProperties}
    >
      {project.title}
    </button>
  );
}
