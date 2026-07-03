"use client";

import { useEffect, useState } from "react";

// Reveals `text` character-by-character with a blinking cursor while
// mid-reveal — the same effect Collections' note-insight already used
// hand-rolled, now shared across every spot that shows AI-generated text.
export function useTypewriter(text: string, speedMs = 16): string {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (!text) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay("");
      return;
    }
    let i = 0;
    setDisplay("▌");
    const iv = setInterval(() => {
      i++;
      if (i > text.length) {
        clearInterval(iv);
        setDisplay(text);
        return;
      }
      setDisplay(text.slice(0, i) + "▌");
    }, speedMs);
    return () => clearInterval(iv);
  }, [text, speedMs]);

  return display;
}
