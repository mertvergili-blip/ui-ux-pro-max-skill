"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { localNoteInsight } from "@/lib/note-insight";
import { localPortfolioPitch } from "@/lib/portfolio-pitch";
import { useTypewriter } from "@/lib/use-typewriter";
import { useStore, type CollectionFolder as FolderData } from "@/lib/store";
import {
  STUDIO_TEAM,
  localStudioTeamFeedback,
  type PersonaFeedback,
} from "@/lib/studio-team";

const ACCENT_PRESETS = [
  "var(--color-gold)",
  "var(--color-blue)",
  "var(--color-rose)",
  "var(--color-sage)",
];

const PIECE_POS_STYLES = {
  p1: { left: "6%", transitionDelay: "0.08s" },
  p2: { left: "32%", transitionDelay: "0.15s" },
  p3: { left: "58%", transitionDelay: "0.22s" },
} as const;

const PIECE_OPEN_TRANSFORMS = {
  p1: "translateY(-46px) rotate(-9deg) scale(1)",
  p2: "translateY(-58px) rotate(2deg) scale(1)",
  p3: "translateY(-46px) rotate(9deg) scale(1)",
} as const;

function Piece({
  pos,
  accent,
  isOpen,
  onDragClose,
}: {
  pos: "p1" | "p2" | "p3";
  accent: string;
  isOpen: boolean;
  onDragClose: () => void;
}) {
  const startY = useRef(0);
  const elRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!elRef.current) return;
    dragging.current = true;
    startY.current = e.clientY;
    elRef.current.setPointerCapture(e.pointerId);
    elRef.current.style.transition = "none";
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !elRef.current) return;
    const dy = Math.max(0, e.clientY - startY.current);
    elRef.current.style.transform = `${PIECE_OPEN_TRANSFORMS[pos]} translateY(${dy}px)`;
    elRef.current.style.opacity = String(1 - Math.min(dy / 140, 0.7));
  }, [pos]);

  const handlePointerEnd = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || !elRef.current) return;
      dragging.current = false;
      const dy = Math.max(0, e.clientY - startY.current);
      elRef.current.style.transition = "";
      elRef.current.style.transform = "";
      elRef.current.style.opacity = "";
      if (dy > 70) onDragClose();
    },
    [onDragClose]
  );

  return (
    <div
      ref={elRef}
      className="absolute bottom-2 aspect-[3/4] w-[38%] rounded-[3px] border border-white/[0.08] shadow-lg"
      style={{
        ...PIECE_POS_STYLES[pos],
        background: `color-mix(in srgb, ${accent} 70%, var(--color-ink))`,
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? PIECE_OPEN_TRANSFORMS[pos] : "translateY(10px) scale(0.8)",
        transition: `transform 0.45s cubic-bezier(.2,.9,.25,1.2) ${
          isOpen ? PIECE_POS_STYLES[pos].transitionDelay : "0s"
        }, opacity 0.35s`,
        pointerEvents: isOpen ? "auto" : "none",
        cursor: isOpen ? "grab" : "default",
        touchAction: "none",
      }}
      onPointerDown={isOpen ? handlePointerDown : undefined}
      onPointerMove={isOpen ? handlePointerMove : undefined}
      onPointerUp={isOpen ? handlePointerEnd : undefined}
      onPointerCancel={isOpen ? handlePointerEnd : undefined}
    />
  );
}

function Folder({
  data,
  onOpenProject,
  onRemove,
  pitch,
  pitchLoading,
}: {
  data: FolderData;
  onOpenProject: (folder: FolderData) => void;
  onRemove: () => void;
  pitch?: string;
  pitchLoading?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pitchDisplay = useTypewriter(pitch ?? "");

  return (
    <div className="group folder-hover-zoom cursor-pointer transition-transform duration-300 lg:hover:-translate-y-0.5 lg:hover:scale-[1.015]">
      <div
        className="relative h-[118px]"
        style={{ perspective: "800px" }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Back */}
        <div
          className="absolute inset-0 rounded-[4px_8px_8px_4px] border border-line"
          style={{
            background: `linear-gradient(160deg, color-mix(in srgb, ${data.accent} 30%, var(--color-ink)), var(--color-ink))`,
          }}
        />
        {/* Tab */}
        <div
          className="absolute -top-[9px] left-3.5 h-3.5 w-[46px] rounded-t"
          style={{
            background: `color-mix(in srgb, ${data.accent} 55%, var(--color-ink))`,
          }}
        />
        {/* Pieces */}
        <Piece pos="p1" accent={data.accent} isOpen={isOpen} onDragClose={() => setIsOpen(false)} />
        <Piece pos="p2" accent={data.accent} isOpen={isOpen} onDragClose={() => setIsOpen(false)} />
        <Piece pos="p3" accent={data.accent} isOpen={isOpen} onDragClose={() => setIsOpen(false)} />
        {/* Lid */}
        <div
          className="absolute inset-0 rounded-[4px_8px_8px_4px] shadow-lg"
          style={{
            background: `linear-gradient(150deg, color-mix(in srgb, ${data.accent} 62%, var(--color-ink)), color-mix(in srgb, ${data.accent} 30%, var(--color-ink)) 70%)`,
            transformOrigin: "bottom",
            transform: isOpen ? "rotateX(-125deg)" : "rotateX(0deg)",
            transition: "transform 0.55s cubic-bezier(.2,.9,.25,1.1)",
          }}
        >
          <span className="absolute bottom-2.5 right-3.5 text-[11px] text-white/75">
            {data.count}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <p
            className="text-[9.5px] uppercase tracking-[2.5px]"
            style={{ color: data.accent }}
          >
            {data.status}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-[9.5px] uppercase tracking-[1.5px] text-muted opacity-60 transition-opacity duration-200 hover:text-rose lg:opacity-0 lg:group-hover:opacity-100"
          >
            Kaldır
          </button>
        </div>
        <p className="font-heading text-[17px]">{data.name}</p>
        <p className="mt-0.5 text-xs text-muted">{data.sub}</p>
        {(pitch || pitchLoading) && (
          <p className="mt-2 font-serif text-[12.5px] italic leading-relaxed text-bone-dim">
            {pitchLoading ? "Pitch hazırlanıyor…" : pitchDisplay}
          </p>
        )}
        <span
          className="mt-2.5 inline-block text-[10.5px] uppercase tracking-[1.5px] transition-all duration-250 lg:translate-x-[-4px] lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100"
          style={{ color: data.accent }}
          onClick={(e) => {
            e.stopPropagation();
            onOpenProject(data);
          }}
        >
          Projeyi Aç →
        </span>
      </div>
    </div>
  );
}

function AddFolderCard({
  onAdd,
}: {
  onAdd: (f: Omit<FolderData, "id" | "count">) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sub, setSub] = useState("");
  const [accent, setAccent] = useState(ACCENT_PRESETS[0]);

  const reset = () => {
    setName("");
    setSub("");
    setAccent(ACCENT_PRESETS[0]);
    setOpen(false);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      status: "In Progress",
      accent,
      sub: sub.trim() || "Yeni proje",
    });
    reset();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-[118px] flex-col items-center justify-center gap-2 self-start rounded-[4px_8px_8px_4px] border border-dashed border-line text-muted transition-colors hover:border-gold/40 hover:text-gold"
      >
        <span className="text-2xl font-light">+</span>
        <span className="text-[10px] uppercase tracking-[1.5px]">
          Yeni Proje
        </span>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bento-tile bento-gold flex flex-col gap-2.5 !rounded-[4px_8px_8px_4px] p-4"
    >
      <div className="mb-0.5 flex gap-1.5">
        {ACCENT_PRESETS.map((c) => (
          <button
            key={c}
            onClick={() => setAccent(c)}
            className={`h-5 w-5 rounded-full ring-2 transition-transform hover:scale-110 ${
              accent === c ? "ring-bone" : "ring-transparent"
            }`}
            style={{ background: c }}
          />
        ))}
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Koleksiyon adı"
        autoFocus
        className="border-b border-line bg-transparent pb-1.5 text-[13px] text-bone outline-none placeholder:text-muted focus:border-gold/50"
      />
      <input
        value={sub}
        onChange={(e) => setSub(e.target.value)}
        placeholder="Not (örn. Okul projesi)"
        className="border-b border-line bg-transparent pb-1.5 text-[11.5px] text-bone-dim outline-none placeholder:text-muted focus:border-gold/50"
      />
      <div className="mt-1 flex gap-2 text-[10px] uppercase tracking-[1.5px]">
        <button onClick={handleSave} className="rounded-full bg-gold px-3.5 py-1.5 text-ink">
          Kaydet
        </button>
        <button
          onClick={reset}
          className="rounded-full border border-white/10 px-3.5 py-1.5 text-muted hover:border-white/25"
        >
          Vazgeç
        </button>
      </div>
    </motion.div>
  );
}

function ProjectDetail({
  folder,
  onClose,
}: {
  folder: FolderData;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState("");
  const [aiText, setAiText] = useState("");
  const noteTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleNoteInput = (text: string) => {
    setNotes(text);
    setAiText("");
    if (noteTimer.current) clearTimeout(noteTimer.current);
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 3) return;
    noteTimer.current = setTimeout(async () => {
      let insight = localNoteInsight(folder.name);
      try {
        const res = await fetch("/api/note-insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectName: folder.name, notes: text }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.insight) insight = data.insight;
        }
      } catch {
        // local insight already set above
      }
      typeText(insight);
    }, 1400);
  };

  const typeText = (str: string) => {
    let i = 0;
    const iv = setInterval(() => {
      setAiText(str.slice(0, i) + "▌");
      i++;
      if (i > str.length) {
        clearInterval(iv);
        setAiText(str);
      }
    }, 16);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="max-w-[520px]"
    >
      <span
        className="cursor-pointer text-[10.5px] uppercase tracking-[2px] text-muted hover:text-bone"
        onClick={onClose}
      >
        ← Collections
      </span>
      <p
        className="mb-[18px] mt-5 flex items-center gap-2.5 text-[10.5px] uppercase tracking-[3px]"
        style={{ color: folder.accent }}
      >
        <span className="h-px w-7" style={{ background: folder.accent }} />
        {folder.status}
      </p>
      <h1 className="mb-6 font-heading text-[32px] font-normal leading-[1.12] text-[#f7f2e6]">
        {folder.name}
      </h1>
      <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
        Notlarım
      </p>
      <div className="bento-tile bento-graphite mb-5">
        <textarea
          className="min-h-[136px] w-full resize-none border-none bg-transparent p-[18px] text-sm leading-relaxed text-bone-dim outline-none placeholder:text-muted"
          placeholder="Bu proje için fikrini yaz — AI kategorize etsin…"
          value={notes}
          onChange={(e) => handleNoteInput(e.target.value)}
        />
      </div>
      {aiText && (
        <div className="mb-8 flex items-start gap-3 border-t border-line pt-4 text-[13px] leading-relaxed text-bone-dim">
          <span
            className="mt-1 h-1.5 w-1.5 flex-shrink-0 animate-[pulse-glow_2.4s_infinite] rounded-full"
            style={{ background: folder.accent }}
          />
          <span>{aiText}</span>
        </div>
      )}

      <StudioTeam notes={notes} accent={folder.accent} />

      <IterationLog collectionId={folder.id} />
    </motion.div>
  );
}

function PersonaMessage({
  persona,
  message,
  delay,
}: {
  persona: (typeof STUDIO_TEAM)[number];
  message: string;
  delay: number;
}) {
  const display = useTypewriter(message);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="flex items-start gap-3"
    >
      <span
        className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
        style={{ background: persona.accent }}
      />
      <p className="text-[13px] leading-relaxed text-bone-dim">
        <span className="text-bone">{persona.name}</span>
        <span className="text-muted"> · {persona.role} — </span>
        {display}
      </p>
    </motion.div>
  );
}

function StudioTeam({ notes, accent }: { notes: string; accent: string }) {
  const [feedback, setFeedback] = useState<PersonaFeedback[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!notes.trim() || loading) return;
    setLoading(true);
    setFeedback(null);
    let result = localStudioTeamFeedback(notes);
    try {
      const res = await fetch("/api/studio-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notes }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.feedback)) result = data.feedback;
      }
    } catch {
      // local result already set above
    }
    setFeedback(result);
    setLoading(false);
  };

  return (
    <div className="mb-8 border-t border-line pt-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[9.5px] uppercase tracking-[3px] text-muted">
          Stüdyo Ekibi
        </p>
        <button
          onClick={handleAsk}
          disabled={!notes.trim() || loading}
          className="text-[10px] uppercase tracking-[1.5px] text-muted transition-colors hover:text-bone-dim disabled:opacity-30"
          style={feedback || loading ? { color: accent } : undefined}
        >
          {loading ? "Soruluyor…" : "Ekibe Sor"}
        </button>
      </div>
      {!feedback && !loading && (
        <p className="text-[12px] leading-relaxed text-muted">
          Yukarıdaki nota dört farklı bakış açısından anlık geri bildirim al.
        </p>
      )}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-3.5"
          >
            {STUDIO_TEAM.map((p, i) => {
              const f = feedback.find((x) => x.personaId === p.id);
              if (!f) return null;
              return <PersonaMessage key={p.id} persona={p} message={f.message} delay={i * 0.06} />;
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IterationLog({ collectionId }: { collectionId: string }) {
  const allEntries = useStore((s) => s.iterationLogs);
  const addIterationEntry = useStore((s) => s.addIterationEntry);
  const removeIterationEntry = useStore((s) => s.removeIterationEntry);
  const entries = allEntries.filter((e) => e.collectionId === collectionId);

  const [open, setOpen] = useState(false);
  const [whatDidntWork, setWhatDidntWork] = useState("");
  const [why, setWhy] = useState("");

  const handleSave = () => {
    if (!whatDidntWork.trim()) return;
    addIterationEntry({ collectionId, whatDidntWork: whatDidntWork.trim(), why: why.trim() });
    setWhatDidntWork("");
    setWhy("");
    setOpen(false);
  };

  return (
    <div className="mt-2 border-t border-dashed border-line pt-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[9.5px] uppercase tracking-[3px] text-muted">
          İterasyon Günlüğü
        </p>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="text-[10px] uppercase tracking-[1.5px] text-muted hover:text-bone-dim"
          >
            + Ekle
          </button>
        )}
      </div>
      <p className="mb-4 text-[12px] leading-relaxed text-muted">
        İşe yaramayan kararlar ve nedenleri — portfolyoya girmeyen, sadece
        senin gelişimin için.
      </p>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="flex flex-col gap-2.5 rounded-[1rem] border border-dashed border-line p-4">
              <input
                value={whatDidntWork}
                onChange={(e) => setWhatDidntWork(e.target.value)}
                placeholder="Ne işe yaramadı?"
                autoFocus
                className="border-b border-line bg-transparent pb-1.5 text-[13px] text-bone outline-none placeholder:text-muted focus:border-bone-dim/50"
              />
              <input
                value={why}
                onChange={(e) => setWhy(e.target.value)}
                placeholder="Neden? (opsiyonel)"
                className="border-b border-line bg-transparent pb-1.5 text-[12.5px] text-bone-dim outline-none placeholder:text-muted focus:border-bone-dim/50"
              />
              <div className="mt-1 flex gap-2 text-[10px] uppercase tracking-[1.5px]">
                <button
                  onClick={handleSave}
                  className="rounded-full border border-bone-dim/40 px-3.5 py-1.5 text-bone-dim hover:border-bone-dim"
                >
                  Kaydet
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-white/10 px-3.5 py-1.5 text-muted hover:border-white/25"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-3">
        {entries.map((e) => (
          <div key={e.id} className="group flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] leading-relaxed text-bone-dim">{e.whatDidntWork}</p>
              {e.why && <p className="mt-0.5 text-[12px] text-muted">{e.why}</p>}
            </div>
            <button
              onClick={() => removeIterationEntry(e.id)}
              className="flex-shrink-0 text-[10px] uppercase tracking-[1.5px] text-muted opacity-60 transition-opacity hover:text-rose lg:opacity-0 lg:group-hover:opacity-100"
            >
              Kaldır
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CollectionsView() {
  const [openProject, setOpenProject] = useState<FolderData | null>(null);
  const collections = useStore((s) => s.collections);
  const addCollection = useStore((s) => s.addCollection);
  const removeCollection = useStore((s) => s.removeCollection);

  // Portfolio Autopilot — generates a one-line pitch per collection on
  // demand, always reading live from the collections list, so a project
  // added/removed here is reflected without any separate portfolio doc.
  const [portfolioMode, setPortfolioMode] = useState(false);
  const [pitches, setPitches] = useState<Record<string, string>>({});
  const [pitchLoadingIds, setPitchLoadingIds] = useState<Set<string>>(new Set());

  const togglePortfolioMode = () => {
    const next = !portfolioMode;
    setPortfolioMode(next);
    if (!next) return;

    const missing = collections.filter((c) => !pitches[c.id]);
    if (missing.length === 0) return;

    setPitchLoadingIds(new Set(missing.map((c) => c.id)));
    missing.forEach(async (c) => {
      let pitch = localPortfolioPitch(c.name, c.status);
      try {
        const res = await fetch("/api/portfolio-pitch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: c.name, status: c.status, sub: c.sub }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.pitch) pitch = data.pitch;
        }
      } catch {
        // local pitch already set above
      }
      setPitches((prev) => ({ ...prev, [c.id]: pitch }));
      setPitchLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(c.id);
        return next;
      });
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="lg:pr-14"
    >
      <AnimatePresence mode="wait">
        {openProject ? (
          <ProjectDetail
            key="detail"
            folder={openProject}
            onClose={() => setOpenProject(null)}
          />
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4 }}
          >
            <div className="mb-[18px] flex items-center justify-between">
              <p className="flex items-center gap-2.5 text-[10.5px] uppercase tracking-[3.5px] text-muted">
                <span className="h-px w-7 bg-gradient-to-r from-gold/70 to-transparent" />
                Collections
              </p>
              <button
                onClick={togglePortfolioMode}
                className={`text-[10px] uppercase tracking-[1.5px] transition-colors ${
                  portfolioMode ? "text-gold" : "text-muted hover:text-bone-dim"
                }`}
              >
                {portfolioMode ? "Portfolyo Modu · Açık" : "Portfolyo Modu"}
              </button>
            </div>
            <h1 className="mb-7 font-heading text-[28px] font-normal leading-[1.12] text-[#f7f2e6] lg:text-[34px]">
              Klasörü aç, içindeki parçaları gör.
            </h1>
            <div className="mt-12 grid grid-cols-1 gap-x-[26px] gap-y-[34px] sm:grid-cols-2 lg:mt-[90px] lg:grid-cols-3">
              {collections.map((f) => (
                <Folder
                  key={f.id}
                  data={f}
                  onOpenProject={setOpenProject}
                  onRemove={() => removeCollection(f.id)}
                  pitch={portfolioMode ? pitches[f.id] : undefined}
                  pitchLoading={portfolioMode && pitchLoadingIds.has(f.id)}
                />
              ))}
              <AddFolderCard onAdd={addCollection} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
