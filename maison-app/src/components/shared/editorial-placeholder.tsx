"use client";

// A considered "no photo yet" state — a contact-sheet/proof-mark motif
// instead of pretending to depict a garment. Used anywhere a real image
// (upload or fetched og:image) isn't available, so the space never reads
// as broken or empty.
export function EditorialPlaceholder({
  palette,
  label,
  sublabel,
  className = "",
}: {
  palette: [string, string];
  label: string;
  sublabel?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `
          radial-gradient(ellipse 70% 90% at 50% 40%, color-mix(in srgb, ${palette[0]} 18%, transparent), transparent 70%),
          linear-gradient(175deg, color-mix(in srgb, ${palette[1]} 85%, var(--color-ink)) 0%, var(--color-ink) 78%)
        `,
      }}
    >
      {/* Corner registration marks — a darkroom contact-sheet cue that this
          is an intentional archive placeholder, not a broken image. */}
      {(["top-2.5 left-2.5", "top-2.5 right-2.5", "bottom-2.5 left-2.5", "bottom-2.5 right-2.5"] as const).map(
        (pos) => (
          <span
            key={pos}
            className={`absolute ${pos} h-2 w-2 border-white/25 ${
              pos.includes("top") ? "border-t" : "border-b"
            } ${pos.includes("left") ? "border-l" : "border-r"}`}
          />
        )
      )}

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-6 text-center">
        <p className="font-serif text-lg italic leading-snug text-bone-dim">{label}</p>
        {sublabel && (
          <p className="text-[9.5px] uppercase tracking-[2px] text-muted">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
