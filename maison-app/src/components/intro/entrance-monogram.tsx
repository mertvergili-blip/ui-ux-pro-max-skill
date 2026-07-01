"use client";

import { useEffect, useRef } from "react";
import { animate, createTimeline, createDrawable, stagger } from "animejs";

interface Props {
  onSequenceDone?: () => void;
}

export function EntranceMonogram({ onSequenceDone }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!svgRef.current || !wordsRef.current || !hintRef.current) return;

    const path = svgRef.current.querySelector("path");
    if (!path) return;

    const drawable = createDrawable(path);
    const words = wordsRef.current.querySelectorAll("[data-word]");

    const tl = createTimeline({
      defaults: { ease: "outExpo" },
      onComplete: () => onSequenceDone?.(),
    });

    tl.add(drawable, { draw: ["0 0", "0 1"], duration: 1400 })
      .add(
        words,
        {
          opacity: [0, 1],
          translateY: [14, 0],
          filter: ["blur(4px)", "blur(0px)"],
          duration: 700,
          delay: stagger(80),
        },
        "-=600"
      )
      .add(
        hintRef.current,
        { opacity: [0, 1], duration: 900 },
        "-=200"
      );

    animate(".mono-glow", {
      opacity: [0.15, 0.35, 0.15],
      duration: 3200,
      loop: true,
      ease: "inOutSine",
    });
  }, [onSequenceDone]);

  return (
    <div className="pointer-events-none absolute left-[8%] top-1/2 z-5 max-w-[460px] -translate-y-1/2">
      <svg
        ref={svgRef}
        width="72"
        height="72"
        viewBox="0 0 72 72"
        className="mb-5"
      >
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

      <p className="mb-3.5 text-[10px] uppercase tracking-[3px] text-gold">
        Maison
      </p>
      <h1
        ref={wordsRef}
        className="mb-5 font-heading text-[50px] font-normal leading-[1.12] tracking-tight text-[#f7f2e6]"
      >
        <span data-word className="inline-block">
          Kendi
        </span>{" "}
        <span data-word className="inline-block">
          atölyene
        </span>{" "}
        <span data-word className="inline-block italic text-gold">
          gir.
        </span>
      </h1>
      <p
        ref={hintRef}
        className="text-[11px] uppercase tracking-[1.5px] text-muted opacity-0"
      >
        Girmek için herhangi bir yere dokun
      </p>
    </div>
  );
}
