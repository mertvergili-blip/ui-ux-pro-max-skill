"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSaveStatus } from "@/lib/save-status";
import { flushPendingWrite } from "@/lib/db-storage";

// Every widget in this app (Finance Pulse, Runway news) already degrades
// gracefully to stale/cached data on a failed fetch — silently, by
// design. That's the right behavior per-widget, but it means the user has
// no way to tell "the numbers are old" from "the numbers are current"
// without this. Pure navigator.onLine + browser events, no polling.
//
// Lives inline in the topbar's icon row (not a floating full-width banner)
// — a fixed-position banner centered at the top of the screen used to
// land directly on top of the nav pill and visually block it. A small
// status dot that expands into a detail popover on click can never do
// that, since it takes up the same footprint as the other topbar icons.
export function OfflineIndicator() {
  const [offline, setOffline] = useState(false);
  const saveStatus = useSaveStatus((s) => s.status);
  const [retrying, setRetrying] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    if (!navigator.onLine) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOffline(true);
    }
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    await flushPendingWrite();
    setRetrying(false);
  };

  // A save failure while online is a different problem than "no network"
  // (offline already explains itself) — surface it distinctly, with a
  // way to act, so "I wrote something and it vanished" never happens
  // silently.
  const showSaveError = !offline && saveStatus === "error";
  const active = offline || showSaveError;

  if (!active) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={offline ? "Bağlantı yok" : "Kaydedilemedi"}
        title={offline ? "Bağlantı yok" : "Kaydedilemedi"}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-rose/25 text-rose transition-colors hover:border-rose/50"
      >
        <span className="h-1.5 w-1.5 flex-shrink-0 animate-[pulse-glow_2.4s_infinite] rounded-full bg-rose" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="absolute left-0 top-full z-50 mt-2 w-60 rounded-[1rem] border border-white/10 bg-ink/95 p-3.5 text-[12px] leading-relaxed text-bone-dim shadow-[0_16px_40px_-16px_rgba(0,0,0,0.85)] backdrop-blur-xl"
          >
            <p>
              {offline
                ? "Bağlantı yok — gösterilen veri güncel olmayabilir."
                : "Kaydedilemedi — bağlantı sorunu."}
            </p>
            {showSaveError && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="mt-2.5 rounded-full border border-white/15 px-3 py-1.5 text-[10.5px] uppercase tracking-[1.5px] text-bone transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-40"
              >
                {retrying ? "…" : "Tekrar dene"}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
