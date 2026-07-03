"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore, type ViewName } from "@/lib/store";

const EASE = [0.32, 0.72, 0, 1] as const;

interface SearchResult {
  id: string;
  group: string;
  title: string;
  sub?: string;
  view: ViewName;
  onSelect: () => void;
}

export function useSearchShortcut(open: boolean, setOpen: (v: boolean) => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCombo = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (!isCombo) return;
      e.preventDefault();
      setOpen(!open);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const collections = useStore((s) => s.collections);
  const materials = useStore((s) => s.materials);
  const journalEntries = useStore((s) => s.journalEntries);
  const tasks = useStore((s) => s.tasks);
  const setView = useStore((s) => s.setView);
  const setLastOpenedCollection = useStore((s) => s.setLastOpenedCollection);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      // Autofocus needs to wait a frame for the mount/animation to land.
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const out: SearchResult[] = [];

    for (const c of collections) {
      if (c.name.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q)) {
        out.push({
          id: `col-${c.id}`,
          group: "Collections",
          title: c.name,
          sub: c.sub,
          view: "collections",
          onSelect: () => {
            setLastOpenedCollection(c.id);
            setView("collections");
          },
        });
      }
    }

    for (const m of materials) {
      if (m.name.toLowerCase().includes(q) || m.supplier.toLowerCase().includes(q)) {
        out.push({
          id: `mat-${m.id}`,
          group: "Materials",
          title: m.name,
          sub: m.supplier,
          view: "materials",
          onSelect: () => setView("materials"),
        });
      }
    }

    for (const j of journalEntries) {
      if (j.reflection.toLowerCase().includes(q)) {
        out.push({
          id: `jrn-${j.date}`,
          group: "Journal",
          title: j.date,
          sub: j.reflection.slice(0, 80),
          view: "journal",
          onSelect: () => setView("journal"),
        });
      }
    }

    for (const t of tasks) {
      if (t.text.toLowerCase().includes(q)) {
        out.push({
          id: `task-${t.id}`,
          group: "Görevler",
          title: t.text,
          sub: t.done ? "Tamamlandı" : "Bugün",
          view: "studio",
          onSelect: () => setView("studio"),
        });
      }
    }

    return out.slice(0, 30);
  }, [query, collections, materials, journalEntries, tasks, setView, setLastOpenedCollection]);

  const handleSelect = (r: SearchResult) => {
    r.onSelect();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[96] flex items-start justify-center bg-ink/85 pt-[15vh] backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="w-full max-w-[460px] px-6"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="overflow-hidden rounded-[1.25rem] border border-white/[0.08] bg-[#100d09]/95 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)]">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") onClose();
                }}
                placeholder="Koleksiyonlarda, kumaşlarda, günlükte, görevlerde ara…"
                className="w-full border-b border-white/[0.06] bg-transparent px-5 py-4 text-[14px] text-bone outline-none placeholder:text-muted"
              />
              <div className="max-h-[50vh] overflow-y-auto p-2">
                {query.trim() && results.length === 0 && (
                  <p className="px-3 py-4 text-[12.5px] text-muted">Sonuç yok.</p>
                )}
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r)}
                    className="flex w-full flex-col items-start gap-0.5 rounded-[0.75rem] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="text-[9px] uppercase tracking-[1.5px] text-gold">
                      {r.group}
                    </span>
                    <span className="text-[13px] text-bone-dim">{r.title}</span>
                    {r.sub && <span className="text-[11.5px] text-muted">{r.sub}</span>}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
