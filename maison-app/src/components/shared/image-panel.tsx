"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore, selectUrgency, type ViewName } from "@/lib/store";
import { CalendarRightPanel } from "@/components/calendar/calendar-right-panel";
import { RunwayLookCarousel } from "@/components/runway/runway-look-carousel";

const VIEW_CAPTIONS: Record<ViewName, [string, string]> = {
  studio: ["Collection III", "Moodboard — Terre & Or"],
  collections: ["Archive", "Tüm koleksiyonlar"],
  calendar: ["Rituals", "Temmuz akışı"],
  path: ["Journey", "Creative Director yolu"],
  journal: ["Reflection", "Bugünkü ruh hali"],
  runway: ["Runway Intel", "Bugünün moda özeti"],
  dna: ["Identity", "Yaratıcı DNA haritası"],
  materials: ["Archive", "Kumaş ve materyal arşivi"],
};

export function ImagePanel() {
  const { currentView, mousePos } = useStore();
  const deadlineDate = useStore((s) => s.deadlineDate);
  const [eyebrow, title] = VIEW_CAPTIONS[currentView];

  const nx = mousePos.x - 0.5;
  const ny = mousePos.y - 0.5;

  // Ambient urgency: as the deadline approaches, the atmosphere quietly
  // shifts from this cool blue toward the warm wine tone already present
  // in the same gradient — no banners, no red flashes, just weather changing.
  const urgency = useMemo(() => selectUrgency(deadlineDate), [deadlineDate]);
  const blueAlpha = 0.42 - urgency * 0.28;
  const wineAlpha = 0.34 + urgency * 0.24;

  if (currentView === "runway") {
    return (
      <div className="fixed right-0 top-0 z-0 h-screen w-[40%] overflow-hidden">
        <RunwayLookCarousel />
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 z-0 h-screen w-[40%] overflow-hidden">
      <div
        className="absolute -inset-[10%]"
        style={{
          background: `
            radial-gradient(ellipse 700px 900px at 80% 20%, rgba(61,90,108,${blueAlpha}), transparent 55%),
            radial-gradient(ellipse 600px 700px at 25% 85%, rgba(122,46,46,${wineAlpha}), transparent 60%),
            linear-gradient(160deg, #1c1f26 0%, #100d09 55%, #1b1712 100%)
          `,
          transform: `translate(${nx * 10}px, ${ny * 10}px) scale(1.04)`,
          transition: "transform 0.4s ease-out, background 1.4s ease",
          animation: "drift 18s ease-in-out infinite alternate",
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-ink to-transparent to-[14%]" />
      <div className="absolute bottom-11 right-14 z-5 text-right">
        <AnimatePresence mode="wait">
          {currentView === "calendar" ? (
            <CalendarRightPanel key="calendar-panel" />
          ) : (
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="pointer-events-none"
            >
              <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[9.5px] uppercase tracking-[2.5px] text-bone-dim backdrop-blur-sm">
                {eyebrow}
              </p>
              <p className="font-serif text-xl italic text-bone">{title}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
