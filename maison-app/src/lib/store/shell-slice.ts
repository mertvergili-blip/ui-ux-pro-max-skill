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

  // Any fixed-position bottom sheet (currently just BottomNav's "Diğer")
  // that occupies the same bottom-left corner the mini composer bar lives
  // in — the composer hides itself while this is true instead of the two
  // fighting over z-index and the sheet's items becoming unclickable.
  bottomSheetOpen: boolean;
  setBottomSheetOpen: (open: boolean) => void;
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

  bottomSheetOpen: false,
  setBottomSheetOpen: (open) => set({ bottomSheetOpen: open }),
});
