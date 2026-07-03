"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useUndoStore } from "@/lib/undo-toast";

// Held open longer than a typical toast (6s, not the usual 3-4s) — enough
// time to notice and react even mid-distraction, since impulsive deletes
// and the moment of "wait, I needed that" are exactly the failure mode
// this exists to catch.
const AUTO_DISMISS_MS = 6000;

function ToastRow({ id, label }: { id: number; label: string }) {
  const dismiss = useUndoStore((s) => s.dismiss);
  const runUndo = useUndoStore((s) => s.runUndo);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [id, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex items-center gap-3 rounded-full border border-white/10 bg-ink/95 py-2 pl-4 pr-2 text-[12px] text-bone-dim shadow-[0_12px_32px_-16px_rgba(0,0,0,0.85)] backdrop-blur-xl"
    >
      <span>{label}</span>
      <button
        onClick={() => runUndo(id)}
        className="rounded-full bg-gold px-3 py-1.5 text-[10.5px] uppercase tracking-[1.5px] text-ink transition-opacity hover:opacity-90"
      >
        Geri Al
      </button>
    </motion.div>
  );
}

export function UndoToast() {
  const queue = useUndoStore((s) => s.queue);

  return (
    <div className="fixed bottom-[calc(var(--bottom-nav-h,0px)+1.25rem)] left-1/2 z-[90] flex -translate-x-1/2 flex-col-reverse items-center gap-2 lg:bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))]">
      <AnimatePresence>
        {queue.map((p) => (
          <ToastRow key={p.id} id={p.id} label={p.label} />
        ))}
      </AnimatePresence>
    </div>
  );
}
