"use client";

import { motion } from "motion/react";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import { Text } from "../ui/Text";
import { StationInlineContext } from "./InlineStationLink";

export interface StationProps {
  year: ReactNode;
  name?: ReactNode;
  title: ReactNode;
  children: ReactNode;
  variant?: "plain" | "timeline";
  timelineMode?: "range" | "release";
  timelinePointShape?: "circle" | "diamond";
  current?: boolean;
  dotIndex?: number;
  dotDelay?: number;
  startYear?: number;
  endYear?: number;
  timelinePadding?: number;
  timelineNodeOffset?: number;
  timelineNodeY?: number;
  hideTimelinePoint?: boolean;
  hoverEnabled?: boolean;
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
  timelineMode = "range",
  timelinePointShape = "circle",
  current = false,
  dotIndex = 0,
  dotDelay = dotIndex * 0.15,
  timelinePadding = 24,
  timelineNodeOffset = 0,
  timelineNodeY = 11,
  hideTimelinePoint = false,
  hoverEnabled = true,
  timeframeActive = false,
  onTimeframeEnter,
  onTimeframeLeave,
  onMarkerEnter,
  onMarkerLeave,
  className,
  style,
}: StationProps) {
  const isTimeline = variant === "timeline";
  const isDiamondPoint = timelinePointShape === "diamond";
  const stationRef = useRef<HTMLDivElement | null>(null);
  const anchorRefs = useRef<Record<string, HTMLElement | null>>({});
  const [registeredPoints, setRegisteredPoints] = useState<
    Array<{ id: string; shape: "circle" | "diamond" }>
  >([]);
  const [activePointId, setActivePointId] = useState<string | null>(null);
  const [stationHovered, setStationHovered] = useState(false);
  const [pointPositions, setPointPositions] = useState<Record<string, number>>(
    {},
  );
  const hasCustomTimelinePoints = registeredPoints.length > 0;
  const stationActive = timeframeActive || stationHovered;

  const dotRight = timelineNodeOffset - 4.5;
  const contentStyle = isTimeline
    ? {
        ...style,
        paddingRight: timelinePadding,
      }
    : style;

  const measurePoints = useCallback(() => {
    const stationElement = stationRef.current;
    if (!stationElement || registeredPoints.length === 0) {
      return;
    }

    const stationRect = stationElement.getBoundingClientRect();
    const measuredPositions = registeredPoints.map(({ id }) => {
      const anchor = anchorRefs.current[id];
      if (!anchor) {
        return timelineNodeY;
      }

      const anchorRect = anchor.getBoundingClientRect();
      return anchorRect.top - stationRect.top + anchorRect.height * 0.5 - 4.5;
    });
    const invertedPositions = [...measuredPositions].reverse();
    const nextPositions = Object.fromEntries(
      registeredPoints.map(({ id }) => {
        const position = invertedPositions.shift() ?? timelineNodeY;
        return [id, position];
      }),
    );

    setPointPositions((currentPositions) => {
      const currentEntries = Object.entries(currentPositions);
      const nextEntries = Object.entries(nextPositions);

      if (
        currentEntries.length === nextEntries.length &&
        nextEntries.every(([id, value]) => currentPositions[id] === value)
      ) {
        return currentPositions;
      }

      return nextPositions;
    });
  }, [registeredPoints, timelineNodeY]);

  const registerPoint = useCallback(
    (
      id: string,
      node: HTMLElement | null,
      shape: "circle" | "diamond" = "diamond",
    ) => {
      anchorRefs.current[id] = node;
      setRegisteredPoints((currentPoints) => {
        const currentPoint = currentPoints.find((point) => point.id === id);
        if (currentPoint && currentPoint.shape === shape) {
          return currentPoints;
        }

        if (currentPoint) {
          return currentPoints.map((point) =>
            point.id === id ? { ...point, shape } : point,
          );
        }

        return [...currentPoints, { id, shape }];
      });
    },
    [],
  );

  const unregisterPoint = useCallback((id: string) => {
    delete anchorRefs.current[id];
    setRegisteredPoints((currentPoints) =>
      currentPoints.filter((point) => point.id !== id),
    );
    setPointPositions((currentPositions) => {
      if (!(id in currentPositions)) {
        return currentPositions;
      }

      const nextPositions = { ...currentPositions };
      delete nextPositions[id];
      return nextPositions;
    });
    setActivePointId((currentId) => (currentId === id ? null : currentId));
  }, []);

  const inlineContextValue = useMemo(
    () => ({
      activePointId,
      hoverEnabled,
      registerPoint,
      unregisterPoint,
      setActivePointId,
    }),
    [activePointId, hoverEnabled, registerPoint, unregisterPoint],
  );

  useEffect(() => {
    if (!hasCustomTimelinePoints) {
      return;
    }

    measurePoints();

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            measurePoints();
          });

    if (stationRef.current) {
      observer?.observe(stationRef.current);
    }

    for (const point of registeredPoints) {
      const anchor = anchorRefs.current[point.id];
      if (anchor) {
        observer?.observe(anchor);
      }
    }

    window.addEventListener("resize", measurePoints);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measurePoints);
    };
  }, [hasCustomTimelinePoints, measurePoints, registeredPoints]);

  const handleStationPointerEnter = useCallback(() => {
    if (!hoverEnabled) {
      return;
    }

    setStationHovered(true);
    onTimeframeEnter?.();
  }, [hoverEnabled, onTimeframeEnter]);

  const handleStationPointerLeave = useCallback(() => {
    if (!hoverEnabled) {
      return;
    }

    setStationHovered(false);
    onTimeframeLeave?.();
  }, [hoverEnabled, onTimeframeLeave]);

  useEffect(() => {
    if (hoverEnabled) {
      return;
    }

    setStationHovered(false);
    setActivePointId(null);
  }, [hoverEnabled]);

  const timeframeLabel = (
    <Text
      size="1"
      color="dim"
      className="order-first shrink-0 whitespace-nowrap"
    >
      <span
        className={cn(
          "inline-flex font-mono text-[11px] leading-none tracking-[0.12em] text-white/70 uppercase transition-colors duration-200",
          stationActive && "text-white/92",
        )}
      >
        {year}
      </span>
    </Text>
  );

  return (
    <div
      ref={stationRef}
      className={cn(
        isTimeline && "relative min-h-[92px] py-1 sm:min-h-[104px]",
        className,
      )}
      style={contentStyle}
      onPointerEnter={handleStationPointerEnter}
      onPointerLeave={handleStationPointerLeave}
    >
      {isTimeline && !hideTimelinePoint && !hasCustomTimelinePoints && (
        <>
          {current && stationActive && (
            <span
              className="absolute z-20 size-[9px] rounded-full bg-gray-300 animate-ping opacity-20"
              style={{ right: dotRight, top: timelineNodeY }}
            />
          )}
          <motion.button
            type="button"
            aria-label={`Highlight ${typeof title === "string" ? title : "timeline station"}`}
            className={cn(
              "absolute z-20 size-[9px] border border-white/20 shadow-[0_0_0_3px_rgba(10,10,10,0.85)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
              isDiamondPoint ? "rotate-45 rounded-[2px]" : "rounded-full",
              stationActive ? "bg-gray-100" : "bg-gray-500",
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
      {isTimeline &&
        !hideTimelinePoint &&
        hasCustomTimelinePoints &&
        registeredPoints.map((point, index) => {
          const pointIsDiamond = point.shape === "diamond";
          const pointActive =
            activePointId !== null ? activePointId === point.id : stationActive;

          return (
            <motion.button
              key={point.id}
              type="button"
              aria-label={`Highlight ${point.id}`}
              className={cn(
                "absolute z-20 size-[9px] border border-white/20 shadow-[0_0_0_3px_rgba(10,10,10,0.85)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
                pointIsDiamond ? "rotate-45 rounded-[2px]" : "rounded-full",
                pointActive ? "bg-gray-100" : "bg-gray-500",
              )}
              style={{
                right: dotRight,
                top: pointPositions[point.id] ?? timelineNodeY + index * 18,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: dotDelay + index * 0.06,
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              onPointerEnter={
                hoverEnabled ? () => setActivePointId(point.id) : undefined
              }
              onPointerLeave={
                hoverEnabled ? () => setActivePointId(null) : undefined
              }
              onFocus={() => setActivePointId(point.id)}
              onBlur={() => setActivePointId(null)}
            />
          );
        })}
      <div
        className={cn(
          "relative mb-3 flex w-full min-w-0 flex-col gap-0.5 pr-3 sm:pr-4",
          isTimeline && "py-2",
        )}
      >
        {isTimeline ? (
          <>
            <div className="sm:hidden">
              {timeframeLabel}
            </div>
            {name && (
              <div
                className={cn(
                  "min-w-0 transition-colors duration-200",
                  stationActive ? "text-white" : "text-white/72",
                )}
              >
                {name}
              </div>
            )}
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-3">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
                <Text
                  weight="semibold"
                  size="3"
                  className={cn(
                    "transition-colors duration-200",
                    stationActive ? "text-white" : "text-white/82",
                  )}
                >
                  {title}
                </Text>
              </div>
              <Text
                size="1"
                color="dim"
                className="hidden shrink-0 whitespace-nowrap sm:ml-auto sm:block"
              >
                <span
                  className={cn(
                    "inline-flex font-mono text-[11px] leading-none tracking-[0.12em] text-white/70 uppercase transition-colors duration-200",
                    stationActive && "text-white/92",
                  )}
                >
                  {year}
                </span>
              </Text>
            </div>
          </>
        ) : (
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-3">
            {timeframeLabel}
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
              <Text
                weight="semibold"
                size="3"
                className={cn(
                  "transition-colors duration-200",
                  stationActive ? "text-white" : "text-white/82",
                )}
              >
                {title}
              </Text>
              {name ? <span>{name}</span> : null}
            </div>
          </div>
        )}
        <StationInlineContext value={inlineContextValue}>
          <div
            className={cn(
              "mt-2 transition-colors duration-200 [&_p]:text-pretty [&_p]:transition-colors [&_p]:duration-200",
              stationActive ? "[&_p]:text-white/92" : "[&_p]:text-white/72",
            )}
          >
            {children}
          </div>
        </StationInlineContext>
      </div>
    </div>
  );
}
