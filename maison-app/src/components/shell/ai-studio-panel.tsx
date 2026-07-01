"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, type SuggestionType } from "@/lib/store";

const TYPE_LABELS: Record<SuggestionType, string> = {
  task: "Task",
  idea: "Idea",
  note: "Note",
  mood: "Mood",
  deadline: "Deadline",
  calendar: "Calendar Block",
};

const TYPE_COLORS: Record<SuggestionType, string> = {
  task: "var(--color-gold)",
  idea: "var(--color-blue)",
  note: "var(--color-muted)",
  mood: "var(--color-rose)",
  deadline: "var(--color-wine)",
  calendar: "var(--color-sage)",
};

export function AiStudioPanel() {
  const {
    aiPanelOpen,
    toggleAiPanel,
    pendingSuggestion,
    proposeSuggestion,
    updatePendingContent,
    confirmSuggestion,
    cancelSuggestion,
  } = useStore();

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

  return (
    <>
      {/* Trigger */}
      <button
        onClick={toggleAiPanel}
        className="fixed bottom-[22px] right-[22px] z-50 flex items-center gap-3 rounded-[3px] border border-line bg-ink/80 px-4 py-3 text-[10.5px] uppercase tracking-[2.5px] text-muted backdrop-blur-sm transition-colors hover:text-bone"
      >
        <span className="h-1.5 w-1.5 animate-[pulse-glow_2.4s_infinite] rounded-full bg-gold" />
        Talk to your Studio
      </button>

      <AnimatePresence>
        {aiPanelOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[90] bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleAiPanel}
            />
            <motion.div
              className="fixed right-0 top-0 z-[95] flex h-screen w-[400px] flex-col border-l border-line bg-ink p-8"
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div className="mb-8 flex items-center justify-between">
                <p className="font-serif text-lg italic text-bone">Studio Assistant</p>
                <button
                  onClick={toggleAiPanel}
                  className="text-muted transition-colors hover:text-bone"
                >
                  ✕
                </button>
              </div>

              <p className="mb-6 text-[13px] leading-relaxed text-bone-dim">
                Bugünü, bir fikri ya da bir deadline&apos;ı anlat — ben türünü
                belirleyip önereceğim. Onaylamadan hiçbir şey eklenmez.
              </p>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Örn: yarın kumaş tedarikçisiyle görüşme var…"
                className="min-h-[90px] w-full resize-none rounded-[3px] border border-line bg-transparent p-3.5 text-[13px] text-bone outline-none placeholder:text-muted focus:border-gold/50"
              />

              <AnimatePresence mode="wait">
                {pendingSuggestion && (
                  <motion.div
                    key="suggestion"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mt-5 rounded-[3px] border border-line p-4"
                  >
                    <p
                      className="mb-2.5 text-[9.5px] uppercase tracking-[2.5px]"
                      style={{ color: TYPE_COLORS[pendingSuggestion.type] }}
                    >
                      {TYPE_LABELS[pendingSuggestion.type]} olarak algıladım
                    </p>
                    {editing ? (
                      <textarea
                        value={pendingSuggestion.content}
                        onChange={(e) => updatePendingContent(e.target.value)}
                        className="mb-3 w-full resize-none rounded-[3px] border border-line bg-transparent p-2.5 text-[13px] text-bone outline-none"
                        rows={2}
                        autoFocus
                      />
                    ) : (
                      <p className="mb-3 text-[13.5px] leading-relaxed text-bone">
                        {pendingSuggestion.content}
                      </p>
                    )}
                    <div className="flex gap-2 text-[10.5px] uppercase tracking-[1.5px]">
                      <button
                        onClick={handleConfirm}
                        className="rounded-[3px] border border-gold px-3.5 py-2 text-gold transition-colors hover:bg-gold hover:text-ink"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setEditing(!editing)}
                        className="rounded-[3px] border border-line px-3.5 py-2 text-bone-dim transition-colors hover:border-bone-dim"
                      >
                        {editing ? "Done" : "Edit"}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="rounded-[3px] border border-line px-3.5 py-2 text-muted transition-colors hover:border-muted"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
