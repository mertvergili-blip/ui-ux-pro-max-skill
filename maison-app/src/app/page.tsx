"use client";

import { useEffect, useCallback } from "react";
import { useStore } from "@/lib/store";
import { IntroScreen } from "@/components/intro/intro-screen";
import { GrainOverlay } from "@/components/shared/grain-overlay";
import { Spotlight } from "@/components/shared/spotlight";
import { ImagePanel } from "@/components/shared/image-panel";
import { InstallPrompt } from "@/components/shared/install-prompt";
import { OfflineIndicator } from "@/components/shared/offline-indicator";
import { Topbar } from "@/components/shell/topbar";
import { AiStudioPanel } from "@/components/shell/ai-studio-panel";
import { StudioView } from "@/components/studio/studio-view";
import { CollectionsView } from "@/components/collections/collections-view";
import { CalendarView } from "@/components/calendar/calendar-view";
import { PathView } from "@/components/path/path-view";
import { JournalView } from "@/components/journal/journal-view";
import { RunwayView } from "@/components/runway/runway-view";
import { DnaMapView } from "@/components/dna/dna-map-view";
import { MaterialLibraryView } from "@/components/materials/material-library-view";

const VIEW_MAP = {
  studio: StudioView,
  calendar: CalendarView,
  collections: CollectionsView,
  path: PathView,
  journal: JournalView,
  runway: RunwayView,
  dna: DnaMapView,
  materials: MaterialLibraryView,
} as const;

// Grids that were visibly cramped fighting the panel for room, and don't
// have a natural "atmosphere" reason to keep it the way Studio/Journal's
// mood-driven panel does — so they get the full width instead. Path is a
// linear timeline, not a grid, and reads better narrower, so it keeps the
// panel. Calendar/Runway/DNA keep their own panel content unchanged.
const FULL_WIDTH_VIEWS = new Set(["collections", "materials"]);

export default function Home() {
  // Selectors, not a full-store destructure — this component (and everything
  // it renders, including IntroScreen) must not re-render on every mousemove
  // just because setMousePos touches the same store as mousePos readers.
  const currentView = useStore((s) => s.currentView);
  const introVisible = useStore((s) => s.introVisible);
  const setMousePos = useStore((s) => s.setMousePos);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      setMousePos(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    },
    [setMousePos]
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const ActiveView = VIEW_MAP[currentView as keyof typeof VIEW_MAP] ?? StudioView;
  const fullWidth = FULL_WIDTH_VIEWS.has(currentView);

  return (
    <>
      <GrainOverlay />
      <Spotlight />
      <IntroScreen />
      <OfflineIndicator />

      {!introVisible && (
        <>
          {!fullWidth && <ImagePanel />}
          {/* Topbar always lives in the full-width shell, regardless of
              whether the content below narrows for the side panel — it
              used to be inside the width-toggling container, which made
              the whole nav bar visibly jump sideways switching between a
              panel view and a full-width one. */}
          <div className="relative z-5 min-h-screen w-full px-5 pb-24 sm:px-9 lg:px-0 lg:pl-[72px]">
            <Topbar />
            <div className={`pt-[38px] ${fullWidth ? "" : "lg:w-[60%]"}`}>
              <ActiveView />
            </div>
          </div>
          <AiStudioPanel />
          <InstallPrompt />
        </>
      )}
    </>
  );
}
