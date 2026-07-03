"use client";

import { create } from "zustand";

interface PendingUndo {
  id: number;
  label: string;
  undo: () => void;
}

interface UndoStore {
  pending: PendingUndo | null;
  show: (label: string, undo: () => void) => void;
  dismiss: (id: number) => void;
  runUndo: () => void;
}

// Deliberately not persisted — an undo offer only makes sense for the
// action that just happened in this session, not something to resurrect
// after a reload.
export const useUndoStore = create<UndoStore>((set, get) => ({
  pending: null,
  show: (label, undo) => set({ pending: { id: Date.now(), label, undo } }),
  dismiss: (id) =>
    set((s) => (s.pending?.id === id ? { pending: null } : {})),
  runUndo: () => {
    const p = get().pending;
    if (!p) return;
    p.undo();
    set({ pending: null });
  },
}));
