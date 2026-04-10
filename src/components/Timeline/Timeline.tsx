"use client";

import { motion } from "motion/react";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useShaderHighlightController } from "../ShaderHighlight";
import {
  DURATION_COLOR,
  GRAPH_INSET,
  GRAPH_MARGIN_RIGHT,
  LANE_GAP,
  LINE_COLOR,
  MAX_SHADER_PATH_POINTS,
  NODE_END_INSET,
  NODE_OFFSET_Y,
  TIMEFRAME_HIGHLIGHT_WIDTH,
} from "./constants";
import { laneXFor, parseYearValue, samplePoints } from "./geometry";
import {
  buildDurationGeometries,
  buildRailPath,
  buildRouteIntervals,
} from "./graph";
import type {
  StationMetrics,
  TimelineProps,
  TimelineStationData,
} from "./types";

export function Timeline({ children }: TimelineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [metrics, setMetrics] = useState<StationMetrics[]>([]);
  const [activeTimeframeIndex, setActiveTimeframeIndex] = useState<
    number | null
  >(null);
  const shaderHighlightController = useShaderHighlightController();

  const activateTimeframe = (index: number) => setActiveTimeframeIndex(index);
  const deactivateTimeframe = (index: number) =>
    setActiveTimeframeIndex((currentIndex) =>
      currentIndex === index ? null : currentIndex,
    );

  const stations = useMemo(() => {
    const childArray = Children.toArray(children).filter(
      isValidElement,
    ) as TimelineStationData["child"][];

    return childArray.map((child, index) => {
      const fallbackEndYear = child.props.current
        ? new Date().getFullYear()
        : parseYearValue(child.props.year, new Date().getFullYear());

      return {
        child,
        index,
        startYear:
          child.props.startYear ??
          parseYearValue(child.props.year, fallbackEndYear),
        endYear: child.props.endYear ?? fallbackEndYear,
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

  useEffect(() => {
    if (
      activeTimeframeIndex === null ||
      !shaderHighlightController ||
      !containerRef.current
    ) {
      return;
    }

    const durationGeometry = durationGeometries[activeTimeframeIndex];
    if (!durationGeometry || durationGeometry.points.length < 2) {
      return;
    }

    const highlightId = `timeframe-${activeTimeframeIndex}`;

    const publish = (method: "activatePath" | "updatePath") => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) {
        return;
      }

      const viewportWidth = window.innerWidth || 1;
      const viewportHeight = window.innerHeight || 1;
      const graphLeft = containerRect.right - graphWidth;
      const graphTop = containerRect.top;

      shaderHighlightController[method]({
        id: highlightId,
        width: TIMEFRAME_HIGHLIGHT_WIDTH,
        points: samplePoints(durationGeometry.points, MAX_SHADER_PATH_POINTS)
          .filter((point, index, points) => {
            if (index === 0) {
              return true;
            }

            const previousPoint = points[index - 1];
            return (
              Math.abs(point.x - previousPoint.x) > 0.05 ||
              Math.abs(point.y - previousPoint.y) > 0.05
            );
          })
          .map((point) => ({
            x: (graphLeft + point.x) / viewportWidth,
            y: 1 - (graphTop + point.y) / viewportHeight,
          })),
      });
    };

    publish("activatePath");

    const handleViewportChange = () => publish("updatePath");
    window.addEventListener("scroll", handleViewportChange, { passive: true });
    window.addEventListener("resize", handleViewportChange);

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(handleViewportChange);
    observer?.observe(containerRef.current);

    return () => {
      window.removeEventListener("scroll", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
      observer?.disconnect();
      shaderHighlightController.deactivatePath(highlightId);
    };
  }, [
    activeTimeframeIndex,
    durationGeometries,
    graphWidth,
    shaderHighlightController,
  ]);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-[32px]">
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
                <path
                  d={railPath}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  pointerEvents="none"
                />
                <path
                  d={railPath}
                  stroke={LINE_COLOR}
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  pointerEvents="none"
                />
              </>
            ) : null}
            {stations.map(({ index }) => {
              const path = durationGeometries[index]?.path;
              if (!path) {
                return null;
              }

              return (
                <g key={`duration-${index}`}>
                  <path
                    d={path}
                    stroke={DURATION_COLOR}
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    pointerEvents="none"
                  />
                  <path
                    d={path}
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

      {stations.map(({ child, index, layout }) => (
        <div
          key={child.key ?? index}
          ref={(node) => {
            itemRefs.current[index] = node;
          }}
        >
          {cloneElement(child, {
            timelinePadding,
            timelineNodeOffset: graphWidth - laneXFor(layout.lane),
            timelineNodeY: Math.max(
              (metrics[index]?.height ?? NODE_OFFSET_Y) - NODE_END_INSET,
              NODE_OFFSET_Y,
            ),
            onTimeframeEnter: () => activateTimeframe(index),
            onTimeframeLeave: () => deactivateTimeframe(index),
            onMarkerEnter: () => activateTimeframe(index),
            onMarkerLeave: () => deactivateTimeframe(index),
            timeframeActive: activeTimeframeIndex === index,
          })}
        </div>
      ))}
    </div>
  );
}
