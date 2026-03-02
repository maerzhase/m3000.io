"use client";

import { useCallback, useRef } from "react";
import type { Project } from "@/data/projects";
import { useIntersectionReveal } from "@/hooks/useIntersectionReveal";
import { useTilt } from "@/hooks/useTilt";
import { useDraggable } from "@/hooks/useDraggable";

interface ProjectCardProps {
  project: Project;
  index?: number;
  rotation?: number;
}

export function ProjectCard({
  project,
  index = 0,
  rotation = 0,
}: ProjectCardProps) {
  const { ref: revealRef, isVisible } = useIntersectionReveal({
    threshold: 0.1,
  });
  const { ref: tiltRef } = useTilt({ maxTilt: 10, scale: 1.04 });
  const { ref: dragRef, isDragging, dragHandlers } = useDraggable({ bounds: 100 });

  // Combine all refs into one
  const combinedRef = useCallback(
    (node: HTMLElement | null) => {
      (revealRef as React.MutableRefObject<HTMLElement | null>).current = node;
      (tiltRef as React.MutableRefObject<HTMLElement | null>).current = node;
      (dragRef as React.MutableRefObject<HTMLElement | null>).current = node;
    },
    [revealRef, tiltRef, dragRef],
  );

  const staggerDelay = `${index * 120}ms`;

  return (
    <article
      ref={combinedRef}
      data-visible={isVisible}
      className={`project-card ${isDragging ? "is-dragging" : ""}`}
      style={
        {
          "--card-rotation": `${rotation}deg`,
          "--card-stagger": staggerDelay,
          "--card-accent": project.color,
          "--card-tilt-x": "0deg",
          "--card-tilt-y": "0deg",
          "--card-glare-x": "50%",
          "--card-glare-y": "50%",
          "--card-scale": "1",
          "--drag-x": "0px",
          "--drag-y": "0px",
          touchAction: "none",
        } as React.CSSProperties
      }
      {...dragHandlers}
    >
      {/* Gradient background placeholder */}
      <div
        className="project-card__visual"
        style={{
          background: `linear-gradient(135deg, ${project.color}22 0%, ${project.color}08 100%)`,
        }}
      >
        <div className="project-card__visual-accent" />
      </div>

      {/* Glare overlay */}
      <div className="project-card__glare" />

      {/* Content */}
      <div className="project-card__content">
        <div className="project-card__header">
          <span className="project-card__title font-sans">{project.title}</span>
          <span className="project-card__subtitle font-sans">
            {project.subtitle}
          </span>
        </div>
        <div className="project-card__tags">
          {project.tags.map((tag) => (
            <span key={tag} className="project-card__tag font-mono">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* External link indicator */}
      {project.href && (
        <a
          href={project.href}
          target="_blank"
          rel="noopener noreferrer"
          className="project-card__link"
          aria-label={`Visit ${project.title}`}
          onClick={(e) => e.stopPropagation()}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 1.5H12.5V10M12 2L1.5 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      )}
    </article>
  );
}
