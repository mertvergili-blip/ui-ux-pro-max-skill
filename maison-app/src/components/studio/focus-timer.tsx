"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";

const EASE = [0.32, 0.72, 0, 1] as const;

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// A single-task countdown, not a full pomodoro suite — the point is
// lowering the barrier to "just start", not managing a whole session.
// Driven by an absolute end timestamp (not a local interval-decremented
// counter) so a reload or a backgrounded tab picks up exactly where real
// time says it should, instead of the whole session quietly resetting.
export function FocusTimer({
  taskText,
  endsAt,
  onExit,
  onComplete,
}: {
  taskText: string;
  endsAt: number;
  onExit: () => void;
  onComplete: () => void;
}) {
  const extendFocusTimer = useStore((s) => s.extendFocusTimer);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const secondsLeft = Math.max(0, Math.round((endsAt - now) / 1000));
  const done = secondsLeft === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="fixed bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] right-[max(1.25rem,env(safe-area-inset-right))] z-[80] w-[280px] overflow-hidden rounded-[1.25rem] border border-white/[0.08] bg-[#100d09]/95 p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl lg:bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))]"
    >
      <p className="mb-1 text-[9.5px] uppercase tracking-[2.5px] text-muted">
        {done ? "Süre doldu" : "Odak Seansı"}
      </p>
      <p className="mb-3.5 line-clamp-2 text-[13px] leading-snug text-bone-dim">{taskText}</p>

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-2.5"
          >
            <p className="text-[12px] leading-relaxed text-bone-dim">
              Bitti mi, yoksa biraz daha mı sürsün?
            </p>
            <div className="flex gap-2 text-[10px] uppercase tracking-[1.5px]">
              <button
                onClick={onComplete}
                className="flex-1 rounded-full bg-gold px-3 py-2 text-ink"
              >
                Görevi Bitir
              </button>
              <button
                onClick={() => extendFocusTimer(5)}
                className="rounded-full border border-white/10 px-3 py-2 text-muted hover:border-white/25"
              >
                +5 dk
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="mb-3.5 font-heading text-[34px] tabular-nums text-[#f7f2e6]">
              {formatClock(secondsLeft)}
            </p>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[1.5px]">
              <button
                onClick={() => extendFocusTimer(5)}
                className="rounded-full border border-white/10 px-3.5 py-2 text-bone-dim hover:border-white/25"
              >
                +5 dk
              </button>
              <button
                onClick={onComplete}
                className="ml-auto text-muted hover:text-gold"
                title="Görevi bitti işaretle"
              >
                ✓ Bitti
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={onExit}
        className="absolute right-3 top-3 text-[11px] text-muted hover:text-bone-dim"
        aria-label="Odak seansını kapat"
      >
        ✕
      </button>
    </motion.div>
  );
}

export function FocusTimerHost() {
  const focusTaskId = useStore((s) => s.focusTaskId);
  const focusEndsAt = useStore((s) => s.focusEndsAt);
  const setFocusTask = useStore((s) => s.setFocusTask);
  const tasks = useStore((s) => s.tasks);
  const toggleTask = useStore((s) => s.toggleTask);

  const task = tasks.find((t) => t.id === focusTaskId);

  if (!task || task.done || !focusEndsAt) return null;

  return (
    <AnimatePresence>
      <FocusTimer
        key={task.id}
        taskText={task.text}
        endsAt={focusEndsAt}
        onExit={() => setFocusTask(null)}
        onComplete={() => {
          toggleTask(task.id);
          setFocusTask(null);
        }}
      />
    </AnimatePresence>
  );
}
