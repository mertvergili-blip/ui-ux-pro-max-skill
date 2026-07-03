"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, selectCreativeEnergy, selectDaysRemaining } from "@/lib/store";
import { FinancePulse } from "@/components/shared/finance-pulse";
import { CapsuleDayCard } from "@/components/studio/capsule-day-card";
import { AnimateDigits } from "@/components/unlumen-ui/animate-digits";
import { useUndoStore } from "@/lib/undo-toast";

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
  estimatedMinutes,
  subtasks,
  onRemove,
}: {
  id: string;
  idx: string;
  text: string;
  done: boolean;
  estimatedMinutes?: number;
  subtasks?: { id: string; text: string; done: boolean }[];
  onRemove: () => void;
}) {
  const toggleTask = useStore((s) => s.toggleTask);
  const setTaskSubtasks = useStore((s) => s.setTaskSubtasks);
  const setTaskEstimate = useStore((s) => s.setTaskEstimate);
  const toggleSubtask = useStore((s) => s.toggleSubtask);
  const startFocusTask = useStore((s) => s.startFocusTask);
  const [breakingDown, setBreakingDown] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleBreakdown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setBreakingDown(true);
    setExpanded(true);
    try {
      const res = await fetch("/api/task-breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (Array.isArray(data.steps)) {
        setTaskSubtasks(
          id,
          data.steps.map((s: string, i: number) => ({ id: `${id}-sub${i}`, text: s, done: false }))
        );
      }
      if (data.estimatedMinutes) setTaskEstimate(id, data.estimatedMinutes);
    } finally {
      setBreakingDown(false);
    }
  };

  const hasSubtasks = (subtasks?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-2">
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
          className={`relative flex-1 transition-colors duration-300 ${
            done ? "text-[#57503f] line-through" : "text-[#d7cfbc]"
          }`}
        >
          {text}
          {estimatedMinutes && !done && (
            <span className="ml-2 text-[10.5px] text-muted">~{estimatedMinutes} dk</span>
          )}
        </span>
        {!done && (
          <div
            className="flex items-center gap-2.5 text-[9.5px] uppercase tracking-[1.5px] opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            {hasSubtasks ? (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-muted hover:text-bone-dim"
              >
                {expanded ? "Gizle" : "Adımlar"}
              </button>
            ) : (
              <button
                onClick={handleBreakdown}
                disabled={breakingDown}
                className="text-muted hover:text-bone-dim disabled:opacity-40"
              >
                {breakingDown ? "Bölünüyor…" : "Parçala"}
              </button>
            )}
            <button
              onClick={() => startFocusTask(id, estimatedMinutes ?? 15)}
              className="text-gold hover:text-bone"
            >
              Odaklan
            </button>
            <button onClick={onRemove} className="text-muted hover:text-rose">
              Sil
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {expanded && hasSubtasks && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-[26px] flex flex-col gap-1.5 overflow-hidden border-l border-line pl-3.5"
          >
            {subtasks!.map((st) => (
              <div
                key={st.id}
                className="flex cursor-pointer items-center gap-2.5 text-[12px]"
                onClick={() => toggleSubtask(id, st.id)}
              >
                <span
                  className={`h-[11px] w-[11px] flex-shrink-0 rounded-full border ${
                    st.done ? "border-gold bg-gold" : "border-bone-dim/40"
                  }`}
                />
                <span className={st.done ? "text-muted line-through" : "text-bone-dim"}>
                  {st.text}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function StudioView() {
  const tasks = useStore((s) => s.tasks);
  const streak = useStore((s) => s.streak);
  const bestStreak = useStore((s) => s.bestStreak);
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
  const startFocusTask = useStore((s) => s.startFocusTask);
  const removeTask = useStore((s) => s.removeTask);
  const restoreTask = useStore((s) => s.restoreTask);
  const showUndo = useUndoStore((s) => s.show);

  const handleRemoveTask = (id: string) => {
    const index = tasks.findIndex((t) => t.id === id);
    const task = tasks[index];
    removeTask(id);
    if (task) showUndo(`"${task.text}" kaldırıldı`, () => restoreTask(task, index));
  };

  const lastOpenedCollectionId = useStore((s) => s.lastOpenedCollectionId);
  const collections = useStore((s) => s.collections);
  const setView = useStore((s) => s.setView);
  const setLastOpenedCollection = useStore((s) => s.setLastOpenedCollection);
  const resumeCollection = collections.find((c) => c.id === lastOpenedCollectionId);

  // The deadline card names a collection by label ("Koleksiyon III") rather
  // than id, so resolve it the same loose way a person would read it —
  // the one still actively "In Progress" — falling back to whichever
  // collection is currently open if none matches.
  const deadlineCollection =
    collections.find((c) => c.status === "In Progress") ?? resumeCollection ?? collections[0];
  const openDeadlineCollection = () => {
    if (!deadlineCollection) return;
    setLastOpenedCollection(deadlineCollection.id);
    setView("collections");
  };

  // The single next actionable thing, not a summary — one undone task
  // beats a paragraph of options when starting is the hard part.
  const nextTask = tasks.find((t) => !t.done);

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

      {resumeCollection && (
        <button
          onClick={() => setView("collections")}
          className="mb-7 flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-[12px] text-bone-dim transition-colors hover:border-gold/30 hover:text-bone"
        >
          <span className="text-gold">↩</span>
          Kaldığın yerden devam et:{" "}
          <span className="text-bone">{resumeCollection.name}</span>
        </button>
      )}

      <div className="mb-9 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-6">
        <div className="bento-tile bento-gold p-6 sm:col-span-2 lg:col-span-4">
          <div className="bento-orb" style={{ width: 150, height: 150, top: -50, right: -40 }} />
          <p className="mb-3.5 text-[9.5px] uppercase tracking-[2px] text-white/55">
            Studio Focus
          </p>
          {nextTask ? (
            <>
              <p className="mb-2.5 max-w-[340px] font-serif text-[22px] italic text-[#e4c98f]">
                {nextTask.text}
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => startFocusTask(nextTask.id, nextTask.estimatedMinutes ?? 15)}
                  className="rounded-full bg-[#e4c98f] px-4 py-2 text-[10.5px] uppercase tracking-[1.5px] text-ink transition-opacity hover:opacity-90"
                >
                  Şimdi Başla
                </button>
                {nextTask.estimatedMinutes && (
                  <span className="text-[12px] text-bone-dim">
                    ~{nextTask.estimatedMinutes} dk
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="max-w-[320px] text-[13px] leading-relaxed text-bone-dim">
              Bugün için işaretlenmiş her şeyi bitirdin. Yeni bir görev ekle ya
              da dinlen.
            </p>
          )}
        </div>

        <button
          onClick={() => setView("journal")}
          className="bento-tile bento-violet w-full p-5 text-left transition-transform duration-200 hover:-translate-y-0.5 lg:col-span-2"
        >
          <div className="bento-orb" style={{ width: 110, height: 110, bottom: -40, left: -30 }} />
          <p className="mb-3.5 text-[9.5px] uppercase tracking-[2px] text-white/55">
            Streak
          </p>
          <p className="flex items-baseline font-heading text-[28px] text-[#f1ecff]">
            <AnimateDigits value={String(streak)} enterY={20} />
            <small className="ml-1.5 font-sans text-xs text-white/60">gün</small>
          </p>
          {bestStreak > 0 && (
            <p className="mt-1 text-[10.5px] text-white/45">en iyi: {bestStreak} gün</p>
          )}
        </button>

        <button
          onClick={() => setView("journal")}
          className="bento-tile bento-teal w-full p-5 text-left transition-transform duration-200 hover:-translate-y-0.5 lg:col-span-2"
        >
          <div className="bento-orb" style={{ width: 120, height: 120, top: -40, right: -35 }} />
          <p className="mb-3.5 text-[9.5px] uppercase tracking-[2px] text-white/55">
            Creative Energy
          </p>
          <p className="font-serif text-lg italic text-[#d3fff2]">{creativeEnergy}</p>
        </button>

        <div className="bento-tile bento-graphite p-5 lg:col-span-2">
          <p className="mb-3.5 text-[9.5px] uppercase tracking-[2px] text-white/55">
            Finance Pulse
          </p>
          <FinancePulse />
        </div>

        <button
          onClick={openDeadlineCollection}
          disabled={!deadlineCollection}
          className="bento-tile bento-blue w-full p-5 text-left transition-transform duration-200 hover:-translate-y-0.5 disabled:pointer-events-none lg:col-span-2"
        >
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
        </button>
      </div>

      <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
        Today
      </p>
      <div className="flex flex-col gap-3.5">
        {tasks.map((t) => (
          <TaskItem key={t.id} {...t} onRemove={() => handleRemoveTask(t.id)} />
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
