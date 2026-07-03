import type { StateCreator } from "zustand";
import type { MaisonStore } from "./index";
import type { ViewName } from "./types";
import { markIntroSeen } from "../intro-seen";

export interface ShellSlice {
  currentView: ViewName;
  setView: (view: ViewName) => void;

  introVisible: boolean;
  dismissIntro: () => void;

  mousePos: { x: number; y: number };
  setMousePos: (x: number, y: number) => void;
}

export const createShellSlice: StateCreator<MaisonStore, [], [], ShellSlice> = (set) => ({
  currentView: "studio",
  setView: (view) => set({ currentView: view }),

  introVisible: true,
  dismissIntro: () => {
    markIntroSeen();
    set({ introVisible: false });
  },

  mousePos: { x: 0.5, y: 0.5 },
  setMousePos: (x, y) => set({ mousePos: { x, y } }),
});
