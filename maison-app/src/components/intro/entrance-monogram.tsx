"use client";

import { useEffect, useRef, useState } from "react";
import { animate, createDrawable } from "animejs";
import { EncryptedText } from "@/components/vendor/encrypted-text";

interface Props {
  onSequenceDone?: () => void;
}

export function EntranceMonogram({ onSequenceDone }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [showHeadline, setShowHeadline] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!svgRef.current) return;
    const path = svgRef.current.querySelector("path");
    if (!path) return;

    const drawable = createDrawable(path);
    animate(drawable, {
      draw: ["0 0", "0 1"],
      duration: 1400,
      ease: "outExpo",
      onComplete: () => setShowHeadline(true),
    });

    animate(".mono-glow", {
      opacity: [0.15, 0.35, 0.15],
      duration: 3200,
      loop: true,
      ease: "inOutSine",
    });
  }, []);

  return (
    <div className="pointer-events-none absolute left-[8%] right-[8%] top-1/2 z-5 -translate-y-1/2 sm:right-auto sm:max-w-[460px]">
      <svg ref={svgRef} width="72" height="72" viewBox="0 0 72 72" className="mb-5">
        <path
          d="M8 60 L8 12 L26 42 L44 12 L44 60 M52 12 L64 12 M58 12 L58 60"
          fill="none"
          stroke="var(--color-gold)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mono-glow"
          style={{ filter: "drop-shadow(0 0 6px rgba(196,164,105,0.4))" }}
        />
      </svg>

      <p className="mb-3.5 text-[10px] uppercase tracking-[3px] text-gold">Maison</p>

      <h1 className="mb-5 font-heading text-[34px] font-normal leading-[1.12] tracking-tight text-[#f7f2e6] sm:text-[50px]">
        {showHeadline && (
          <>
            <EncryptedText
              text="Kendi atölyene"
              revealDelayMs={45}
              encryptedClassName="text-bone-dim/40"
              revealedClassName="text-[#f7f2e6]"
            />{" "}
            <EncryptedText
              text="gir."
              revealDelayMs={45}
              startDelayMs={700}
              encryptedClassName="text-gold/40"
              revealedClassName="italic text-gold"
              onComplete={() => {
                setShowHint(true);
                onSequenceDone?.();
              }}
            />
          </>
        )}
      </h1>

      <p
        className={`text-[11px] uppercase tracking-[1.5px] text-muted transition-opacity duration-700 ${
          showHint ? "opacity-100" : "opacity-0"
        }`}
      >
        Girmek için herhangi bir yere dokun
      </p>
    </div>
  );
}
