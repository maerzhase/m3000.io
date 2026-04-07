"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Text } from "./ui/Text";

interface StationProps {
  year: ReactNode;
  name?: ReactNode;
  title: ReactNode;
  children: ReactNode;
  variant?: "plain" | "timeline";
  current?: boolean;
  dotIndex?: number;
}

export function Station({
  year,
  title,
  name,
  children,
  variant = "plain",
  current = false,
  dotIndex = 0,
}: StationProps) {
  const isTimeline = variant === "timeline";

  return (
    <div className={cn(isTimeline && "relative pl-6")}>
      {isTimeline && (
        <>
          {current && (
            <span className="absolute left-0 top-[11px] size-[7px] rounded-full bg-primary animate-ping opacity-30" />
          )}
          <motion.div
            className={cn(
              "absolute left-0 top-[11px] size-[7px] rounded-full",
              current ? "bg-primary" : "bg-gray-600",
            )}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: dotIndex * 0.15,
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
          />
        </>
      )}
      <div className="flex gap-2 items-baseline mb-2 w-full">
        <Text weight="semibold" size="3">
          {title}
        </Text>
        <Text>{name}</Text>
        <Text size="1" color="dim" className="ml-auto">
          {year}
        </Text>
      </div>
      {children}
    </div>
  );
}
