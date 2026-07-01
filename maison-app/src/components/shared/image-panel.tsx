"use client";

import { useStore, type ViewName } from "@/lib/store";

const VIEW_CAPTIONS: Record<ViewName, [string, string]> = {
  studio: ["Collection III", "Moodboard — Terre & Or"],
  collections: ["Archive", "Tüm koleksiyonlar"],
  calendar: ["Rituals", "Temmuz akışı"],
  path: ["Journey", "Creative Director yolu"],
  journal: ["Reflection", "Bugünkü ruh hali"],
  runway: ["Runway Intel", "Bugünün moda özeti"],
};

export function ImagePanel() {
  const { currentView, mousePos } = useStore();
  const [eyebrow, title] = VIEW_CAPTIONS[currentView];

  const nx = mousePos.x - 0.5;
  const ny = mousePos.y - 0.5;

  return (
    <div className="fixed right-0 top-0 z-0 h-screen w-[40%] overflow-hidden">
      <div
        className="absolute -inset-[10%]"
        style={{
          background: `
            radial-gradient(ellipse 700px 900px at 80% 20%, rgba(61,90,108,.42), transparent 55%),
            radial-gradient(ellipse 600px 700px at 25% 85%, rgba(122,46,46,.34), transparent 60%),
            linear-gradient(160deg, #1c1f26 0%, #100d09 55%, #1b1712 100%)
          `,
          transform: `translate(${nx * 10}px, ${ny * 10}px) scale(1.04)`,
          transition: "transform 0.4s ease-out, background 1.1s ease",
          animation: "drift 18s ease-in-out infinite alternate",
        }}
      />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-ink to-transparent to-[14%]" />
      <div className="pointer-events-none absolute bottom-11 right-14 z-5 text-right">
        <p className="mb-1.5 text-[10px] uppercase tracking-[3px] text-gold transition-all duration-400">
          {eyebrow}
        </p>
        <p className="font-serif text-xl italic transition-all duration-400">
          {title}
        </p>
      </div>
    </div>
  );
}
