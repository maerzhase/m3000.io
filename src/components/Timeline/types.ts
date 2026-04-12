import type { ReactElement, ReactNode } from "react";
import type { StationProps } from "./Station";

export interface TimelineProps {
  children: ReactNode;
  hideStationPoints?: boolean;
}

export interface StationMetrics {
  top: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface RouteInterval {
  yearStart: number;
  yearEnd: number;
  points: Point[];
  lengths: number[];
  totalLength: number;
}

export interface DurationGeometry {
  path: string;
  points: Point[];
}

export interface TimelineStationData {
  child: ReactElement<StationProps>;
  index: number;
  startYear: number;
  endYear: number;
  layout: {
    index: number;
    lane: number;
  };
}
