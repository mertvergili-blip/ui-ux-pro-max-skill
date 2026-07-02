"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { CURATED_RUNWAY_SHOWS } from "@/lib/runway-looks";
import { EditorialPlaceholder } from "@/components/shared/editorial-placeholder";

const EASE = [0.32, 0.72, 0, 1] as const;
const AUTOPLAY_MS = 3800;

type Slide =
  | { kind: "upload"; id: string; src: string; designer: string; season: string }
  | {
      kind: "curated";
      id: string;
      designer: string;
      season: string;
      mood: string;
      reviewUrl: string;
      palette: [string, string];
      image: string | null; // real og:image, or null → editorial placeholder
    };

export function RunwayLookCarousel() {
  const photos = useStore((s) => s.runwayPhotos);
  const [curatedImages, setCuratedImages] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/runway-look-images")
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (!cancelled) setCuratedImages(data);
      })
      .catch(() => {
        // Editorial placeholders cover this — no real image, not empty.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // User uploads take priority (item 5); otherwise the curated archive
  // shows real photos where we found one, editorial placeholders where we
  // didn't (item 6/7) — never the old generative-only silhouette.
  const slides = useMemo<Slide[]>(() => {
    if (photos.length > 0) {
      return photos.map((p) => ({
        kind: "upload" as const,
        id: p.id,
        src: p.dataUrl,
        designer: p.designer,
        season: p.season,
      }));
    }
    return CURATED_RUNWAY_SHOWS.map((show) => ({
      kind: "curated" as const,
      id: show.id,
      designer: show.designer,
      season: show.season,
      mood: show.mood,
      reviewUrl: show.reviewUrl,
      palette: show.palette,
      image: curatedImages[show.id] ?? null,
    }));
  }, [photos, curatedImages]);

  const [rawIndex, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Slide count can change (photo added/removed, images finish loading) —
  // clamp at render time instead of syncing via an effect.
  const index = slides.length ? rawIndex % slides.length : 0;

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  const advance = (dir: 1 | -1) => {
    setIndex((i) => (i + dir + slides.length) % slides.length);
  };

  if (slides.length === 0) return null;
  const slide = slides[index];

  return (
    <div
      className="group absolute inset-0 z-[3]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        {slide.kind === "upload" ? (
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="absolute inset-0"
          >
            {/* User-uploaded data URL, not a remote asset — next/image's
                optimizer has nothing to do here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.src}
              alt={`${slide.designer} ${slide.season}`}
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/20" />
          </motion.div>
        ) : (
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="absolute inset-0"
          >
            {slide.image ? (
              // Real og:image fetched from the show's own WWD review page —
              // not a scraped gallery. See src/lib/og-image.ts.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={slide.image}
                alt={`${slide.designer} ${slide.season}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <EditorialPlaceholder
                palette={slide.palette}
                label={slide.mood}
                sublabel="Görsel arşivde — link üzerinden gör"
                className="h-full w-full"
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/20" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-ink to-transparent to-[14%]" />

      {slides.length > 1 && (
        <div className="pointer-events-none absolute inset-0 z-5 flex items-center justify-between px-6">
          <button
            onClick={() => advance(-1)}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/20 text-bone-dim opacity-0 transition-opacity duration-300 hover:text-bone hover:opacity-100 group-hover:opacity-60"
          >
            ‹
          </button>
          <button
            onClick={() => advance(1)}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/20 text-bone-dim opacity-0 transition-opacity duration-300 hover:text-bone hover:opacity-100 group-hover:opacity-60"
          >
            ›
          </button>
        </div>
      )}

      <div className="absolute bottom-11 right-14 z-5 text-right">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="pointer-events-none"
          >
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[9.5px] uppercase tracking-[2.5px] text-bone-dim backdrop-blur-sm">
              {slide.designer} · {slide.season}
            </p>
            {slide.kind === "upload" ? (
              <p className="text-[10.5px] uppercase tracking-[1.5px] text-muted">
                {index + 1} / {slides.length}
              </p>
            ) : (
              <>
                {slide.image && (
                  <p className="mb-1.5 font-serif text-xl italic text-bone">{slide.mood}</p>
                )}
                <a
                  href={slide.reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto text-[10.5px] uppercase tracking-[1.5px] text-muted underline decoration-white/20 underline-offset-4 transition-colors hover:text-gold"
                >
                  Tüm koleksiyonu gör →
                </a>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
