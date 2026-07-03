import type { StateCreator } from "zustand";
import type { MaisonStore } from "./index";

export interface MiscSlice {
  // Next deadline — drives both the Studio stat and the ambient urgency tint
  deadlineLabel: string;
  deadlineDate: string; // YYYY-MM-DD

  // Capsule Day Challenge — tracks which day-challenges were marked done
  completedCapsuleIds: string[];
  toggleCapsuleComplete: (id: string) => void;
}

export const createMiscSlice: StateCreator<MaisonStore, [], [], MiscSlice> = (set) => ({
  deadlineLabel: "Koleksiyon III",
  deadlineDate: (() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  })(),

  completedCapsuleIds: [],
  toggleCapsuleComplete: (id) =>
    set((s) => ({
      completedCapsuleIds: s.completedCapsuleIds.includes(id)
        ? s.completedCapsuleIds.filter((c) => c !== id)
        : [...s.completedCapsuleIds, id],
    })),
});
