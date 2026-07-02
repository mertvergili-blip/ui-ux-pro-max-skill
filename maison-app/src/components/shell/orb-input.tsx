"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";

interface OrbInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  active: boolean;
  loading?: boolean;
}

export function OrbInput({ value, onChange, placeholder, active, loading }: OrbInputProps) {
  const { isSupported, listening, start, stop } = useSpeechRecognition(onChange);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow with the content — a fixed rows={2} let longer notes spill
  // over the mic hint below.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [value]);

  const handleOrbClick = () => {
    if (listening) stop();
    else start(value);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-8 flex h-28 w-28 items-center justify-center">
        <motion.button
          type="button"
          onClick={isSupported ? handleOrbClick : undefined}
          className="absolute inset-0 rounded-full"
          style={{
            background: listening
              ? "radial-gradient(circle at 35% 30%, rgba(214,150,150,0.9), rgba(122,46,46,0.5) 55%, transparent 75%)"
              : "radial-gradient(circle at 35% 30%, rgba(231,201,143,0.9), rgba(122,90,36,0.5) 55%, transparent 75%)",
            cursor: isSupported ? "pointer" : "default",
          }}
          animate={{
            scale: listening
              ? [1, 1.16, 1]
              : loading
                ? [1, 1.14, 1]
                : active
                  ? [1, 1.08, 1]
                  : [1, 1.02, 1],
            opacity: listening
              ? [0.9, 1, 0.9]
              : loading
                ? [0.85, 1, 0.85]
                : active
                  ? [0.9, 1, 0.9]
                  : [0.55, 0.7, 0.55],
          }}
          transition={{
            duration: listening ? 1.3 : loading ? 1 : active ? 2.2 : 3.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          aria-label={listening ? "Sesli notu durdur" : "Sesli not al"}
        />
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full border"
          style={{ borderColor: listening ? "rgba(214,150,150,0.4)" : "rgba(196,164,105,0.4)" }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full border"
          style={{ borderColor: listening ? "rgba(214,150,150,0.3)" : "rgba(196,164,105,0.3)" }}
          animate={{ scale: [1, 1.6, 1], opacity: [0.35, 0, 0.35] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
        />
        <div
          className="pointer-events-none relative h-14 w-14 rounded-full"
          style={{
            background: listening
              ? "radial-gradient(circle at 38% 32%, #f0c4c4, #7a2e2e 45%, #4a1a1a 85%)"
              : "radial-gradient(circle at 38% 32%, #f3e2ba, #c4a469 45%, #6b5326 85%)",
            boxShadow: listening
              ? "0 0 30px 6px rgba(214,150,150,0.35)"
              : "0 0 30px 6px rgba(196,164,105,0.35)",
          }}
        />
        {isSupported && !listening && (
          <svg
            className="pointer-events-none absolute bottom-0 right-0 h-6 w-6 rounded-full bg-ink p-1 ring-1 ring-white/10"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3zM19 11a7 7 0 01-14 0M12 18v3"
              stroke="var(--color-bone-dim)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={listening ? "Dinliyorum…" : placeholder}
        rows={1}
        className="w-full max-w-[360px] resize-none overflow-y-auto border-b border-line bg-transparent px-1 pb-3 text-center font-serif text-[17px] italic leading-snug text-bone outline-none placeholder:text-muted focus:border-gold/50"
      />
      {isSupported && (
        <p className="mt-2 text-[10px] uppercase tracking-[1.5px] text-muted">
          {listening ? "Bitirmek için orb'a dokun" : "Sesli not için orb'a dokun"}
        </p>
      )}
    </div>
  );
}
