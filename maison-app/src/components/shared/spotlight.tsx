"use client";

import { useStore } from "@/lib/store";

export function Spotlight() {
  const { mousePos } = useStore();
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1]"
      style={{
        background: `radial-gradient(600px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(196,164,105,0.06), transparent 40%)`,
      }}
    />
  );
}
