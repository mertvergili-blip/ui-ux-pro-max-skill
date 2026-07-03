"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore, type SuggestionType } from "@/lib/store";
import { haptics } from "@/lib/haptics";
import { AiSourceTag } from "@/components/shared/ai-source-tag";

const TYPE_LABELS: Record<SuggestionType, string> = {
  task: "Görev",
  idea: "Fikir",
  note: "Not",
  mood: "Ruh Hali",
  deadline: "Deadline",
  calendar: "Takvim Bloğu",
};

const TYPE_COLORS: Record<SuggestionType, string> = {
  task: "var(--color-bone-dim)",
  idea: "var(--color-blue)",
  note: "var(--color-muted)",
  mood: "var(--color-rose)",
  deadline: "var(--color-gold)",
  calendar: "var(--color-sage)",
};

// The always-visible fast path for "just capture this" — typing here and
// hitting Enter never opens a modal. A task (the common case) lands
// straight on the list via the CommandPanel's own auto-confirm effect,
// which fires on the shared pendingSuggestion state regardless of which of
// the two components proposed it. Anything that needs real review (idea,
// note, mood, deadline, calendar) gets a compact inline card right above
// this bar instead of the full-screen overlay. Search still lives one tap
// away via onExpand, for when a quick capture isn't actually what's needed.
export function MiniComposer({ onExpand }: { onExpand: () => void }) {
  const pendingSuggestion = useStore((s) => s.pendingSuggestion);
  const suggestionLoading = useStore((s) => s.suggestionLoading);
  const proposeSuggestion = useStore((s) => s.proposeSuggestion);
  const updatePendingContent = useStore((s) => s.updatePendingContent);
  const confirmSuggestion = useStore((s) => s.confirmSuggestion);
  const cancelSuggestion = useStore((s) => s.cancelSuggestion);
  const bottomSheetOpen = useStore((s) => s.bottomSheetOpen);

  const [value, setValue] = useState("");
  const [editing, setEditing] = useState(false);

  // BottomNav's "Diğer" sheet occupies the exact same bottom-left corner on
  // mobile — without this, the composer's higher z-index (needed to sit
  // above ordinary page content) sat on top of that sheet's last item and
  // silently ate its taps instead of showing a broken-looking overlap.
  if (bottomSheetOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    proposeSuggestion(value);
    setValue("");
  };

  const handleConfirm = () => {
    haptics.confirm();
    confirmSuggestion();
    setEditing(false);
  };

  const handleCancel = () => {
    cancelSuggestion();
    setEditing(false);
  };

  // The task auto-confirm effect lives on CommandPanel (shared store state),
  // so a task typed here still lands without any card ever appearing —
  // only non-task types make it to this render.
  const showCard = pendingSuggestion && pendingSuggestion.type !== "task";

  return (
    <div className="fixed bottom-[calc(var(--bottom-nav-h,0px)+22px)] left-[max(22px,env(safe-area-inset-left))] z-50 w-[min(340px,calc(100vw-44px))] lg:bottom-[max(22px,calc(env(safe-area-inset-bottom)+14px))]">
      <AnimatePresence>
        {showCard && pendingSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="relative mb-2 overflow-hidden rounded-[1.1rem] border border-white/[0.08] p-4"
            style={{
              background: `radial-gradient(90% 90% at 100% 0%, color-mix(in srgb, ${TYPE_COLORS[pendingSuggestion.type]} 30%, transparent), transparent 60%), #100d09f2`,
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <p
                className="text-[9px] uppercase tracking-[2px]"
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
                className="mb-3 w-full resize-none rounded-[3px] border border-line bg-transparent p-2 text-[12.5px] text-bone outline-none"
                rows={2}
                autoFocus
              />
            ) : (
              <p className="mb-3 text-[12.5px] leading-relaxed text-bone">
                {pendingSuggestion.content}
              </p>
            )}
            <div className="flex gap-2 text-[9.5px] uppercase tracking-[1.5px]">
              <button
                onClick={handleConfirm}
                className="rounded-full bg-gold px-3 py-1.5 text-ink"
              >
                Onayla
              </button>
              <button
                onClick={() => setEditing(!editing)}
                className="rounded-full border border-white/10 px-3 py-1.5 text-bone-dim hover:border-white/25"
              >
                {editing ? "Tamam" : "Düzenle"}
              </button>
              <button
                onClick={handleCancel}
                className="rounded-full border border-white/10 px-3 py-1.5 text-muted hover:border-white/25"
              >
                Vazgeç
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-[#100d09]/90 py-1.5 pl-1.5 pr-2 backdrop-blur-xl"
      >
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
          <span
            className={`h-1.5 w-1.5 rounded-full bg-gold ${
              suggestionLoading ? "animate-[pulse-glow_1s_infinite]" : "animate-[pulse-glow_2.4s_infinite]"
            }`}
          />
        </span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Bugünü anlat…"
          className="min-w-0 flex-1 bg-transparent text-[12.5px] text-bone outline-none placeholder:text-muted"
        />
        <button
          type="button"
          onClick={onExpand}
          aria-label="Ara"
          title="Ara (Ctrl/Cmd+K)"
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-gold"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
            <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M20 20l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </form>
    </div>
  );
}
