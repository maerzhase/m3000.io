"use client";

import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Text } from "./ui/Text";

interface StationProps {
  year: ReactNode;
  name?: ReactNode;
  title: ReactNode;
  children: ReactNode;
  variant?: "plain" | "timeline";
  current?: boolean;
  dotIndex?: number;
  startYear?: number;
  endYear?: number;
  timelinePadding?: number;
  timelineNodeOffset?: number;
  timelineNodeY?: number;
  className?: string;
  style?: CSSProperties;
}

export function Station({
  year,
  title,
  name,
  children,
  variant = "plain",
  current = false,
  dotIndex = 0,
  timelinePadding = 24,
  timelineNodeOffset = 0,
  timelineNodeY = 11,
  className,
  style,
}: StationProps) {
  const isTimeline = variant === "timeline";

  const dotRight = timelineNodeOffset - 4.5;
  const contentStyle = isTimeline
    ? {
        ...style,
        paddingRight: timelinePadding,
      }
    : style;

  return (
    <div
      className={cn(
        isTimeline && "relative min-h-[92px] py-1 sm:min-h-[104px]",
        className,
      )}
      style={contentStyle}
    >
      {isTimeline && (
        <>
          {current && (
            <span
              className="absolute size-[9px] rounded-full bg-gray-300 animate-ping opacity-20"
              style={{ right: dotRight, top: timelineNodeY }}
            />
          )}
          <motion.div
            className={cn(
              "absolute size-[9px] rounded-full border border-white/20 shadow-[0_0_0_3px_rgba(10,10,10,0.85)]",
              current ? "bg-gray-100" : "bg-gray-500",
            )}
            style={{ right: dotRight, top: timelineNodeY }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: dotIndex * 0.15,
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
          />
        </>
      )}
      <div className="relative mb-3 flex w-full flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 pr-6">
          <Text weight="semibold" size="3" className="tracking-[-0.01em]">
            {title}
          </Text>
          {name ? (
            <Text color="dim" className="text-white/70">
              {name}
            </Text>
          ) : null}
        </div>
        <Text size="1" color="dim" className="ml-auto">
          <span className="inline-flex rounded-full border border-white/10 bg-white/6 px-2 py-1 font-mono text-[11px] leading-none tracking-[0.12em] text-white/70 uppercase">
            {year}
          </span>
        </Text>
      </div>
      <div className="pr-6 text-white/88">{children}</div>
    </div>
  );
}
