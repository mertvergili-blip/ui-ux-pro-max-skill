"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore, type SuggestionType, type ViewName } from "@/lib/store";
import { HoverBorderGradient } from "@/components/vendor/hover-border-gradient";
import { useUndoStore } from "@/lib/undo-toast";
import { haptics } from "@/lib/haptics";
import { AiSourceTag } from "@/components/shared/ai-source-tag";
import { MiniComposer } from "./mini-composer";

const EASE = [0.32, 0.72, 0, 1] as const;

interface SearchResult {
  id: string;
  group: string;
  title: string;
  sub?: string;
  view: ViewName;
  onSelect: () => void;
}

const TYPE_LABELS: Record<SuggestionType, string> = {
  task: "Görev",
  idea: "Fikir",
  note: "Not",
  mood: "Ruh Hali",
  deadline: "Deadline",
  calendar: "Takvim Bloğu",
};

// Gold is reserved for urgency (deadlines) — every other type gets its own
// quiet identity so the panel doesn't read as one big yellow moment.
const TYPE_COLORS: Record<SuggestionType, string> = {
  task: "var(--color-bone-dim)",
  idea: "var(--color-blue)",
  note: "var(--color-muted)",
  mood: "var(--color-rose)",
  deadline: "var(--color-gold)",
  calendar: "var(--color-sage)",
};

// Search, "/" quick-capture and the AI studio panel used to be three
// separate overlays with three separate triggers, each solving one half of
// "I want to get something in or out of the app quickly." One box that
// searches what exists and — if nothing matches — offers to capture it as
// something new covers both without asking the user to know in advance
// which of three tools they meant to open.
export function useCommandPanelShortcut() {
  const toggleAiPanel = useStore((s) => s.toggleAiPanel);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isComboK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const isSlash = e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey;
      if (isSlash) {
        const target = e.target as HTMLElement;
        const typing =
          target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
        if (typing) return;
      }
      if (!isComboK && !isSlash) return;
      e.preventDefault();
      toggleAiPanel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleAiPanel]);
}

export function CommandPanel() {
  const open = useStore((s) => s.aiPanelOpen);
  const toggleAiPanel = useStore((s) => s.toggleAiPanel);
  const closeAiPanel = useStore((s) => s.closeAiPanel);
  const pendingSuggestion = useStore((s) => s.pendingSuggestion);
  const suggestionLoading = useStore((s) => s.suggestionLoading);
  const proposeSuggestion = useStore((s) => s.proposeSuggestion);
  const updatePendingContent = useStore((s) => s.updatePendingContent);
  const confirmSuggestion = useStore((s) => s.confirmSuggestion);
  const cancelSuggestion = useStore((s) => s.cancelSuggestion);
  const removeTask = useStore((s) => s.removeTask);
  const showUndo = useUndoStore((s) => s.show);

  const collections = useStore((s) => s.collections);
  const materials = useStore((s) => s.materials);
  const journalEntries = useStore((s) => s.journalEntries);
  const tasks = useStore((s) => s.tasks);
  const setView = useStore((s) => s.setView);
  const setLastOpenedCollection = useStore((s) => s.setLastOpenedCollection);

  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 80);
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

  // Only worth asking the AI to classify this as a new task/note/etc. once
  // it's clear the user isn't just searching for something that already
  // exists — otherwise every search keystroke would also kick off a
  // classify request racing the results that already answer it.
  useEffect(() => {
    if (!query.trim() || results.length > 0) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      proposeSuggestion(query);
    }, 900);
    return () => clearTimeout(debounceRef.current);
  }, [query, results.length, proposeSuggestion]);

  // A task is the lowest-stakes, most common thing said here — reviewing a
  // card just to confirm what you already typed added friction without
  // adding safety. Everything else still gets the review card.
  useEffect(() => {
    if (pendingSuggestion?.type !== "task") return;
    haptics.success();
    confirmSuggestion();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery("");
    // Unconditional close (not toggle) — this same effect also fires for
    // a task captured through the always-visible mini composer, where the
    // panel was never open to begin with; toggling it there would open it.
    closeAiPanel();
    const currentTasks = useStore.getState().tasks;
    const added = currentTasks[currentTasks.length - 1];
    if (added) {
      showUndo(`"${added.text}" eklendi`, () => removeTask(added.id));
    }
  }, [pendingSuggestion, confirmSuggestion, closeAiPanel, removeTask, showUndo]);

  const handleSelect = (r: SearchResult) => {
    r.onSelect();
    handleClose();
  };

  const handleConfirm = () => {
    haptics.confirm();
    confirmSuggestion();
    setQuery("");
    setEditing(false);
  };

  const handleCancel = () => {
    cancelSuggestion();
    setEditing(false);
  };

  const handleClose = () => {
    closeAiPanel();
    setQuery("");
    setEditing(false);
    if (pendingSuggestion) cancelSuggestion();
  };

  const showResults = results.length > 0 && !pendingSuggestion;
  const showThinking =
    query.trim() && results.length === 0 && !pendingSuggestion && suggestionLoading;

  return (
    <>
      <MiniComposer onExpand={toggleAiPanel} />

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[96] flex items-start justify-center bg-ink/85 pt-[15vh] backdrop-blur-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            onClick={(e) => {
              if (e.target === e.currentTarget) handleClose();
            }}
          >
            <motion.div
              className="w-full max-w-[480px] px-6"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <div className="overflow-hidden rounded-[1.25rem] border border-white/[0.08] bg-[#100d09]/95 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)]">
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") handleClose();
                  }}
                  placeholder="Ara ya da bir şey anlat…"
                  className="w-full border-b border-white/[0.06] bg-transparent px-5 py-4 text-[14px] text-bone outline-none placeholder:text-muted"
                />

                {!query.trim() && (
                  <p className="px-5 py-4 text-[11.5px] leading-relaxed text-muted">
                    Koleksiyonlarda, kumaşlarda, günlükte ara — ya da bugünü,
                    bir fikri, bir deadline&apos;ı anlat, türünü ben belirleyeyim.
                  </p>
                )}

                {showResults && (
                  <div className="max-h-[45vh] overflow-y-auto p-2">
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
                )}

                {showThinking && (
                  <p className="px-5 py-4 text-[11.5px] uppercase tracking-[2px] text-muted">
                    düşünüyor…
                  </p>
                )}

                <AnimatePresence mode="wait">
                  {pendingSuggestion && (
                    <motion.div
                      key="suggestion"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="relative overflow-hidden border-t border-white/[0.06] px-5 py-6"
                      style={{
                        background: `radial-gradient(90% 90% at 100% 0%, color-mix(in srgb, ${TYPE_COLORS[pendingSuggestion.type]} 30%, transparent), transparent 60%)`,
                      }}
                    >
                      <div className="mb-2.5 flex items-center justify-center gap-2">
                        <p
                          className="text-center text-[9.5px] uppercase tracking-[2.5px]"
                          style={{ color: TYPE_COLORS[pendingSuggestion.type] }}
                        >
                          {TYPE_LABELS[pendingSuggestion.type]} olarak algıladım
                        </p>
                        <AiSourceTag source={pendingSuggestion.source} />
                      </div>
                      {editing ? (
                        <textarea
                          value={pendingSuggestion.content}
                          onChange={(e) => updatePendingContent(e.target.value)}
                          className="mb-4 w-full resize-none rounded-[3px] border border-line bg-transparent p-2.5 text-center text-[13px] text-bone outline-none"
                          rows={2}
                          autoFocus
                        />
                      ) : (
                        <p className="mb-4 text-center text-[13.5px] leading-relaxed text-bone">
                          {pendingSuggestion.content}
                        </p>
                      )}
                      <div className="flex justify-center gap-2 text-[10.5px] uppercase tracking-[1.5px]">
                        <HoverBorderGradient
                          onClick={handleConfirm}
                          duration={0.9}
                          gradientColor="var(--color-bone)"
                          innerBg="var(--color-gold)"
                          innerClassName="px-4 py-2 text-ink"
                        >
                          Onayla
                        </HoverBorderGradient>
                        <motion.button
                          onClick={() => setEditing(!editing)}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ duration: 0.2, ease: EASE }}
                          className="rounded-full border border-white/10 px-4 py-2 text-bone-dim hover:border-white/25"
                        >
                          {editing ? "Tamam" : "Düzenle"}
                        </motion.button>
                        <motion.button
                          onClick={handleCancel}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          transition={{ duration: 0.2, ease: EASE }}
                          className="rounded-full border border-white/10 px-4 py-2 text-muted hover:border-white/25"
                        >
                          Vazgeç
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
