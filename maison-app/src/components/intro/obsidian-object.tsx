"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

/**
 * Abstract obsidian/dark-marble monolith rendered with layered CSS gradients
 * and a soft rotation loop. No external 3D asset — avoids depending on an
 * unreviewed Spline scene, and keeps the object sculptural and quiet rather
 * than literal (no figure, no crystal/sci-fi read).
 */
export function ObsidianObject() {
  const { mousePos } = useStore();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const nx = mousePos.x - 0.5;
    const ny = mousePos.y - 0.5;
    wrapRef.current.style.transform = `rotateY(${nx * 6}deg) rotateX(${-ny * 4}deg)`;
  }, [mousePos]);

  return (
    <div
      className="pointer-events-none absolute right-[10%] top-1/2 h-[420px] w-[420px] -translate-y-1/2"
      style={{ perspective: "1200px" }}
    >
      <div
        ref={wrapRef}
        className="relative h-full w-full transition-transform duration-700 ease-out"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div
          className="absolute inset-0 animate-[slow-spin_26s_linear_infinite] rounded-[38%_62%_55%_45%/48%_42%_58%_52%]"
          style={{
            background: `
              radial-gradient(ellipse 140px 200px at 32% 28%, rgba(255,255,255,0.10), transparent 55%),
              radial-gradient(ellipse 90px 130px at 70% 75%, rgba(196,164,105,0.05), transparent 60%),
              linear-gradient(150deg, #1a1814 0%, #080705 45%, #14120e 75%, #050403 100%)
            `,
            boxShadow:
              "inset -30px -40px 80px rgba(0,0,0,0.7), inset 20px 20px 60px rgba(255,255,255,0.03), 0 40px 90px -30px rgba(0,0,0,0.8)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
    </div>
  );
}
