"use client";

import { useEffect, useCallback } from "react";
import { useStore } from "@/lib/store";
import { IntroScreen } from "@/components/intro/intro-screen";
import { GrainOverlay } from "@/components/shared/grain-overlay";
import { Spotlight } from "@/components/shared/spotlight";
import { CryptoTicker } from "@/components/shared/crypto-ticker";
import { ImagePanel } from "@/components/shared/image-panel";
import { Topbar } from "@/components/shell/topbar";
import { StudioView } from "@/components/studio/studio-view";
import { CollectionsView } from "@/components/collections/collections-view";
import { CalendarView } from "@/components/calendar/calendar-view";
import { PathView } from "@/components/path/path-view";
import { JournalView } from "@/components/journal/journal-view";
import { RunwayView } from "@/components/runway/runway-view";
import Script from "next/script";

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

  const ActiveView = VIEW_MAP[currentView];

  return (
    <>
      <Script
        src="https://unpkg.com/@splinetool/viewer@1.9.82/build/spline-viewer.js"
        type="module"
        strategy="afterInteractive"
      />

      <GrainOverlay />
      <Spotlight />
      <CryptoTicker />
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
        </>
      )}
    </>
  );
}
