"use client";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  MotionConfig,
} from "motion/react";
import { createContext, type ReactNode, useContext, useState } from "react";
import { Text } from "../ui/Text";
import { Overlay } from "./Overlay";

type OverlayContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string | undefined;
  setId: (id: string) => void;
};

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function useOverlay() {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error("useOverlay must be used within an OverlayProvider");
  }
  return context;
}

export function OverlayProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<string | undefined>(undefined);
  return (
    <MotionConfig transition={{ type: "spring" }}>
      <LayoutGroup>
        <OverlayContext.Provider value={{ open, setOpen, id, setId }}>
          <AnimatePresence>
            {!open && (
              <motion.div
                key="children"
                layoutScroll
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                {children}
              </motion.div>
            )}
            {open && (
              <Overlay
                layoutId={id}
                layoutScroll
                transition={{ duration: 0.5, type: "spring" }}
                onClick={() => setOpen(false)}
                layout
              >
                <Text>blblablabla</Text>
              </Overlay>
            )}
          </AnimatePresence>
        </OverlayContext.Provider>
      </LayoutGroup>
    </MotionConfig>
  );
}
