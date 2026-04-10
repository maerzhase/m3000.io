import {
  DURATION_BRANCH_LEAD,
  DURATION_OFFSET,
  NODE_OFFSET_Y,
} from "./constants";
import {
  appendCurvePoints,
  buildLengths,
  continueCurve,
  cubicPoint,
  distance,
  interpolatePoint,
  laneXFor,
  offsetPoints,
  pointsToPath,
  slicePoints,
  stationNodeY,
  trimPointsEnd,
} from "./geometry";
import type {
  DurationGeometry,
  Point,
  RouteInterval,
  StationMetrics,
  TimelineStationData,
} from "./types";

export function buildRailPath(
  stations: TimelineStationData[],
  metrics: StationMetrics[],
) {
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
}

export function buildRouteIntervals(
  stations: TimelineStationData[],
  metrics: StationMetrics[],
) {
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
}

export function buildDurationGeometries(
  stations: TimelineStationData[],
  metrics: StationMetrics[],
  routeIntervals: RouteInterval[],
) {
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
        slicePoints(interval.points, interval.lengths, startLength, endLength),
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
      const trimmedPoints = trimPointsEnd(shiftedPoints, DURATION_BRANCH_LEAD);
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
}
