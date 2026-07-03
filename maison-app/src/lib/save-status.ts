"use client";

import { create } from "zustand";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveStatusStore {
  status: SaveStatus;
  setStatus: (status: SaveStatus) => void;
}

// Not persisted — this reflects the health of the *current* session's
// writes, not something to remember across reloads.
export const useSaveStatus = create<SaveStatusStore>((set) => ({
  status: "idle",
  setStatus: (status) => set({ status }),
}));
