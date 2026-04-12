"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { ExternalLink } from "../ui/Link";

interface StationInlineContextValue {
  activePointId: string | null;
  hoverEnabled: boolean;
  registerPoint: (
    id: string,
    node: HTMLElement | null,
    shape?: "circle" | "diamond",
  ) => void;
  unregisterPoint: (id: string) => void;
  setActivePointId: (id: string | null) => void;
}

export const StationInlineContext =
  createContext<StationInlineContextValue | null>(null);

export interface InlineStationLinkProps {
  children: ReactNode;
  href: string;
  pointId: string;
  pointShape?: "circle" | "diamond";
}

export function InlineStationLink({
  children,
  href,
  pointId,
  pointShape = "diamond",
}: InlineStationLinkProps) {
  const context = useContext(StationInlineContext);
  const localRef = useRef<HTMLElement | null>(null);
  const registerPoint = context?.registerPoint;
  const unregisterPoint = context?.unregisterPoint;
  const setActivePointId = context?.setActivePointId;
  const hoverEnabled = context?.hoverEnabled ?? true;
  const active = context?.activePointId === pointId;

  const setRef = useCallback((node: HTMLElement | null) => {
    localRef.current = node;
  }, []);

  useEffect(() => {
    registerPoint?.(pointId, localRef.current, pointShape);

    return () => {
      unregisterPoint?.(pointId);
    };
  }, [pointId, pointShape, registerPoint, unregisterPoint]);

  return (
    <ExternalLink
      href={href}
      ref={setRef}
      active={active}
      className="px-1"
      onPointerEnter={
        hoverEnabled ? () => setActivePointId?.(pointId) : undefined
      }
      onPointerLeave={hoverEnabled ? () => setActivePointId?.(null) : undefined}
      onFocus={() => setActivePointId?.(pointId)}
      onBlur={() => setActivePointId?.(null)}
    >
      {children}
    </ExternalLink>
  );
}
