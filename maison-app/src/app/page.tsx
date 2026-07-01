"use client";

import { useEffect, useCallback } from "react";
import { useStore } from "@/lib/store";
import { IntroScreen } from "@/components/intro/intro-screen";
import { GrainOverlay } from "@/components/shared/grain-overlay";
import { Spotlight } from "@/components/shared/spotlight";
import { ImagePanel } from "@/components/shared/image-panel";
import { Topbar } from "@/components/shell/topbar";
import { AiStudioPanel } from "@/components/shell/ai-studio-panel";
import { StudioView } from "@/components/studio/studio-view";
import { CollectionsView } from "@/components/collections/collections-view";
import { CalendarView } from "@/components/calendar/calendar-view";
import { PathView } from "@/components/path/path-view";
import { JournalView } from "@/components/journal/journal-view";
import { RunwayView } from "@/components/runway/runway-view";

const VIEW_MAP = {
  studio: StudioView,
  calendar: CalendarView,
  collections: CollectionsView,
  path: PathView,
  journal: JournalView,
  runway: RunwayView,
} as const;

export default function Home() {
  const { currentView, introVisible, setMousePos } = useStore();

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

  return (
    <>
      <GrainOverlay />
      <Spotlight />
      <IntroScreen />

      {!introVisible && (
        <>
          <ImagePanel />
          <div className="relative z-5 min-h-screen w-[60%] pb-24 pl-[72px]">
            <Topbar />
            <div className="pt-[38px]">
              <ActiveView />
            </div>
          </div>
          <AiStudioPanel />
        </>
      )}
    </>
  );
}
