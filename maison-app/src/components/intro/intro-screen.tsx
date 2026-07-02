"use client";

import { useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useStore } from "@/lib/store";
import { EntranceMonogram } from "./entrance-monogram";

const LiquidEther = dynamic(() => import("@/components/vendor/LiquidEther"), {
  ssr: false,
});

// Module-level, not inline — an inline array literal gets a new reference on
// every render, which re-triggers LiquidEther's setup effect (whose deps
// include `colors`) and tears down/rebuilds the whole WebGL sim each time.
const LIQUID_COLORS = ["#e3bd7e", "#b25a5a", "#5b87a6"];

export function IntroScreen() {
  // Selectors — this must not re-render (and tear down the WebGL scenes
  // inside it) on every mousemove-driven mousePos update elsewhere in the store.
  const introVisible = useStore((s) => s.introVisible);
  const dismissIntro = useStore((s) => s.dismissIntro);
  const downPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    downPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const dx = e.clientX - downPos.current.x;
      const dy = e.clientY - downPos.current.y;
      if (Math.hypot(dx, dy) <= 6) {
        dismissIntro();
      }
    },
    [dismissIntro]
  );

  return (
    <AnimatePresence>
      {introVisible && (
        <motion.div
          className="fixed inset-0 z-[100] cursor-pointer overflow-hidden bg-[#0a0906]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <div className="pointer-events-none absolute inset-0">
            <LiquidEther
              colors={LIQUID_COLORS}
              mouseForce={22}
              cursorSize={120}
              resolution={0.5}
              autoDemo
              autoSpeed={0.5}
              autoIntensity={2.8}
              autoResumeDelay={2400}
              autoRampDuration={0.8}
            />
          </div>

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 900px 700px at 72% 50%, rgba(196,164,105,0.09), transparent 60%)",
            }}
          />

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, rgba(10,9,6,0.55) 0%, rgba(10,9,6,0.22) 38%, transparent 68%)",
            }}
          />

          <EntranceMonogram />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
