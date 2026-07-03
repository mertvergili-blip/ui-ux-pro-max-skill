import type { StateCreator } from "zustand";
import type { MaisonStore } from "./index";
import type { RunwayPhoto } from "./types";

export interface RunwaySlice {
  // User-saved reference photos for the Runway right-panel carousel. Real
  // photography can't be auto-fetched (Vogue/WWD/Instagram all block bot
  // access), so this is a personal upload archive instead.
  runwayPhotos: RunwayPhoto[];
  addRunwayPhoto: (p: Omit<RunwayPhoto, "id" | "createdAt">) => void;
  removeRunwayPhoto: (id: string) => void;
  restoreRunwayPhoto: (p: RunwayPhoto) => void;
}

export const createRunwaySlice: StateCreator<MaisonStore, [], [], RunwaySlice> = (set) => ({
  runwayPhotos: [],
  addRunwayPhoto: (p) =>
    set((s) => ({
      runwayPhotos: [{ ...p, id: `rw${Date.now()}`, createdAt: Date.now() }, ...s.runwayPhotos],
    })),
  removeRunwayPhoto: (id) =>
    set((s) => ({
      runwayPhotos: s.runwayPhotos.filter((p) => p.id !== id),
    })),
  restoreRunwayPhoto: (p) => set((s) => ({ runwayPhotos: [p, ...s.runwayPhotos] })),
});
