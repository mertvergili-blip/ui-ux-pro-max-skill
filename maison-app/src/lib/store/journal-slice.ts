import type { StateCreator } from "zustand";
import type { MaisonStore } from "./index";
import type { JournalDay, MoodKey } from "./types";
import { MOOD_ENERGY } from "./types";
import { todayKey } from "../deadline";
import { selectCurrentStreak, selectBestStreak } from "../streak";

export interface JournalSlice {
  journalEntries: JournalDay[];
  setTodayMood: (mood: MoodKey) => void;
  setTodayReflection: (text: string) => void;

  streak: number;
  bestStreak: number;

  // Quarterly self-review — a deliberate, manually-triggered longer-horizon
  // reflection (vs. the always-on Weekly Editor Letter)
  quarterlyReviewText: string | null;
  quarterlyReviewGeneratedAt: number | null;
  setQuarterlyReview: (text: string) => void;
}

export function selectTodayEntry(journalEntries: JournalDay[]): JournalDay {
  const key = todayKey();
  return (
    journalEntries.find((e) => e.date === key) ?? {
      date: key,
      mood: null,
      reflection: "",
    }
  );
}

export function selectCreativeEnergy(journalEntries: JournalDay[]): string {
  const entry = selectTodayEntry(journalEntries);
  return entry.mood ? MOOD_ENERGY[entry.mood] : "Flowing";
}

export const createJournalSlice: StateCreator<MaisonStore, [], [], JournalSlice> = (set) => ({
  journalEntries: [],
  setTodayMood: (mood) =>
    set((s) => {
      const key = todayKey();
      const existing = s.journalEntries.find((e) => e.date === key);
      const journalEntries = existing
        ? s.journalEntries.map((e) => (e.date === key ? { ...e, mood } : e))
        : [...s.journalEntries, { date: key, mood, reflection: "" }];
      return {
        journalEntries,
        streak: selectCurrentStreak(journalEntries),
        bestStreak: selectBestStreak(journalEntries, s.bestStreak),
      };
    }),
  setTodayReflection: (text) =>
    set((s) => {
      const key = todayKey();
      const existing = s.journalEntries.find((e) => e.date === key);
      const journalEntries = existing
        ? s.journalEntries.map((e) => (e.date === key ? { ...e, reflection: text } : e))
        : [...s.journalEntries, { date: key, mood: null, reflection: text }];
      return {
        journalEntries,
        streak: selectCurrentStreak(journalEntries),
        bestStreak: selectBestStreak(journalEntries, s.bestStreak),
      };
    }),

  streak: 12,
  bestStreak: 12,

  quarterlyReviewText: null,
  quarterlyReviewGeneratedAt: null,
  setQuarterlyReview: (text) =>
    set({ quarterlyReviewText: text, quarterlyReviewGeneratedAt: Date.now() }),
});
