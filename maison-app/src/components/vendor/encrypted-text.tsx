"use client";

import { useEffect, useState } from "react";

const GLYPHS = "!<>-_\\/[]{}=+*^?#";

function randomGlyph() {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

interface EncryptedTextProps {
  text: string;
  className?: string;
  encryptedClassName?: string;
  revealedClassName?: string;
  revealDelayMs?: number;
  startDelayMs?: number;
  onComplete?: () => void;
}

// Matrix-style decrypt reveal: unrevealed characters cycle through random
// glyphs each frame, characters lock in left-to-right over time.
export function EncryptedText({
  text,
  className,
  encryptedClassName = "",
  revealedClassName = "",
  revealDelayMs = 50,
  startDelayMs = 0,
  onComplete,
}: EncryptedTextProps) {
  const [display, setDisplay] = useState<string[]>(() => text.split(""));
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    let raf: number;
    let revealed = 0;
    const start = performance.now() + startDelayMs;
    let lastReveal = start;

    const loop = (now: number) => {
      if (now < start) {
        raf = requestAnimationFrame(loop);
        return;
      }
      if (now - lastReveal >= revealDelayMs && revealed < text.length) {
        lastReveal = now;
        revealed += 1;
      }
      setDisplay(
        text.split("").map((c, i) => (i < revealed || c === " " ? c : randomGlyph()))
      );
      setRevealedCount(revealed);
      if (revealed < text.length) {
        raf = requestAnimationFrame(loop);
      } else {
        onComplete?.();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, revealDelayMs, startDelayMs]);

  return (
    <span className={className}>
      {display.map((c, i) => (
        <span key={i} className={i < revealedCount ? revealedClassName : encryptedClassName}>
          {c}
        </span>
      ))}
    </span>
  );
}
