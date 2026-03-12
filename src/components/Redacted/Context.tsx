"use client";

import { MotionConfig } from "motion/react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

interface RedactedContextValue {
  redacted: boolean;
  /** Key that changes each toggle, used to generate fresh random delays */
  redactKey: number;
  toggle: () => void;
}

const RedactedContext = createContext<RedactedContextValue | null>(null);

export function useRedacted() {
  const context = useContext(RedactedContext);
  if (!context) {
    throw new Error("useRedacted must be used within a RedactedProvider");
  }
  return context;
}

export function RedactedProvider({ children }: { children: ReactNode }) {
  const [redacted, setRedacted] = useState(false);
  const [redactKey, setRedactKey] = useState(0);

  const toggle = useCallback(() => {
    setRedacted((prev) => !prev);
    setRedactKey((prev) => prev + 1);
  }, []);

  return (
    <RedactedContext.Provider value={{ redacted, redactKey, toggle }}>
      <MotionConfig
        transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
      >
        {children}
      </MotionConfig>
    </RedactedContext.Provider>
  );
}
