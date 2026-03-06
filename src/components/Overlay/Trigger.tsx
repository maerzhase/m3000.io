"use client";
import { type HTMLMotionProps, motion } from "motion/react";
import { useOverlay } from "./Context";

type OverlayTriggerProps = HTMLMotionProps<"button"> & { id: string };

export function OverlayTrigger({
  children,
  id,
  ...props
}: OverlayTriggerProps) {
  const { open, id: activeId, setOpen, setId } = useOverlay();
  const isActive = open && activeId === id;

  return (
    <motion.button
      layoutId={id}
      className="text-1 bg-gray-900 px-2 py-0.5 border border-gray-800 rounded-sm inline-block align-baseline leading-1"
      onClick={() => {
        setOpen(true);
        setId(id);
      }}
      transition={{ duration: 0.5, type: "spring" }}
      {...props}
    >
      <motion.span
        animate={{ opacity: isActive ? 0 : 1 }}
        transition={{ duration: 0.15 }}
      >
        {children}
      </motion.span>
    </motion.button>
  );
}
