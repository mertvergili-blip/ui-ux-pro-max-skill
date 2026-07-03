"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useStore, type ViewName } from "@/lib/store";
import { NotificationToggle } from "@/components/shell/notification-toggle";
import { LogoutButton } from "@/components/shell/logout-button";
import { SearchOverlay, useSearchShortcut } from "@/components/shell/search-overlay";

const TABS: { label: string; view: ViewName }[] = [
  { label: "Studio", view: "studio" },
  { label: "Calendar", view: "calendar" },
  { label: "Collections", view: "collections" },
  { label: "DNA Map", view: "dna" },
  { label: "Materials", view: "materials" },
  { label: "Path", view: "path" },
  { label: "Journal", view: "journal" },
  { label: "Runway", view: "runway" },
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
      </div>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Below lg the pill becomes a horizontal scroll rail — all eight tabs
          stay reachable without wrapping or shrinking below tap size. */}
      <nav className="no-scrollbar flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-white/[0.07] bg-white/[0.025] p-1.5 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.7)] backdrop-blur-xl lg:overflow-visible">
        {TABS.map(({ label, view }) => {
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
      </nav>
    </div>
  );
}
