"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore, selectActiveDeadline } from "@/lib/store";
import { useUndoStore } from "@/lib/undo-toast";

// A date string ("YYYY-MM-DD") parsed with the local calendar fields it was
// built from, rather than Date parsing (which reads plain date strings as
// UTC midnight and can land a day off depending on the viewer's timezone).
function dateParts(dateStr: string): { day: number; month: number; year: number } {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { day, month: month - 1, year };
}

const DAYS_OF_WEEK = ["PZT", "SAL", "ÇAR", "PER", "CUM", "CMT", "PAZ"];
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// JS getDay() is Sunday-first (0-6) — this app's week starts Monday, so
// shift it into a 0(Mon)-6(Sun) index to know how many blank cells lead
// the grid.
function leadingBlanks(month: number, year: number): number {
  const jsDay = new Date(year, month, 1).getDay();
  return (jsDay + 6) % 7;
}

// Below lg the ImagePanel (and the day-detail panel that lives in it) is
// hidden, so the same select-a-day flow renders inline under the grid.
function MobileDayPanel({
  day,
  month,
  year,
  monthLabel,
  deadlineLabel,
}: {
  day: number;
  month: number;
  year: number;
  monthLabel: string;
  deadlineLabel?: string;
}) {
  const events = useStore((s) => s.calendarEvents);
  const addCalendarEvent = useStore((s) => s.addCalendarEvent);
  const removeCalendarEvent = useStore((s) => s.removeCalendarEvent);
  const restoreCalendarEvent = useStore((s) => s.restoreCalendarEvent);
  const showUndo = useUndoStore((s) => s.show);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  const dayEvents = events.filter((e) => e.day === day && e.month === month && e.year === year);

  const handleRemove = (id: string) => {
    const event = events.find((e) => e.id === id);
    removeCalendarEvent(id);
    if (event) showUndo("Etkinlik kaldırıldı", () => restoreCalendarEvent(event));
  };

  const handleAdd = () => {
    if (!draft.trim()) return;
    addCalendarEvent(day, month, year, draft.trim());
    setDraft("");
    setAdding(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bento-tile bento-gold relative mt-6 px-5 py-5 lg:hidden"
    >
      <div className="bento-orb" style={{ width: 110, height: 110, top: -35, right: -30 }} />
      <div>
        <div className="relative mb-3.5 flex items-center justify-between">
          <p className="text-[9.5px] uppercase tracking-[2.5px] text-[#e4c98f]">
            {monthLabel} {day}
          </p>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="text-[10px] uppercase tracking-[1.5px] text-white/60 transition-colors hover:text-[#e4c98f]"
            >
              + Ekle
            </button>
          )}
        </div>

        {deadlineLabel && (
          <p className="mb-2.5 flex items-center gap-1.5 text-[13px] text-[#e4c98f]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#e4c98f]" />
            {deadlineLabel} teslim
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          <AnimatePresence mode="popLayout">
            {dayEvents.map((e) => (
              <motion.div
                key={e.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.25 }}
                className="group flex items-center justify-between gap-2"
              >
                <p className="text-[13.5px] leading-relaxed text-bone">{e.text}</p>
                <button
                  onClick={() => handleRemove(e.id)}
                  className="text-[9.5px] uppercase tracking-[1.5px] text-muted opacity-60 hover:text-rose"
                >
                  Kaldır
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {dayEvents.length === 0 && !adding && (
            <p className="text-[13px] italic text-muted">
              Bu gün için bir şey planlanmadı.
            </p>
          )}

          {adding && (
            <div className="flex flex-col gap-2">
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") {
                    setAdding(false);
                    setDraft("");
                  }
                }}
                placeholder="Ne planlandı?"
                className="border-b border-white/15 bg-transparent pb-1.5 text-[13px] text-bone outline-none placeholder:text-muted focus:border-gold/50"
              />
              <div className="flex gap-3 text-[10px] uppercase tracking-[1.5px]">
                <button onClick={handleAdd} className="text-gold hover:text-bone">
                  Kaydet
                </button>
                <button
                  onClick={() => {
                    setAdding(false);
                    setDraft("");
                  }}
                  className="text-muted hover:text-bone-dim"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function CalendarView() {
  const selectedDay = useStore((s) => s.selectedCalendarDay);
  const setSelectedDay = useStore((s) => s.setSelectedCalendarDay);
  const calendarEvents = useStore((s) => s.calendarEvents);
  const collections = useStore((s) => s.collections);
  const viewMonth = useStore((s) => s.calendarViewMonth);
  const viewYear = useStore((s) => s.calendarViewYear);
  const shiftCalendarMonth = useStore((s) => s.shiftCalendarMonth);

  const monthLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

  const days = useMemo(() => {
    const blanks = leadingBlanks(viewMonth, viewYear);
    const result: (number | null)[] = Array(blanks).fill(null);
    const total = daysInMonth(viewMonth, viewYear);
    for (let d = 1; d <= total; d++) result.push(d);
    return result;
  }, [viewMonth, viewYear]);

  const eventsThisMonth = useMemo(
    () => calendarEvents.filter((e) => e.month === viewMonth && e.year === viewYear),
    [calendarEvents, viewMonth, viewYear]
  );

  const daysWithEvents = useMemo(
    () => new Set(eventsThisMonth.map((e) => e.day)),
    [eventsThisMonth]
  );

  // Same deadline Studio's "Next Deadline" card and Path's "Şimdi" section
  // read — surfaced on its actual date here instead of being invisible on
  // the calendar entirely.
  const deadline = useMemo(() => selectActiveDeadline(collections), [collections]);
  const deadlineParts = useMemo(
    () => (deadline ? dateParts(deadline.date) : null),
    [deadline]
  );
  const deadlineDayThisMonth =
    deadlineParts && deadlineParts.month === viewMonth && deadlineParts.year === viewYear
      ? deadlineParts.day
      : null;

  // Client-only — the server render can't know the viewer's actual date.
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => {
    const now = new Date();
    if (now.getFullYear() === viewYear && now.getMonth() === viewMonth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToday(now.getDate());
    } else {
      setToday(null);
    }
  }, [viewMonth, viewYear]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="lg:pr-14"
    >
      <div className="mb-5 flex items-baseline justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => shiftCalendarMonth(-1)}
            aria-label="Önceki ay"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-gold/40 hover:text-gold"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <p className="font-serif text-2xl italic">{monthLabel}</p>
            <p className="mt-1 text-[11px] text-muted">
              {eventsThisMonth.length} kayıt · {daysWithEvents.size} gün planlı
            </p>
          </div>
          <button
            onClick={() => shiftCalendarMonth(1)}
            aria-label="Sonraki ay"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-gold/40 hover:text-gold"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <p className="text-[9.5px] uppercase tracking-[3px] text-muted">
          Rituals & Deadlines
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
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
                  : d === today
                  ? "border-gold/40 text-bone"
                  : "border-line text-bone-dim"
              }`}
              onClick={() => setSelectedDay(selectedDay === d ? null : d)}
            >
              <span>{d}</span>
              {d === today && (
                <span className="absolute left-1.5 top-1.5 h-1 w-1 rounded-full bg-gold/60" />
              )}
              {d === deadlineDayThisMonth && (
                <span
                  className="absolute inset-0 rounded-[3px] ring-1 ring-[#e4c98f]/60"
                  title={`${deadline?.label} teslim`}
                />
              )}
              {daysWithEvents.has(d) && (
                <span className="absolute bottom-[7px] h-1 w-1 rounded-full bg-gold" />
              )}
            </div>
          )
        )}
      </div>

      <AnimatePresence>
        {selectedDay && (
          <MobileDayPanel
            key={`${viewYear}-${viewMonth}-${selectedDay}`}
            day={selectedDay}
            month={viewMonth}
            year={viewYear}
            monthLabel={MONTH_NAMES[viewMonth]}
            deadlineLabel={selectedDay === deadlineDayThisMonth ? deadline?.label : undefined}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
