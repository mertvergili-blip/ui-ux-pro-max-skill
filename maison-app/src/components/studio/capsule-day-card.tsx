"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { getTodayCapsuleChallenge } from "@/lib/capsule-challenges";

// A small four-point sparkle — distinguishes "occasion" cards (this,
// roughly one day in three) from the everyday note/AI-note bezel used
// everywhere else.
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none">
      <path
        d="M8 1 L9.4 6.6 L15 8 L9.4 9.4 L8 15 L6.6 9.4 L1 8 L6.6 6.6 Z"
        fill="var(--color-gold)"
      />
    </svg>
  );
}

export function CapsuleDayCard() {
  // Computed client-side only — depends on the viewer's actual today, which
  // can differ from whatever date the page was statically rendered with.
  const [challenge, setChallenge] = useState<{ id: string; text: string } | null>(null);
  const completedIds = useStore((s) => s.completedCapsuleIds);
  const toggleCapsuleComplete = useStore((s) => s.toggleCapsuleComplete);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChallenge(getTodayCapsuleChallenge());
  }, []);

  if (!challenge) return null;
  const done = completedIds.includes(challenge.id);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative mt-9 max-w-[420px] rounded-[1.4rem] p-px"
        style={{
          background:
            "linear-gradient(135deg, rgba(196,164,105,0.65) 0%, rgba(196,164,105,0.08) 32%, rgba(196,164,105,0.08) 68%, rgba(196,164,105,0.65) 100%)",
        }}
      >
        <div className="relative overflow-hidden rounded-[1.38rem] bg-black/30 px-5 py-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              background:
                "radial-gradient(ellipse 220px 140px at 100% 0%, var(--color-gold), transparent 70%)",
            }}
          />
          <p className="relative mb-2.5 flex items-center gap-1.5 text-[9.5px] uppercase tracking-[2.5px] text-gold">
            <SparkleIcon className="h-3 w-3" />
            Capsule Day
          </p>
          <p
            className={`relative mb-3.5 text-[14px] leading-relaxed transition-colors ${
              done ? "text-muted line-through" : "text-bone-dim"
            }`}
          >
            {challenge.text}
          </p>
          <button
            onClick={() => toggleCapsuleComplete(challenge.id)}
            className="relative text-[10px] uppercase tracking-[1.5px] text-muted transition-colors hover:text-gold"
          >
            {done ? "Tekrar aç" : "Bugün tamamladım"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
