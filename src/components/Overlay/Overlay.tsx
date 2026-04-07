import { HTMLMotionProps, motion } from "motion/react";
import type { ComponentProps } from "react";

type OverlayComponentProps = ComponentProps<"div">;

function OverlayComponent({ ref, children, ...props }: OverlayComponentProps) {
  return (
    <div
      className="fixed z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-h-[300px] max-h-[80vh] overflow-y-auto w-[calc(100%-3rem)] sm:w-[calc(800px-6rem)] bg-gray-900/80 border border-gray-800 rounded-sm p-6 shadow-xl"
      ref={ref}
      {...props}
    >
      {children}
    </div>
  );
}

export const Overlay = motion.create(OverlayComponent);
