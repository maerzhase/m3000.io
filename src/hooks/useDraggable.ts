"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useDraggable(options?: { bounds?: number }) {
  const { bounds = 80 } = options ?? {};
  const ref = useRef<HTMLElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const start = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = ref.current;
      if (!el) return;

      // Respect reduced motion
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
        return;
      }

      dragging.current = true;
      setIsDragging(true);
      start.current = { x: e.clientX, y: e.clientY };
      offset.current = { x: pos.current.x, y: pos.current.y };

      el.style.transition = "none";
      el.setPointerCapture(e.nativeEvent.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || !ref.current) return;

      const dx = e.clientX - start.current.x + offset.current.x;
      const dy = e.clientY - start.current.y + offset.current.y;

      // Clamp to bounds
      const cx = Math.max(-bounds, Math.min(bounds, dx));
      const cy = Math.max(-bounds, Math.min(bounds, dy));

      pos.current = { x: cx, y: cy };
      ref.current.style.setProperty("--drag-x", `${cx}px`);
      ref.current.style.setProperty("--drag-y", `${cy}px`);
    },
    [bounds],
  );

  const onPointerUp = useCallback(() => {
    if (!dragging.current || !ref.current) return;

    dragging.current = false;
    setIsDragging(false);

    // Spring back to origin
    const el = ref.current;
    el.style.transition =
      "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
    pos.current = { x: 0, y: 0 };
    el.style.setProperty("--drag-x", "0px");
    el.style.setProperty("--drag-y", "0px");

    // Clean up transition after animation
    const onEnd = () => {
      el.style.transition = "";
      el.removeEventListener("transitionend", onEnd);
    };
    el.addEventListener("transitionend", onEnd);
  }, []);

  // Clean up if component unmounts while dragging
  useEffect(() => {
    return () => {
      dragging.current = false;
    };
  }, []);

  return {
    ref,
    isDragging,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
  };
}
