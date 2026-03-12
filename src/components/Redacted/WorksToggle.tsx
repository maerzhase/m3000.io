"use client";

import { motion } from "motion/react";
import { useRedacted } from "./Context";

export function WorksToggle() {
  const { redacted, toggle } = useRedacted();

  return (
    <motion.button
      onClick={toggle}
      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xs text-white text-sm font-medium backdrop-blur-sm transition-colors"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {redacted ? "Show Bio" : "Works"}
    </motion.button>
  );
}
