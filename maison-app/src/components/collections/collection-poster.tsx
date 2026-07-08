"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useStore, type CollectionFolder as FolderData } from "@/lib/store";

const EASE = [0.32, 0.72, 0, 1] as const;

// The one genuinely new "wow" surface in this pass — everything else this
// round was making existing features honest or connected. This composes an
// editorial one-page spread entirely from a collection's own real data
// (its moodboard photos, its linked fabrics, its status) — nothing
// invented, nothing to configure, it just exists the moment a collection
// has a photo or two.
export function CollectionPoster({
  folder,
  onClose,
}: {
  folder: FolderData;
  onClose: () => void;
}) {
  const materials = useStore((s) => s.materials);
  const linked = materials.filter((m) => m.linkedCollectionIds?.includes(folder.id));
  const images = folder.images ?? [];
  const [hero, ...rest] = images;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[97] flex items-center justify-center bg-ink/90 p-4 backdrop-blur-xl sm:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.08, rotate: 90 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="fixed right-6 top-6 z-[98] flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-muted hover:text-bone print:hidden"
        >
          ✕
        </motion.button>
        <button
          onClick={() => window.print()}
          className="fixed right-20 top-6 z-[98] flex h-9 items-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-[10px] uppercase tracking-[1.5px] text-muted hover:border-gold/30 hover:text-gold print:hidden"
        >
          Yazdır
        </button>

        <motion.div
          id="collection-poster-print"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="relative aspect-[3/4] w-full max-w-[440px] overflow-hidden rounded-[0.4rem] border border-white/[0.08] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)]"
          style={{
            background: `radial-gradient(120% 60% at 100% 0%, color-mix(in srgb, ${folder.accent} 28%, transparent), transparent 60%), linear-gradient(175deg, color-mix(in srgb, ${folder.accent} 10%, #0c0d0e) 0%, #0a0906 78%)`,
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          <div className="relative flex h-full flex-col p-7">
            <div className="flex items-center justify-between">
              <span className="font-serif text-[13px] italic tracking-wide text-bone-dim">
                Maison
              </span>
              <span
                className="text-[8.5px] uppercase tracking-[2.5px]"
                style={{ color: folder.accent }}
              >
                {folder.status}
              </span>
            </div>

            <h1 className="mb-1 mt-6 font-heading text-[30px] font-normal leading-[1.08] text-[#f7f2e6]">
              {folder.name}
            </h1>
            {folder.sub && (
              <p className="mb-5 text-[11px] uppercase tracking-[1.5px] text-muted">
                {folder.sub}
              </p>
            )}

            {hero ? (
              <div className="mb-3 flex-1 overflow-hidden rounded-[0.3rem] bg-black/30">
                {/* User-uploaded data URL, not a remote asset. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hero.dataUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="mb-3 flex flex-1 items-center justify-center rounded-[0.3rem] border border-dashed border-white/10 text-center">
                <p className="max-w-[220px] text-[11.5px] leading-relaxed text-muted">
                  Moodboard&apos;a fotoğraf ekledikçe bu poster onlarla dolacak.
                </p>
              </div>
            )}

            {rest.length > 0 && (
              <div className="mb-5 grid grid-cols-4 gap-1.5">
                {rest.slice(0, 4).map((img) => (
                  <div key={img.id} className="aspect-square overflow-hidden rounded-[3px] bg-black/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.dataUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {linked.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-1.5 border-t border-white/[0.07] pt-4">
                {linked.slice(0, 6).map((m) => (
                  <span
                    key={m.id}
                    className="flex items-center gap-1.5 rounded-full border border-white/10 py-1 pl-1 pr-2.5 text-[9px] uppercase tracking-[1px] text-bone-dim"
                  >
                    <span
                      className="h-3 w-3 flex-shrink-0 rounded-full ring-1 ring-white/15"
                      style={{ background: m.colorTag }}
                    />
                    {m.name}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-baseline justify-between border-t border-white/[0.07] pt-4">
              <p className="text-[9px] uppercase tracking-[2px] text-muted">
                {images.length} {images.length === 1 ? "görsel" : "görsel"}
                {linked.length > 0 && ` · ${linked.length} kumaş`}
              </p>
              <p className="text-[9px] uppercase tracking-[2px] text-muted">
                {new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
