"use client";

import { motion } from "framer-motion";
import { useStore, type ViewName } from "@/lib/store";

// The topbar's tab rail already reaches every view via horizontal scroll,
// but that means the daily-use tabs aren't always one thumb-reach away —
// this puts the four most-used ones in a fixed strip at the bottom, where
// they're reachable one-handed. It supplements the topbar rail rather than
// replacing it (all eight views stay reachable up there), and only shows
// below lg, where the topbar rail is a scroll-y reach in the first place.
const TABS: { label: string; view: ViewName; icon: (active: boolean) => React.ReactNode }[] = [
  {
    label: "Studio",
    view: "studio",
    icon: (active) => (
      <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none">
        <path
          d="M4 11.5 12 4l8 7.5M6 9.8V19a1 1 0 0 0 1 1h3.2v-4.6a1.8 1.8 0 0 1 1.8-1.8v0a1.8 1.8 0 0 1 1.8 1.8V20H17a1 1 0 0 0 1-1V9.8"
          stroke="currentColor"
          strokeWidth={active ? 1.9 : 1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Calendar",
    view: "calendar",
    icon: (active) => (
      <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none">
        <rect x="4" y="5.5" width="16" height="14.5" rx="2.2" stroke="currentColor" strokeWidth={active ? 1.9 : 1.6} />
        <path d="M4 9.8h16M8 3.5v3.4M16 3.5v3.4" stroke="currentColor" strokeWidth={active ? 1.9 : 1.6} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Collections",
    view: "collections",
    icon: (active) => (
      <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none">
        <path
          d="M4 8.2c0-.66.54-1.2 1.2-1.2h4.3l1.6 1.9h7.7c.66 0 1.2.54 1.2 1.2v8.7c0 .66-.54 1.2-1.2 1.2H5.2A1.2 1.2 0 0 1 4 18.8V8.2Z"
          stroke="currentColor"
          strokeWidth={active ? 1.9 : 1.6}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Journal",
    view: "journal",
    icon: (active) => (
      <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none">
        <path
          d="M6 4.5h9.5a2.5 2.5 0 0 1 2.5 2.5v12.5H8a2 2 0 0 1-2-2V4.5Z"
          stroke="currentColor"
          strokeWidth={active ? 1.9 : 1.6}
          strokeLinejoin="round"
        />
        <path d="M6 17.5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth={active ? 1.9 : 1.6} strokeLinecap="round" />
        <path d="M9.3 8.4h5.4M9.3 11.4h5.4" stroke="currentColor" strokeWidth={active ? 1.9 : 1.6} strokeLinecap="round" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const currentView = useStore((s) => s.currentView);
  const setView = useStore((s) => s.setView);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex justify-center border-t border-white/[0.07] bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      aria-label="Ana gezinme"
    >
      <div className="flex w-full max-w-md items-stretch">
        {TABS.map(({ label, view, icon }) => {
          const active = currentView === view;
          return (
            <button
              key={view}
              onClick={() => setView(view)}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5"
              aria-label={label}
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  className="absolute inset-x-3 top-1 h-0.5 rounded-full bg-gold"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className={active ? "text-gold" : "text-muted"}>{icon(active)}</span>
              <span
                className={`text-[9px] uppercase tracking-[1px] ${active ? "text-bone" : "text-muted"}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
