"use client";

import * as React from "react";

export interface ShaderHighlightPayload {
  id: string;
  rects: ShaderHighlightRect[];
  snap?: boolean;
}

export interface ShaderHighlightPoint {
  x: number;
  y: number;
}

export interface ShaderPathHighlightPayload {
  id: string;
  points: ShaderHighlightPoint[];
  width?: number;
}

export interface ShaderHighlightRect {
  centerX: number;
  centerY: number;
  halfWidth: number;
  halfHeight: number;
  radius: number;
}

export type ShaderHighlightPadding =
  | number
  | {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
      x?: number;
      y?: number;
    };

export interface ShaderHighlightController {
  activate: (payload: ShaderHighlightPayload) => void;
  update: (payload: ShaderHighlightPayload) => void;
  deactivate: (id: string) => void;
  activatePath: (payload: ShaderPathHighlightPayload) => void;
  updatePath: (payload: ShaderPathHighlightPayload) => void;
  deactivatePath: (id: string) => void;
}

const ShaderHighlightContext =
  React.createContext<ShaderHighlightController | null>(null);

export function ShaderHighlightProvider({
  controller,
  children,
}: {
  controller: ShaderHighlightController;
  children: React.ReactNode;
}) {
  return (
    <ShaderHighlightContext.Provider value={controller}>
      {children}
    </ShaderHighlightContext.Provider>
  );
}

export function useShaderHighlightController() {
  return React.useContext(ShaderHighlightContext);
}

type ShaderHighlightProps = {
  children: React.ReactElement;
  disabled?: boolean;
  active?: boolean;
  padding?: ShaderHighlightPadding;
  radius?: number;
};

function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(value);
        continue;
      }
      if (ref) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    }
  };
}

function composeEventHandlers<E>(
  theirHandler: ((event: E) => void) | undefined,
  ourHandler: (event: E) => void,
) {
  return (event: E) => {
    theirHandler?.(event);
    ourHandler(event);
  };
}

function resolvePadding(padding: ShaderHighlightPadding) {
  if (typeof padding === "number") {
    return {
      top: padding,
      right: padding,
      bottom: padding,
      left: padding,
    };
  }

  const x = padding.x ?? 0;
  const y = padding.y ?? 0;

  return {
    top: padding.top ?? y,
    right: padding.right ?? x,
    bottom: padding.bottom ?? y,
    left: padding.left ?? x,
  };
}

function normalizeRect(
  rect: DOMRect,
  padding: ShaderHighlightPadding,
  radius: number,
): ShaderHighlightRect {
  const viewportWidth = window.innerWidth || 1;
  const viewportHeight = window.innerHeight || 1;
  const minViewport = Math.max(1, Math.min(viewportWidth, viewportHeight));
  const inset = resolvePadding(padding);
  const left = rect.left - inset.left;
  const top = rect.top - inset.top;
  const width = rect.width + inset.left + inset.right;
  const height = rect.height + inset.top + inset.bottom;

  return {
    centerX: (left + width * 0.5) / viewportWidth,
    centerY: 1 - (top + height * 0.5) / viewportHeight,
    halfWidth: width / (2 * viewportWidth),
    halfHeight: height / (2 * viewportHeight),
    radius: radius / minViewport,
  };
}

function getNormalizedRects(
  element: HTMLElement,
  padding: ShaderHighlightPadding,
  radius: number,
): ShaderHighlightRect[] {
  const rectList = Array.from(element.getClientRects())
    .filter((rect) => rect.width > 0 && rect.height > 0)
    .map((rect) => normalizeRect(rect, padding, radius));

  if (rectList.length > 0) {
    return rectList.slice(0, 4);
  }

  return [normalizeRect(element.getBoundingClientRect(), padding, radius)];
}

export function ShaderHighlight({
  children,
  disabled = false,
  active: forcedActive,
  padding = 2,
  radius = 16,
}: ShaderHighlightProps) {
  const controller = React.useContext(ShaderHighlightContext);
  const id = React.useId();
  const elementRef = React.useRef<HTMLElement | null>(null);
  const [active, setActive] = React.useState(false);
  const activeRef = React.useRef(false);

  const updateBounds = React.useCallback(() => {
    const element = elementRef.current;
    if (!controller || !element || !activeRef.current) return;
    controller.update({
      id,
      rects: getNormalizedRects(element, padding, radius),
      snap: true,
    });
  }, [controller, id, padding, radius]);

  const activate = React.useCallback(() => {
    const element = elementRef.current;
    if (!controller || !element) return;
    activeRef.current = true;
    controller.activate({
      id,
      rects: getNormalizedRects(element, padding, radius),
    });
    setActive(true);
  }, [controller, id, padding, radius]);

  const deactivate = React.useCallback(() => {
    if (!controller) return;
    activeRef.current = false;
    controller.deactivate(id);
    setActive(false);
  }, [controller, id]);

  React.useEffect(() => {
    if (!active) return;

    const handleViewportChange = () => updateBounds();
    window.addEventListener("scroll", handleViewportChange, { passive: true });
    window.addEventListener("resize", handleViewportChange);

    const observer =
      typeof ResizeObserver === "undefined" || !elementRef.current
        ? null
        : new ResizeObserver(() => updateBounds());
    if (observer && elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      window.removeEventListener("scroll", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
      observer?.disconnect();
    };
  }, [active, updateBounds]);

  React.useEffect(() => deactivate, [deactivate]);

  React.useEffect(() => {
    if (forcedActive === undefined) {
      return;
    }

    if (forcedActive) {
      activate();
      return;
    }

    deactivate();
  }, [activate, deactivate, forcedActive]);

  if (disabled || !controller) {
    return children;
  }

  const child = React.Children.toArray(children)[0];
  if (React.Children.count(children) !== 1 || !React.isValidElement(child)) {
    return children;
  }

  const element = child as React.ReactElement<
    React.HTMLAttributes<HTMLElement> & {
      ref?: React.Ref<HTMLElement>;
    }
  >;

  return React.cloneElement(element, {
    ref: mergeRefs(element.props.ref, (node: HTMLElement | null) => {
      elementRef.current = node;
    }),
    onPointerEnter: composeEventHandlers(
      element.props.onPointerEnter,
      activate as (event: React.PointerEvent<HTMLElement>) => void,
    ),
    onPointerLeave: composeEventHandlers(
      element.props.onPointerLeave,
      deactivate as (event: React.PointerEvent<HTMLElement>) => void,
    ),
    onFocus: composeEventHandlers(
      element.props.onFocus,
      activate as (event: React.FocusEvent<HTMLElement>) => void,
    ),
    onBlur: composeEventHandlers(
      element.props.onBlur,
      deactivate as (event: React.FocusEvent<HTMLElement>) => void,
    ),
  });
}
