"use client";

import { create } from "zustand";

interface PendingUndo {
  id: number;
  label: string;
  undo: () => void;
}

interface UndoStore {
  // A stack, not a single slot — deleting two things in quick succession
  // (easy to do impulsively) shouldn't silently drop the first offer.
  queue: PendingUndo[];
  show: (label: string, undo: () => void) => void;
  dismiss: (id: number) => void;
  runUndo: (id: number) => void;
}

// Deliberately not persisted — an undo offer only makes sense for the
// action that just happened in this session, not something to resurrect
// after a reload.
export const useUndoStore = create<UndoStore>((set, get) => ({
  queue: [],
  show: (label, undo) =>
    set((s) => ({ queue: [...s.queue, { id: Date.now() + Math.random(), label, undo }] })),
  dismiss: (id) => set((s) => ({ queue: s.queue.filter((p) => p.id !== id) })),
  runUndo: (id) => {
    const item = get().queue.find((p) => p.id === id);
    if (!item) return;
    item.undo();
    set((s) => ({ queue: s.queue.filter((p) => p.id !== id) }));
  },
}));
