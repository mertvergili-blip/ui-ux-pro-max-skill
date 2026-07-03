"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  useStore,
  selectActiveDeadline,
  selectDaysRemaining,
  selectTodayEntry,
  selectUrgency,
  type MoodKey,
  type ViewName,
} from "@/lib/store";
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

const MOOD_DOT_COLOR: Record<MoodKey, string> = {
  flowing: "#c4a469",
  calm: "#3d5a6c",
  stressed: "#7a2e2e",
  grounded: "#5c6b52",
  tired: "#786f5c",
};

const MOOD_WORD: Record<MoodKey, string> = {
  flowing: "Flowing",
  calm: "Calm",
  stressed: "Tense",
  grounded: "Grounded",
  tired: "Low",
};

const TR_MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function InsightRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[11.5px] leading-relaxed text-bone-dim">
      <span className="text-muted">{label} · </span>
      {value}
    </p>
  );
}

// Live, view-specific data for the right panel — this 40% of the screen
// used to hold nothing but a caption, which read as unfinished. Only
// mounts client-side (after the intro), so Date here can't cause
// hydration mismatches.
function PanelInsight({ view }: { view: ViewName }) {
  const tasks = useStore((s) => s.tasks);
  const journalEntries = useStore((s) => s.journalEntries);
  const collections = useStore((s) => s.collections);
  const materials = useStore((s) => s.materials);
  const deadline = selectActiveDeadline(collections);

  if (view === "studio") {
    const now = new Date();
    const done = tasks.filter((t) => t.done).length;
    return (
      <div className="mb-7">
        <p className="font-serif text-[52px] italic leading-none text-bone">
          {now.getDate()}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[2.5px] text-muted">
          {TR_MONTHS[now.getMonth()]}
        </p>
        <div className="my-4 ml-auto h-px w-10 bg-white/10" />
        <InsightRow label="Bugün" value={`${done}/${tasks.length} görev tamam`} />
        {deadline && (
          <InsightRow
            label={deadline.label}
            value={
              selectDaysRemaining(deadline.date) === 0
                ? "bugün teslim"
                : `${selectDaysRemaining(deadline.date)} gün kaldı`
            }
          />
        )}
      </div>
    );
  }

  if (view === "journal") {
    const today = selectTodayEntry(journalEntries);
    const last7 = journalEntries.slice(-7);
    return (
      <div className="mb-7">
        <p className="font-serif text-[30px] italic leading-tight text-bone">
          {today.mood ? MOOD_WORD[today.mood] : "Bir ruh hali seç"}
        </p>
        {last7.length > 0 && (
          <div className="mt-4 flex justify-end gap-1.5">
            {last7.map((e, i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full"
                style={{
                  background: e.mood ? MOOD_DOT_COLOR[e.mood] : "var(--color-line)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (view === "collections") {
    const inProgress = collections.find((c) => c.status !== "Archived");
    const pieces = collections.reduce((sum, c) => sum + (c.images?.length ?? 0), 0);
    return (
      <div className="mb-7">
        <p className="font-serif text-[30px] italic leading-tight text-bone">
          {collections.length} koleksiyon
        </p>
        <div className="my-4 ml-auto h-px w-10 bg-white/10" />
        <InsightRow label="Toplam" value={`${pieces} parça`} />
        {inProgress && <InsightRow label="Aktif" value={inProgress.name} />}
      </div>
    );
  }

  if (view === "materials") {
    return (
      <div className="mb-7">
        <p className="font-serif text-[30px] italic leading-tight text-bone">
          {materials.length === 0 ? "Arşiv boş" : `${materials.length} kumaş`}
        </p>
        {materials.length > 0 && (
          <div className="mt-4 flex justify-end gap-1.5">
            {materials.slice(0, 8).map((m) => (
              <span
                key={m.id}
                className="h-3 w-3 rounded-full ring-1 ring-white/15"
                style={{ background: m.colorTag }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}

export function ImagePanel() {
  const { currentView, mousePos } = useStore();
  const collections = useStore((s) => s.collections);
  const calendarViewMonth = useStore((s) => s.calendarViewMonth);
  const [eyebrow, staticTitle] = VIEW_CAPTIONS[currentView];
  // Calendar's caption tracks whichever month is currently being browsed,
  // rather than a title fixed to the originally-seeded month.
  const title = currentView === "calendar" ? `${TR_MONTHS[calendarViewMonth]} akışı` : staticTitle;

  const nx = mousePos.x - 0.5;
  const ny = mousePos.y - 0.5;

  // Ambient urgency: as the deadline approaches, the atmosphere quietly
  // shifts from this cool blue toward the warm wine tone already present
  // in the same gradient — no banners, no red flashes, just weather changing.
  const deadline = useMemo(() => selectActiveDeadline(collections), [collections]);
  const urgency = useMemo(() => (deadline ? selectUrgency(deadline.date) : 0), [deadline]);
  const blueAlpha = 0.42 - urgency * 0.28;
  const wineAlpha = 0.34 + urgency * 0.24;

  // Hidden below lg: on mobile the main content takes the full width and
  // panel-dependent views (calendar day detail) render their own inline
  // fallbacks instead.
  if (currentView === "runway") {
    return (
      <div className="fixed right-0 top-0 z-0 hidden h-screen w-[40%] overflow-hidden lg:block">
        <RunwayLookCarousel />
      </div>
    );
  }

  return (
    <div className="fixed right-0 top-0 z-0 hidden h-screen w-[40%] overflow-hidden lg:block">
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
              <PanelInsight view={currentView} />
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
