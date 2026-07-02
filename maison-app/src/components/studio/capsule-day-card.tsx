"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { getTodayCapsuleChallenge } from "@/lib/capsule-challenges";

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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="mt-9 max-w-[420px] rounded-[1.25rem] bg-white/[0.02] p-1.5 ring-1 ring-gold/15"
      >
        <div className="rounded-[1rem] bg-black/20 px-5 py-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]">
          <p className="mb-2.5 text-[9.5px] uppercase tracking-[2.5px] text-gold">
            Capsule Day
          </p>
          <p
            className={`mb-3.5 text-[14px] leading-relaxed transition-colors ${
              done ? "text-muted line-through" : "text-bone-dim"
            }`}
          >
            {challenge.text}
          </p>
          <button
            onClick={() => toggleCapsuleComplete(challenge.id)}
            className="text-[10px] uppercase tracking-[1.5px] text-muted transition-colors hover:text-gold"
          >
            {done ? "Tekrar aç" : "Bugün tamamladım"}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
