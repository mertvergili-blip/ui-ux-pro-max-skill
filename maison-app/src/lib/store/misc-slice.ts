import type { StateCreator } from "zustand";
import type { MaisonStore } from "./index";

export interface MiscSlice {
  // Capsule Day Challenge — tracks which day-challenges were marked done
  completedCapsuleIds: string[];
  toggleCapsuleComplete: (id: string) => void;
}

export const createMiscSlice: StateCreator<MaisonStore, [], [], MiscSlice> = (set) => ({
  completedCapsuleIds: [],
  toggleCapsuleComplete: (id) =>
    set((s) => ({
      completedCapsuleIds: s.completedCapsuleIds.includes(id)
        ? s.completedCapsuleIds.filter((c) => c !== id)
        : [...s.completedCapsuleIds, id],
    })),
});
