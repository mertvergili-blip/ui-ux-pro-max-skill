"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { HeroSceneBoundary } from "./hero-scene-boundary";

const HeroScene = dynamic(
  () => import("./hero-scene").then((m) => m.HeroScene),
  { ssr: false }
);

/**
 * The hero scene needs WebGPU. Most current desktop Chrome/Edge support it,
 * but Firefox, older Safari, and some GPU/driver combos don't — or expose
 * navigator.gpu but fail during adapter/device/shader setup. HeroSceneBoundary
 * catches synchronous render-time throws; the window error listeners below
 * catch failures that surface later from inside react-three-fiber's
 * requestAnimationFrame loop, which a React error boundary can't intercept.
 * Either path just drops the hero visual — the intro copy still works.
 */
export function HeroSceneGate() {
  const [supported, setSupported] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Browser capability check — only known client-side, after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported("gpu" in navigator);
  }, []);

  useEffect(() => {
    if (!supported) return;
    const onError = () => setFailed(true);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onError);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onError);
    };
  }, [supported]);

  if (!supported || failed) return null;

  return (
    <div className="absolute inset-0">
      <HeroSceneBoundary>
        <HeroScene />
      </HeroSceneBoundary>
    </div>
  );
}
