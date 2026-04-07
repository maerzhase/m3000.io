"use client";

import { motion } from "motion/react";

const CARD_W = 24;
const CARD_H = 16;
const CONTAINER_W = CARD_W + 8; // enough room for the horizontal overlap without widening the text gap
const CONTAINER_H = 10; // keep the inline box short so it doesn't inflate the line-height

// Each card: static base position (top/left) + animated offset (x/y) per variant
const CARDS = [
  // Back card — offset mostly on x so the stack reads left-to-right
  {
    top: -2,
    left: 8,
    rest: { x: 0, y: 0, rotate: 2 },
    hover: { x: 6, y: 0, rotate: 4 },
  },
  // Middle card — nudges out a bit, staying nearly level
  {
    top: -1,
    left: 4,
    rest: { x: 0, y: 0, rotate: -1 },
    hover: { x: 3, y: 0, rotate: -2 },
  },
  // Front card — the anchor card stays almost fixed
  {
    top: -1,
    left: 0,
    rest: { x: 0, y: 0, rotate: 0 },
    hover: { x: 0, y: 0, rotate: 0 },
  },
] as const;

export function CardDeck() {
  return (
    <motion.span
      className="relative ml-[0.5em] mr-[0.3em] inline-block overflow-visible"
      style={{
        width: CONTAINER_W,
        height: CONTAINER_H,
        lineHeight: 1,
        verticalAlign: "middle",
      }}
      initial="rest"
      whileHover="hover"
      aria-hidden="true"
    >
      {CARDS.map((card, i) => (
        <motion.span
          // biome-ignore lint/suspicious/noArrayIndexKey: static array
          key={i}
          className="absolute dither bg-gray-800 rounded-[2px] border border-gray-700/50"
          style={{
            display: "block",
            width: CARD_W,
            height: CARD_H,
            top: card.top,
            left: card.left,
          }}
          variants={{
            rest: card.rest,
            hover: card.hover,
          }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
        />
      ))}
    </motion.span>
  );
}
