"use client";

import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Text } from "../ui/Text";

export interface StationProps {
  year: ReactNode;
  name?: ReactNode;
  title: ReactNode;
  children: ReactNode;
  variant?: "plain" | "timeline";
  current?: boolean;
  dotIndex?: number;
  dotDelay?: number;
  startYear?: number;
  endYear?: number;
  timelinePadding?: number;
  timelineNodeOffset?: number;
  timelineNodeY?: number;
  hideTimelinePoint?: boolean;
  timeframeActive?: boolean;
  onTimeframeEnter?: () => void;
  onTimeframeLeave?: () => void;
  onMarkerEnter?: () => void;
  onMarkerLeave?: () => void;
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
  dotDelay = dotIndex * 0.15,
  timelinePadding = 24,
  timelineNodeOffset = 0,
  timelineNodeY = 11,
  hideTimelinePoint = false,
  timeframeActive = false,
  onTimeframeEnter,
  onTimeframeLeave,
  onMarkerEnter,
  onMarkerLeave,
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
      {isTimeline && !hideTimelinePoint && (
        <>
          {current && timeframeActive && (
            <span
              className="absolute z-20 size-[9px] rounded-full bg-gray-300 animate-ping opacity-20"
              style={{ right: dotRight, top: timelineNodeY }}
            />
          )}
          <motion.button
            type="button"
            aria-label={`Highlight ${typeof title === "string" ? title : "timeline station"}`}
            className={cn(
              "absolute z-20 size-[9px] rounded-full border border-white/20 shadow-[0_0_0_3px_rgba(10,10,10,0.85)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
              timeframeActive ? "bg-gray-100" : "bg-gray-500",
            )}
            style={{ right: dotRight, top: timelineNodeY }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: dotDelay,
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            onPointerEnter={onMarkerEnter}
            onPointerLeave={onMarkerLeave}
            onFocus={onMarkerEnter}
            onBlur={onMarkerLeave}
          />
        </>
      )}
      <div className="relative mb-3 flex w-full min-w-0 flex-col pr-3 sm:pr-4 gap-0.5">
        {isTimeline ? (
          <>
            {name && <div className="min-w-0">{name}</div>}
            <div className="flex min-w-0 gap-3">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                <Text weight="semibold" size="3">
                  {title}
                </Text>
              </div>
              <Text
                size="1"
                color="dim"
                className="ml-auto shrink-0 whitespace-nowrap"
              >
                <button
                  type="button"
                  className={cn(
                    "inline-flex rounded-full border border-white/10 bg-white/6 px-2 py-1 font-mono text-[11px] leading-none tracking-[0.12em] text-white/70 uppercase transition-colors duration-200",
                    isTimeline &&
                      "cursor-default focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
                    timeframeActive &&
                      "border-white/20 bg-white/10 text-white/92",
                  )}
                  onPointerEnter={onTimeframeEnter}
                  onPointerLeave={onTimeframeLeave}
                  onFocus={onTimeframeEnter}
                  onBlur={onTimeframeLeave}
                  tabIndex={isTimeline ? 0 : -1}
                >
                  {year}
                </button>
              </Text>
            </div>
          </>
        ) : (
          <div className="flex min-w-0 gap-3">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
              <Text weight="semibold" size="3">
                {title}
              </Text>
              {name ? <span>{name}</span> : null}
            </div>
            <Text
              size="1"
              color="dim"
              className="ml-auto shrink-0 whitespace-nowrap"
            >
              <button
                type="button"
                className={cn(
                  "inline-flex rounded-full border border-white/10 bg-white/6 px-2 py-1 font-mono text-[11px] leading-none tracking-[0.12em] text-white/70 uppercase transition-colors duration-200",
                  isTimeline &&
                    "cursor-default focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
                  timeframeActive &&
                    "border-white/20 bg-white/10 text-white/92",
                )}
                onPointerEnter={onTimeframeEnter}
                onPointerLeave={onTimeframeLeave}
                onFocus={onTimeframeEnter}
                onBlur={onTimeframeLeave}
                tabIndex={isTimeline ? 0 : -1}
              >
                {year}
              </button>
            </Text>
          </div>
        )}
      </div>
      <div className="pr-3 text-white/88 sm:pr-4 [&_p]:text-pretty">
        {children}
      </div>
    </div>
  );
}
