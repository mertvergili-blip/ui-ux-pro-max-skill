"use client";

import { useEffect, useState, type ReactNode, type ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

const DIRECTIONS: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];

function rotateDirection(current: Direction): Direction {
  return DIRECTIONS[(DIRECTIONS.indexOf(current) + 1) % DIRECTIONS.length];
}

const MOVING_MAP: Record<Direction, string> = {
  TOP: "radial-gradient(20.7% 50% at 50% 0%, var(--gradient-color) 0%, rgba(255,255,255,0) 100%)",
  LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, var(--gradient-color) 0%, rgba(255,255,255,0) 100%)",
  BOTTOM:
    "radial-gradient(20.7% 50% at 50% 100%, var(--gradient-color) 0%, rgba(255,255,255,0) 100%)",
  RIGHT:
    "radial-gradient(16.2% 41.2% at 100% 50%, var(--gradient-color) 0%, rgba(255,255,255,0) 100%)",
};

interface HoverBorderGradientProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  containerClassName?: string;
  innerClassName?: string;
  duration?: number;
  gradientColor?: string;
  innerBg?: string;
}

// A rotating radial-gradient light chases around the border on hover —
// reconstructed in the spirit of the reference (no direct source access).
export function HoverBorderGradient({
  children,
  containerClassName = "",
  innerClassName = "",
  duration = 1,
  gradientColor = "var(--color-gold)",
  innerBg = "var(--color-ink)",
  className,
  ...props
}: HoverBorderGradientProps) {
  const [hovered, setHovered] = useState(false);
  const [direction, setDirection] = useState<Direction>("TOP");

  useEffect(() => {
    if (!hovered) return;
    const interval = setInterval(() => {
      setDirection((prev) => rotateDirection(prev));
    }, duration * 1000);
    return () => clearInterval(interval);
  }, [hovered, duration]);

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative flex items-center justify-center overflow-hidden rounded-full border border-white/10 bg-ink/60 transition-colors duration-500 ${containerClassName}`}
      style={{ ["--gradient-color" as string]: gradientColor } as React.CSSProperties}
      {...props}
    >
      <div className={`relative z-10 ${innerClassName || className || ""}`}>{children}</div>
      <motion.div
        className="absolute inset-0 z-0"
        style={{ filter: "blur(3px)" }}
        animate={{ background: hovered ? MOVING_MAP[direction] : "transparent" }}
        transition={{ ease: "linear", duration }}
      />
      <div
        className="absolute inset-[1.5px] z-[1] rounded-full"
        style={{ background: innerBg }}
      />
    </button>
  );
}
