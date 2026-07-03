"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useStore } from "@/lib/store";

const PULL_THRESHOLD = 64;
const MAX_PULL = 96;
const RESISTANCE = 0.5;

// Native touch events rather than Framer's drag gesture — this needs to
// activate only when the page is already scrolled to the very top (so it
// doesn't fight normal scrolling everywhere else), which is simplest to
// gate by reading window.scrollY directly on each touchmove.
export function PullToRefresh() {
  const y = useMotionValue(0);
  const rotate = useTransform(y, [0, MAX_PULL], [0, 180]);
  const indicatorOpacity = useTransform(y, [0, 28], [0, 1]);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || refreshing) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
      pulling.current = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0 || window.scrollY > 0) {
        startY.current = null;
        pulling.current = false;
        y.set(0);
        return;
      }
      pulling.current = true;
      y.set(Math.min(dy * RESISTANCE, MAX_PULL));
    };

    const onTouchEnd = async () => {
      if (!pulling.current) {
        startY.current = null;
        return;
      }
      const pulled = y.get();
      pulling.current = false;
      startY.current = null;

      if (pulled >= PULL_THRESHOLD) {
        setRefreshing(true);
        animate(y, 52, { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] });
        try {
          await useStore.persist.rehydrate();
        } finally {
          setRefreshing(false);
          animate(y, 0, { duration: 0.3, ease: [0.2, 0.8, 0.2, 1] });
        }
      } else {
        animate(y, 0, { duration: 0.25, ease: [0.2, 0.8, 0.2, 1] });
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [y, refreshing]);

  return (
    <motion.div
      style={{ y }}
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden"
    >
      <motion.div
        style={{ opacity: indicatorOpacity }}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-ink/85 text-gold shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] backdrop-blur-xl"
      >
        <motion.svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          style={refreshing ? undefined : { rotate }}
          animate={refreshing ? { rotate: 360 } : undefined}
          transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : undefined}
        >
          <path
            d="M20 11a8 8 0 1 0-2.34 5.66M20 5v6h-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.div>
    </motion.div>
  );
}
