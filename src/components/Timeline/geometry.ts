import type { ReactNode } from "react";
import {
  GRAPH_INSET,
  LANE_GAP,
  NODE_END_INSET,
  NODE_OFFSET_Y,
} from "./constants";
import type { Point, StationMetrics } from "./types";

export function parseYearValue(value: ReactNode, fallback: number) {
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

export function continueCurve(
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

export function laneXFor(lane: number) {
  return GRAPH_INSET + lane * LANE_GAP + 3.5;
}

export function stationNodeY(metric: StationMetrics) {
  return (
    metric.top + Math.max(metric.height - NODE_END_INSET, NODE_OFFSET_Y) + 4.5
  );
}

export function cubicPoint(
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

export function distance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function appendCurvePoints(
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

export function buildLengths(points: Point[]) {
  const lengths = [0];

  for (let index = 1; index < points.length; index += 1) {
    lengths.push(
      lengths[index - 1] + distance(points[index - 1], points[index]),
    );
  }

  return lengths;
}

export function interpolatePoint(a: Point, b: Point, ratio: number) {
  return {
    x: a.x + (b.x - a.x) * ratio,
    y: a.y + (b.y - a.y) * ratio,
  };
}

export function slicePoints(
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

export function trimPointsEnd(points: Point[], trimLength: number) {
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

export function offsetPoints(points: Point[], offset: number): Point[] {
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

export function pointsToPath(points: Point[]) {
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

export function samplePoints(points: Point[], maxPoints: number) {
  if (points.length <= maxPoints) {
    return points;
  }

  return Array.from({ length: maxPoints }, (_, index) => {
    const ratio = maxPoints === 1 ? 0 : index / (maxPoints - 1);
    const pointIndex = Math.round(ratio * (points.length - 1));
    return points[pointIndex] ?? points[points.length - 1];
  });
}
