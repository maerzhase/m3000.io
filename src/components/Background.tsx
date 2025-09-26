"use client";
import type React from "react";
import { useEffect, useRef } from "react";

const Background: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    )?.matches;
    if (reduce) return;

    let raf = 0;
    let targetX = 0,
      targetY = 0; // normalized [-1, 1]
    let curX = 0,
      curY = 0;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const onMove = (e: PointerEvent) => {
      // Viewport-relative (so it works the same anywhere on the page)
      const x = e.clientX / window.innerWidth; // 0..1
      const y = e.clientY / window.innerHeight; // 0..1
      targetX = (x - 0.5) * 2; // -1..1
      targetY = (y - 0.5) * 2; // -1..1

      el.style.setProperty("--mx", `${x * 100}%`);
      el.style.setProperty("--my", `${y * 100}%`);
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const tick = () => {
      curX = lerp(curX, targetX, 0.06);
      curY = lerp(curY, targetY, 0.06);

      el.style.setProperty("--par-x-1", `${curX * 14}px`);
      el.style.setProperty("--par-y-1", `${curY * 14}px`);
      el.style.setProperty("--par-x-2", `${curX * 9}px`);
      el.style.setProperty("--par-y-2", `${curY * 9}px`);
      el.style.setProperty("--par-x-3", `${curX * 5}px`);
      el.style.setProperty("--par-y-3", `${curY * 5}px`);

      el.style.setProperty("--tilt-x", `${curX * 1.1}deg`);
      el.style.setProperty("--tilt-y", `${-curY * 1.1}deg`);

      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative min-h-dvh bg-[#070707] text-white"
      style={
        {
          "--par-x-1": "0px",
          "--par-y-1": "0px",
          "--par-x-2": "0px",
          "--par-y-2": "0px",
          "--par-x-3": "0px",
          "--par-y-3": "0px",
          "--tilt-x": "0deg",
          "--tilt-y": "0deg",
          "--mx": "50%",
          "--my": "50%",
        } as React.CSSProperties
      }
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 will-change-transform"
        style={{
          transform:
            "perspective(1200px) rotateY(var(--tilt-x)) rotateX(var(--tilt-y))",
          transformStyle: "preserve-3d",
          opacity: 0.7,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,#0a0a0a_0%,#060606_60%,#000_100%)]" />

        {/* Ember core (primary) — centered a bit higher */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2
                     h-[50rem] w-[50rem] rounded-full
                     bg-[#ff2f00] opacity-15 blur-[110px] mix-blend-screen animate-ember"
          style={{
            transform: "translate3d(var(--par-x-1), var(--par-y-1), 0)",
          }}
        />

        <div
          className="absolute bottom-[-20%] left-1/2 -translate-x-1/2
                     h-[56rem] w-[56rem] rounded-full
                     bg-[radial-gradient(closest-side,rgba(255,47,0,0.20)_0%,rgba(255,47,0,0)_75%)]
                     blur-[120px] opacity-80 mix-blend-screen animate-drift-slower"
          style={{
            transform:
              "translate3d(calc(var(--par-x-1) * -0.6), calc(var(--par-y-1) * 0.4), 0)",
          }}
        />

        <div
          className="absolute top-1/3 left-[-6%]
                     h-[34rem] w-[30rem] rotate-6 rounded-[999px]
                     bg-[radial-gradient(closest-side,rgba(255,47,0,0.20)_0%,rgba(255,47,0,0)_72%)]
                     blur-[90px] mix-blend-screen animate-drift-slow"
          style={{
            transform: "translate3d(var(--par-x-2), var(--par-y-2), 0)",
          }}
        />

        <div
          className="absolute top-[45%] right-[-10%]
                     h-[32rem] w-[36rem] -rotate-6 rounded-[999px]
                     bg-[radial-gradient(closest-side,rgba(74,12,0,0.20)_0%,rgba(74,12,0,0)_70%)]
                     blur-[100px] mix-blend-lighten animate-drift-slower"
          style={{
            transform: "translate3d(var(--par-x-3), var(--par-y-3), 0)",
          }}
        />

        <div
          className="absolute bottom-8 left-[48%]
                     h-[28rem] w-[28rem] rounded-full
                     bg-[radial-gradient(closest-side,#0a0f14_0%,rgba(10,15,20,0)_70%)]
                     opacity-45 blur-[90px] mix-blend-overlay animate-pulse-slow"
          style={{
            transform:
              "translate3d(calc(var(--par-x-3) * -1), calc(var(--par-y-3) * -1), 0)",
          }}
        />

        <div
          className="absolute inset-0 mix-blend-screen"
          style={{
            background:
              "radial-gradient(42rem circle at var(--mx) var(--my), rgba(255,47,0,0.04), rgba(255,47,0,0.0) 62%)",
            transition: "background-position 120ms ease-out",
          }}
        />
      </div>

      {/* Content always above the fixed FX layer */}
      <div className="relative z-10">{children}</div>

      {/* Keyframes */}
      <style>{`
        @keyframes ember {
          0%   { transform: translate3d(var(--par-x-1), var(--par-y-1), 0) scale(1.00); opacity: 0.15; }
          50%  { transform: translate3d(calc(var(--par-x-1) + 12px), calc(var(--par-y-1) + 8px), 0) scale(1.035); opacity: 0.18; }
          100% { transform: translate3d(var(--par-x-1), var(--par-y-1), 0) scale(1.00); opacity: 0.15; }
        }
        @keyframes drift-slow {
          0%   { transform: translate3d(var(--par-x-2), var(--par-y-2), 0) rotate(6deg)  scale(1.00); }
          50%  { transform: translate3d(calc(var(--par-x-2) + 18px), calc(var(--par-y-2) - 12px), 0) rotate(8deg) scale(1.02); }
          100% { transform: translate3d(var(--par-x-2), var(--par-y-2), 0) rotate(6deg)  scale(1.00); }
        }
        @keyframes drift-slower {
          0%   { transform: translate3d(var(--par-x-3), var(--par-y-3), 0) rotate(-6deg) scale(1.00); }
          50%  { transform: translate3d(calc(var(--par-x-3) - 16px), calc(var(--par-y-3) + 12px), 0) rotate(-4deg) scale(1.015); }
          100% { transform: translate3d(var(--par-x-3), var(--par-y-3), 0) rotate(-6deg) scale(1.00); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.45; }
          50%      { opacity: 0.52; }
        }
        .animate-ember        { animation: ember 18s ease-in-out infinite; }
        .animate-drift-slow   { animation: drift-slow 32s ease-in-out infinite; }
        .animate-drift-slower { animation: drift-slower 45s ease-in-out infinite; }
        .animate-pulse-slow   { animation: pulse-slow 22s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .animate-ember,
          .animate-drift-slow,
          .animate-drift-slower,
          .animate-pulse-slow { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Background;
