"use client";

import { useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";

export function IntroScreen() {
  const { introVisible, dismissIntro } = useStore();
  const downPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      downPos.current = { x: e.clientX, y: e.clientY };
    },
    []
  );

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
          className="fixed inset-0 z-[100] bg-[#0a0906]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          {/* Spline 3D scene */}
          <div className="absolute -inset-[3%] h-[106%] w-[106%]">
            <spline-viewer
              url="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              loading-anim-type="none"
              style={{ width: "100%", height: "100%" }}
            />
          </div>

          {/* Gradient veil */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, #100d09 0%, rgba(16,13,9,0.55) 38%, transparent 68%)",
            }}
          />

          {/* Copy */}
          <div className="pointer-events-none absolute left-[8%] top-1/2 z-5 max-w-[460px] -translate-y-1/2">
            <p className="mb-3.5 text-[10px] uppercase tracking-[3px] text-gold">
              Maison
            </p>
            <h1 className="mb-5 font-heading text-[50px] font-normal leading-[1.12] tracking-tight text-[#f7f2e6]">
              Kendi atölyene <em className="italic text-gold">gir.</em>
            </h1>
            <p className="animate-[hint-fade_2.6s_ease-in-out_infinite] text-[11px] uppercase tracking-[1.5px] text-muted">
              Sahneyi döndürmek için sürükle · girmek için herhangi bir yere
              dokun
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

