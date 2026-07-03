"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Every widget in this app (Finance Pulse, Runway news) already degrades
// gracefully to stale/cached data on a failed fetch — silently, by
// design. That's the right behavior per-widget, but it means the user has
// no way to tell "the numbers are old" from "the numbers are current"
// without this. Pure navigator.onLine + browser events, no polling.
export function OfflineIndicator() {
  const [offline, setOffline] = useState(false);

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

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed left-1/2 top-[max(1rem,calc(env(safe-area-inset-top)+0.4rem))] z-50 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-ink/90 px-4 py-2 text-[10.5px] uppercase tracking-[1.5px] text-bone-dim shadow-[0_12px_32px_-16px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose" />
            Bağlantı yok — gösterilen veri güncel olmayabilir
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
