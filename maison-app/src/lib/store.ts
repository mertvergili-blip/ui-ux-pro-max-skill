"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ViewName =
  | "studio"
  | "calendar"
  | "collections"
  | "path"
  | "journal"
  | "runway"
  | "dna";

export type MoodKey = "flowing" | "calm" | "stressed" | "grounded" | "tired";

export type SuggestionType =
  | "task"
  | "idea"
  | "note"
  | "mood"
  | "deadline"
  | "calendar";

export interface Task {
  id: string;
  idx: string;
  text: string;
  done: boolean;
}

export interface JournalDay {
  date: string; // YYYY-MM-DD
  mood: MoodKey | null;
  reflection: string;
}

export interface AiNote {
  id: string;
  type: SuggestionType;
  content: string;
  createdAt: number;
}

export interface PendingSuggestion {
  type: SuggestionType;
  content: string;
  rawInput: string;
}

const MOOD_ENERGY: Record<MoodKey, string> = {
  flowing: "Flowing",
  calm: "Calm",
  grounded: "Grounded",
  tired: "Low",
  stressed: "Tense",
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

interface MaisonStore {
  currentView: ViewName;
  setView: (view: ViewName) => void;

  introVisible: boolean;
  dismissIntro: () => void;

  mousePos: { x: number; y: number };
  setMousePos: (x: number, y: number) => void;

  // Studio tasks
  tasks: Task[];
  toggleTask: (id: string) => void;
  addTask: (text: string) => void;

  streak: number;

  // AI notes log (confirmed suggestions land here, or in their target slice)
  notes: AiNote[];

  // AI Studio panel
  aiPanelOpen: boolean;
  toggleAiPanel: () => void;
  pendingSuggestion: PendingSuggestion | null;
  proposeSuggestion: (input: string) => void;
  updatePendingContent: (content: string) => void;
  confirmSuggestion: () => void;
  cancelSuggestion: () => void;

  // Journal
  journalEntries: JournalDay[];
  setTodayMood: (mood: MoodKey) => void;
  setTodayReflection: (text: string) => void;
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

function classify(input: string): { type: SuggestionType; content: string } {
  const text = input.trim();
  const lower = text.toLowerCase();

  if (
    /\b(teslim|deadline|son gün|yetiştir)\b/.test(lower) ||
    /\d{1,2}\s?(temmuz|ağustos|eylül|gün)/.test(lower)
  ) {
    return { type: "deadline", content: text };
  }
  if (/\b(hissediyorum|moral|enerji|yorgun|stresli|sakin)\b/.test(lower)) {
    return { type: "mood", content: text };
  }
  if (/\b(randevu|toplantı|görüşme|saat \d)/.test(lower)) {
    return { type: "calendar", content: text };
  }
  if (
    /\b(yapmalıyım|tamamla|bitir|gönder|hazırla|çiz|topla)\b/.test(lower) ||
    /^(brief|ritual|creative challenge)/i.test(text)
  ) {
    return { type: "task", content: text };
  }
  if (/\b(fikir|ne olsa|belki|konsept)\b/.test(lower)) {
    return { type: "idea", content: text };
  }
  return { type: "note", content: text };
}

export const useStore = create<MaisonStore>()(
  persist(
    (set, get) => ({
      currentView: "studio",
      setView: (view) => set({ currentView: view }),

      introVisible: true,
      dismissIntro: () => set({ introVisible: false }),

      mousePos: { x: 0.5, y: 0.5 },
      setMousePos: (x, y) => set({ mousePos: { x, y } }),

      tasks: [
        { id: "t1", idx: "01", text: "Brief · Croquis taslaklarını tamamla", done: false },
        { id: "t2", idx: "02", text: "Ritual · Sabah moodboard incelemesi", done: true },
        { id: "t3", idx: "03", text: "Creative Challenge · 3 yeni referans topla", done: false },
      ],
      toggleTask: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        })),
      addTask: (text) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              id: `t${Date.now()}`,
              idx: String(s.tasks.length + 1).padStart(2, "0"),
              text,
              done: false,
            },
          ],
        })),

      streak: 12,

      notes: [],

      aiPanelOpen: false,
      toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
      pendingSuggestion: null,
      proposeSuggestion: (input) => {
        if (!input.trim()) return;
        const { type, content } = classify(input);
        set({ pendingSuggestion: { type, content, rawInput: input } });
      },
      updatePendingContent: (content) =>
        set((s) =>
          s.pendingSuggestion
            ? { pendingSuggestion: { ...s.pendingSuggestion, content } }
            : {}
        ),
      confirmSuggestion: () => {
        const s = get();
        const p = s.pendingSuggestion;
        if (!p) return;

        if (p.type === "task") {
          get().addTask(p.content);
        } else if (p.type === "mood") {
          const moodGuess = (Object.keys(MOOD_ENERGY) as MoodKey[]).find((m) =>
            p.content.toLowerCase().includes(m)
          );
          if (moodGuess) get().setTodayMood(moodGuess);
        } else {
          set((st) => ({
            notes: [
              ...st.notes,
              { id: `n${Date.now()}`, type: p.type, content: p.content, createdAt: Date.now() },
            ],
          }));
        }
        set({ pendingSuggestion: null });
      },
      cancelSuggestion: () => set({ pendingSuggestion: null }),

      journalEntries: [],
      setTodayMood: (mood) =>
        set((s) => {
          const key = todayKey();
          const existing = s.journalEntries.find((e) => e.date === key);
          if (existing) {
            return {
              journalEntries: s.journalEntries.map((e) =>
                e.date === key ? { ...e, mood } : e
              ),
            };
          }
          return {
            journalEntries: [...s.journalEntries, { date: key, mood, reflection: "" }],
          };
        }),
      setTodayReflection: (text) =>
        set((s) => {
          const key = todayKey();
          const existing = s.journalEntries.find((e) => e.date === key);
          if (existing) {
            return {
              journalEntries: s.journalEntries.map((e) =>
                e.date === key ? { ...e, reflection: text } : e
              ),
            };
          }
          return {
            journalEntries: [
              ...s.journalEntries,
              { date: key, mood: null, reflection: text },
            ],
          };
        }),
    }),
    {
      name: "maison-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        tasks: s.tasks,
        notes: s.notes,
        journalEntries: s.journalEntries,
        streak: s.streak,
      }),
    }
  )
);
