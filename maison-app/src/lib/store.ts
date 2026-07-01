"use client";

import { create } from "zustand";

export type ViewName =
  | "studio"
  | "calendar"
  | "collections"
  | "path"
  | "journal"
  | "runway";

interface MaisonStore {
  currentView: ViewName;
  setView: (view: ViewName) => void;
  introVisible: boolean;
  dismissIntro: () => void;
  mousePos: { x: number; y: number };
  setMousePos: (x: number, y: number) => void;
}

export const useStore = create<MaisonStore>((set) => ({
  currentView: "studio",
  setView: (view) => set({ currentView: view }),
  introVisible: true,
  dismissIntro: () => set({ introVisible: false }),
  mousePos: { x: 0.5, y: 0.5 },
  setMousePos: (x, y) => set({ mousePos: { x, y } }),
}));
