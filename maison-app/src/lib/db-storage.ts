"use client";

import { useSaveStatus } from "./save-status";

const LEGACY_LOCALSTORAGE_KEY = "maison-storage";
const LOCAL_CACHE_KEY = "maison-local-cache";
const PENDING_WRITE_KEY = "maison-pending-write";

function cacheLocally(value: string) {
  try {
    window.localStorage.setItem(LOCAL_CACHE_KEY, value);
  } catch {
    // localStorage full/unavailable — nothing more we can do locally
  }
}

async function pushToServer(value: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(value);
    const res = await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Retries the last write that failed to reach the server — fired on the
// browser's "online" event so reconnecting silently reconciles instead of
// requiring the user to notice and manually re-save.
export async function flushPendingWrite() {
  if (typeof window === "undefined") return;
  const pending = window.localStorage.getItem(PENDING_WRITE_KEY);
  if (!pending) return;
  const ok = await pushToServer(pending);
  if (ok) {
    window.localStorage.removeItem(PENDING_WRITE_KEY);
    useSaveStatus.getState().setStatus("saved");
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("online", flushPendingWrite);
}

// Raw StateStorage for zustand's createJSONStorage — reads/writes the
// persisted slice through /api/state instead of localStorage, so data
// follows the user across devices/browsers instead of being stuck in one.
export const dbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const { data } = await res.json();
        if (data) {
          cacheLocally(JSON.stringify(data));
          return JSON.stringify(data);
        }
      }
    } catch {
      // network hiccup — fall through to the local cache / legacy checks
    }

    if (typeof window === "undefined") return null;

    // A previous successful read/write left a local cache — better to
    // boot from slightly-stale local data than to boot empty and look
    // like everything was wiped.
    const cached = window.localStorage.getItem(LOCAL_CACHE_KEY);
    if (cached) return cached;

    // One-time migration: if the DB has nothing yet but this browser has
    // an old localStorage snapshot, seed the DB from it so it isn't lost.
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
    useSaveStatus.getState().setStatus("saving");
    cacheLocally(value);
    const ok = await pushToServer(value);
    if (ok) {
      if (typeof window !== "undefined") window.localStorage.removeItem(PENDING_WRITE_KEY);
      useSaveStatus.getState().setStatus("saved");
    } else {
      // Stash the write so a later reconnect (or the next successful
      // setItem) can retry it — a dropped write shouldn't just vanish.
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(PENDING_WRITE_KEY, value);
        } catch {
          // best-effort
        }
      }
      useSaveStatus.getState().setStatus("error");
    }
  },

  removeItem: async (): Promise<void> => {
    // Nothing in this app calls persist.clearStorage().
  },
};
