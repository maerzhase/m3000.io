"use client";
import { useCallback, useEffect, useRef } from "react";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function useTilt(options?: {
  maxTilt?: number;
  lerpFactor?: number;
  scale?: number;
}) {
  const { maxTilt = 12, lerpFactor = 0.1, scale = 1.02 } = options ?? {};

  const ref = useRef<HTMLElement>(null);
  const raf = useRef(0);
  const isHovering = useRef(false);
  const target = useRef({ x: 0, y: 0, glareX: 50, glareY: 50 });
  const current = useRef({ x: 0, y: 0, glareX: 50, glareY: 50 });

  const tick = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    current.current.x = lerp(current.current.x, target.current.x, lerpFactor);
    current.current.y = lerp(current.current.y, target.current.y, lerpFactor);
    current.current.glareX = lerp(
      current.current.glareX,
      target.current.glareX,
      lerpFactor,
    );
    current.current.glareY = lerp(
      current.current.glareY,
      target.current.glareY,
      lerpFactor,
    );

    const { x, y, glareX, glareY } = current.current;

    el.style.setProperty("--card-tilt-x", `${y}deg`);
    el.style.setProperty("--card-tilt-y", `${-x}deg`);
    el.style.setProperty("--card-glare-x", `${glareX}%`);
    el.style.setProperty("--card-glare-y", `${glareY}%`);
    el.style.setProperty(
      "--card-scale",
      isHovering.current ? `${scale}` : "1",
    );

    // Keep ticking while values haven't settled
    const dx = Math.abs(current.current.x - target.current.x);
    const dy = Math.abs(current.current.y - target.current.y);
    if (dx > 0.01 || dy > 0.01 || isHovering.current) {
      raf.current = requestAnimationFrame(tick);
    }
  }, [lerpFactor, scale]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      return;
    }

    // Check for hover capability
    if (!window.matchMedia?.("(hover: hover)")?.matches) {
      return;
    }

    const onEnter = () => {
      isHovering.current = true;
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1..1
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1..1
      target.current.x = x * maxTilt;
      target.current.y = y * maxTilt;
      target.current.glareX = ((e.clientX - rect.left) / rect.width) * 100;
      target.current.glareY = ((e.clientY - rect.top) / rect.height) * 100;
    };

    const onLeave = () => {
      isHovering.current = false;
      target.current = { x: 0, y: 0, glareX: 50, glareY: 50 };
      // Continue ticking to animate back
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(tick);
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf.current);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [maxTilt, tick]);

  return { ref };
}
