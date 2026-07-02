"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LOCAL_RUNWAY_NEWS, RUNWAY_TAG_COLOR, type RunwayNewsItem } from "@/lib/runway-news";

function NewsCard({ tag, title, sub, link, large }: RunwayNewsItem) {
  const color = RUNWAY_TAG_COLOR[tag];
  const Wrapper = link ? "a" : "div";
  return (
    <Wrapper
      {...(link ? { href: link, target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`group block cursor-pointer overflow-hidden rounded border border-line transition-all duration-300 hover:-translate-y-0.5 ${
        large ? "col-span-2" : ""
      }`}
      style={
        {
          "--nc": color,
        } as React.CSSProperties
      }
    >
      <div
        className="relative"
        style={{
          height: large ? 200 : 120,
          background: `
            radial-gradient(circle at 25% 30%, color-mix(in srgb, ${color} 55%, transparent), transparent 60%),
            radial-gradient(circle at 80% 70%, color-mix(in srgb, ${color} 30%, transparent), transparent 55%),
            linear-gradient(150deg, #232019, #100d09)
          `,
        }}
      >
        <div
          className="absolute inset-0 opacity-5 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
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

export function RunwayView() {
  const [news, setNews] = useState<RunwayNewsItem[]>(LOCAL_RUNWAY_NEWS);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchNews = async () => {
      try {
        const res = await fetch("/api/runway-news");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.items) && data.items.length > 0) {
          setNews(data.items);
          setLive(data.source === "gemini");
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="pr-14"
    >
      <p className="mb-[18px] flex items-center gap-2.5 text-[10.5px] uppercase tracking-[3.5px] text-muted">
        <span className="h-px w-7 bg-gradient-to-r from-gold/70 to-transparent" />
        Runway Intel
      </p>
      <h1 className="mb-1.5 font-heading text-[34px] font-normal leading-[1.12] text-[#f7f2e6]">
        Bugünün moda özeti.
      </h1>
      <p className="mb-7 max-w-[380px] text-[13.5px] leading-relaxed text-bone-dim">
        {live
          ? "WWD'den gerçek zamanlı haberler, AI tarafından Türkçe'ye çevrilip özetlendi."
          : "Bağlantı kurulamadı — örnek içerik gösteriliyor."}
      </p>

      <div className="mr-5 grid grid-cols-2 gap-[18px]">
        {news.map((n, i) => (
          <NewsCard key={i} {...n} />
        ))}
      </div>
    </motion.div>
  );
}
