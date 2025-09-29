"use client";

import Image from "next/image";
import cakeOn from "./cake-on.png";
import cakeOff from "./cake-off.png";
import frame from "./frame.png";
import { useState } from "react";
import { cn } from "@/lib/cn";
import confetti from "canvas-confetti";

export default function BdayPage() {
  const [on, setOn] = useState(false);

  function toggleCandles() {
    setOn(!on);
    if (!on) {
      confetti();
    }
  }

  return (
    <div className="bg-amber-200 w-screen h-screen bg-[url(/bg.png)] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1/2 aspect-[1024/1024] ">
        {/* base (candles off) */}
        <Image
          src={cakeOff}
          alt="bday cake off"
          className="size-full absolute"
          onClick={toggleCandles}
        />
        <Image
          onClick={toggleCandles}
          src={cakeOn}
          alt="bday cake on"
          className={cn("size-full transition-opacity duration-200 absolute", {
            "opacity-0": !on,
            "opacity-100": on,
          })}
        />
        {on && (
          <>
            <div
              className="flame"
              style={{ "--x": "44%", "--y": "58%" } as any}
            ></div>
            <div
              className="flame"
              style={{ "--x": "55%", "--y": "58%" } as any}
            ></div>
          </>
        )}
      </div>

      {/* frame overlay */}
      <Image
        src={frame}
        alt="bday cake frame"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[60%] w-auto pointer-events-none"
      />

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
