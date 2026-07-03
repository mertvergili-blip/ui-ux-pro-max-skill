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
// "az önce" / "3 dk önce" / "2 saat önce" — coarse enough that it doesn't
// need a live-updating timer while the popover is closed, exact enough to
// answer "did my last change actually save."
function relativeTime(ts: number): string {
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

export function OfflineIndicator() {
  const [offline, setOffline] = useState(false);
  const saveStatus = useSaveStatus((s) => s.status);
  const lastSavedAt = useSaveStatus((s) => s.lastSavedAt);
  const [retrying, setRetrying] = useState(false);
  const [open, setOpen] = useState(false);
  // Forces relativeTime() to recompute while the popover is open, instead
  // of freezing at whatever it read on the click that opened it.
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [open]);

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
  const trouble = offline || showSaveError;

  // Always mounted now (not just on trouble) — a status you can only find
  // when something's already wrong isn't a status indicator, it's an
  // alarm. Quiet dot at rest, click to see when the last write actually
  // landed.
  const dotColor = trouble ? "bg-rose" : saveStatus === "saving" ? "bg-gold" : "bg-sage/70";
  const borderColor = trouble ? "border-rose/25 hover:border-rose/50" : "border-white/[0.08] hover:border-white/20";
  const label = offline
    ? "Bağlantı yok"
    : showSaveError
    ? "Kaydedilemedi"
    : saveStatus === "saving"
    ? "Kaydediliyor"
    : "Senkronizasyon durumu";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        title={label}
        className={`flex h-8 w-8 items-center justify-center rounded-full border text-muted transition-colors ${borderColor}`}
      >
        <span
          className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotColor} ${
            trouble || saveStatus === "saving" ? "animate-[pulse-glow_2.4s_infinite]" : ""
          }`}
        />
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
                : showSaveError
                ? "Kaydedilemedi — bağlantı sorunu."
                : saveStatus === "saving"
                ? "Kaydediliyor…"
                : lastSavedAt
                ? `Son kayıt: ${relativeTime(lastSavedAt)}`
                : "Henüz bu oturumda bir değişiklik kaydedilmedi."}
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
