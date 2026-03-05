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
  if (!ctx)
    throw new Error(
      "useProjectOverlay must be used inside ProjectOverlayProvider"
    );
  return ctx;
}

export function ProjectOverlayProvider({
  children,
}: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project | null>(null);
  const [origin, setOrigin] = useState<OriginRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  // activeId exposed to ornaments so they can dim themselves
  const [activeId, setActiveId] = useState<string | null>(null);

  const open = useCallback((p: Project, rect: OriginRect) => {
    setProject(p);
    setOrigin(rect);
    setActiveId(p.id);
    setIsVisible(true);
  }, []);

  const close = useCallback(() => {
    setActiveId(null);
    // actual hide happens after GSAP animation, signalled via onCloseComplete
  }, []);

  const handleCloseComplete = useCallback(() => {
    setIsVisible(false);
    setProject(null);
    setOrigin(null);
  }, []);

  return (
    <OverlayContext.Provider value={{ activeId, open }}>
      {children}
      {isVisible && project && origin && (
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

// ─── MorphCard ────────────────────────────────────────────────────────────────

interface MorphCardProps {
  project: Project;
  origin: OriginRect;
  isOpen: boolean;
  onClose: () => void;
  onCloseComplete: () => void;
}

function MorphCard({
  project,
  origin,
  isOpen,
  onClose,
  onCloseComplete,
}: MorphCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dimmerRef = useRef<HTMLDivElement>(null);
  const prevIsOpen = useRef<boolean | null>(null);

  // Stable ref for onCloseComplete to avoid stale closure in effect
  const onCloseCompleteRef = useRef(onCloseComplete);
  onCloseCompleteRef.current = onCloseComplete;

  useEffect(() => {
    // Only import GSAP on client
    let cancelled = false;

    async function animate() {
      const { gsap } = await import("gsap");

      const card = cardRef.current;
      const content = contentRef.current;
      const dimmer = dimmerRef.current;
      const page = document.getElementById("page-content");
      if (!card || !content || !dimmer) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const CARD_W = Math.min(600, vw * 0.9);
      const CARD_H = Math.min(vh * 0.85, 680);
      const targetTop = (vh - CARD_H) / 2;
      const targetLeft = (vw - CARD_W) / 2;

      if (isOpen && prevIsOpen.current !== true) {
        // ── OPEN animation ────────────────────────────────────────────────
        prevIsOpen.current = true;

        // Set card to ornament position immediately (no transition)
        gsap.set(card, {
          position: "fixed",
          top: origin.top,
          left: origin.left,
          width: origin.width,
          height: origin.height,
          borderRadius: 2,
          opacity: 1,
          zIndex: 200,
          overflow: "hidden",
          background: "rgba(10,10,10,0)",
        });

        gsap.set(content, { opacity: 0, y: 8 });
        gsap.set(dimmer, { opacity: 0, pointerEvents: "none" });

        if (page) gsap.set(page, { opacity: 1 });

        // Morph to target card
        gsap.to(card, {
          top: targetTop,
          left: targetLeft,
          width: CARD_W,
          height: CARD_H,
          borderRadius: 6,
          background: "rgba(10,10,10,0.96)",
          duration: 0.7,
          ease: "power4.out",
          onComplete: () => {
            if (cancelled) return;
            // Reveal content after morph completes
            gsap.to(content, {
              opacity: 1,
              y: 0,
              duration: 0.4,
              ease: "power2.out",
              stagger: 0.05,
            });
          },
        });

        // Fade page out and dimmer in simultaneously
        if (page) {
          gsap.to(page, {
            opacity: 0.07,
            duration: 0.55,
            ease: "power2.out",
          });
        }
        gsap.to(dimmer, {
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
          onStart: () => {
            dimmer.style.pointerEvents = "auto";
          },
        });
      } else if (!isOpen && prevIsOpen.current === true) {
        // ── CLOSE animation ───────────────────────────────────────────────
        prevIsOpen.current = false;

        // Fade content out fast
        gsap.to(content, {
          opacity: 0,
          y: 4,
          duration: 0.18,
          ease: "power2.in",
        });

        // Fade dimmer out
        gsap.to(dimmer, {
          opacity: 0,
          duration: 0.45,
          ease: "power2.inOut",
          onStart: () => {
            dimmer.style.pointerEvents = "none";
          },
        });

        // Restore page
        if (page) {
          gsap.to(page, {
            opacity: 1,
            duration: 0.5,
            ease: "power2.inOut",
          });
        }

        // Morph back to ornament rect
        gsap.to(card, {
          top: origin.top,
          left: origin.left,
          width: origin.width,
          height: origin.height,
          borderRadius: 2,
          background: "rgba(10,10,10,0)",
          duration: 0.5,
          delay: 0.12,
          ease: "power3.inOut",
          onComplete: () => {
            if (cancelled) return;
            // Restore page opacity fully in case it was still transitioning
            if (page) gsap.set(page, { opacity: "" });
            onCloseCompleteRef.current();
          },
        });
      }
    }

    animate();

    return () => {
      cancelled = true;
    };
  }, [isOpen, origin]);

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
    <>
      {/* Dimmer — captures click-to-close, sits behind card */}
      <div
        ref={dimmerRef}
        className="morph-dimmer"
        onClick={onClose}
        aria-hidden="true"
        style={{ opacity: 0 }}
      />

      {/* Morphing card — GSAP controls all geometry */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={project.title}
        className="morph-card"
        style={{ opacity: 0 }}
      >
        {/* Accent stripe */}
        <div
          className="morph-card__accent"
          style={{ background: project.color }}
        />

        {/* Content — fades in after morph */}
        <div ref={contentRef} className="morph-card__inner">
          <button
            type="button"
            className="morph-card__close font-mono"
            onClick={onClose}
            aria-label="Close"
          >
            &#x2715;
          </button>

          <div className="morph-card__content">
            {project.year && (
              <span className="morph-card__meta font-mono">{project.year}</span>
            )}

            <h2 className="morph-card__title">{project.title}</h2>
            <p className="morph-card__description">{project.description}</p>

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
                <svg
                  width="11"
                  height="11"
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
      </div>
    </>
  );
}
