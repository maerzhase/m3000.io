"use client";

import { motion } from "motion/react";
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import {
  DURATION_COLOR,
  GRAPH_INSET,
  GRAPH_MARGIN_RIGHT,
  LANE_GAP,
  LINE_COLOR,
  NODE_END_INSET,
  NODE_OFFSET_Y,
} from "./constants";
import { laneXFor, parseYearValue, pointsToPath } from "./geometry";
import {
  buildDurationGeometries,
  buildRailPath,
  buildRouteIntervals,
} from "./graph";
import { TimelineHighlightShader } from "./TimelineHighlightShader";
import type {
  StationMetrics,
  TimelineProps,
  TimelineStationData,
} from "./types";

export function Timeline({
  children,
  hideStationPoints = false,
}: TimelineProps) {
  const ROOT_DRAW_DURATION = 0.55;
  const ROOT_DRAW_DELAY = 0.05;
  const STATION_STAGGER = 0.15;
  const BRANCH_DRAW_DURATION = 0.55;
  const BRANCH_STAGGER = 0.14;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const triggerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [metrics, setMetrics] = useState<StationMetrics[]>([]);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [debugAnchorY, setDebugAnchorY] = useState<number | null>(null);
  const [hoverEnabled, setHoverEnabled] = useState(false);
  const [activeTimeframeIndex, setActiveTimeframeIndex] = useState<
    number | null
  >(null);
  const activeTimeframeIndexRef = useRef<number | null>(null);

  const activateTimeframe = useCallback(
    (index: number) => {
      if (!hoverEnabled) {
        return;
      }

      setActiveTimeframeIndex(index);
    },
    [hoverEnabled],
  );

  const deactivateTimeframe = useCallback(
    (index: number) => {
      if (!hoverEnabled) {
        return;
      }

      setActiveTimeframeIndex((currentIndex) =>
        currentIndex === index ? null : currentIndex,
      );
    },
    [hoverEnabled],
  );

  const stations = useMemo(() => {
    const childArray = Children.toArray(children).filter(
      isValidElement,
    ) as TimelineStationData["child"][];

    return childArray.map((child, index) => {
      const timelineMode = child.props.timelineMode ?? "range";
      const fallbackEndYear = child.props.current
        ? new Date().getFullYear()
        : parseYearValue(child.props.year, new Date().getFullYear());
      const startYear =
        child.props.startYear ??
        parseYearValue(child.props.year, fallbackEndYear);
      const endYear =
        child.props.endYear ??
        (timelineMode === "release" ? startYear : fallbackEndYear);

      return {
        child,
        index,
        startYear,
        endYear,
        timelineMode,
        layout: {
          index,
          lane: index % 2,
        },
      };
    }) satisfies TimelineStationData[];
  }, [children]);

  const totalLanes = 2;

  const graphWidth = GRAPH_INSET * 2 + totalLanes * LANE_GAP;
  const timelinePadding = graphWidth + GRAPH_MARGIN_RIGHT;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDebugEnabled(params.get("timelineDebug") === "1");
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const syncHoverSupport = () => {
      setHoverEnabled(mediaQuery.matches);
    };

    syncHoverSupport();
    mediaQuery.addEventListener("change", syncHoverSupport);

    return () => {
      mediaQuery.removeEventListener("change", syncHoverSupport);
    };
  }, []);

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) {
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const nextMetrics = stations.map((station) => {
        const element = itemRefs.current[station.index];
        if (!element) {
          return { top: 0, height: 0 };
        }

        const rect = element.getBoundingClientRect();

        return {
          top: rect.top - containerRect.top,
          height: rect.height,
        };
      });

      setMetrics(nextMetrics);
    };

    const resizeObserver = new ResizeObserver(() => {
      measure();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    for (const itemRef of itemRefs.current) {
      if (itemRef) {
        resizeObserver.observe(itemRef);
      }
    }

    measure();
    window.addEventListener("resize", measure);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [stations]);

  const graphHeight =
    metrics.length > 0
      ? metrics.reduce(
          (max, metric) => Math.max(max, metric.top + metric.height),
          0,
        )
      : 0;

  const railPath = useMemo(() => {
    return buildRailPath(stations, metrics);
  }, [metrics, stations]);

  const routeIntervals = useMemo(() => {
    return buildRouteIntervals(stations, metrics);
  }, [metrics, stations]);

  const durationGeometries = useMemo(() => {
    return buildDurationGeometries(stations, metrics, routeIntervals);
  }, [metrics, routeIntervals, stations]);

  const stationDotStart = ROOT_DRAW_DELAY + ROOT_DRAW_DURATION;
  const activeDurationGeometry =
    activeTimeframeIndex !== null
      ? durationGeometries[activeTimeframeIndex]
      : null;

  useEffect(() => {
    if (!hoverEnabled || stations.length === 0) {
      setDebugAnchorY(null);
      return;
    }

    setActiveTimeframeIndex(null);
  }, [hoverEnabled, stations.length]);

  useEffect(() => {
    activeTimeframeIndexRef.current = activeTimeframeIndex;
  }, [activeTimeframeIndex]);

  useEffect(() => {
    if (hoverEnabled || stations.length === 0 || metrics.length === 0) {
      return;
    }

    let frameId: number | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const pickActiveStation = () => {
      const containerElement = containerRef.current;
      if (!containerElement) {
        return;
      }

      const viewportHeight = window.innerHeight || 1;
      const viewportAnchorOffset = viewportHeight * 0.5;
      const viewportAnchor = window.scrollY + viewportAnchorOffset;
      const containerTop =
        window.scrollY + containerElement.getBoundingClientRect().top;
      setDebugAnchorY(viewportAnchorOffset);
      let nextIndex: number | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (const station of stations) {
        const metric = metrics[station.index];
        if (!metric) {
          continue;
        }

        const itemElement = itemRefs.current[station.index];
        const triggerElement = triggerRefs.current[station.index];
        const triggerOffset =
          itemElement && triggerElement
            ? triggerElement.getBoundingClientRect().top -
              itemElement.getBoundingClientRect().top
            : 0;
        const triggerHeight =
          triggerElement?.offsetHeight ?? Math.max(metric.height * 0.55, 1);
        const stationTop = containerTop + metric.top + triggerOffset;
        const stationBottom = stationTop + triggerHeight;
        const visibleTop = stationTop - window.scrollY;
        const visibleBottom = stationBottom - window.scrollY;
        const isVisible = visibleBottom > 0 && visibleTop < viewportHeight;

        if (!isVisible) {
          continue;
        }

        if (stationTop <= viewportAnchor && stationBottom >= viewportAnchor) {
          nextIndex = station.index;
          break;
        }

        const clampedAnchor = Math.min(
          Math.max(viewportAnchor, stationTop),
          stationBottom,
        );
        const distance = Math.abs(clampedAnchor - viewportAnchor);

        if (distance < bestDistance) {
          bestDistance = distance;
          nextIndex = station.index;
        }
      }

      setActiveTimeframeIndex((currentIndex) =>
        currentIndex === nextIndex ? currentIndex : nextIndex,
      );
    };

    const schedulePickActiveStation = () => {
      if (frameId !== null) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        pickActiveStation();
      });
    };

    pickActiveStation();
    window.addEventListener("scroll", schedulePickActiveStation, {
      passive: true,
    });
    window.addEventListener("resize", schedulePickActiveStation);
    window.visualViewport?.addEventListener(
      "resize",
      schedulePickActiveStation,
    );
    window.visualViewport?.addEventListener(
      "scroll",
      schedulePickActiveStation,
    );
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        schedulePickActiveStation();
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      for (const itemRef of itemRefs.current) {
        if (itemRef) {
          resizeObserver.observe(itemRef);
        }
      }

      for (const triggerRef of triggerRefs.current) {
        if (triggerRef) {
          resizeObserver.observe(triggerRef);
        }
      }
    }

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", schedulePickActiveStation);
      window.removeEventListener("resize", schedulePickActiveStation);
      window.visualViewport?.removeEventListener(
        "resize",
        schedulePickActiveStation,
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        schedulePickActiveStation,
      );
    };
  }, [hoverEnabled, metrics, stations]);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-[32px]">
      {debugEnabled && !hoverEnabled && debugAnchorY !== null ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 z-[70] border-t border-amber-300/70"
          style={{ top: debugAnchorY }}
        />
      ) : null}
      {debugEnabled ? (
        <div className="pointer-events-none fixed right-3 top-3 z-[80] rounded-md border border-amber-200/30 bg-black/80 px-3 py-2 font-mono text-[11px] leading-relaxed text-amber-100 shadow-[0_8px_24px_rgba(0,0,0,0.28)] backdrop-blur-sm">
          <div>{`timelineDebug=1`}</div>
          <div>{`mode: ${hoverEnabled ? "hover" : "scroll"}`}</div>
          <div>{`active: ${activeTimeframeIndex === null ? "none" : activeTimeframeIndex + 1}`}</div>
          <div>
            {`anchor: ${debugAnchorY === null ? "n/a" : `${Math.round(debugAnchorY)}px`}`}
          </div>
        </div>
      ) : null}
      {graphHeight > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-0 rounded-full"
          style={{
            right: graphWidth * 0.5 - 20,
            width: 40,
            height: graphHeight,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.025) 18%, rgba(255,255,255,0.055) 52%, rgba(255,255,255,0.015))",
            filter: "blur(16px)",
            opacity: 0.28,
          }}
        />
      )}
      {graphHeight > 0 && (
        <TimelineHighlightShader
          width={graphWidth}
          height={graphHeight}
          activePoints={activeDurationGeometry?.points ?? null}
        />
      )}
      {graphHeight > 0 && (
        <svg
          className="absolute right-0 top-0 z-10 overflow-visible"
          width={graphWidth}
          height={graphHeight}
          aria-hidden="true"
        >
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {railPath ? (
              <>
                <motion.path
                  d={railPath}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  pointerEvents="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    delay: ROOT_DRAW_DELAY,
                    duration: ROOT_DRAW_DURATION,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
                <motion.path
                  d={railPath}
                  stroke={LINE_COLOR}
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  pointerEvents="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    delay: ROOT_DRAW_DELAY,
                    duration: ROOT_DRAW_DURATION,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              </>
            ) : null}
            {stations.map(({ index }) => {
              const geometry = durationGeometries[index];
              if (!geometry?.path) {
                return null;
              }

              const path = pointsToPath([...geometry.points].reverse());

              return (
                <g key={`duration-${index}`}>
                  <motion.path
                    d={path}
                    stroke={DURATION_COLOR}
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    pointerEvents="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                      delay:
                        stationDotStart +
                        index * STATION_STAGGER +
                        index * BRANCH_STAGGER,
                      duration: BRANCH_DRAW_DURATION,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                  <path
                    d={geometry.path}
                    stroke="transparent"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    pointerEvents="stroke"
                    onPointerEnter={() => activateTimeframe(index)}
                    onPointerLeave={() => deactivateTimeframe(index)}
                  />
                </g>
              );
            })}
          </motion.g>
        </svg>
      )}

      {stations.map(({ child, index, layout }) =>
        (() => {
          const hasTimeframe = durationGeometries[index]?.points.length > 1;

          return (
            <div
              key={child.key ?? index}
              className="relative"
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
            >
              {debugEnabled ? (
                <div
                  className={cn(
                    "pointer-events-none absolute -left-2 top-0 z-30 -translate-x-full rounded border px-1.5 py-0.5 font-mono text-[10px] leading-none sm:-left-3",
                    activeTimeframeIndex === index
                      ? "border-amber-300/70 bg-amber-300/15 text-amber-100"
                      : "border-white/15 bg-black/40 text-white/45",
                  )}
                >
                  {`#${index + 1}${activeTimeframeIndex === index ? " active" : ""}`}
                </div>
              ) : null}
              {cloneElement(child, {
                timelinePadding,
                timelineNodeOffset: graphWidth - laneXFor(layout.lane),
                timelineNodeY: Math.max(
                  (metrics[index]?.height ?? NODE_OFFSET_Y) - NODE_END_INSET,
                  NODE_OFFSET_Y,
                ),
                hideTimelinePoint: hideStationPoints,
                hoverEnabled,
                dotDelay: stationDotStart + index * STATION_STAGGER,
                timelineTriggerRef: (node: HTMLDivElement | null) => {
                  triggerRefs.current[index] = node;
                },
                onTimeframeEnter: hasTimeframe
                  ? () => activateTimeframe(index)
                  : undefined,
                onTimeframeLeave: hasTimeframe
                  ? () => deactivateTimeframe(index)
                  : undefined,
                onMarkerEnter: hasTimeframe
                  ? () => activateTimeframe(index)
                  : undefined,
                onMarkerLeave: hasTimeframe
                  ? () => deactivateTimeframe(index)
                  : undefined,
                timeframeActive: activeTimeframeIndex === index,
              })}
            </div>
          );
        })(),
      )}
    </div>
  );
}
