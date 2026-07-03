import type { StateCreator } from "zustand";
import type { MaisonStore } from "./index";
import type { CalendarEvent } from "./types";

export interface CalendarSlice {
  // Calendar — day-keyed events plus which day is currently open in the
  // right-panel detail view (shared between the grid and ImagePanel).
  // The viewed month/year lives here too (not component-local state) so
  // the grid and the ImagePanel's right-side detail view — two separate
  // components — always agree on which month they're both looking at.
  calendarEvents: CalendarEvent[];
  selectedCalendarDay: number | null;
  setSelectedCalendarDay: (day: number | null) => void;
  addCalendarEvent: (day: number, month: number, year: number, text: string) => void;
  removeCalendarEvent: (id: string) => void;
  restoreCalendarEvent: (e: CalendarEvent) => void;
  calendarViewMonth: number;
  calendarViewYear: number;
  shiftCalendarMonth: (delta: number) => void;
}

export const createCalendarSlice: StateCreator<MaisonStore, [], [], CalendarSlice> = (
  set
) => ({
  calendarEvents: [
    { id: "ce1", day: 1, month: 6, year: 2026, text: "Brief · Croquis taslakları" },
    { id: "ce2", day: 1, month: 6, year: 2026, text: "Ritual · Sabah incelemesi" },
    { id: "ce3", day: 4, month: 6, year: 2026, text: "Deadline · Koleksiyon III" },
    { id: "ce4", day: 9, month: 6, year: 2026, text: "Creative Challenge" },
    { id: "ce5", day: 14, month: 6, year: 2026, text: "Fitting · Prova günü" },
  ],
  selectedCalendarDay: null,
  setSelectedCalendarDay: (day) => set({ selectedCalendarDay: day }),
  addCalendarEvent: (day, month, year, text) =>
    set((s) => ({
      calendarEvents: [...s.calendarEvents, { id: `ce${Date.now()}`, day, month, year, text }],
    })),
  removeCalendarEvent: (id) =>
    set((s) => ({
      calendarEvents: s.calendarEvents.filter((e) => e.id !== id),
    })),
  restoreCalendarEvent: (e) =>
    set((s) => ({ calendarEvents: [...s.calendarEvents, e] })),

  // Seeded on July 2026 to match the demo events above — shiftCalendarMonth
  // handles the year rollover at either edge.
  calendarViewMonth: 6,
  calendarViewYear: 2026,
  shiftCalendarMonth: (delta) =>
    set((s) => {
      const total = s.calendarViewMonth + delta;
      const year = s.calendarViewYear + Math.floor(total / 12);
      const month = ((total % 12) + 12) % 12;
      return { calendarViewMonth: month, calendarViewYear: year, selectedCalendarDay: null };
    }),
});
