"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";

const DAYS_OF_WEEK = ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"];

export function CalendarView() {
  const selectedDay = useStore((s) => s.selectedCalendarDay);
  const setSelectedDay = useStore((s) => s.setSelectedCalendarDay);
  const calendarEvents = useStore((s) => s.calendarEvents);

  const days = useMemo(() => {
    const blanks = 2;
    const result: (number | null)[] = Array(blanks).fill(null);
    for (let d = 1; d <= 31; d++) result.push(d);
    return result;
  }, []);

  const daysWithEvents = useMemo(
    () => new Set(calendarEvents.map((e) => e.day)),
    [calendarEvents]
  );

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
                d === selectedDay
                  ? "border-gold bg-gold/[0.14] text-bone"
                  : d === 1
                  ? "border-gold/40 text-bone-dim"
                  : "border-line text-bone-dim"
              }`}
              onClick={() => setSelectedDay(selectedDay === d ? null : d)}
            >
              <span>{d}</span>
              {daysWithEvents.has(d) && (
                <span className="absolute bottom-[7px] h-1 w-1 rounded-full bg-gold" />
              )}
            </div>
          )
        )}
      </div>
    </motion.div>
  );
}
