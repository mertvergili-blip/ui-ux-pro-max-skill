"use client";

import { useRef, useEffect, useCallback } from "react";
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
  const { currentView, setView } = useStore();
  const navRef = useRef<HTMLDivElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);

  const updateUnderline = useCallback(() => {
    if (!navRef.current || !underlineRef.current) return;
    const active = navRef.current.querySelector(
      `[data-view="${currentView}"]`
    ) as HTMLElement | null;
    if (!active) return;
    const navRect = navRef.current.getBoundingClientRect();
    const elRect = active.getBoundingClientRect();
    underlineRef.current.style.left = `${elRect.left - navRect.left}px`;
    underlineRef.current.style.width = `${elRect.width}px`;
  }, [currentView]);

  useEffect(() => {
    updateUnderline();
    window.addEventListener("resize", updateUnderline);
    return () => window.removeEventListener("resize", updateUnderline);
  }, [updateUnderline]);

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between bg-gradient-to-b from-ink from-65% to-transparent px-0 pb-5 pt-7 text-[10.5px] uppercase tracking-[3px] text-muted">
      <span className="font-serif text-[19px] normal-case italic tracking-wide text-bone">
        Maison
      </span>
      <div ref={navRef} className="relative flex gap-[30px]">
        {TABS.map(({ label, view }) => (
          <span
            key={view}
            data-view={view}
            className={`cursor-pointer pb-2 transition-colors duration-250 hover:text-bone ${
              currentView === view ? "text-bone" : ""
            }`}
            onClick={() => setView(view)}
          >
            {label}
          </span>
        ))}
        <span
          ref={underlineRef}
          className="absolute bottom-0 h-px bg-gold transition-all duration-350"
          style={{ transitionTimingFunction: "cubic-bezier(.65,0,.35,1)" }}
        />
      </div>
    </div>
  );
}
