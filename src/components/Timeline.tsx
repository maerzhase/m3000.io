"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface TimelineProps {
  children: ReactNode;
}

export function Timeline({ children }: TimelineProps) {
  return (
    <div className="relative flex flex-col gap-[32px]">
      <motion.div
        className="absolute left-[3px] top-0 bottom-0 w-px bg-gray-700 origin-top"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
      {children}
    </div>
  );
}
