"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DAYS_OF_WEEK = ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"];

const TASKS_BY_DAY: Record<number, string[]> = {
  1: ["Brief · Croquis taslakları", "Ritual · Sabah incelemesi"],
  4: ["Deadline · Koleksiyon III"],
  9: ["Creative Challenge"],
  14: ["Fitting · Prova günü"],
};

export function CalendarView() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const days = useMemo(() => {
    const blanks = 2;
    const result: (number | null)[] = Array(blanks).fill(null);
    for (let d = 1; d <= 31; d++) result.push(d);
    return result;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="pr-14"
    >
      <div className="mb-5 flex items-baseline justify-between">
        <p className="font-serif text-2xl italic">Temmuz 2026</p>
        <p className="text-[9.5px] uppercase tracking-[3px] text-muted">
          Rituals & Deadlines
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {DAYS_OF_WEEK.map((d) => (
          <div
            key={d}
            className="pb-1.5 text-center text-[9.5px] uppercase tracking-[1.5px] text-muted"
          >
            {d}
          </div>
        ))}
        {days.map((d, i) =>
          d === null ? (
            <div key={`blank-${i}`} className="aspect-square opacity-30" />
          ) : (
            <div
              key={d}
              className={`relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-[3px] border text-[12.5px] transition-all duration-250 hover:-translate-y-0.5 hover:border-gold ${
                d === 1
                  ? "border-gold bg-gold/[0.14] text-bone"
                  : "border-line text-bone-dim"
              }`}
              onClick={() => setSelectedDay(selectedDay === d ? null : d)}
            >
              <span>{d}</span>
              {TASKS_BY_DAY[d] && (
                <span className="absolute bottom-[7px] h-1 w-1 rounded-full bg-gold" />
              )}
            </div>
          )
        )}
      </div>

      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mt-6 overflow-hidden rounded-[3px] border border-line"
          >
            <div className="p-5">
              <p className="mb-2 font-heading text-base">
                1 Temmuz + {selectedDay - 1} gün
              </p>
              {(
                TASKS_BY_DAY[selectedDay] || [
                  "Bu gün için bir şey planlanmadı.",
                ]
              ).map((t, i) => (
                <p key={i} className="text-[13px] text-bone-dim">
                  · {t}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
