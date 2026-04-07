"use client";
import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import { useOverlay } from "./Context";

type OverlayTriggerProps = Omit<HTMLMotionProps<"button">, "onClick"> & {
  id: string;
  variant?: "button" | "plain";
};

export function OverlayTrigger({
  children,
  id,
  variant = "button",
  ...props
}: OverlayTriggerProps) {
  const { open, id: activeId, setOpen, setId, setTriggerPoint } = useOverlay();
  const isActive = open && activeId === id;

  return (
    <motion.button
      className={
        variant === "button"
          ? "text-1 h-[20px] bg-gray-900 px-2 py-0.5 border border-gray-800 rounded-sm inline-block align-baseline leading-1"
          : "inline-flex cursor-pointer items-baseline bg-transparent border-0 p-0 align-baseline leading-inherit"
      }
      animate={{ opacity: isActive ? 0 : 1 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => {
        // Capture the exact viewport position of the clicked element right now
        const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
        setTriggerPoint({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
        setOpen(true);
        setId(id);
      }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
