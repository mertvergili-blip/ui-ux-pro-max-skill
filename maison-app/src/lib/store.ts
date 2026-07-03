"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { localClassify, type SuggestionType } from "./classify";
import { dbStorage } from "./db-storage";
import { selectDaysRemaining, selectUrgency, todayKey } from "./deadline";
import { selectCurrentStreak, selectBestStreak } from "./streak";

export { selectDaysRemaining, selectUrgency };

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

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  idx: string;
  text: string;
  done: boolean;
  estimatedMinutes?: number;
  subtasks?: Subtask[];
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
  imageUrl?: string; // real fabric photo, when uploaded — falls back to colorTag dot
  createdAt: number;
  linkedCollectionIds?: string[]; // which projects this fabric is used in
}

export interface IterationEntry {
  id: string;
  collectionId: string;
  whatDidntWork: string;
  why: string;
  createdAt: number;
}

export interface ProjectImage {
  id: string;
  dataUrl: string;
  insight?: string; // AI's read on the photo, once analyzed
  createdAt: number;
}

export interface CollectionFolder {
  id: string;
  name: string;
  status: string;
  accent: string;
  count: number;
  sub: string;
  images?: ProjectImage[]; // moodboard / manipulation / reference photos
}

export interface CalendarEvent {
  id: string;
  day: number;
  month: number; // 0-indexed, matches Date.getMonth()
  year: number;
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
  removeTask: (id: string) => void;
  restoreTask: (task: Task, index: number) => void;
  setTaskEstimate: (id: string, minutes: number | undefined) => void;
  setTaskSubtasks: (id: string, subtasks: Subtask[]) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;

  // The task currently held in a Focus session (single-task mode) — not
  // persisted, resets on reload, since it's a "right now" concept.
  // Persisted (not just in-memory) — a countdown expressed as an absolute
  // end timestamp survives a reload/tab-close naturally: reopening the app
  // just re-derives "time left" from now vs. that timestamp, instead of
  // the whole session silently vanishing the moment the tab closes.
  focusTaskId: string | null;
  focusEndsAt: number | null;
  startFocusTask: (id: string, minutes: number) => void;
  extendFocusTimer: (minutes: number) => void;
  setFocusTask: (id: string | null) => void;

  streak: number;
  bestStreak: number;

  // Next deadline — drives both the Studio stat and the ambient urgency tint
  deadlineLabel: string;
  deadlineDate: string; // YYYY-MM-DD

  // AI notes log (confirmed suggestions land here, or in their target slice)
  notes: AiNote[];

  // Material library
  materials: Material[];
  addMaterial: (m: Omit<Material, "id" | "createdAt">) => void;
  removeMaterial: (id: string) => void;
  restoreMaterial: (m: Material) => void;
  setMaterialImage: (id: string, imageUrl: string) => void;
  toggleMaterialCollectionLink: (materialId: string, collectionId: string) => void;

  // Mistake/iteration log — per collection
  iterationLogs: IterationEntry[];
  addIterationEntry: (e: Omit<IterationEntry, "id" | "createdAt">) => void;
  removeIterationEntry: (id: string) => void;
  restoreIterationEntry: (e: IterationEntry) => void;

  // Capsule Day Challenge — tracks which day-challenges were marked done
  completedCapsuleIds: string[];
  toggleCapsuleComplete: (id: string) => void;

  // Collections — projects/folders, user-extensible beyond the seeded three
  collections: CollectionFolder[];
  addCollection: (c: Omit<CollectionFolder, "id" | "count">) => void;
  removeCollection: (id: string) => void;
  restoreCollection: (c: CollectionFolder, index: number) => void;
  addProjectImage: (folderId: string, dataUrl: string) => void;
  removeProjectImage: (folderId: string, imageId: string) => void;
  restoreProjectImage: (folderId: string, image: ProjectImage) => void;
  setProjectImageInsight: (folderId: string, imageId: string, insight: string) => void;

  // Which collection was last drilled into — read on CollectionsView mount
  // so switching away mid-task (to check Journal, say) and back drops you
  // right where you left off instead of back at the grid.
  lastOpenedCollectionId: string | null;
  setLastOpenedCollection: (id: string | null) => void;

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

  // Runway — user-saved reference photos for the Runway right-panel carousel.
  // Real photography can't be auto-fetched (Vogue/WWD/Instagram all block
  // bot access), so this is a personal upload archive instead.
  runwayPhotos: RunwayPhoto[];
  addRunwayPhoto: (p: Omit<RunwayPhoto, "id" | "createdAt">) => void;
  removeRunwayPhoto: (id: string) => void;
  restoreRunwayPhoto: (p: RunwayPhoto) => void;

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
      removeTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      restoreTask: (task, index) =>
        set((s) => {
          const next = [...s.tasks];
          next.splice(Math.min(index, next.length), 0, task);
          return { tasks: next };
        }),
      setTaskEstimate: (id, minutes) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, estimatedMinutes: minutes } : t)),
        })),
      setTaskSubtasks: (id, subtasks) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, subtasks } : t)),
        })),
      toggleSubtask: (taskId, subtaskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: (t.subtasks ?? []).map((st) =>
                    st.id === subtaskId ? { ...st, done: !st.done } : st
                  ),
                }
              : t
          ),
        })),

      focusTaskId: null,
      focusEndsAt: null,
      startFocusTask: (id, minutes) =>
        set({ focusTaskId: id, focusEndsAt: Date.now() + minutes * 60000 }),
      extendFocusTimer: (minutes) =>
        set((s) => ({
          focusEndsAt: Math.max(Date.now(), s.focusEndsAt ?? Date.now()) + minutes * 60000,
        })),
      setFocusTask: (id) => set({ focusTaskId: id, focusEndsAt: id ? Date.now() + 15 * 60000 : null }),

      streak: 12,
      bestStreak: 12,

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
      restoreMaterial: (m) =>
        set((s) => ({ materials: [m, ...s.materials] })),
      setMaterialImage: (id, imageUrl) =>
        set((s) => ({
          materials: s.materials.map((m) => (m.id === id ? { ...m, imageUrl } : m)),
        })),
      toggleMaterialCollectionLink: (materialId, collectionId) =>
        set((s) => ({
          materials: s.materials.map((m) => {
            if (m.id !== materialId) return m;
            const linked = m.linkedCollectionIds ?? [];
            return {
              ...m,
              linkedCollectionIds: linked.includes(collectionId)
                ? linked.filter((id) => id !== collectionId)
                : [...linked, collectionId],
            };
          }),
        })),

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
      restoreIterationEntry: (e) =>
        set((s) => ({ iterationLogs: [e, ...s.iterationLogs] })),

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
      restoreCollection: (c, index) =>
        set((s) => {
          const next = [...s.collections];
          next.splice(Math.min(index, next.length), 0, c);
          return { collections: next };
        }),
      addProjectImage: (folderId, dataUrl) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === folderId
              ? {
                  ...c,
                  images: [
                    ...(c.images ?? []),
                    { id: `img${Date.now()}`, dataUrl, createdAt: Date.now() },
                  ],
                }
              : c
          ),
        })),
      removeProjectImage: (folderId, imageId) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === folderId
              ? { ...c, images: (c.images ?? []).filter((img) => img.id !== imageId) }
              : c
          ),
        })),
      restoreProjectImage: (folderId, image) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === folderId ? { ...c, images: [...(c.images ?? []), image] } : c
          ),
        })),
      setProjectImageInsight: (folderId, imageId, insight) =>
        set((s) => ({
          collections: s.collections.map((c) =>
            c.id === folderId
              ? {
                  ...c,
                  images: (c.images ?? []).map((img) =>
                    img.id === imageId ? { ...img, insight } : img
                  ),
                }
              : c
          ),
        })),

      lastOpenedCollectionId: null,
      setLastOpenedCollection: (id) => set({ lastOpenedCollectionId: id }),

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
          calendarEvents: [
            ...s.calendarEvents,
            { id: `ce${Date.now()}`, day, month, year, text },
          ],
        })),
      removeCalendarEvent: (id) =>
        set((s) => ({
          calendarEvents: s.calendarEvents.filter((e) => e.id !== id),
        })),
      restoreCalendarEvent: (e) =>
        set((s) => ({ calendarEvents: [...s.calendarEvents, e] })),

      // Seeded on July 2026 to match the existing demo events above —
      // shiftCalendarMonth handles the year rollover at either edge.
      calendarViewMonth: 6,
      calendarViewYear: 2026,
      shiftCalendarMonth: (delta) =>
        set((s) => {
          const total = s.calendarViewMonth + delta;
          const year = s.calendarViewYear + Math.floor(total / 12);
          const month = ((total % 12) + 12) % 12;
          return { calendarViewMonth: month, calendarViewYear: year, selectedCalendarDay: null };
        }),

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
      restoreRunwayPhoto: (p) =>
        set((s) => ({ runwayPhotos: [p, ...s.runwayPhotos] })),

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

      quarterlyReviewText: null,
      quarterlyReviewGeneratedAt: null,
      setQuarterlyReview: (text) =>
        set({ quarterlyReviewText: text, quarterlyReviewGeneratedAt: Date.now() }),
    }),
    {
      name: "maison-storage",
      storage: createJSONStorage(() => dbStorage),
      partialize: (s) => ({
        tasks: s.tasks,
        notes: s.notes,
        journalEntries: s.journalEntries,
        streak: s.streak,
        bestStreak: s.bestStreak,
        materials: s.materials,
        iterationLogs: s.iterationLogs,
        completedCapsuleIds: s.completedCapsuleIds,
        quarterlyReviewText: s.quarterlyReviewText,
        quarterlyReviewGeneratedAt: s.quarterlyReviewGeneratedAt,
        collections: s.collections,
        calendarEvents: s.calendarEvents,
        calendarViewMonth: s.calendarViewMonth,
        calendarViewYear: s.calendarViewYear,
        runwayPhotos: s.runwayPhotos,
        lastOpenedCollectionId: s.lastOpenedCollectionId,
        focusTaskId: s.focusTaskId,
        focusEndsAt: s.focusEndsAt,
      }),
    }
  )
);
