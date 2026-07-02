"use client";

const LEGACY_LOCALSTORAGE_KEY = "maison-storage";

// Raw StateStorage for zustand's createJSONStorage — reads/writes the
// persisted slice through /api/state instead of localStorage, so data
// follows the user across devices/browsers instead of being stuck in one.
export const dbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const { data } = await res.json();
        if (data) return JSON.stringify(data);
      }
    } catch {
      // network hiccup — fall through to the legacy check below
    }

    // One-time migration: if the DB has nothing yet but this browser has
    // an old localStorage snapshot, seed the DB from it so it isn't lost.
    if (typeof window === "undefined") return null;
    const legacy = window.localStorage.getItem(name ?? LEGACY_LOCALSTORAGE_KEY);
    if (!legacy) return null;

    try {
      const parsed = JSON.parse(legacy);
      await fetch("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
    } catch {
      // migration push failed — still return the legacy value so the app boots
    }
    return legacy;
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const parsed = JSON.parse(value);
      await fetch("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
    } catch {
      // best-effort — a dropped write shouldn't crash the UI
    }
  },

  removeItem: async (): Promise<void> => {
    // Nothing in this app calls persist.clearStorage().
  },
};
