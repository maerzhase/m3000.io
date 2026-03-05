"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
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
  if (!ctx)
    throw new Error(
      "useProjectOverlay must be used inside ProjectOverlayProvider"
    );
  return ctx;
}

export function ProjectOverlayProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [origin, setOrigin] = useState<OriginRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const open = useCallback((p: Project, rect: OriginRect) => {
    setProject(p);
    setOrigin(rect);
    setActiveId(p.id);
    setMounted(true);
  }, []);

  const close = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleCloseComplete = useCallback(() => {
    setMounted(false);
    setProject(null);
    setOrigin(null);
  }, []);

  return (
    <OverlayContext.Provider value={{ activeId, open }}>
      {children}
      {mounted && project && origin && (
        <MorphCard
          project={project}
          origin={origin}
          isOpen={activeId !== null}
          onClose={close}
          onCloseComplete={handleCloseComplete}
        />
      )}
    </OverlayContext.Provider>
  );
}

// ─── MorphCard ──────────────────────────────────────────────────────────────

interface MorphCardProps {
  project: Project;
  origin: OriginRect;
  isOpen: boolean;
  onClose: () => void;
  onCloseComplete: () => void;
}

function MorphCard({ project, origin, isOpen, onClose, onCloseComplete }: MorphCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hasAnimatedOpen = useRef(false);
  const onCloseCompleteRef = useRef(onCloseComplete);
  onCloseCompleteRef.current = onCloseComplete;

  // ── Open animation (runs once on mount) ───────────────────────────────────
  useEffect(() => {
    if (hasAnimatedOpen.current) return;
    hasAnimatedOpen.current = true;

    let cancelled = false;

    async function animateOpen() {
      const { gsap } = await import("gsap");
      if (cancelled) return;

      const card = cardRef.current;
      const content = contentRef.current;
      const page = document.getElementById("page-content");
      if (!card || !content) return;

      // Target: vertically centered, same horizontal constraints as the page column
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const padding = vw < 640 ? 24 : 48;
      const maxW = Math.min(vw - padding * 2, 640);
      const CARD_W = maxW;
      const CARD_H = Math.min(vh * 0.82, 680);
      const targetTop = (vh - CARD_H) / 2;
      const targetLeft = (vw - CARD_W) / 2;

      // Start exactly at the ornament — same size, same position, same bg color
      gsap.set(card, {
        position: "fixed",
        top: origin.top,
        left: origin.left,
        width: origin.width,
        height: origin.height,
        borderRadius: 3,
        zIndex: 200,
        opacity: 1,
        overflow: "hidden",
        backgroundColor: project.color,
      });

      gsap.set(content, { opacity: 0 });

      // Fade page text out
      if (page) {
        gsap.to(page, {
          opacity: 0,
          duration: 0.35,
          ease: "power2.out",
        });
      }

      // Spring-morph to full card
      gsap.to(card, {
        top: targetTop,
        left: targetLeft,
        width: CARD_W,
        height: CARD_H,
        borderRadius: 8,
        backgroundColor: "rgba(10,10,10,0.97)",
        duration: 0.75,
        ease: "power4.out",
        delay: 0.1,
        onComplete: () => {
          if (cancelled) return;
          gsap.to(content, {
            opacity: 1,
            duration: 0.35,
            ease: "power2.out",
          });
        },
      });
    }

    animateOpen();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Close animation (triggered when isOpen → false) ───────────────────────
  useEffect(() => {
    if (isOpen) return; // only run when closing

    let cancelled = false;

    async function animateClose() {
      const { gsap } = await import("gsap");
      if (cancelled) return;

      const card = cardRef.current;
      const content = contentRef.current;
      const page = document.getElementById("page-content");
      if (!card || !content) return;

      // Fade content first
      gsap.to(content, { opacity: 0, duration: 0.18, ease: "power2.in" });

      // Morph back to ornament rect
      gsap.to(card, {
        top: origin.top,
        left: origin.left,
        width: origin.width,
        height: origin.height,
        borderRadius: 3,
        backgroundColor: project.color,
        duration: 0.52,
        delay: 0.1,
        ease: "power3.inOut",
        onComplete: () => {
          if (cancelled) return;
          // Restore page
          if (page) {
            gsap.to(page, {
              opacity: 1,
              duration: 0.4,
              ease: "power2.out",
              onComplete: () => {
                if (page) gsap.set(page, { clearProps: "opacity" });
              },
            });
          }
          onCloseCompleteRef.current();
        },
      });
    }

    animateClose();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      className="morph-card"
    >
      {/* Accent bar */}
      <div
        className="morph-card__accent-bar"
        style={{ backgroundColor: project.color }}
        aria-hidden="true"
      />

      {/* Scrollable content — fades in after morph */}
      <div ref={contentRef} className="morph-card__inner" style={{ opacity: 0 }}>
        <button
          type="button"
          className="morph-card__close font-mono"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="morph-card__body">
          {project.year && (
            <span className="morph-card__year font-mono">{project.year}</span>
          )}
          <h2 className="morph-card__title">{project.title}</h2>
          <p className="morph-card__description">{project.description}</p>

          {project.images && project.images.length > 0 && (
            <div
              className="morph-card__images"
              data-count={Math.min(project.images.length, 3)}
            >
              {project.images.slice(0, 3).map((src, i) => (
                <div key={src} className="morph-card__img-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${project.title} — ${i + 1}`}
                    className="morph-card__img"
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
              Visit project
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
  );
}
