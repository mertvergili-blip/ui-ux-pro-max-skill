"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

// A plain system arrow is the one place left where Maison looks like every
// other web page instead of a considered object — but only on hardware that
// actually has a precise pointer. Touch devices never render this (no
// mouse to replace), and it never intercepts clicks (pointer-events: none
// throughout), so it can't make anything less usable, only more considered.
export function CustomCursor() {
  const mousePos = useStore((s) => s.mousePos);
  // Starts false to match the server-rendered (window-less) output —
  // flipping true immediately on the client, before paint, would make the
  // client's first render disagree with the SSR'd HTML it's hydrating onto.
  const [fine, setFine] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const ringPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFine(mq.matches);
    const handler = (e: MediaQueryListEvent) => setFine(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!fine) return;
    document.documentElement.classList.add("custom-cursor-active");
    return () => document.documentElement.classList.remove("custom-cursor-active");
  }, [fine]);

  // The dot tracks the raw position every frame (via the store, already
  // updated on mousemove for the Spotlight effect); the ring eases toward
  // it on a rAF loop so it reads as a considered trailing outline rather
  // than a second dot glued to the first.
  useEffect(() => {
    if (!fine) return;
    let raf: number;
    const tick = () => {
      const targetX = mousePos.x * window.innerWidth;
      const targetY = mousePos.y * window.innerHeight;
      ringPos.current.x += (targetX - ringPos.current.x) * 0.22;
      ringPos.current.y += (targetY - ringPos.current.y) * 0.22;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${targetX}px, ${targetY}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fine, mousePos]);

  if (!fine) return null;

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[200] h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold"
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[200] h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/40"
      />
    </>
  );
}
