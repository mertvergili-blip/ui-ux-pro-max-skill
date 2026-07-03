"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore, type ViewName } from "@/lib/store";

// Below lg this is the ONLY navigation (the topbar's tab rail is desktop-only
// now — having the same tabs reachable in two places at once read as
// cluttered rather than premium). Four daily-use views get their own slot;
// the rest live behind "More" so the bar stays within the ≤5-item limit
// that keeps a bottom nav scannable at a glance.
const PRIMARY_TABS: { label: string; view: ViewName; icon: (active: boolean) => React.ReactNode }[] = [
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

type MoreTab = { label: string; view: ViewName; icon: React.ReactNode };

const DNA_ICON = (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
    <path d="M6 17 11 8l3 5.5L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="6" cy="17" r="1.8" fill="currentColor" />
    <circle cx="11" cy="8" r="1.8" fill="currentColor" />
    <circle cx="14" cy="13.5" r="1.8" fill="currentColor" />
    <circle cx="18" cy="6" r="1.8" fill="currentColor" />
  </svg>
);

const MATERIALS_ICON = (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
    <path
      d="M4 6a2 2 0 0 1 2-2h9a5 5 0 0 1 5 5v9a2 2 0 0 1-2 2H9a5 5 0 0 1-5-5V6Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M15 4a5 5 0 0 0 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const PATH_ICON = (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
    <circle cx="6" cy="5.5" r="1.9" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="6" cy="12" r="1.9" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="6" cy="18.5" r="1.9" fill="currentColor" />
    <path d="M6 7.4v3.1M6 13.9v2.7M10 5.5h9M10 12h9M10 18.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const RUNWAY_ICON = (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
    <rect x="3.5" y="4" width="17" height="16" rx="1.8" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3.5 15.5 9 10l3.5 3.5L16 10l4.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="9" cy="8.3" r="1.3" fill="currentColor" />
  </svg>
);

// Grouped the same way as the desktop rail (see topbar.tsx) — Studio,
// Calendar, Collections and Journal already have their own primary slot
// below, so only the remaining views need a home here, sorted under the
// category they'd fall into on desktop.
const MORE_GROUPS: { group: string; tabs: MoreTab[] }[] = [
  {
    group: "Arşiv",
    tabs: [
      { label: "Materials", view: "materials", icon: MATERIALS_ICON },
      { label: "Path", view: "path", icon: PATH_ICON },
    ],
  },
  {
    group: "Yansıma",
    tabs: [{ label: "DNA Map", view: "dna", icon: DNA_ICON }],
  },
  {
    group: "İlham",
    tabs: [{ label: "Runway", view: "runway", icon: RUNWAY_ICON }],
  },
];

const MORE_TABS: MoreTab[] = MORE_GROUPS.flatMap((g) => g.tabs);

function MoreIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none">
      <circle cx="7" cy="7" r="1.6" fill="currentColor" opacity={active ? 1 : 0.85} />
      <circle cx="17" cy="7" r="1.6" fill="currentColor" opacity={active ? 1 : 0.85} />
      <circle cx="7" cy="17" r="1.6" fill="currentColor" opacity={active ? 1 : 0.85} />
      <circle cx="17" cy="17" r="1.6" fill="currentColor" opacity={active ? 1 : 0.85} />
    </svg>
  );
}

export function BottomNav() {
  const currentView = useStore((s) => s.currentView);
  const setView = useStore((s) => s.setView);
  const setBottomSheetOpen = useStore((s) => s.setBottomSheetOpen);
  const navRef = useRef<HTMLElement>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE_TABS.some((t) => t.view === currentView);

  // Published to the store so anything else fixed to the same bottom-left
  // corner (the mini composer bar) knows to get out of the way instead of
  // silently sitting on top of this sheet's items.
  useEffect(() => {
    setBottomSheetOpen(moreOpen);
  }, [moreOpen, setBottomSheetOpen]);

  // Every other fixed-bottom element (AI panel trigger, undo toast, install
  // prompt, focus timer) needs to clear this bar's real rendered height —
  // that height varies by device (safe-area-inset-bottom differs) and isn't
  // safe to hardcode, so it's measured and published as a CSS var those
  // elements read via calc(). Collapses to 0 automatically on desktop since
  // lg:hidden makes this element's own box zero-sized there.
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const setVar = () =>
      document.documentElement.style.setProperty("--bottom-nav-h", `${el.offsetHeight}px`);
    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Closing the sheet on every navigation (including via the primary tabs,
  // which don't touch moreOpen otherwise) keeps it from lingering open over
  // a different view than the one the user opened it from.
  const go = (view: ViewName) => {
    setView(view);
    setMoreOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-[35] bg-ink/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              style={{ bottom: "var(--bottom-nav-h, 0px)" }}
              className="fixed inset-x-3 z-[36] mb-2 rounded-[1.4rem] border border-white/[0.08] bg-[#1a1611]/97 p-2 shadow-[0_-16px_48px_-16px_rgba(0,0,0,0.85)] backdrop-blur-xl lg:hidden"
            >
              {MORE_GROUPS.map(({ group, tabs }) => (
                <div key={group} className="mb-1 last:mb-0">
                  <p className="px-3.5 pb-1 pt-2 text-[9px] uppercase tracking-[2px] text-muted/70">
                    {group}
                  </p>
                  {tabs.map(({ label, view, icon }) => {
                    const active = currentView === view;
                    return (
                      <button
                        key={view}
                        onClick={() => go(view)}
                        className={`flex w-full items-center gap-3 rounded-[1rem] px-3.5 py-3 text-left transition-colors ${
                          active ? "bg-white/[0.06] text-gold" : "text-bone-dim hover:bg-white/[0.03]"
                        }`}
                      >
                        {icon}
                        <span className="text-[12.5px] uppercase tracking-[1.5px]">{label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav
        ref={navRef}
        className="fixed inset-x-0 bottom-0 z-30 flex justify-center border-t border-white/[0.07] bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        aria-label="Ana gezinme"
      >
        <div className="flex w-full max-w-md items-stretch">
          {PRIMARY_TABS.map(({ label, view, icon }) => {
            const active = currentView === view;
            return (
              <button
                key={view}
                onClick={() => go(view)}
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
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5"
            aria-label="Diğer"
            aria-expanded={moreOpen}
          >
            {moreActive && (
              <motion.span
                layoutId="bottom-nav-pill"
                className="absolute inset-x-3 top-1 h-0.5 rounded-full bg-gold"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className={moreActive || moreOpen ? "text-gold" : "text-muted"}>
              <MoreIcon active={moreActive || moreOpen} />
            </span>
            <span
              className={`text-[9px] uppercase tracking-[1px] ${moreActive || moreOpen ? "text-bone" : "text-muted"}`}
            >
              Diğer
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
