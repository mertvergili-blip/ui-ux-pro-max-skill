"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUndoStore } from "@/lib/undo-toast";

// Held open longer than a typical toast (6s, not the usual 3-4s) — enough
// time to notice and react even mid-distraction, since impulsive deletes
// and the moment of "wait, I needed that" are exactly the failure mode
// this exists to catch.
const AUTO_DISMISS_MS = 6000;

export function UndoToast() {
  const pending = useUndoStore((s) => s.pending);
  const dismiss = useUndoStore((s) => s.dismiss);
  const runUndo = useUndoStore((s) => s.runUndo);

  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => dismiss(pending.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [pending, dismiss]);

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] left-1/2 z-[90] -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-ink/95 py-2 pl-4 pr-2 text-[12px] text-bone-dim shadow-[0_12px_32px_-16px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <span>{pending.label}</span>
            <button
              onClick={runUndo}
              className="rounded-full bg-gold px-3 py-1.5 text-[10.5px] uppercase tracking-[1.5px] text-ink transition-opacity hover:opacity-90"
            >
              Geri Al
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
