"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useStore, selectCreativeEnergy, selectDaysRemaining } from "@/lib/store";
import { FinancePulse } from "@/components/shared/finance-pulse";
import { CapsuleDayCard } from "@/components/studio/capsule-day-card";
import { AnimateDigits } from "@/components/unlumen-ui/animate-digits";

function HeadlineReveal() {
  const words = "Bugün sakin bir gün. Bir teslim tarihi *yaklaşıyor.*".split(" ");

  return (
    <h1 className="mb-9 max-w-[600px] font-heading text-[32px] font-normal leading-[1.12] tracking-tight text-[#f7f2e6] sm:text-[40px] lg:text-[46px]">
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
      className="lg:pr-14"
    >
      <p className="mb-[18px] flex items-center gap-2.5 text-[10.5px] uppercase tracking-[3.5px] text-muted">
        <span className="h-px w-7 bg-gradient-to-r from-gold/70 to-transparent" />
        From the Studio Assistant
      </p>

      <HeadlineReveal />

      <div className="mb-9 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-6">
        <div className="bento-tile bento-gold p-6 sm:col-span-2 lg:col-span-4">
          <div className="bento-orb" style={{ width: 150, height: 150, top: -50, right: -40 }} />
          <p className="mb-3.5 text-[9.5px] uppercase tracking-[2px] text-white/55">
            Studio Focus
          </p>
          <p className="mb-2.5 max-w-[340px] font-serif text-[22px] italic text-[#e4c98f]">
            Koleksiyon III — Moodboard Revizyonu
          </p>
          <p className="max-w-[320px] text-[13px] leading-relaxed text-bone-dim">
            Kumaş referanslarını gözden geçir, palet notlarını netleştir.
          </p>
        </div>

        <div className="bento-tile bento-violet p-5 lg:col-span-2">
          <div className="bento-orb" style={{ width: 110, height: 110, bottom: -40, left: -30 }} />
          <p className="mb-3.5 text-[9.5px] uppercase tracking-[2px] text-white/55">
            Streak
          </p>
          <p className="flex items-baseline font-heading text-[28px] text-[#f1ecff]">
            <AnimateDigits value={String(streak)} enterY={20} />
            <small className="ml-1.5 font-sans text-xs text-white/60">gün</small>
          </p>
        </div>

        <div className="bento-tile bento-teal p-5 lg:col-span-2">
          <div className="bento-orb" style={{ width: 120, height: 120, top: -40, right: -35 }} />
          <p className="mb-3.5 text-[9.5px] uppercase tracking-[2px] text-white/55">
            Creative Energy
          </p>
          <p className="font-serif text-lg italic text-[#d3fff2]">{creativeEnergy}</p>
        </div>

        <div className="bento-tile bento-graphite p-5 lg:col-span-2">
          <p className="mb-3.5 text-[9.5px] uppercase tracking-[2px] text-white/55">
            Finance Pulse
          </p>
          <FinancePulse />
        </div>

        <div className="bento-tile bento-blue p-5 lg:col-span-2">
          <div className="bento-orb" style={{ width: 100, height: 100, bottom: -35, right: -30 }} />
          <p className="mb-3.5 text-[9.5px] uppercase tracking-[2px] text-white/55">
            Next Deadline
          </p>
          <p className="font-heading text-[15px] text-[#e2f0ff]">{deadlineLabel}</p>
          <p className="mt-0.5 flex items-baseline text-[11.5px] text-white/60">
            {daysRemaining === 0 ? (
              "Bugün teslim"
            ) : (
              <>
                <AnimateDigits
                  value={String(daysRemaining)}
                  enterY={14}
                  className="text-[11.5px]"
                />
                <span className="ml-1">gün kaldı</span>
              </>
            )}
          </p>
        </div>
      </div>

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
    </motion.div>
  );
}
