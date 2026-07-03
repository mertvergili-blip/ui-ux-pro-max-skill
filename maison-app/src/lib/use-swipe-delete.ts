"use client";

import { useEffect, useState } from "react";
import { useMotionValue, type PanInfo } from "framer-motion";
import { haptics } from "./haptics";

const REVEAL_WIDTH = 80;
const DELETE_THRESHOLD = 60;

// Swipe-to-delete only makes sense on touch — a mouse user already has the
// always-visible "Kaldır" text to click, and a coarse-pointer check (rather
// than a viewport-width breakpoint) is what actually distinguishes "has a
// finger" from "has a mouse," independent of window size.
function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const handler = (e: MediaQueryListEvent) => setCoarse(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return coarse;
}

/**
 * `x` is the shared drag position — pass it straight to SwipeDeleteBackdrop
 * so the backdrop's own width grows in sync with the drag instead of
 * sitting there as a static, always-visible box (it has no opaque card
 * behind it on every caller, e.g. Collections' transparent info row, so
 * the backdrop must reveal itself only as the card actually slides away).
 * `props` spreads onto the draggable motion element; it's empty on a mouse
 * pointer, leaving the element undraggable without an extra null-check at
 * every call site. `touch` is also returned directly — callers use it to
 * pick a single primary delete affordance instead of showing both the
 * swipe gesture AND an always-visible "Kaldır" text at once, which read as
 * two competing ways to do the same thing.
 */
export function useSwipeDelete(onDelete: () => void) {
  const touch = useCoarsePointer();
  const x = useMotionValue(0);

  const props = touch
    ? {
        drag: "x" as const,
        style: { x },
        dragDirectionLock: true,
        dragConstraints: { left: -REVEAL_WIDTH, right: 0 },
        dragElastic: { left: 0.15, right: 0 },
        dragSnapToOrigin: true,
        onDragEnd: (_: unknown, info: PanInfo) => {
          if (info.offset.x < -DELETE_THRESHOLD) {
            haptics.delete();
            onDelete();
          }
        },
      }
    : {};

  return { x, props, touch };
}
