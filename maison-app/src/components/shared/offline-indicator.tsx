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
export function OfflineIndicator() {
  const [offline, setOffline] = useState(false);
  const saveStatus = useSaveStatus((s) => s.status);
  const [retrying, setRetrying] = useState(false);

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

  return (
    <AnimatePresence>
      {(offline || showSaveError) && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="pointer-events-none fixed left-1/2 top-[max(1rem,calc(env(safe-area-inset-top)+0.4rem))] z-50 -translate-x-1/2"
        >
          {/* The row itself lets clicks pass through to whatever's
              underneath (the nav often sits right behind it) — only the
              retry button opts back in, so the banner can't block
              navigation just by being on screen. */}
          <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-ink/90 px-4 py-2 text-[10.5px] uppercase tracking-[1.5px] text-bone-dim shadow-[0_12px_32px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose" />
            {offline
              ? "Bağlantı yok — gösterilen veri güncel olmayabilir"
              : "Kaydedilemedi — bağlantı sorunu"}
            {showSaveError && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="pointer-events-auto ml-1 rounded-full border border-white/15 px-2.5 py-1 text-bone transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-40"
              >
                {retrying ? "…" : "Tekrar dene"}
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
