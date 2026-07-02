"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, type SuggestionType } from "@/lib/store";
import { OrbInput } from "./orb-input";
import { HoverBorderGradient } from "@/components/vendor/hover-border-gradient";

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

const EASE = [0.32, 0.72, 0, 1] as const;

export function AiStudioPanel() {
  const aiPanelOpen = useStore((s) => s.aiPanelOpen);
  const toggleAiPanel = useStore((s) => s.toggleAiPanel);
  const pendingSuggestion = useStore((s) => s.pendingSuggestion);
  const suggestionLoading = useStore((s) => s.suggestionLoading);
  const proposeSuggestion = useStore((s) => s.proposeSuggestion);
  const updatePendingContent = useStore((s) => s.updatePendingContent);
  const confirmSuggestion = useStore((s) => s.confirmSuggestion);
  const cancelSuggestion = useStore((s) => s.cancelSuggestion);

  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!input.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      proposeSuggestion(input);
    }, 900);
    return () => clearTimeout(debounceRef.current);
  }, [input, proposeSuggestion]);

  const handleConfirm = () => {
    confirmSuggestion();
    setInput("");
    setEditing(false);
  };

  const handleCancel = () => {
    cancelSuggestion();
    setEditing(false);
  };

  const handleClose = () => {
    toggleAiPanel();
    setInput("");
    setEditing(false);
    if (pendingSuggestion) cancelSuggestion();
  };

  return (
    <>
      {/* Trigger — bottom-left, mirrors the old Finance Pulse corner so it never
          collides with the image panel's caption on the right */}
      <HoverBorderGradient
        onClick={toggleAiPanel}
        duration={1.4}
        containerClassName="fixed bottom-[22px] left-[22px] z-50 backdrop-blur-xl"
        innerClassName="flex items-center gap-2.5 py-2 pl-2 pr-4 text-[10.5px] uppercase tracking-[2px] text-muted transition-colors hover:text-bone"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/[0.06]">
          <span className="h-1.5 w-1.5 animate-[pulse-glow_2.4s_infinite] rounded-full bg-gold" />
        </span>
        Talk to your Studio
      </HoverBorderGradient>

      <AnimatePresence>
        {aiPanelOpen && (
          <motion.div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/85 backdrop-blur-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            onClick={(e) => {
              if (e.target === e.currentTarget) handleClose();
            }}
          >
            <motion.button
              onClick={handleClose}
              whileHover={{ scale: 1.08, rotate: 90 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="absolute right-8 top-8 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-muted hover:text-bone"
            >
              ✕
            </motion.button>

            <motion.div
              className="flex w-full max-w-[480px] flex-col items-center px-8"
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              <p className="mb-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[9.5px] uppercase tracking-[2.5px] text-bone-dim">
                Studio Assistant
              </p>
              <p className="mb-10 mt-3 max-w-[360px] text-center text-[13px] leading-relaxed text-bone-dim">
                Bugünü, bir fikri ya da bir deadline&apos;ı anlat — ben türünü
                belirleyip önereceğim. Onaylamadan hiçbir şey eklenmez.
              </p>

              <OrbInput
                value={input}
                onChange={setInput}
                placeholder="Bugünü anlat…"
                active={Boolean(input.trim())}
                loading={suggestionLoading}
              />

              <AnimatePresence mode="wait">
                {suggestionLoading && !pendingSuggestion && (
                  <motion.p
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mt-8 text-[11px] uppercase tracking-[2px] text-muted"
                  >
                    düşünüyor…
                  </motion.p>
                )}
                {pendingSuggestion && (
                  <motion.div
                    key="suggestion"
                    initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="relative mt-8 w-full overflow-hidden rounded-[1.5rem] border border-white/[0.07] px-5 py-6"
                    style={{
                      background: `radial-gradient(90% 90% at 100% 0%, color-mix(in srgb, ${TYPE_COLORS[pendingSuggestion.type]} 35%, transparent), transparent 60%), linear-gradient(155deg, #17181a 0%, #0c0d0e 75%)`,
                    }}
                  >
                    <div
                      className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-70"
                      style={{
                        background: `radial-gradient(circle, color-mix(in srgb, ${TYPE_COLORS[pendingSuggestion.type]} 85%, white), ${TYPE_COLORS[pendingSuggestion.type]} 55%, transparent 75%)`,
                        filter: "blur(24px)",
                      }}
                    />
                    <div className="relative">
                      <p
                        className="mb-2.5 text-center text-[9.5px] uppercase tracking-[2.5px]"
                        style={{ color: TYPE_COLORS[pendingSuggestion.type] }}
                      >
                        {TYPE_LABELS[pendingSuggestion.type]} olarak algıladım
                      </p>
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
