"use client";

import { motion } from "framer-motion";
import { useStore, type ViewName } from "@/lib/store";

const TABS: { label: string; view: ViewName }[] = [
  { label: "Studio", view: "studio" },
  { label: "Calendar", view: "calendar" },
  { label: "Collections", view: "collections" },
  { label: "Path", view: "path" },
  { label: "Journal", view: "journal" },
  { label: "Runway", view: "runway" },
];

export function Topbar() {
  const currentView = useStore((s) => s.currentView);
  const setView = useStore((s) => s.setView);

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between bg-gradient-to-b from-ink from-60% to-transparent pb-7 pt-7">
      <span className="font-serif text-[19px] italic tracking-wide text-bone">
        Maison
      </span>

      <nav className="flex items-center gap-0.5 rounded-full border border-white/[0.07] bg-white/[0.025] p-1.5 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        {TABS.map(({ label, view }) => {
          const active = currentView === view;
          return (
            <button
              key={view}
              onClick={() => setView(view)}
              className={`relative rounded-full px-4 py-2 text-[10.5px] uppercase tracking-[2px] transition-colors duration-300 ${
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
