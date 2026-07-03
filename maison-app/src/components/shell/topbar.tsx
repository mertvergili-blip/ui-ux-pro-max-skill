"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useStore, type ViewName } from "@/lib/store";
import { NotificationToggle } from "@/components/shell/notification-toggle";
import { LogoutButton } from "@/components/shell/logout-button";
import { SearchOverlay, useSearchShortcut } from "@/components/shell/search-overlay";
import { OfflineIndicator } from "@/components/shared/offline-indicator";

// Eight flat tabs read as a wall of equally-weighted labels — grouping them
// by what they're for (today's work / the archive / self-reflection /
// outside inspiration) gives the rail a scannable shape instead of a list
// to read left-to-right every time.
const NAV_GROUPS: { group: string; tabs: { label: string; view: ViewName }[] }[] = [
  {
    group: "Bugün",
    tabs: [
      { label: "Studio", view: "studio" },
      { label: "Calendar", view: "calendar" },
    ],
  },
  {
    group: "Arşiv",
    tabs: [
      { label: "Collections", view: "collections" },
      { label: "Materials", view: "materials" },
      { label: "Path", view: "path" },
    ],
  },
  {
    group: "Yansıma",
    tabs: [
      { label: "Journal", view: "journal" },
      { label: "DNA Map", view: "dna" },
    ],
  },
  {
    group: "İlham",
    tabs: [{ label: "Runway", view: "runway" }],
  },
];

export function Topbar() {
  const currentView = useStore((s) => s.currentView);
  const setView = useStore((s) => s.setView);
  const [searchOpen, setSearchOpen] = useState(false);
  useSearchShortcut(searchOpen, setSearchOpen);

  return (
    <div className="sticky top-0 z-20 flex flex-col gap-3.5 bg-gradient-to-b from-ink from-60% to-transparent pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] lg:flex-row lg:items-center lg:justify-between lg:pb-7 lg:pt-[max(1.75rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-3">
        <span className="font-serif text-[19px] italic tracking-wide text-bone">
          Maison
        </span>
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Ara"
          title="Ara (Ctrl/Cmd+K)"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] text-muted transition-colors hover:border-white/20 hover:text-gold"
        >
          <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M20 20l-4.3-4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <NotificationToggle />
        <LogoutButton />
        <OfflineIndicator />
      </div>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Below lg, BottomNav (Studio/Calendar/Collections/Journal, plus a
          "More" sheet for the rest) is the only navigation — having the
          same tabs reachable up here too read as redundant/cluttered on a
          small screen instead of premium. This rail is desktop-only now. */}
      <nav className="no-scrollbar hidden max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-white/[0.07] bg-white/[0.025] p-1.5 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.7)] backdrop-blur-xl lg:flex lg:overflow-visible">
        {NAV_GROUPS.map(({ group, tabs }, i) => (
          <div key={group} className="flex shrink-0 items-center">
            {i > 0 && <span className="mx-1 h-4 w-px shrink-0 bg-white/[0.08]" />}
            <span className="hidden shrink-0 pl-2.5 pr-1 text-[8.5px] uppercase tracking-[1.5px] text-muted/70 xl:inline">
              {group}
            </span>
            {tabs.map(({ label, view }) => {
              const active = currentView === view;
              return (
                <button
                  key={view}
                  onClick={() => setView(view)}
                  className={`relative shrink-0 whitespace-nowrap rounded-full px-3.5 py-2.5 text-[10px] uppercase tracking-[1.5px] transition-colors duration-300 lg:py-2 ${
                    active ? "text-ink" : "text-muted hover:text-bone"
                  }`}
                  style={{ transitionTimingFunction: "cubic-bezier(.32,.72,0,1)" }}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-bone"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}
