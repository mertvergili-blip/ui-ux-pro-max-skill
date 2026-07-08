import type { StateCreator } from "zustand";
import type { MaisonStore } from "./index";
import type { CollectionFolder, ProjectImage, IterationEntry, ProjectNote } from "./types";

export interface CollectionsSlice {
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

  // Mistake/iteration log — per collection
  iterationLogs: IterationEntry[];
  addIterationEntry: (e: Omit<IterationEntry, "id" | "createdAt">) => void;
  removeIterationEntry: (id: string) => void;
  restoreIterationEntry: (e: IterationEntry) => void;

  // Free-text project notes — previously only a transient AI-insight
  // preview shown while typing, with the actual note text never saved
  // anywhere. Now a real, persisted, removable list per collection.
  projectNotes: ProjectNote[];
  addProjectNote: (n: Omit<ProjectNote, "id" | "createdAt">) => void;
  removeProjectNote: (id: string) => void;
  restoreProjectNote: (n: ProjectNote, index: number) => void;
}

export const createCollectionsSlice: StateCreator<MaisonStore, [], [], CollectionsSlice> = (
  set
) => ({
  collections: [
    {
      id: "terre-or",
      name: "Koleksiyon III — Terre & Or",
      status: "In Progress",
      accent: "var(--color-gold)",
      count: 12,
      sub: "6 gün kaldı",
      deadlineDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 6);
        return d.toISOString().slice(0, 10);
      })(),
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

  projectNotes: [],
  addProjectNote: (n) =>
    set((s) => ({
      projectNotes: [
        { ...n, id: `note${Date.now()}`, createdAt: Date.now() },
        ...s.projectNotes,
      ],
    })),
  removeProjectNote: (id) =>
    set((s) => ({
      projectNotes: s.projectNotes.filter((n) => n.id !== id),
    })),
  restoreProjectNote: (n, index) =>
    set((s) => {
      const next = [...s.projectNotes];
      next.splice(Math.min(index, next.length), 0, n);
      return { projectNotes: next };
    }),
});
