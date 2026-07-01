"use client";

import { motion } from "framer-motion";

const NEWS = [
  {
    tag: "Runway · Bugün",
    title: "Maison Margiela, SS26 koleksiyonunu sundu",
    sub: "Deconstructed tailoring ve ham kenar detayları öne çıktı.",
    color: "var(--color-gold)",
    large: true,
  },
  {
    tag: "Trend Renk",
    title: "Sezonun rengi: Terracotta Rosé",
    color: "var(--color-rose)",
  },
  {
    tag: "Beklenti",
    title: "2027 için sivri omuz siluetleri geri dönüyor",
    color: "var(--color-blue)",
  },
  {
    tag: "Materyal",
    title: "Geri dönüştürülmüş deri kullanımı %30 arttı",
    color: "var(--color-sage)",
  },
];

function NewsCard({
  tag,
  title,
  sub,
  color,
  large,
}: {
  tag: string;
  title: string;
  sub?: string;
  color: string;
  large?: boolean;
}) {
  return (
    <div
      className={`group cursor-pointer overflow-hidden rounded border border-line transition-all duration-300 hover:-translate-y-0.5 ${
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
    </div>
  );
}

export function RunwayView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="pr-14"
    >
      <p className="mb-[18px] flex items-center gap-2.5 text-[10.5px] uppercase tracking-[3px] text-gold">
        <span className="h-px w-7 bg-gold" />
        Runway Intel
      </p>
      <h1 className="mb-1.5 font-heading text-[34px] font-normal leading-[1.12] text-[#f7f2e6]">
        Bugünün moda özeti.
      </h1>
      <p className="mb-7 max-w-[380px] text-[13.5px] leading-relaxed text-bone-dim">
        Örnek/temsili içerik — gerçek üründe gerçek zamanlı haber kaynaklarından
        beslenip AI tarafından özetlenecek.
      </p>

      <div className="mr-5 grid grid-cols-2 gap-[18px]">
        {NEWS.map((n, i) => (
          <NewsCard key={i} {...n} />
        ))}
      </div>
    </motion.div>
  );
}
