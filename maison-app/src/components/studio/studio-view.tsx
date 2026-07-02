"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useStore, selectCreativeEnergy, selectDaysRemaining } from "@/lib/store";
import { FinancePulse } from "@/components/shared/finance-pulse";
import { CapsuleDayCard } from "@/components/studio/capsule-day-card";

function HeadlineReveal() {
  const words = "Bugün sakin bir gün. Bir teslim tarihi *yaklaşıyor.*".split(" ");

  return (
    <h1 className="mb-9 max-w-[600px] font-heading text-[46px] font-normal leading-[1.12] tracking-tight text-[#f7f2e6]">
      {words.map((w, i) => {
        const isEm = w.includes("*");
        const clean = w.replace(/\*/g, "");
        return (
          <span key={i}>
            <motion.span
              className="inline-block"
              initial={{ opacity: 0, y: 16, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.6,
                delay: 0.2 + i * 0.08,
                ease: [0.2, 0.7, 0.3, 1],
              }}
            >
              {isEm ? <em className="italic text-gold">{clean}</em> : clean}
            </motion.span>{" "}
          </span>
        );
      })}
    </h1>
  );
}

function TaskItem({
  id,
  idx,
  text,
  done,
}: {
  id: string;
  idx: string;
  text: string;
  done: boolean;
}) {
  const toggleTask = useStore((s) => s.toggleTask);

  return (
    <div
      className="group flex cursor-pointer select-none items-center gap-3.5 text-[13.5px]"
      onClick={() => toggleTask(id)}
    >
      <span className="w-3.5 font-serif text-xs italic text-muted">{idx}</span>
      <span
        className={`relative flex h-[15px] w-[15px] flex-shrink-0 items-center justify-center rounded-full border transition-all duration-200 group-hover:scale-[1.15] ${
          done ? "border-bone bg-bone" : "border-bone-dim/40 bg-transparent"
        }`}
      >
        <svg viewBox="0 0 16 16" className="h-full w-full">
          <path
            d="M4 8.5l2.8 2.8L12 5.5"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="2.4"
            strokeDasharray="20"
            strokeDashoffset={done ? 0 : 20}
            className="transition-all duration-300"
          />
        </svg>
      </span>
      <span
        className={`relative transition-colors duration-300 ${
          done ? "text-[#57503f] line-through" : "text-[#d7cfbc]"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

export function StudioView() {
  const tasks = useStore((s) => s.tasks);
  const streak = useStore((s) => s.streak);
  const journalEntries = useStore((s) => s.journalEntries);
  const creativeEnergy = useMemo(
    () => selectCreativeEnergy(journalEntries),
    [journalEntries]
  );
  const notes = useStore((s) => s.notes);
  const toggleAiPanel = useStore((s) => s.toggleAiPanel);
  const latestNote = notes[notes.length - 1];
  const deadlineLabel = useStore((s) => s.deadlineLabel);
  const deadlineDate = useStore((s) => s.deadlineDate);
  const daysRemaining = useMemo(() => selectDaysRemaining(deadlineDate), [deadlineDate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="pr-14"
    >
      <p className="mb-[18px] flex items-center gap-2.5 text-[10.5px] uppercase tracking-[3.5px] text-muted">
        <span className="h-px w-7 bg-gradient-to-r from-gold/70 to-transparent" />
        From the Studio Assistant
      </p>

      <HeadlineReveal />

      <div className="flex gap-[50px]">
        <div className="flex-[1.3]">
          <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
            Studio Focus
          </p>
          <p className="mb-2.5 font-heading text-[22px]">
            Koleksiyon III — Moodboard Revizyonu
          </p>
          <p className="mb-6 max-w-[380px] text-[13.5px] leading-relaxed text-bone-dim">
            Kumaş referanslarını gözden geçir, palet notlarını netleştir.
          </p>
          <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
            Today
          </p>
          <div className="flex flex-col gap-3.5">
            {tasks.map((t) => (
              <TaskItem key={t.id} {...t} />
            ))}
          </div>

          {latestNote && (
            <div
              className="mt-9 max-w-[420px] cursor-pointer border-t border-line pt-5"
              onClick={toggleAiPanel}
            >
              <p className="mb-2 text-[9.5px] uppercase tracking-[3px] text-muted">
                Studio Assistant Note
              </p>
              <p className="text-[13px] leading-relaxed text-bone-dim">
                {latestNote.content}
              </p>
            </div>
          )}

          <CapsuleDayCard />
        </div>

        <div className="flex flex-col gap-6 border-l border-line pl-7">
          <div>
            <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
              Streak
            </p>
            <p className="font-heading text-[28px]">
              {streak}
              <small className="ml-1.5 font-sans text-xs text-muted">gün</small>
            </p>
          </div>
          <div>
            <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
              Creative Energy
            </p>
            <p className="font-serif text-lg italic text-bone">{creativeEnergy}</p>
          </div>
          <div>
            <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
              Next Deadline
            </p>
            <p className="font-heading text-[15px]">{deadlineLabel}</p>
            <p className="mt-0.5 text-[11.5px] text-muted">
              {daysRemaining === 0 ? "Bugün teslim" : `${daysRemaining} gün kaldı`}
            </p>
          </div>
          <div className="border-t border-line pt-6">
            <FinancePulse />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
