"use client";

import confetti from "canvas-confetti";
import Image from "next/image";
import {
  type CSSProperties,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import cake from "./cake-2026.png";
import frame from "./frame-2026.png";
import PortraitFly from "./PortraitFly";
import styles from "./page.module.css";

type Stage = "unlit" | "lit" | "wished";
type CandleStyle = CSSProperties & { "--x": string; "--y": string };
const candles: CandleStyle[] = [
  { "--x": "46.8%", "--y": "58.1%" },
  { "--x": "53.5%", "--y": "58.1%" },
];
const HOLD_DURATION = 1400;

function celebrate() {
  const heart = confetti.shapeFromPath({
    path: "M10 30 A20 20 0 0 1 50 30 Q50 60 10 90 Q-30 60 -30 30 A20 20 0 0 1 10 30 Z",
  });
  confetti({
    particleCount: 90,
    spread: 85,
    startVelocity: 27,
    gravity: 0.65,
    ticks: 260,
    scalar: 0.85,
    shapes: ["circle", heart],
    colors: ["#a14b36", "#cf9352", "#f3d9a1", "#6c7650"],
    origin: { x: 0.5, y: 0.58 },
    disableForReducedMotion: true,
  });
}

export default function BdayPage() {
  const [stage, setStage] = useState<Stage>("unlit");
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipClick = useRef(false);

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearTimeout(holdTimer.current);
      if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
      confetti.reset();
    };
  }, []);

  function stopHolding() {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    setHolding(false);
  }

  function finishWish(fromHold = false) {
    stopHolding();
    skipClick.current = fromHold;
    setStage("wished");
    celebrationTimer.current = setTimeout(celebrate, 350);
  }

  function startHolding() {
    if (stage !== "lit" || holdTimer.current) return;
    setHolding(true);
    holdTimer.current = setTimeout(() => finishWish(true), HOLD_DURATION);
  }

  function lightCandles() {
    if (celebrationTimer.current) clearTimeout(celebrationTimer.current);
    confetti.reset();
    skipClick.current = false;
    setStage("lit");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") stopHolding();
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (event.repeat) return;
    if (stage === "lit") startHolding();
    else lightCandles();
  }

  const instruction =
    stage === "unlit"
      ? "Tap to light the candles."
      : stage === "lit"
        ? holding
          ? "Keep holding…"
          : "Make a wish. Hold to blow out the candles."
        : "Tap to make another wish.";

  return (
    <main className={styles.page} data-stage={stage} data-holding={holding}>
      <div className={styles.portraitWrap}>
        <button
          type="button"
          className={styles.portrait}
          aria-label={
            stage === "lit"
              ? "Hold to blow out the birthday candles"
              : "Light the birthday candles"
          }
          aria-describedby="birthday-instruction"
          onClick={(event) => {
            if (skipClick.current) {
              skipClick.current = false;
              return;
            }
            if (stage !== "lit") lightCandles();
            else if (event.detail === 0) finishWish();
          }}
          onPointerDown={(event) => {
            if (event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            startHolding();
          }}
          onPointerUp={stopHolding}
          onPointerCancel={() => {
            stopHolding();
            skipClick.current = false;
          }}
          onLostPointerCapture={stopHolding}
          onKeyDown={handleKeyDown}
          onKeyUp={(event) => {
            if (event.key === " " || event.key === "Enter") {
              event.preventDefault();
              stopHolding();
              skipClick.current = false;
            }
          }}
          onBlur={stopHolding}
          onContextMenu={(event) => event.preventDefault()}
        >
          <Image
            src={cake}
            alt="Six cats gathered around a birthday cake with 41 candles"
            className={styles.painting}
            sizes="(max-width: 600px) 75vw, 465px"
            priority
            draggable={false}
          />
        </button>
        <PortraitFly />
        <span className={styles.candlelight} aria-hidden="true" />
        {candles.map((style) => (
          <span
            key={style["--x"]}
            className={styles.candle}
            style={style}
            aria-hidden="true"
          >
            {stage === "lit" && <span className={styles.flame} />}
            {stage === "wished" && <span className={styles.smoke} />}
          </span>
        ))}
        <Image
          src={frame}
          alt=""
          className={styles.frame}
          sizes="(max-width: 600px) 90vw, 620px"
          draggable={false}
        />
      </div>

      <div className={styles.below}>
        <p
          id="birthday-instruction"
          className={styles.instruction}
          aria-live="polite"
        >
          {instruction}
        </p>
        <div className={styles.progress} aria-hidden="true">
          <span />
        </div>
        {stage === "lit" && (
          <button
            type="button"
            className={styles.textButton}
            onClick={() => finishWish()}
          >
            Blow out candles
          </button>
        )}
      </div>
    </main>
  );
}
