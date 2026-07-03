const KEY = "maison-intro-seen";

// Plain localStorage, not the zustand/dbStorage persistence — this is a
// per-device "don't replay the entrance" flag, not app data that needs to
// follow the user across devices, and it needs to be readable synchronously
// on mount rather than waiting on a network round trip.
export function hasSeenIntro(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // storage unavailable — worst case the intro replays next time
  }
}
