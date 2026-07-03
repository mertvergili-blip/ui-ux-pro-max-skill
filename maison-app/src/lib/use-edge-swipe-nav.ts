"use client";

import { useEffect, useRef } from "react";
import { useStore, type ViewName } from "@/lib/store";
import { haptics } from "./haptics";

// Same grouped order as the desktop rail (topbar.tsx) and the mobile "Diğer"
// sheet (bottom-nav.tsx) — Bugün / Arşiv / Yansıma / İlham, flattened.
const VIEW_ORDER: ViewName[] = [
  "studio",
  "calendar",
  "collections",
  "materials",
  "path",
  "journal",
  "dna",
  "runway",
];

const EDGE_ZONE = 28; // px from the screen edge the gesture must start within
const SWIPE_THRESHOLD = 80; // px of horizontal travel to commit to a nav
const MAX_VERTICAL_DRIFT = 60; // px — beyond this it reads as a scroll, not a swipe

// iOS-style edge-swipe, repurposed for view paging rather than a back
// stack: dragging in from the left edge goes to the previous view, from the
// right edge to the next one. Starting the touch away from the very edge
// leaves every existing in-content horizontal gesture (swipe-to-delete
// rows, DNA Map node dragging, photo carousels) completely untouched.
export function useEdgeSwipeNav() {
  const currentView = useStore((s) => s.currentView);
  const setView = useStore((s) => s.setView);
  const touchStart = useRef<{ x: number; y: number; edge: "left" | "right" } | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    if (!mq.matches) return;

    const handleTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const w = window.innerWidth;
      if (t.clientX <= EDGE_ZONE) {
        touchStart.current = { x: t.clientX, y: t.clientY, edge: "left" };
      } else if (t.clientX >= w - EDGE_ZONE) {
        touchStart.current = { x: t.clientX, y: t.clientY, edge: "right" };
      } else {
        touchStart.current = null;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = Math.abs(t.clientY - start.y);
      if (dy > MAX_VERTICAL_DRIFT) return;

      const idx = VIEW_ORDER.indexOf(currentView);
      if (idx === -1) return;

      if (start.edge === "left" && dx > SWIPE_THRESHOLD) {
        const prev = VIEW_ORDER[(idx - 1 + VIEW_ORDER.length) % VIEW_ORDER.length];
        haptics.tap();
        setView(prev);
      } else if (start.edge === "right" && dx < -SWIPE_THRESHOLD) {
        const next = VIEW_ORDER[(idx + 1) % VIEW_ORDER.length];
        haptics.tap();
        setView(next);
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [currentView, setView]);
}
