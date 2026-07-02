"use client";

import { useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { HeroSceneGate } from "./hero-scene-gate";
import { EntranceMonogram } from "./entrance-monogram";

export function IntroScreen() {
  const { introVisible, dismissIntro } = useStore();
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
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 900px 700px at 72% 50%, rgba(196,164,105,0.05), transparent 60%)",
            }}
          />

          <HeroSceneGate />

          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, #0a0906 0%, rgba(10,9,6,0.6) 42%, transparent 70%)",
            }}
          />

          <EntranceMonogram />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
