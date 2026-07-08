"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { dbStorage } from "../db-storage";
import { selectDaysRemaining, selectUrgency, selectActiveDeadline } from "../deadline";

import { createShellSlice, type ShellSlice } from "./shell-slice";
import { createTasksSlice, type TasksSlice } from "./tasks-slice";
import { createJournalSlice, type JournalSlice } from "./journal-slice";
import { createCollectionsSlice, type CollectionsSlice } from "./collections-slice";
import { createMaterialsSlice, type MaterialsSlice } from "./materials-slice";
import { createCalendarSlice, type CalendarSlice } from "./calendar-slice";
import { createRunwaySlice, type RunwaySlice } from "./runway-slice";
import { createAiPanelSlice, type AiPanelSlice } from "./ai-panel-slice";
import { createMiscSlice, type MiscSlice } from "./misc-slice";

export { selectDaysRemaining, selectUrgency, selectActiveDeadline };
export { selectTodayEntry, selectCreativeEnergy } from "./journal-slice";

export type {
  ViewName,
  MoodKey,
  Subtask,
  Task,
  JournalDay,
  AiNote,
  PendingSuggestion,
  Material,
  IterationEntry,
  ProjectNote,
  ProjectImage,
  CollectionFolder,
  CalendarEvent,
  RunwayPhoto,
  SuggestionType,
} from "./types";

// The store is composed from one slice per domain (see the individual
// *-slice.ts files) rather than one flat 600+ line object — each slice
// owns its own piece of state/actions and can be read in isolation, while
// still living in a single zustand store so any slice's actions can call
// into another's (see confirmSuggestion's get().addTask/setTodayMood).
// This file is the only place that composes them, plus the persistence
// config, which needs the full picture of what to save.
export interface MaisonStore
  extends ShellSlice,
    TasksSlice,
    JournalSlice,
    CollectionsSlice,
    MaterialsSlice,
    CalendarSlice,
    RunwaySlice,
    AiPanelSlice,
    MiscSlice {}

export const useStore = create<MaisonStore>()(
  persist(
    (...a) => ({
      ...createShellSlice(...a),
      ...createTasksSlice(...a),
      ...createJournalSlice(...a),
      ...createCollectionsSlice(...a),
      ...createMaterialsSlice(...a),
      ...createCalendarSlice(...a),
      ...createRunwaySlice(...a),
      ...createAiPanelSlice(...a),
      ...createMiscSlice(...a),
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
        projectNotes: s.projectNotes,
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
