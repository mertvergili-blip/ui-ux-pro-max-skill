"use client";

import { motion } from "framer-motion";

interface OrbInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  active: boolean;
  loading?: boolean;
}

export function OrbInput({ value, onChange, placeholder, active, loading }: OrbInputProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative mb-8 flex h-28 w-28 items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, rgba(231,201,143,0.9), rgba(122,90,36,0.5) 55%, transparent 75%)",
          }}
          animate={{
            scale: loading ? [1, 1.14, 1] : active ? [1, 1.08, 1] : [1, 1.02, 1],
            opacity: loading ? [0.85, 1, 0.85] : active ? [0.9, 1, 0.9] : [0.55, 0.7, 0.55],
          }}
          transition={{
            duration: loading ? 1 : active ? 2.2 : 3.6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-gold/40"
          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border border-gold/30"
          animate={{ scale: [1, 1.6, 1], opacity: [0.35, 0, 0.35] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
        />
        <div
          className="relative h-14 w-14 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 38% 32%, #f3e2ba, #c4a469 45%, #6b5326 85%)",
            boxShadow: "0 0 30px 6px rgba(196,164,105,0.35)",
          }}
        />
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full max-w-[360px] resize-none border-b border-line bg-transparent px-1 pb-3 text-center font-serif text-[17px] italic text-bone outline-none placeholder:text-muted focus:border-gold/50"
      />
    </div>
  );
}
