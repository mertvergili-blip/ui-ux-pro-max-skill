import type { StateCreator } from "zustand";
import type { MaisonStore } from "./index";
import type { AiNote, PendingSuggestion, MoodKey, SuggestionType } from "./types";
import { MOOD_ENERGY } from "./types";
import { localClassify } from "../classify";

export interface AiPanelSlice {
  // AI notes log (confirmed suggestions land here, or in their target slice)
  notes: AiNote[];

  aiPanelOpen: boolean;
  toggleAiPanel: () => void;
  closeAiPanel: () => void;
  pendingSuggestion: PendingSuggestion | null;
  suggestionLoading: boolean;
  proposeSuggestion: (input: string) => Promise<void>;
  updatePendingContent: (content: string) => void;
  confirmSuggestion: () => void;
  cancelSuggestion: () => void;
}

export const createAiPanelSlice: StateCreator<MaisonStore, [], [], AiPanelSlice> = (
  set,
  get
) => ({
  notes: [],

  aiPanelOpen: false,
  toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  closeAiPanel: () => set({ aiPanelOpen: false }),
  pendingSuggestion: null,
  suggestionLoading: false,
  proposeSuggestion: async (input) => {
    if (!input.trim()) return;
    set({ suggestionLoading: true });

    let result: { type: SuggestionType; content: string };
    let source: "ai" | "local" = "ai";
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      if (!res.ok) throw new Error("classify request failed");
      const data = await res.json();
      result = data;
      // The route itself falls back to a local keyword guess when Gemini is
      // unavailable but still returns 200 — its own source field is the
      // only way to tell the two apart from here.
      if (data.source === "local") source = "local";
    } catch {
      result = localClassify(input);
      source = "local";
    }

    // The input may have changed (or the panel closed) while the request
    // was in flight — only apply a result that's still relevant.
    if (get().suggestionLoading) {
      set({
        pendingSuggestion: { ...result, rawInput: input, source },
        suggestionLoading: false,
      });
    }
  },
  updatePendingContent: (content) =>
    set((s) =>
      s.pendingSuggestion ? { pendingSuggestion: { ...s.pendingSuggestion, content } } : {}
    ),
  confirmSuggestion: () => {
    const s = get();
    const p = s.pendingSuggestion;
    if (!p) return;

    if (p.type === "task") {
      get().addTask(p.content);
    } else if (p.type === "mood") {
      const moodGuess = (Object.keys(MOOD_ENERGY) as MoodKey[]).find((m) =>
        p.content.toLowerCase().includes(m)
      );
      if (moodGuess) get().setTodayMood(moodGuess);
    } else {
      set((st) => ({
        notes: [
          ...st.notes,
          { id: `n${Date.now()}`, type: p.type, content: p.content, createdAt: Date.now() },
        ],
      }));
    }
    set({ pendingSuggestion: null });
  },
  cancelSuggestion: () => set({ pendingSuggestion: null, suggestionLoading: false }),
});
