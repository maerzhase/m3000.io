"use client";

import { motion } from "motion/react";
import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useShaderHighlightController } from "./ShaderHighlight";

interface TimelineProps {
  children: ReactNode;
}

interface TimelineStationProps {
  variant?: "plain" | "timeline";
  startYear?: number;
  endYear?: number;
  year?: ReactNode;
  current?: boolean;
  dotIndex?: number;
  timelinePadding?: number;
  timelineNodeOffset?: number;
  timelineNodeY?: number;
  timeframeActive?: boolean;
  onTimeframeEnter?: () => void;
  onTimeframeLeave?: () => void;
  onMarkerEnter?: () => void;
  onMarkerLeave?: () => void;
}

interface StationMetrics {
  top: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface RouteInterval {
  yearStart: number;
  yearEnd: number;
  points: Point[];
  lengths: number[];
  totalLength: number;
}

interface DurationGeometry {
  path: string;
  points: Point[];
}

const NODE_OFFSET_Y = 14;
const NODE_END_INSET = 16;
const LANE_GAP = 20;
const GRAPH_INSET = 8;
const GRAPH_MARGIN_RIGHT = 20;
const LINE_COLOR = "rgba(160, 160, 168, 0.68)";
const DURATION_OFFSET = 7;
const DURATION_COLOR = "rgba(228, 228, 232, 0.34)";
const DURATION_BRANCH_LEAD = 22;
const MAX_SHADER_PATH_POINTS = 24;
const TIMEFRAME_HIGHLIGHT_WIDTH = 5;

function parseYearValue(value: ReactNode, fallback: number) {
  if (typeof value !== "string") {
    return fallback;
  }

  const matches = value.match(/\d{4}/g);
  if (!matches?.length) {
    return fallback;
  }

  const [start, end] = matches.map(Number);
  return end ?? start ?? fallback;
}

function continueCurve(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  sameLane: boolean,
) {
  if (sameLane) {
    return `L ${endX} ${endY}`;
  }

  const deltaY = Math.max(endY - startY, 24);
  const controlOffset = Math.min(deltaY * 0.45, 40);

  return [
    `C ${startX} ${startY + controlOffset}`,
    `${endX} ${endY - controlOffset}`,
    `${endX} ${endY}`,
  ].join(" ");
}

function laneXFor(lane: number) {
  return GRAPH_INSET + lane * LANE_GAP + 3.5;
}

function stationNodeY(metric: StationMetrics) {
  return (
    metric.top + Math.max(metric.height - NODE_END_INSET, NODE_OFFSET_Y) + 4.5
  );
}

function cubicPoint(
  start: Point,
  control1: Point,
  control2: Point,
  end: Point,
  t: number,
) {
  const inverse = 1 - t;
  const x =
    inverse ** 3 * start.x +
    3 * inverse ** 2 * t * control1.x +
    3 * inverse * t ** 2 * control2.x +
    t ** 3 * end.x;
  const y =
    inverse ** 3 * start.y +
    3 * inverse ** 2 * t * control1.y +
    3 * inverse * t ** 2 * control2.y +
    t ** 3 * end.y;

  return { x, y };
}

function appendCurvePoints(
  points: Point[],
  end: Point,
  sameLane: boolean,
  sampleCount = 7,
) {
  if (points.length === 0) {
    return points;
  }

  const start = points[points.length - 1];
  if (distance(start, end) <= 0.1) {
    points[points.length - 1] = end;
    return points;
  }

  if (sameLane) {
    points.push(end);
    return points;
  }

  const deltaY = Math.max(end.y - start.y, 24);
  const controlOffset = Math.min(deltaY * 0.45, 40);
  const control1 = {
    x: start.x,
    y: start.y + controlOffset,
  };
  const control2 = {
    x: end.x,
    y: end.y - controlOffset,
  };

  points.push(
    ...Array.from({ length: sampleCount }, (_, pointIndex) =>
      cubicPoint(
        start,
        control1,
        control2,
        end,
        (pointIndex + 1) / sampleCount,
      ),
    ),
  );

  return points;
}

function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function buildLengths(points: Point[]) {
  const lengths = [0];

  for (let index = 1; index < points.length; index += 1) {
    lengths.push(
      lengths[index - 1] + distance(points[index - 1], points[index]),
    );
  }

  return lengths;
}

function interpolatePoint(a: Point, b: Point, ratio: number) {
  return {
    x: a.x + (b.x - a.x) * ratio,
    y: a.y + (b.y - a.y) * ratio,
  };
}

function slicePoints(
  points: Point[],
  lengths: number[],
  startLength: number,
  endLength: number,
) {
  if (points.length === 0) {
    return [];
  }

  const nextPoints: Point[] = [];

  for (let index = 1; index < points.length; index += 1) {
    const segmentStartLength = lengths[index - 1];
    const segmentEndLength = lengths[index];

    if (segmentEndLength < startLength || segmentStartLength > endLength) {
      continue;
    }

    const startRatio =
      segmentEndLength === segmentStartLength
        ? 0
        : Math.max(
            0,
            (startLength - segmentStartLength) /
              (segmentEndLength - segmentStartLength),
          );
    const endRatio =
      segmentEndLength === segmentStartLength
        ? 1
        : Math.min(
            1,
            (endLength - segmentStartLength) /
              (segmentEndLength - segmentStartLength),
          );

    const segmentStartPoint =
      startRatio <= 0
        ? points[index - 1]
        : interpolatePoint(points[index - 1], points[index], startRatio);
    const segmentEndPoint =
      endRatio >= 1
        ? points[index]
        : interpolatePoint(points[index - 1], points[index], endRatio);

    if (nextPoints.length === 0) {
      nextPoints.push(segmentStartPoint);
    } else {
      const lastPoint = nextPoints[nextPoints.length - 1];
      if (distance(lastPoint, segmentStartPoint) > 0.1) {
        nextPoints.push(segmentStartPoint);
      }
    }

    if (distance(nextPoints[nextPoints.length - 1], segmentEndPoint) > 0.1) {
      nextPoints.push(segmentEndPoint);
    }
  }

  return nextPoints;
}

function trimPointsEnd(points: Point[], trimLength: number) {
  if (points.length <= 1 || trimLength <= 0) {
    return points.slice();
  }

  const lengths = buildLengths(points);
  const totalLength = lengths[lengths.length - 1] ?? 0;

  if (totalLength <= trimLength) {
    return [points[0]];
  }

  return slicePoints(points, lengths, 0, totalLength - trimLength);
}

function offsetPoints(points: Point[], offset: number): Point[] {
  return points.map((point, index) => {
    if (index === 0 || index === points.length - 1) {
      return { x: point.x + offset, y: point.y };
    }

    const prev = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return { x: point.x + offset, y: point.y };
    const tx = dx / len;
    const ty = dy / len;
    return { x: point.x + offset * ty, y: point.y - offset * tx };
  });
}

function pointsToPath(points: Point[]) {
  if (points.length === 0) {
    return "";
  }

  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");
}

function samplePoints(points: Point[], maxPoints: number) {
  if (points.length <= maxPoints) {
    return points;
  }

  return Array.from({ length: maxPoints }, (_, index) => {
    const ratio = maxPoints === 1 ? 0 : index / (maxPoints - 1);
    const pointIndex = Math.round(ratio * (points.length - 1));
    return points[pointIndex] ?? points[points.length - 1];
  });
}

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
    ) as Array<ReactElement<TimelineStationProps>>;

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
    });
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
    if (stations.length === 0 || metrics.length === 0) {
      return "";
    }

    const firstMetric = metrics[0];
    if (!firstMetric) {
      return "";
    }

    const segments: string[] = [
      `M ${laneXFor(stations[0].layout.lane)} ${firstMetric.top + NODE_OFFSET_Y}`,
      `L ${laneXFor(stations[0].layout.lane)} ${firstMetric.top + firstMetric.height}`,
    ];

    for (let index = 0; index < stations.length - 1; index += 1) {
      const station = stations[index];
      const nextStation = stations[index + 1];
      const metric = metrics[station.index];
      const nextMetric = metrics[nextStation.index];

      if (!metric || !nextMetric) {
        continue;
      }

      const startX = laneXFor(station.layout.lane);
      const startY = metric.top + metric.height;
      const endX = laneXFor(nextStation.layout.lane);
      const endY = nextMetric.top + NODE_OFFSET_Y;

      segments.push(
        continueCurve(
          startX,
          startY,
          endX,
          endY,
          station.layout.lane === nextStation.layout.lane,
        ),
      );
      segments.push(`L ${endX} ${nextMetric.top + nextMetric.height}`);
    }

    return segments.join(" ");
  }, [metrics, stations]);

  const routeIntervals = useMemo(() => {
    if (stations.length === 0 || metrics.length === 0) {
      return [] as RouteInterval[];
    }

    const firstMetric = metrics[0];
    if (!firstMetric) {
      return [] as RouteInterval[];
    }

    const maxEndYear = Math.max(...stations.map((station) => station.endYear));
    const intervals: RouteInterval[] = [
      {
        yearStart: maxEndYear,
        yearEnd: stations[0].startYear,
        points: [
          {
            x: laneXFor(stations[0].layout.lane),
            y: firstMetric.top + NODE_OFFSET_Y,
          },
          {
            x: laneXFor(stations[0].layout.lane),
            y: firstMetric.top + firstMetric.height,
          },
        ],
        lengths: [],
        totalLength: 0,
      },
    ];

    for (let index = 0; index < stations.length - 1; index += 1) {
      const station = stations[index];
      const nextStation = stations[index + 1];
      const metric = metrics[station.index];
      const nextMetric = metrics[nextStation.index];

      if (!metric || !nextMetric) {
        continue;
      }

      const start = {
        x: laneXFor(station.layout.lane),
        y: metric.top + metric.height,
      };
      const curveEnd = {
        x: laneXFor(nextStation.layout.lane),
        y: nextMetric.top + NODE_OFFSET_Y,
      };
      const curveDeltaY = Math.max(curveEnd.y - start.y, 24);
      const controlOffset = Math.min(curveDeltaY * 0.45, 40);
      const control1 = {
        x: start.x,
        y: start.y + controlOffset,
      };
      const control2 = {
        x: curveEnd.x,
        y: curveEnd.y - controlOffset,
      };
      const curvePoints = Array.from({ length: 9 }, (_, pointIndex) =>
        cubicPoint(start, control1, control2, curveEnd, pointIndex / 8),
      );
      const verticalEnd = {
        x: curveEnd.x,
        y: nextMetric.top + nextMetric.height,
      };
      const verticalPoints = Array.from({ length: 7 }, (_, pointIndex) =>
        interpolatePoint(curveEnd, verticalEnd, pointIndex / 6),
      );
      const points = [...curvePoints, ...verticalPoints.slice(1)];

      intervals.push({
        yearStart: station.startYear,
        yearEnd: nextStation.startYear,
        points,
        lengths: [],
        totalLength: 0,
      });
    }

    return intervals.map((interval) => {
      const lengths = buildLengths(interval.points);

      return {
        ...interval,
        lengths,
        totalLength: lengths[lengths.length - 1] ?? 0,
      };
    });
  }, [metrics, stations]);

  const durationGeometries = useMemo(() => {
    return stations.map((station) => {
      const metric = metrics[station.index];
      if (!metric) {
        return {
          path: "",
          points: [],
        } satisfies DurationGeometry;
      }

      const shiftedPoints: Point[] = [];
      const offset =
        station.layout.lane === 0 ? -DURATION_OFFSET : DURATION_OFFSET;

      for (const interval of routeIntervals) {
        if (
          station.endYear < interval.yearEnd ||
          station.startYear > interval.yearStart ||
          interval.totalLength === 0
        ) {
          continue;
        }

        const topYear = Math.min(interval.yearStart, station.endYear);
        const bottomYear = Math.max(interval.yearEnd, station.startYear);
        const yearSpan = interval.yearStart - interval.yearEnd;

        if (yearSpan <= 0) {
          continue;
        }

        const startLength =
          ((interval.yearStart - topYear) / yearSpan) * interval.totalLength;
        const endLength =
          ((interval.yearStart - bottomYear) / yearSpan) * interval.totalLength;
        const points = offsetPoints(
          slicePoints(
            interval.points,
            interval.lengths,
            startLength,
            endLength,
          ),
          offset,
        );

        if (points.length === 0) {
          continue;
        }

        if (
          shiftedPoints.length > 0 &&
          distance(shiftedPoints[shiftedPoints.length - 1], points[0]) <= 0.1
        ) {
          shiftedPoints.push(...points.slice(1));
        } else {
          shiftedPoints.push(...points);
        }
      }

      if (shiftedPoints.length > 0) {
        const trimmedPoints = trimPointsEnd(
          shiftedPoints,
          DURATION_BRANCH_LEAD,
        );
        shiftedPoints.splice(0, shiftedPoints.length, ...trimmedPoints);

        appendCurvePoints(
          shiftedPoints,
          {
            x: laneXFor(station.layout.lane),
            y: stationNodeY(metric),
          },
          false,
        );
      } else {
        shiftedPoints.push({
          x: laneXFor(station.layout.lane) + offset,
          y: stationNodeY(metric),
        });
      }

      return {
        path: pointsToPath(shiftedPoints),
        points: shiftedPoints,
      } satisfies DurationGeometry;
    });
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
