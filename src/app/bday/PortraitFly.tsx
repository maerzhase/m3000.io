"use client";

import { useEffect, useRef } from "react";
import painting from "./cake-2026.png";
import styles from "./page.module.css";

// Iris centers in the approved 1254px painting. Only these small regions move.
const eyes = [
  [188, 305],
  [309, 298],
  [546, 322],
  [683, 324],
  [928, 321],
  [1060, 327],
  [240, 670],
  [360, 657],
  [569, 625],
  [690, 624],
  [914, 645],
  [1049, 655],
];
const PATCH = 72;

export default function PortraitFly() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const image = new window.Image();
    let frame = 0;
    let ready = false;
    let disposed = false;
    let previous = 0;
    let elapsed = 0;
    let lastPaint = 0;
    const pixels: { x: number; y: number; weight: number; alpha: number }[] =
      [];
    for (let y = 0; y < PATCH; y++) {
      for (let x = 0; x < PATCH; x++) {
        const radius = Math.hypot(x - PATCH / 2, y - PATCH / 2) / 30;
        if (radius >= 1) continue;
        const blend = 1 - radius * radius;
        pixels.push({
          x,
          y,
          weight: blend * blend,
          alpha: Math.min(1, (1 - radius) * 8) * 255,
        });
      }
    }
    const patches: {
      x: number;
      y: number;
      source: ImageData;
      output: ImageData;
      dx: number;
      dy: number;
    }[] = [];

    function animate(now: number) {
      elapsed += Math.min((now - previous) / 1000, 0.06);
      previous = now;
      frame = requestAnimationFrame(animate);
      if (now - lastPaint < 1000 / 30) return;
      lastPaint = now;
      if (!context || !canvas) return;

      const x =
        627 + 355 * Math.sin(elapsed * 0.53) + 55 * Math.sin(elapsed * 2.1);
      const y =
        625 +
        245 * Math.sin(elapsed * 0.71 + 0.8) +
        55 * Math.sin(elapsed * 1.9);
      const attention = Math.min(1, Math.max(0, (elapsed - 2) / 1.2));
      context.clearRect(0, 0, canvas.width, canvas.height);

      for (const patch of patches) {
        const angle = Math.atan2(y - patch.y, x - patch.x);
        // A little lag feels more like a curious cat than a cursor follower.
        patch.dx += (Math.cos(angle) * 6 * attention - patch.dx) * 0.13;
        patch.dy += (Math.sin(angle) * 4.5 * attention - patch.dy) * 0.13;
        for (const pixel of pixels) {
          const sx = pixel.x - patch.dx * pixel.weight;
          const sy = pixel.y - patch.dy * pixel.weight;
          const ix = Math.floor(sx);
          const iy = Math.floor(sy);
          const fx = sx - ix;
          const fy = sy - iy;
          const sourceIndex = (iy * PATCH + ix) * 4;
          const outputIndex = (pixel.y * PATCH + pixel.x) * 4;
          for (let channel = 0; channel < 3; channel++) {
            const top =
              patch.source.data[sourceIndex + channel] * (1 - fx) +
              patch.source.data[sourceIndex + 4 + channel] * fx;
            const bottom =
              patch.source.data[sourceIndex + PATCH * 4 + channel] * (1 - fx) +
              patch.source.data[sourceIndex + PATCH * 4 + 4 + channel] * fx;
            patch.output.data[outputIndex + channel] =
              top * (1 - fy) + bottom * fy;
          }
        }
        context.putImageData(
          patch.output,
          patch.x - PATCH / 2,
          patch.y - PATCH / 2,
        );
      }

      context.save();
      context.translate(x, y);
      context.rotate(Math.sin(elapsed * 2.1) * 0.5);
      context.fillStyle = "rgba(229, 218, 185, 0.65)";
      const wing = 5 + Math.abs(Math.sin(elapsed * 77)) * 4;
      context.beginPath();
      context.ellipse(-5, -2, wing, 3.5, -0.5, 0, Math.PI * 2);
      context.ellipse(5, -2, wing, 3.5, 0.5, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#302b22";
      context.beginPath();
      context.ellipse(0, 1, 3.5, 5, 0, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(0, -4, 2.8, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    function syncPlayback() {
      cancelAnimationFrame(frame);
      if (disposed || !ready) return;
      if (motion.matches) context?.clearRect(0, 0, 1254, 1254);
      if (motion.matches || document.hidden) return;
      previous = performance.now();
      frame = requestAnimationFrame(animate);
    }

    image.onload = () => {
      if (disposed) return;
      // Keep coordinates stable even if a future asset export changes resolution.
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = sourceCanvas.height = 1254;
      const sourceContext = sourceCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!sourceContext) return;
      sourceContext.drawImage(image, 0, 0, 1254, 1254);
      for (const [x, y] of eyes) {
        const output = context.createImageData(PATCH, PATCH);
        // Fade the patch edge into the underlying responsive image.
        for (const pixel of pixels)
          output.data[(pixel.y * PATCH + pixel.x) * 4 + 3] = pixel.alpha;
        patches.push({
          x,
          y,
          source: sourceContext.getImageData(
            x - PATCH / 2,
            y - PATCH / 2,
            PATCH,
            PATCH,
          ),
          output,
          dx: 0,
          dy: 0,
        });
      }
      ready = true;
      syncPlayback();
    };
    image.src = painting.src;
    motion.addEventListener("change", syncPlayback);
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      disposed = true;
      image.onload = null;
      cancelAnimationFrame(frame);
      motion.removeEventListener("change", syncPlayback);
      document.removeEventListener("visibilitychange", syncPlayback);
    };
  }, []);

  return (
    <span className={styles.portraitFly} aria-hidden="true">
      <canvas ref={canvasRef} width={1254} height={1254} />
    </span>
  );
}
