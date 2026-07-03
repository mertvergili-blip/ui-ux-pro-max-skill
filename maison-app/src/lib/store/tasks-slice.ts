import type { StateCreator } from "zustand";
import type { MaisonStore } from "./index";
import type { Task, Subtask } from "./types";

export interface TasksSlice {
  tasks: Task[];
  toggleTask: (id: string) => void;
  addTask: (text: string) => void;
  removeTask: (id: string) => void;
  restoreTask: (task: Task, index: number) => void;
  setTaskEstimate: (id: string, minutes: number | undefined) => void;
  setTaskSubtasks: (id: string, subtasks: Subtask[]) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;

  // Persisted (not just in-memory) — a countdown expressed as an absolute
  // end timestamp survives a reload/tab-close naturally: reopening the app
  // just re-derives "time left" from now vs. that timestamp, instead of
  // the whole session silently vanishing the moment the tab closes.
  focusTaskId: string | null;
  focusEndsAt: number | null;
  startFocusTask: (id: string, minutes: number) => void;
  extendFocusTimer: (minutes: number) => void;
  setFocusTask: (id: string | null) => void;
}

export const createTasksSlice: StateCreator<MaisonStore, [], [], TasksSlice> = (set) => ({
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
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
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
});
