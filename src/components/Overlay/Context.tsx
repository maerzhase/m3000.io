"use client";
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from "motion/react";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type TriggerPoint = { x: number; y: number };

type OverlayContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  id: string | undefined;
  setId: (id: string) => void;
  setTriggerPoint: (point: TriggerPoint) => void;
};

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function useOverlay() {
  const context = useContext(OverlayContext);
  if (!context) throw new Error("useOverlay must be used within an OverlayProvider");
  return context;
}

interface OverlayProviderProps {
  children: ReactNode;
  content: Record<string, ReactNode>;
}

export function OverlayProvider({ children, content }: OverlayProviderProps) {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<string | undefined>(undefined);
  const [triggerPoint, setTriggerPoint] = useState<TriggerPoint>({ x: 0, y: 0 });
  const viewportWidth = typeof window === "undefined" ? 0 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 0 : window.innerHeight;

  // Lock body scroll while open so the exit target doesn't drift
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Pixel offset from viewport centre → where the animation originates
  const originX = triggerPoint.x - viewportWidth / 2;
  const originY = triggerPoint.y - viewportHeight / 2;

  return (
    <MotionConfig transition={{ type: "spring", stiffness: 280, damping: 26 }}>
      <LayoutGroup>
        <OverlayContext.Provider value={{ open, setOpen, id, setId, setTriggerPoint }}>
          {/* Always mounted — scroll position never lost */}
          <motion.div
            animate={{ opacity: open ? 0 : 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ pointerEvents: open ? "none" : "auto" }}
          >
            {children}
          </motion.div>

          {/* Backdrop — full-screen hit area, click outside closes the overlay */}
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={() => setOpen(false)}
              />
            )}
          </AnimatePresence>

          {/*
            Centering shell: fixed, CSS-only centering — no Framer Motion transforms here.
            The animated child uses x/y offsets relative to this centred origin,
            so x:0 y:0 = viewport centre, and x:originX y:originY = trigger position.
            Sits above the backdrop (later in DOM = higher stacking order at same z-index).
          */}
          <div className="fixed z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-3rem)] sm:w-[calc(800px-6rem)] pointer-events-none">
            <AnimatePresence>
              {open && (
                <motion.div
                  className="pointer-events-auto w-full min-h-[300px] max-h-[80vh] overflow-y-auto bg-gray-900/80 border border-gray-800 rounded-sm p-6 shadow-xl"
                  initial={{ x: originX, y: originY, scale: 0.04, opacity: 0 }}
                  animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  exit={{ x: originX, y: originY, scale: 0.04, opacity: 0 }}
                >
                  {id && content[id] ? content[id] : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </OverlayContext.Provider>
      </LayoutGroup>
    </MotionConfig>
  );
}
