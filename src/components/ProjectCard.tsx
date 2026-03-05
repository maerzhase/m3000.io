"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import type { Project } from "@/data/projects";
import { useIntersectionReveal } from "@/hooks/useIntersectionReveal";
import { useTilt } from "@/hooks/useTilt";

interface ProjectCardProps {
  project: Project;
  index?: number;
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { ref: revealRef, isVisible } = useIntersectionReveal({
    threshold: 0.1,
  });
  const { ref: tiltRef } = useTilt({ maxTilt: 8, scale: 1.02 });

  const combinedRef = useCallback(
    (node: HTMLElement | null) => {
      (revealRef as React.MutableRefObject<HTMLElement | null>).current = node;
      (tiltRef as React.MutableRefObject<HTMLElement | null>).current = node;
    },
    [revealRef, tiltRef],
  );

  const hasImages = project.images && project.images.length > 0;

  return (
    <article
      ref={combinedRef}
      data-visible={isVisible}
      data-expanded={isExpanded}
      className="project-card"
      style={
        {
          "--card-stagger": `${index * 120}ms`,
          "--card-accent": project.color,
          "--card-tilt-x": "0deg",
          "--card-tilt-y": "0deg",
          "--card-glare-x": "50%",
          "--card-glare-y": "50%",
          "--card-scale": "1",
        } as React.CSSProperties
      }
    >
      {/* Glare overlay */}
      <div className="project-card__glare" aria-hidden="true" />

      {/* Accent edge */}
      <div className="project-card__accent-bar" aria-hidden="true" />

      {/* Header — always visible, acts as the toggle */}
      <button
        type="button"
        className="project-card__header"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        aria-controls={`card-body-${project.id}`}
      >
        <span className="project-card__title font-sans">{project.title}</span>
        <span
          className="project-card__toggle-icon"
          aria-hidden="true"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <path
              d="M2 4.5L6 8L10 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {/* Expandable body */}
      <div
        id={`card-body-${project.id}`}
        className="project-card__body"
        aria-hidden={!isExpanded}
      >
        <div className="project-card__body-inner">
          {/* Description */}
          <p className="project-card__description font-sans">
            {project.description}
          </p>

          {/* Images */}
          {hasImages && (
            <div
              className="project-card__images"
              data-count={project.images.length}
            >
              {project.images.map((src, i) => (
                <div key={src} className="project-card__image-wrap">
                  <Image
                    src={src}
                    alt={`${project.title} — preview ${i + 1}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 200px"
                    className="project-card__image"
                    style={{ objectFit: "cover" }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Link */}
          {project.href && (
            <a
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className="project-card__link font-sans"
            >
              <span>Visit project</span>
              <svg
                width="12"
                height="12"
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
        </div>
      </div>
    </article>
  );
}
