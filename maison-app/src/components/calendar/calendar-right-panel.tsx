"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { useUndoStore } from "@/lib/undo-toast";

const EASE = [0.32, 0.72, 0, 1] as const;
const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function CalendarRightPanel() {
  const selectedDay = useStore((s) => s.selectedCalendarDay);
  const events = useStore((s) => s.calendarEvents);
  const addCalendarEvent = useStore((s) => s.addCalendarEvent);
  const removeCalendarEvent = useStore((s) => s.removeCalendarEvent);
  const restoreCalendarEvent = useStore((s) => s.restoreCalendarEvent);
  const showUndo = useUndoStore((s) => s.show);
  const viewMonth = useStore((s) => s.calendarViewMonth);
  const viewYear = useStore((s) => s.calendarViewYear);

  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  if (!selectedDay) {
    return (
      <motion.div
        key="calendar-empty"
        initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
        transition={{ duration: 0.5, ease: EASE }}
        className="max-w-[240px] text-right"
      >
        <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[9.5px] uppercase tracking-[2.5px] text-bone-dim backdrop-blur-sm">
          Rituals
        </p>
        <p className="font-serif text-lg italic leading-snug text-bone-dim">
          Bir gün seç, o günün planını burada gör ve düzenle.
        </p>
      </motion.div>
    );
  }

  const dayEvents = events.filter(
    (e) => e.day === selectedDay && e.month === viewMonth && e.year === viewYear
  );

  const handleAdd = () => {
    if (!draft.trim()) return;
    addCalendarEvent(selectedDay, viewMonth, viewYear, draft.trim());
    setDraft("");
    setAdding(false);
  };

  const handleRemove = (id: string) => {
    const event = events.find((e) => e.id === id);
    removeCalendarEvent(id);
    if (event) showUndo("Etkinlik kaldırıldı", () => restoreCalendarEvent(event));
  };

  return (
    <motion.div
      key={`calendar-day-${selectedDay}`}
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
      transition={{ duration: 0.5, ease: EASE }}
      className="w-[280px] text-right"
    >
      <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[9.5px] uppercase tracking-[2.5px] text-bone-dim backdrop-blur-sm">
        {MONTH_NAMES[viewMonth]} {selectedDay}
      </p>

      <div className="flex flex-col items-end gap-2.5">
        <AnimatePresence mode="popLayout">
          {dayEvents.map((e) => (
            <motion.div
              key={e.id}
              layout
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
              className="group flex items-center gap-2"
            >
              <button
                onClick={() => handleRemove(e.id)}
                className="text-[9.5px] uppercase tracking-[1.5px] text-muted opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
              >
                Kaldır
              </button>
              <p className="text-[13.5px] leading-relaxed text-bone">{e.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>

        {dayEvents.length === 0 && !adding && (
          <p className="text-[13px] italic text-muted">
            Bu gün için bir şey planlanmadı.
          </p>
        )}

        <AnimatePresence mode="wait">
          {adding ? (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full flex-col items-end gap-2"
            >
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
                className="w-full border-b border-white/15 bg-transparent pb-1.5 text-right text-[13px] text-bone outline-none placeholder:text-muted focus:border-gold/50"
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
            </motion.div>
          ) : (
            <motion.button
              key="trigger"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAdding(true)}
              className="text-[10.5px] uppercase tracking-[1.5px] text-muted transition-colors hover:text-gold"
            >
              + Ekle
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
