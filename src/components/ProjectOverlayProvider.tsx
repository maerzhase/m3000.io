"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Project } from "@/data/projects";

interface OriginRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface OverlayContextValue {
  open: (project: Project, originRect: OriginRect) => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function useProjectOverlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useProjectOverlay must be used inside ProjectOverlayProvider");
  return ctx;
}

export function ProjectOverlayProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project | null>(null);
  const [origin, setOrigin] = useState<OriginRect | null>(null);
  const [phase, setPhase] = useState<"closed" | "opening" | "open" | "closing">("closed");
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = useCallback((p: Project, rect: OriginRect) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setProject(p);
    setOrigin(rect);
    setPhase("opening");
    // next frame: kick to "open" so CSS picks up the transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("open"));
    });
  }, []);

  const close = useCallback(() => {
    setPhase("closing");
    closeTimerRef.current = setTimeout(() => {
      setPhase("closed");
      setProject(null);
      setOrigin(null);
    }, 600);
  }, []);

  // Escape key
  useEffect(() => {
    if (phase === "closed") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, close]);

  // Lock body scroll when open
  useEffect(() => {
    if (phase === "closed") {
      document.body.style.overflow = "";
    } else {
      document.body.style.overflow = "hidden";
    }
  }, [phase]);

  return (
    <OverlayContext.Provider value={{ open }}>
      {children}
      {project && origin && phase !== "closed" && (
        <ProjectOverlay
          project={project}
          origin={origin}
          phase={phase}
          onClose={close}
        />
      )}
    </OverlayContext.Provider>
  );
}

// ─── The actual overlay ───────────────────────────────────────────────────────

interface ProjectOverlayProps {
  project: Project;
  origin: OriginRect;
  phase: "opening" | "open" | "closing";
  onClose: () => void;
}

function ProjectOverlay({ project, origin, phase, onClose }: ProjectOverlayProps) {
  const isVisible = phase === "open";

  // Compute the transform-origin as viewport percentages so the card
  // appears to grow out of the ornament's position.
  const ox = ((origin.left + origin.width / 2) / window.innerWidth) * 100;
  const oy = ((origin.top + origin.height / 2) / window.innerHeight) * 100;

  return (
    <div
      className="project-overlay"
      data-phase={phase}
      style={{ "--origin-x": `${ox}%`, "--origin-y": `${oy}%` } as React.CSSProperties}
      aria-modal="true"
      role="dialog"
      aria-label={project.title}
    >
      {/* Backdrop */}
      <button
        type="button"
        className="project-overlay__backdrop"
        onClick={onClose}
        aria-label="Close project"
        tabIndex={-1}
      />

      {/* Panel */}
      <div className="project-overlay__panel">
        {/* Close button */}
        <button
          type="button"
          className="project-overlay__close font-mono"
          onClick={onClose}
          aria-label="Close"
        >
          <span aria-hidden="true">&#x2715;</span>
        </button>

        {/* Accent line */}
        <div
          className="project-overlay__accent"
          style={{ background: project.color }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="project-overlay__content">
          <h2 className="project-overlay__title font-sans">{project.title}</h2>
          <p className="project-overlay__description font-sans">
            {project.description}
          </p>

          {project.images && project.images.length > 0 && (
            <div
              className="project-overlay__images"
              data-count={Math.min(project.images.length, 3)}
            >
              {project.images.slice(0, 3).map((src, i) => (
                <div key={src} className="project-overlay__image-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${project.title} — image ${i + 1}`}
                    className="project-overlay__image"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {project.href && (
            <a
              href={project.href}
              target="_blank"
              rel="noopener noreferrer"
              className="project-overlay__link font-mono"
            >
              <span>Visit project</span>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
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
    </div>
  );
}
