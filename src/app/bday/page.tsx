"use client";

import Image from "next/image";
import cakeOn from "./cake-on.png";
import cakeOff from "./cake-off.png";
import frame from "./frame.png";
import { useState } from "react";
import { cn } from "@/lib/cn";
import confetti from "canvas-confetti";

function shootConfetti() {
  const rand = Math.random();
  if (rand > 0.5) {
    confetti({
      particleCount: 200,
      spread: 60,
      origin: { y: 0.6 },
    });
  } else {
    const heart = confetti.shapeFromPath({
      path: "M10 30 A20 20 0 0 1 50 30 Q50 60 10 90 Q-30 60 -30 30 A20 20 0 0 1 10 30 Z",
    });

    confetti({
      particleCount: 200,
      shapes: [heart],
      colors: ["#ff4d6d", "#ff8fa3", "#ffccd5"],
      spread: 80,
      origin: { y: 0.6 },
    });
  }
}

export default function BdayPage() {
  const [on, setOn] = useState(false);

  function toggleCandles() {
    setOn(!on);
    if (!on) {
      shootConfetti();
    }
  }

  return (
    <div className="bg-amber-200 w-screen h-screen bg-[url(/bg.png)] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1/2 aspect-square">
        {/* base (candles off) */}
        <Image
          src={cakeOff}
          alt="bday cake off"
          className="size-[80%] absolute left-1/2 top-1/2 -translate-1/2"
          onClick={toggleCandles}
        />
        <Image
          onClick={toggleCandles}
          src={cakeOn}
          alt="bday cake on"
          className={cn(
            "size-[80%] absolute left-1/2 top-1/2 -translate-1/2",
            "transition-opacity duration-200",
            {
              "opacity-0": !on,
              "opacity-100": on,
            },
          )}
        />
        {on && (
          <>
            <div
              className="flame"
              style={{ "--x": "45.3%", "--y": "59%" } as any}
            ></div>
            <div
              className="flame"
              style={{ "--x": "54%", "--y": "59%" } as any}
            ></div>
          </>
        )}
        {/* frame overlay */}
        <Image
          src={frame}
          alt="bday cake frame"
          className="absolute size-[95%] left-1/2 top-1/2 -translate-1/2 pointer-events-none"
        />
      </div>

      <style jsx global>{`
        .flame {
          position: absolute;
          left: var(--x);
          top: var(--y);
          width: 7%; 
          height: 13%; 
          transform: translate(-50%, -50%);
          transform-origin: center center;
          pointer-events: none;
          z-index: 50;
          filter: drop-shadow(0 0 8px rgba(255, 180, 80, 0.5));
          mix-blend-mode: screen;
          animation: flameSway 0.15s infinite ease-in-out alternate,
            flameOpacity 1s infinite linear alternate;
        }
        .flame::before,
        .flame::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 40%;
          transform: translate(-50%, -50%);
          border-radius: 50% / 60%;
        }
        .flame::before {
          width: 40%;
          height: 50%;
          background: radial-gradient(
            closest-side,
            rgba(255, 255, 200, 1) 0%,
            rgba(255, 180, 80, 0.7) 60%,
            rgba(255, 140, 60, 0) 100%
          );
        }
        .flame::after {
          width: 80%;
          height: 80%;
          background: radial-gradient(
            closest-side,
            rgba(255, 200, 120, 0.5) 0%,
            rgba(255, 140, 60, 0.15) 50%,
            rgba(255, 120, 50, 0) 100%
          );
          filter: blur(3px);
        }

        @keyframes flameSway {
          0% {
            transform: translate(-50%, -100%) rotate(-2deg) scale(1);
          }
          100% {
            transform: translate(-50%, -100%) rotate(2deg) scale(1.05);
          }
        }
        @keyframes flameOpacity {
          0% {
            opacity: 0.85;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
