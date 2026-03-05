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

export interface OriginRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface OverlayContextValue {
  activeId: string | null;
  open: (project: Project, originRect: OriginRect) => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function useProjectOverlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useProjectOverlay must be used inside ProjectOverlayProvider");
  return ctx;
}

type Phase = "closed" | "opening" | "open" | "closing";

export function ProjectOverlayProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project | null>(null);
  const [origin, setOrigin] = useState<OriginRect | null>(null);
  const [phase, setPhase] = useState<Phase>("closed");
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = useCallback((p: Project, rect: OriginRect) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setProject(p);
    setOrigin(rect);
    setPhase("opening");
    // Double rAF: paint the "from" state first, then trigger transition to "open"
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
    }, 700);
  }, []);

  useEffect(() => {
    if (phase === "closed") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, close]);

  // Fade the page content, not with a backdrop layer
  useEffect(() => {
    const pageEl = document.getElementById("page-content");
    if (!pageEl) return;
    if (phase === "closed") {
      pageEl.style.opacity = "";
      pageEl.style.pointerEvents = "";
    } else if (phase === "open") {
      pageEl.style.opacity = "0";
      pageEl.style.pointerEvents = "none";
    } else if (phase === "opening") {
      pageEl.style.opacity = "";
      pageEl.style.pointerEvents = "none";
    } else if (phase === "closing") {
      pageEl.style.opacity = "";
      pageEl.style.pointerEvents = "none";
    }
  }, [phase]);

  return (
    <OverlayContext.Provider value={{ activeId: project?.id ?? null, open }}>
      {children}
      {project && origin && phase !== "closed" && (
        <MorphCard
          project={project}
          origin={origin}
          phase={phase}
          onClose={close}
        />
      )}
    </OverlayContext.Provider>
  );
}

// ─── MorphCard ────────────────────────────────────────────────────────────────

interface MorphCardProps {
  project: Project;
  origin: OriginRect;
  phase: Phase;
  onClose: () => void;
}

function MorphCard({ project, origin, phase, onClose }: MorphCardProps) {
  // Target: centered card
  const vw = typeof window !== "undefined" ? window.innerWidth : 800;
  const vh = typeof window !== "undefined" ? window.innerHeight : 600;

  const CARD_W = Math.min(600, vw * 0.9);
  const CARD_H = Math.min(vh * 0.85, 700);
  const targetTop = (vh - CARD_H) / 2;
  const targetLeft = (vw - CARD_W) / 2;

  const isOpen = phase === "open";
  const isClosing = phase === "closing";
  const isOpening = phase === "opening";

  // In "opening" phase, start from origin. In "open", animate to target. In "closing", go back.
  const fromState = isOpen;
  const top = fromState ? targetTop : origin.top;
  const left = fromState ? targetLeft : origin.left;
  const width = fromState ? CARD_W : origin.width;
  const height = fromState ? CARD_H : origin.height;
  const borderRadius = fromState ? 6 : 2;

  // Content visible only when open
  const contentVisible = phase === "open";

  const spring = "cubic-bezier(0.32, 0.72, 0, 1)";
  const duration = "0.65s";

  const transition =
    isOpening
      ? "none" // no transition on first paint
      : `top ${duration} ${spring}, left ${duration} ${spring}, width ${duration} ${spring}, height ${duration} ${spring}, border-radius ${duration} ${spring}, background ${duration} ${spring}, box-shadow ${duration} ${spring}`;

  return (
    <>
      {/* Page dimmer - separate from the card so it doesn't move */}
      <div
        className="morph-dimmer"
        data-phase={phase}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* The morphing card element */}
      <div
        className="morph-card"
        data-phase={phase}
        role="dialog"
        aria-modal="true"
        aria-label={project.title}
        style={{
          position: "fixed",
          top,
          left,
          width,
          height,
          borderRadius,
          transition,
          zIndex: 200,
          overflow: "hidden",
          background: isOpen
            ? "rgba(10, 10, 10, 0.97)"
            : "rgba(10, 10, 10, 0.0)",
          boxShadow: isOpen
            ? "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)"
            : "none",
          willChange: "top, left, width, height",
          cursor: isOpen ? "default" : "pointer",
        }}
      >
        {/* Accent stripe */}
        <div
          className="morph-card__accent"
          style={{
            background: project.color,
            opacity: isOpen ? 0.6 : 0,
            transition: `opacity ${duration} ${spring}`,
          }}
        />

        {/* Inner content - fades in after morph */}
        <div
          className="morph-card__inner"
          style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? "translateY(0)" : "translateY(6px)",
            transition: contentVisible
              ? "opacity 0.35s ease 0.25s, transform 0.35s ease 0.25s"
              : "opacity 0.15s ease, transform 0.15s ease",
          }}
        >
          {/* Close */}
          <button
            type="button"
            className="morph-card__close font-mono"
            onClick={onClose}
            aria-label="Close"
          >
            &#x2715;
          </button>

          <div className="morph-card__content">
            {/* Year / tag */}
            {project.year && (
              <span className="morph-card__meta font-mono">{project.year}</span>
            )}

            <h2 className="morph-card__title font-sans">{project.title}</h2>
            <p className="morph-card__description font-sans">
              {project.description}
            </p>

            {project.images && project.images.length > 0 && (
              <div
                className="morph-card__images"
                data-count={Math.min(project.images.length, 3)}
              >
                {project.images.slice(0, 3).map((src, i) => (
                  <div key={src} className="morph-card__image-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`${project.title} — image ${i + 1}`}
                      className="morph-card__image"
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
                className="morph-card__link font-mono"
              >
                <span>Visit project</span>
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
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
    </>
  );
}
