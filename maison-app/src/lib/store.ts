"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { localClassify, type SuggestionType } from "./classify";

export type { SuggestionType };

export type ViewName =
  | "studio"
  | "calendar"
  | "collections"
  | "path"
  | "journal"
  | "runway"
  | "dna"
  | "materials";

export type MoodKey = "flowing" | "calm" | "stressed" | "grounded" | "tired";

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

export interface Material {
  id: string;
  name: string;
  supplier: string;
  costNote: string;
  sampleNote: string;
  colorTag: string; // hex or css color, used as the swatch
  createdAt: number;
}

export interface IterationEntry {
  id: string;
  collectionId: string;
  whatDidntWork: string;
  why: string;
  createdAt: number;
}

export interface CollectionFolder {
  id: string;
  name: string;
  status: string;
  accent: string;
  count: number;
  sub: string;
}

export interface CalendarEvent {
  id: string;
  day: number;
  text: string;
}

export interface RunwayPhoto {
  id: string;
  dataUrl: string;
  designer: string;
  season: string;
  createdAt: number;
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

export function selectDaysRemaining(deadlineDate: string): number {
  const deadline = new Date(deadlineDate + "T00:00:00");
  const today = new Date(todayKey() + "T00:00:00");
  return Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / 86400000));
}

// 0 = calm/cool, 1 = maximum urgency/warm — drives the ambient tint, not any banner
export function selectUrgency(deadlineDate: string): number {
  const daysLeft = selectDaysRemaining(deadlineDate);
  const URGENCY_WINDOW = 10; // days out where urgency starts ramping in
  return Math.max(0, Math.min(1, 1 - daysLeft / URGENCY_WINDOW));
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

  // Next deadline — drives both the Studio stat and the ambient urgency tint
  deadlineLabel: string;
  deadlineDate: string; // YYYY-MM-DD

  // AI notes log (confirmed suggestions land here, or in their target slice)
  notes: AiNote[];

  // Material library
  materials: Material[];
  addMaterial: (m: Omit<Material, "id" | "createdAt">) => void;
  removeMaterial: (id: string) => void;

  // Mistake/iteration log — per collection
  iterationLogs: IterationEntry[];
  addIterationEntry: (e: Omit<IterationEntry, "id" | "createdAt">) => void;
  removeIterationEntry: (id: string) => void;

  // Capsule Day Challenge — tracks which day-challenges were marked done
  completedCapsuleIds: string[];
  toggleCapsuleComplete: (id: string) => void;

  // Collections — projects/folders, user-extensible beyond the seeded three
  collections: CollectionFolder[];
  addCollection: (c: Omit<CollectionFolder, "id" | "count">) => void;
  removeCollection: (id: string) => void;

  // Calendar — day-keyed events plus which day is currently open in the
  // right-panel detail view (shared between the grid and ImagePanel)
  calendarEvents: CalendarEvent[];
  selectedCalendarDay: number | null;
  setSelectedCalendarDay: (day: number | null) => void;
  addCalendarEvent: (day: number, text: string) => void;
  removeCalendarEvent: (id: string) => void;

  // Runway — user-saved reference photos for the Runway right-panel carousel.
  // Real photography can't be auto-fetched (Vogue/WWD/Instagram all block
  // bot access), so this is a personal upload archive instead.
  runwayPhotos: RunwayPhoto[];
  addRunwayPhoto: (p: Omit<RunwayPhoto, "id" | "createdAt">) => void;
  removeRunwayPhoto: (id: string) => void;

  // AI Studio panel
  aiPanelOpen: boolean;
  toggleAiPanel: () => void;
  pendingSuggestion: PendingSuggestion | null;
  suggestionLoading: boolean;
  proposeSuggestion: (input: string) => Promise<void>;
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

      deadlineLabel: "Koleksiyon III",
      deadlineDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 6);
        return d.toISOString().slice(0, 10);
      })(),

      notes: [],

      materials: [],
      addMaterial: (m) =>
        set((s) => ({
          materials: [
            { ...m, id: `mat${Date.now()}`, createdAt: Date.now() },
            ...s.materials,
          ],
        })),
      removeMaterial: (id) =>
        set((s) => ({ materials: s.materials.filter((m) => m.id !== id) })),

      iterationLogs: [],
      addIterationEntry: (e) =>
        set((s) => ({
          iterationLogs: [
            { ...e, id: `iter${Date.now()}`, createdAt: Date.now() },
            ...s.iterationLogs,
          ],
        })),
      removeIterationEntry: (id) =>
        set((s) => ({
          iterationLogs: s.iterationLogs.filter((e) => e.id !== id),
        })),

      completedCapsuleIds: [],
      toggleCapsuleComplete: (id) =>
        set((s) => ({
          completedCapsuleIds: s.completedCapsuleIds.includes(id)
            ? s.completedCapsuleIds.filter((c) => c !== id)
            : [...s.completedCapsuleIds, id],
        })),

      collections: [
        {
          id: "terre-or",
          name: "Koleksiyon III — Terre & Or",
          status: "In Progress",
          accent: "var(--color-gold)",
          count: 12,
          sub: "6 gün kaldı",
        },
        {
          id: "verre-bleu",
          name: "Koleksiyon II — Verre Bleu",
          status: "Archived",
          accent: "var(--color-blue)",
          count: 9,
          sub: "Mart 2026",
        },
        {
          id: "rose-poudre",
          name: "Koleksiyon I — Rosé Poudré",
          status: "Archived",
          accent: "var(--color-rose)",
          count: 7,
          sub: "Okul projesi",
        },
      ],
      addCollection: (c) =>
        set((s) => ({
          collections: [...s.collections, { ...c, id: `col${Date.now()}`, count: 0 }],
        })),
      removeCollection: (id) =>
        set((s) => ({ collections: s.collections.filter((c) => c.id !== id) })),

      calendarEvents: [
        { id: "ce1", day: 1, text: "Brief · Croquis taslakları" },
        { id: "ce2", day: 1, text: "Ritual · Sabah incelemesi" },
        { id: "ce3", day: 4, text: "Deadline · Koleksiyon III" },
        { id: "ce4", day: 9, text: "Creative Challenge" },
        { id: "ce5", day: 14, text: "Fitting · Prova günü" },
      ],
      selectedCalendarDay: null,
      setSelectedCalendarDay: (day) => set({ selectedCalendarDay: day }),
      addCalendarEvent: (day, text) =>
        set((s) => ({
          calendarEvents: [
            ...s.calendarEvents,
            { id: `ce${Date.now()}`, day, text },
          ],
        })),
      removeCalendarEvent: (id) =>
        set((s) => ({
          calendarEvents: s.calendarEvents.filter((e) => e.id !== id),
        })),

      runwayPhotos: [],
      addRunwayPhoto: (p) =>
        set((s) => ({
          runwayPhotos: [
            { ...p, id: `rw${Date.now()}`, createdAt: Date.now() },
            ...s.runwayPhotos,
          ],
        })),
      removeRunwayPhoto: (id) =>
        set((s) => ({
          runwayPhotos: s.runwayPhotos.filter((p) => p.id !== id),
        })),

      aiPanelOpen: false,
      toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
      pendingSuggestion: null,
      suggestionLoading: false,
      proposeSuggestion: async (input) => {
        if (!input.trim()) return;
        set({ suggestionLoading: true });

        let result: { type: SuggestionType; content: string };
        try {
          const res = await fetch("/api/classify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: input }),
          });
          if (!res.ok) throw new Error("classify request failed");
          result = await res.json();
        } catch {
          result = localClassify(input);
        }

        // The input may have changed (or the panel closed) while the
        // request was in flight — only apply a result that's still relevant.
        if (get().suggestionLoading) {
          set({
            pendingSuggestion: { ...result, rawInput: input },
            suggestionLoading: false,
          });
        }
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
      cancelSuggestion: () =>
        set({ pendingSuggestion: null, suggestionLoading: false }),

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
        materials: s.materials,
        iterationLogs: s.iterationLogs,
        completedCapsuleIds: s.completedCapsuleIds,
        collections: s.collections,
        calendarEvents: s.calendarEvents,
        runwayPhotos: s.runwayPhotos,
      }),
    }
  )
);
