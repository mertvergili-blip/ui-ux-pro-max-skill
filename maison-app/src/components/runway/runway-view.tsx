"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LOCAL_RUNWAY_NEWS, RUNWAY_TAG_COLOR, type RunwayNewsItem } from "@/lib/runway-news";
import { useStore } from "@/lib/store";
import { resizeImageFile } from "@/lib/image-resize";
import { rankTrendRadar } from "@/lib/trend-radar";
import { EditorialPlaceholder } from "@/components/shared/editorial-placeholder";

function NewsCard({
  tag,
  title,
  sub,
  link,
  large,
  image,
  matchedLabels,
}: RunwayNewsItem & { matchedLabels?: string[] }) {
  const color = RUNWAY_TAG_COLOR[tag];
  const Wrapper = link ? "a" : "div";
  // A fetched og:image URL can still fail at render time (CDN hiccup,
  // hotlink rules) — fall back to the editorial placeholder, never a
  // broken-image icon.
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <Wrapper
      {...(link ? { href: link, target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`group block cursor-pointer overflow-hidden rounded border border-line transition-all duration-300 hover:-translate-y-0.5 ${
        large ? "sm:col-span-2" : ""
      }`}
      style={
        {
          "--nc": color,
        } as React.CSSProperties
      }
    >
      <div className="relative" style={{ height: large ? 200 : 120 }}>
        {image && !imgFailed ? (
          // Real og:image from the article's own page (see src/lib/og-image.ts).
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={title}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <EditorialPlaceholder
            palette={[color, "#100d09"]}
            label={tag}
            className="h-full w-full"
          />
        )}
        {matchedLabels && matchedLabels.length > 0 && (
          <span className="absolute right-2.5 top-2.5 rounded-full border border-gold/30 bg-ink/60 px-2 py-1 text-[8.5px] uppercase tracking-[1px] text-gold backdrop-blur-sm">
            DNA&apos;na uygun
          </span>
        )}
      </div>
      <p
        className="mx-4 mt-3.5 mb-1.5 text-[9.5px] uppercase tracking-[2px]"
        style={{ color }}
      >
        {tag}
      </p>
      <p
        className={`mx-4 mb-1.5 font-heading leading-[1.3] ${
          large ? "text-[19px]" : "text-[15.5px]"
        }`}
      >
        {title}
      </p>
      {sub && <p className="mx-4 mb-4 text-xs text-muted">{sub}</p>}
      {!sub && <div className="mb-4" />}
    </Wrapper>
  );
}

function RunwayGallery() {
  const photos = useStore((s) => s.runwayPhotos);
  const addRunwayPhoto = useStore((s) => s.addRunwayPhoto);
  const removeRunwayPhoto = useStore((s) => s.removeRunwayPhoto);
  const fileRef = useRef<HTMLInputElement>(null);

  const [pendingFile, setPendingFile] = useState<{ file: File; preview: string } | null>(null);
  const [designer, setDesigner] = useState("");
  const [season, setSeason] = useState("");

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile({ file, preview: URL.createObjectURL(file) });
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!pendingFile) return;
    const dataUrl = await resizeImageFile(pendingFile.file);
    addRunwayPhoto({
      dataUrl,
      designer: designer.trim() || "Bilinmeyen",
      season: season.trim() || "—",
    });
    URL.revokeObjectURL(pendingFile.preview);
    setPendingFile(null);
    setDesigner("");
    setSeason("");
  };

  return (
    <div className="mt-11 border-t border-line pt-7 lg:mr-5">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[9.5px] uppercase tracking-[3px] text-muted">
          Runway Galerin
        </p>
        <button
          onClick={() => fileRef.current?.click()}
          className="text-[10px] uppercase tracking-[1.5px] text-muted transition-colors hover:text-gold"
        >
          + Fotoğraf Ekle
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFilePick}
          className="hidden"
        />
      </div>
      <p className="mb-5 max-w-[420px] text-[12px] leading-relaxed text-muted">
        Sağdaki panel zaten arşivden gerçek görsellerle akıyor — istersen
        kendi beğendiğin defile fotoğraflarını da yükleyip önceliklendirebilirsin.
      </p>

      <AnimatePresence>
        {pendingFile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 overflow-hidden"
          >
            <div className="flex gap-4 rounded-[1rem] border border-dashed border-gold/25 p-4">
              {/* Local blob preview of a just-picked file — not a remote asset. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingFile.preview}
                alt=""
                className="h-24 w-20 flex-shrink-0 rounded-[0.5rem] object-cover"
              />
              <div className="flex flex-1 flex-col gap-2.5">
                <input
                  value={designer}
                  onChange={(e) => setDesigner(e.target.value)}
                  placeholder="Tasarımcı / marka"
                  autoFocus
                  className="border-b border-line bg-transparent pb-1.5 text-[13px] text-bone outline-none placeholder:text-muted focus:border-gold/50"
                />
                <input
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  placeholder="Sezon (örn. SS25)"
                  className="border-b border-line bg-transparent pb-1.5 text-[12.5px] text-bone-dim outline-none placeholder:text-muted focus:border-gold/50"
                />
                <div className="mt-1 flex gap-2 text-[10px] uppercase tracking-[1.5px]">
                  <button
                    onClick={handleSave}
                    className="rounded-full bg-gold px-3.5 py-1.5 text-ink"
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(pendingFile.preview);
                      setPendingFile(null);
                    }}
                    className="rounded-full border border-white/10 px-3.5 py-1.5 text-muted hover:border-white/25"
                  >
                    Vazgeç
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <AnimatePresence mode="popLayout">
            {photos.map((p) => (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-[0.5rem]"
              >
                {/* Stored data URL from the user's own upload. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.dataUrl}
                  alt={`${p.designer} ${p.season}`}
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => removeRunwayPhoto(p.id)}
                  className="absolute inset-0 flex items-center justify-center bg-ink/70 text-[9.5px] uppercase tracking-[1.5px] text-bone opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Kaldır
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export function RunwayView() {
  const [news, setNews] = useState<RunwayNewsItem[]>(LOCAL_RUNWAY_NEWS);
  const [newsSource, setNewsSource] = useState<"gemini" | "rss" | "local">("local");

  useEffect(() => {
    let cancelled = false;

    const fetchNews = async () => {
      try {
        const res = await fetch("/api/runway-news");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.items) && data.items.length > 0) {
          setNews(data.items);
          setNewsSource(data.source ?? "local");
        }
      } catch {
        // local fallback already showing
      }
    };

    fetchNews();
    return () => {
      cancelled = true;
    };
  }, []);

  const radar = useMemo(() => rankTrendRadar(news), [news]);
  const matchedByTitle = useMemo(
    () => new Map(radar.map((r) => [r.item.title, r.matchedLabels])),
    [radar]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="lg:pr-14"
    >
      <p className="mb-[18px] flex items-center gap-2.5 text-[10.5px] uppercase tracking-[3.5px] text-muted">
        <span className="h-px w-7 bg-gradient-to-r from-gold/70 to-transparent" />
        Runway Intel
      </p>
      <h1 className="mb-1.5 font-heading text-[28px] font-normal leading-[1.12] text-[#f7f2e6] lg:text-[34px]">
        Bugünün moda özeti.
      </h1>
      <p className="mb-7 max-w-[380px] text-[13.5px] leading-relaxed text-bone-dim">
        {newsSource === "gemini" &&
          "WWD'den gerçek zamanlı haberler, AI tarafından Türkçe'ye çevrilip özetlendi."}
        {newsSource === "rss" &&
          "WWD'den gerçek zamanlı haberler — AI özeti şu an kullanılamıyor, orijinal başlıklar gösteriliyor."}
        {newsSource === "local" && "Bağlantı kurulamadı — örnek içerik gösteriliyor."}
      </p>

      {radar.length > 0 && (
        <div className="mb-7 rounded-[1.25rem] bg-white/[0.02] p-1.5 ring-1 ring-gold/15 lg:mr-5">
          <div className="rounded-[1rem] bg-black/20 px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]">
            <p className="mb-1.5 text-[9.5px] uppercase tracking-[2.5px] text-gold">
              Trend Radar · Sana Özel
            </p>
            <p className="text-[13px] leading-relaxed text-bone-dim">
              <span className="text-bone">{radar[0].item.title}</span> — DNA
              haritandaki{" "}
              <span className="text-gold">{radar[0].matchedLabels.join(", ")}</span>{" "}
              referanslarınla örtüşüyor.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:mr-5">
        {news.map((n, i) => (
          <NewsCard key={i} {...n} matchedLabels={matchedByTitle.get(n.title)} />
        ))}
      </div>

      <RunwayGallery />
    </motion.div>
  );
}
