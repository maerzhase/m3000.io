"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { Project } from "@/data/projects";

export interface OriginRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface OverlayContextValue {
  activeId: string | null;
  open: (project: Project, originRect: OriginRect, ornamentEl: HTMLElement) => void;
  close: () => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function useProjectOverlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx)
    throw new Error("useProjectOverlay must be used inside ProjectOverlayProvider");
  return ctx;
}

export function ProjectOverlayProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project | null>(null);
  const [origin, setOrigin] = useState<OriginRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const ornamentElRef = useRef<HTMLElement | null>(null);
  const activeId = project?.id ?? null;

  const open = useCallback((p: Project, rect: OriginRect, ornamentEl: HTMLElement) => {
    ornamentElRef.current = ornamentEl;
    setProject(p);
    setOrigin(rect);
    setMounted(true);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleCloseComplete = useCallback(() => {
    // Restore the ornament element visibility
    if (ornamentElRef.current) {
      ornamentElRef.current.style.opacity = "";
      ornamentElRef.current.style.pointerEvents = "";
      ornamentElRef.current = null;
    }
    setMounted(false);
    setProject(null);
    setOrigin(null);
  }, []);

  return (
    <OverlayContext.Provider value={{ activeId, open, close }}>
      {children}
      {mounted && project && origin && (
        <MorphCard
          project={project}
          origin={origin}
          isOpen={isOpen}
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

function MorphCard({
  project,
  origin,
  isOpen,
  onClose,
  onCloseComplete,
}: MorphCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isClosing = useRef(false);
  const onCloseCompleteRef = useRef(onCloseComplete);
  onCloseCompleteRef.current = onCloseComplete;
  const originRef = useRef(origin);
  originRef.current = origin;

  // ── Synchronously place card at ornament rect before first paint ──────────
  // useLayoutEffect fires synchronously after DOM mutations but before paint.
  // This guarantees the card starts at the ornament's exact position with no
  // visible gap — the ornament is already hidden (opacity:0) from the click handler.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const o = originRef.current;
    // Set all geometry inline so GSAP can animate FROM these values
    Object.assign(card.style, {
      position: "fixed",
      top: `${o.top}px`,
      left: `${o.left}px`,
      width: `${o.width}px`,
      height: `${o.height}px`,
      borderRadius: "3px",
      backgroundColor: project.color,
      zIndex: "200",
      opacity: "1",
    });
    if (contentRef.current) {
      contentRef.current.style.opacity = "0";
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Open animation ────────────────────────────────────────────────────────
  useEffect(() => {
    let raf: number;
    let cancelled = false;

    async function run() {
      const { gsap } = await import("gsap");
      if (cancelled) return;

      const card = cardRef.current;
      const content = contentRef.current;
      const page = document.getElementById("page-content");
      if (!card || !content) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const hPad = vw < 640 ? 24 : 48;
      const W = Math.min(vw - hPad * 2, 640);
      const H = Math.min(vh * 0.82, 700);
      const tTop = Math.max((vh - H) / 2, 16);
      const tLeft = (vw - W) / 2;

      // Fade page behind
      if (page) gsap.to(page, { opacity: 0, duration: 0.3, ease: "power2.out" });

      // Morph from ornament rect → full card
      gsap.to(card, {
        top: tTop,
        left: tLeft,
        width: W,
        height: H,
        borderRadius: 10,
        backgroundColor: "rgb(10, 10, 10)",
        duration: 0.65,
        ease: "power4.out",
        onComplete: () => {
          if (cancelled) return;
          gsap.to(content, { opacity: 1, duration: 0.28, ease: "power2.out" });
        },
      });
    }

    // Defer one frame so the browser has painted the initial position
    raf = requestAnimationFrame(() => run());
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Close animation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen || isClosing.current) return;
    isClosing.current = true;
    let cancelled = false;

    async function run() {
      const { gsap } = await import("gsap");
      if (cancelled) return;

      const card = cardRef.current;
      const content = contentRef.current;
      const page = document.getElementById("page-content");
      if (!card || !content) return;

      const o = originRef.current;

      // Fade content out first
      gsap.to(content, { opacity: 0, duration: 0.15, ease: "power2.in" });

      // Morph back to ornament
      gsap.to(card, {
        top: o.top,
        left: o.left,
        width: o.width,
        height: o.height,
        borderRadius: 3,
        backgroundColor: project.color,
        duration: 0.48,
        delay: 0.1,
        ease: "power3.inOut",
        onComplete: () => {
          if (cancelled) return;
          if (page) {
            gsap.to(page, {
              opacity: 1,
              duration: 0.35,
              ease: "power2.out",
              onComplete: () => gsap.set(page, { clearProps: "opacity" }),
            });
          }
          onCloseCompleteRef.current();
        },
      });
    }

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Only render portal client-side
  const [clientReady, setClientReady] = useState(false);
  useEffect(() => setClientReady(true), []);
  if (!clientReady) return null;

  return createPortal(
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      className="morph-card"
    >
      {/* Accent strip — same color as ornament */}
      <div
        className="morph-card__accent-bar"
        style={{ backgroundColor: project.color }}
        aria-hidden="true"
      />

      {/* Content — fades in after morph completes */}
      <div ref={contentRef} className="morph-card__inner">
        <button
          type="button"
          className="morph-card__close"
          onClick={onClose}
          aria-label="Close project panel"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M1 1L11 11M11 1L1 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="morph-card__body">
          {project.year && (
            <span className="morph-card__year">{project.year}</span>
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
                    alt={`${project.title} — view ${i + 1}`}
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
              className="morph-card__link"
            >
              Visit project
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
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
    </div>,
    document.body
  );
}
