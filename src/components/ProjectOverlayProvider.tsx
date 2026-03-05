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
  if (!ctx) throw new Error("useProjectOverlay must be used inside ProjectOverlayProvider");
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

  const close = useCallback(() => setIsOpen(false), []);

  const handleCloseComplete = useCallback(() => {
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

// Portal container that is always `position:fixed` via CSS class so it never
// participates in document flow and never expands the body.
function MorphCard({ project, origin, isOpen, onClose, onCloseComplete }: MorphCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);
  const onCloseCompleteRef = useRef(onCloseComplete);
  onCloseCompleteRef.current = onCloseComplete;
  const originRef = useRef(origin);
  originRef.current = origin;

  // Place card at ornament rect synchronously before the browser paints.
  // The .morph-card class sets position:fixed so it's never in flow.
  // We only need to set the coordinates and the starting color here.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const o = originRef.current;
    card.style.top = `${o.top}px`;
    card.style.left = `${o.left}px`;
    card.style.width = `${o.width}px`;
    card.style.height = `${o.height}px`;
    card.style.borderRadius = "3px";
    card.style.backgroundColor = project.color;
    if (contentRef.current) contentRef.current.style.opacity = "0";
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
      const hPad = vw < 640 ? 20 : 48;
      const W = Math.min(vw - hPad * 2, 680);
      const H = Math.min(vh * 0.84, 720);
      const tTop = Math.max((vh - H) / 2, 16);
      const tLeft = (vw - W) / 2;

      if (page) gsap.to(page, { opacity: 0, duration: 0.25, ease: "power2.out" });

      gsap.to(card, {
        top: tTop,
        left: tLeft,
        width: W,
        height: H,
        borderRadius: 8,
        backgroundColor: "#0a0a0a",
        duration: 0.6,
        ease: "power4.out",
        onComplete: () => {
          if (cancelled) return;
          gsap.to(content, { opacity: 1, duration: 0.25, ease: "power2.out" });
        },
      });
    }

    // One rAF so the browser has committed the initial paint at ornament position
    raf = requestAnimationFrame(() => run());
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Close animation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen || isClosingRef.current) return;
    isClosingRef.current = true;
    let cancelled = false;

    async function run() {
      const { gsap } = await import("gsap");
      if (cancelled) return;

      const card = cardRef.current;
      const content = contentRef.current;
      const page = document.getElementById("page-content");
      if (!card || !content) return;

      const o = originRef.current;

      gsap.to(content, { opacity: 0, duration: 0.15, ease: "power2.in" });

      gsap.to(card, {
        top: o.top,
        left: o.left,
        width: o.width,
        height: o.height,
        borderRadius: 3,
        backgroundColor: project.color,
        duration: 0.45,
        delay: 0.1,
        ease: "power3.inOut",
        onComplete: () => {
          if (cancelled) return;
          if (page) {
            gsap.to(page, {
              opacity: 1,
              duration: 0.3,
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

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return createPortal(
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
      className="morph-card"
    >
      <div
        className="morph-card__accent-bar"
        style={{ backgroundColor: project.color }}
        aria-hidden="true"
      />

      <div ref={contentRef} className="morph-card__inner">
        <button
          type="button"
          className="morph-card__close"
          onClick={onClose}
          aria-label="Close project panel"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <div className="morph-card__body">
          {project.year && <span className="morph-card__year">{project.year}</span>}
          <h2 className="morph-card__title">{project.title}</h2>
          <p className="morph-card__description">{project.description}</p>

          {project.images && project.images.length > 0 && (
            <div className="morph-card__images" data-count={Math.min(project.images.length, 3)}>
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
                <path d="M4 1.5H12.5V10M12 2L1.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
