"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  type ReactNode,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRedacted } from "./Context";

/** Simple seeded random for consistent but varied delays */
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

interface WordRect {
  top: number;
  left: number;
  width: number;
  height: number;
  isSingleChar: boolean;
}

interface MeasuredWords {
  words: WordRect[];
  lineHeight: number;
  firstLineTop: number;
}

interface Segment {
  top: number;
  left: number;
  width: number;
  height: number;
  delay: number;
}

const GAP = 6;

/**
 * Measures word positions in a container using Range API
 */
function measureWords(element: HTMLElement): MeasuredWords {
  const words: WordRect[] = [];
  const containerRect = element.getBoundingClientRect();

  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node: Text | null;

  let firstLineTop = 0;
  let secondLineTop: number | null = null;
  let hasSetFirstLine = false;

  for (;;) {
    const next = walker.nextNode();
    if (!next) break;
    node = next as Text;
    const text = node.textContent || "";
    if (!text.trim()) continue;

    const range = document.createRange();

    // Find word boundaries
    let wordStart = 0;
    let inWord = false;

    for (let i = 0; i <= text.length; i++) {
      const char = text[i];
      const isWordChar = char && !/\s/.test(char);

      if (isWordChar && !inWord) {
        // Start of word
        wordStart = i;
        inWord = true;
      } else if (!isWordChar && inWord) {
        // End of word
        inWord = false;

        range.setStart(node, wordStart);
        range.setEnd(node, i);
        const rect = range.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) continue;

        const relativeTop = rect.top - containerRect.top;
        const relativeLeft = rect.left - containerRect.left;
        const isSingleChar = i - wordStart <= 1;

        // Track line positions for consistent spacing
        if (!hasSetFirstLine) {
          firstLineTop = relativeTop;
          hasSetFirstLine = true;
        } else if (
          secondLineTop === null &&
          Math.abs(relativeTop - firstLineTop) > 2
        ) {
          secondLineTop = relativeTop;
        }

        words.push({
          top: relativeTop,
          left: relativeLeft,
          width: rect.width,
          height: rect.height,
          isSingleChar,
        });
      }
    }
  }

  // Calculate line height from first two lines, or use max height
  let lineHeight = words.length > 0 ? words[0].height : 20;
  if (secondLineTop !== null) {
    lineHeight = secondLineTop - firstLineTop;
  }

  return { words, lineHeight, firstLineTop };
}

/**
 * Group words by line and optionally merge adjacent words randomly
 */
function generateSegments(
  measured: MeasuredWords,
  baseSeed: number,
  redactKey: number,
): Segment[] {
  const { words, lineHeight, firstLineTop } = measured;
  if (words.length === 0) return [];

  const segments: Segment[] = [];
  const barHeight = lineHeight - GAP;

  // Group words by line (based on top position)
  const lineMap = new Map<number, WordRect[]>();
  for (const word of words) {
    // Round to nearest line
    const lineIndex = Math.round((word.top - firstLineTop) / lineHeight);
    const lineKey = lineIndex;
    if (!lineMap.has(lineKey)) {
      lineMap.set(lineKey, []);
    }
    lineMap.get(lineKey)!.push(word);
  }

  // Sort lines and process each
  const sortedLines = Array.from(lineMap.entries()).sort((a, b) => a[0] - b[0]);
  let segmentIndex = 0;

  for (const [lineIndex, lineWords] of sortedLines) {
    // Sort words by left position
    lineWords.sort((a, b) => a.left - b.left);

    // Consistent top position
    const top = firstLineTop + lineIndex * lineHeight;

    let i = 0;
    while (i < lineWords.length) {
      const currentWord = lineWords[i];

      // If this is a single char, always merge with next word if possible
      if (currentWord.isSingleChar) {
        // Try to merge with next word
        if (i + 1 < lineWords.length) {
          const nextWord = lineWords[i + 1];
          const gap = nextWord.left - (currentWord.left + currentWord.width);
          if (gap < 30) {
            // Merge single char with next word - skip this iteration,
            // it will be picked up when we process the next word
            // by looking back
            i++;
            continue;
          }
        }
        // Can't merge forward, skip single char (no bar for it)
        i++;
        continue;
      }

      const seed = baseSeed + segmentIndex * 31 + redactKey * 1000;

      // Look back to include any preceding single chars
      let startIdx = i;
      while (startIdx > 0 && lineWords[startIdx - 1].isSingleChar) {
        const prevWord = lineWords[startIdx - 1];
        const gap = currentWord.left - (prevWord.left + prevWord.width);
        if (gap < 30) {
          startIdx--;
        } else {
          break;
        }
      }

      // Decide whether to merge with next word(s)
      // ~30% chance to merge 2 words, ~10% chance to merge 3
      const rand = seededRandom(seed);
      let mergeCount = 1;
      if (rand > 0.7 && i + 1 < lineWords.length) {
        mergeCount = 2;
        if (rand > 0.9 && i + 2 < lineWords.length) {
          mergeCount = 3;
        }
      }

      // Check if words are actually adjacent (gap < 20px) and include single chars
      let endIdx = i;
      for (let j = 1; j < mergeCount + 5 && i + j < lineWords.length; j++) {
        const prevWord = lineWords[i + j - 1];
        const nextWord = lineWords[i + j];
        const gap = nextWord.left - (prevWord.left + prevWord.width);

        // Always include adjacent single chars
        if (nextWord.isSingleChar && gap < 30) {
          endIdx = i + j;
          continue;
        }

        // Include multi-char words based on merge count and gap
        if (!nextWord.isSingleChar && gap < 20 && j <= mergeCount) {
          endIdx = i + j;
        } else if (!nextWord.isSingleChar) {
          break;
        }
      }

      // Calculate merged segment bounds
      const startWord = lineWords[startIdx];
      const endWord = lineWords[endIdx];
      const left = startWord.left;
      const width = endWord.left + endWord.width - startWord.left;

      // Sequential delay with random offset
      const sequentialDelay = segmentIndex * 0.015;
      const randomOffset = seededRandom(seed + 2) * 0.1;

      segments.push({
        top,
        left,
        width: width - GAP,
        height: barHeight,
        delay: sequentialDelay + randomOffset,
      });

      i = endIdx + 1;
      segmentIndex++;
    }
  }

  return segments;
}

/**
 * Wrapper component that overlays redaction bars on text
 */
export function RedactedArea({ children }: { children: ReactNode }) {
  const id = useId();
  const containerRef = useRef<HTMLSpanElement>(null);
  const [measured, setMeasured] = useState<MeasuredWords>({
    words: [],
    lineHeight: 0,
    firstLineTop: 0,
  });
  const { redacted, redactKey } = useRedacted();

  useLayoutEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setMeasured(measureWords(containerRef.current));
      }
    };

    measure();

    const observer = new ResizeObserver(measure);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const baseSeed = useMemo(() => {
    return id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }, [id]);

  // Generate segments from measured words
  const segments = useMemo(() => {
    return generateSegments(measured, baseSeed, redactKey);
  }, [measured, baseSeed, redactKey]);

  return (
    <span
      ref={containerRef}
      style={{ position: "relative", display: "inline" }}
    >
      {/* Original content */}
      <motion.span
        animate={{ opacity: redacted ? 0 : 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          delay: redacted ? 0 : 0.08,
        }}
      >
        {children}
      </motion.span>

      {/* Redaction bar segments */}
      <AnimatePresence>
        {redacted &&
          segments.map((seg, i) => (
            <motion.span
              key={`seg-${i}-${redactKey}`}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              exit={{ scaleX: 0, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                delay: seg.delay,
              }}
              style={{
                position: "absolute",
                top: seg.top,
                left: seg.left,
                width: seg.width,
                height: seg.height,
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "1px",
                transformOrigin: "left center",
                pointerEvents: "none",
              }}
            />
          ))}
      </AnimatePresence>
    </span>
  );
}
