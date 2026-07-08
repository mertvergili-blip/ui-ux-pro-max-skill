"use client";

import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { localNoteInsight } from "@/lib/note-insight";
import { localPortfolioPitch } from "@/lib/portfolio-pitch";
import { useTypewriter } from "@/lib/use-typewriter";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";
import { useStore, type CollectionFolder as FolderData } from "@/lib/store";
import { resizeImageFile } from "@/lib/image-resize";
import { useUndoStore } from "@/lib/undo-toast";
import { useSwipeDelete } from "@/lib/use-swipe-delete";
import { SwipeDeleteBackdrop } from "@/components/shared/swipe-delete-backdrop";
import { AiSourceTag } from "@/components/shared/ai-source-tag";
import { CollectionPoster } from "./collection-poster";
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
  pitchSource,
  large,
}: {
  data: FolderData;
  onOpenProject: (folder: FolderData) => void;
  onRemove: () => void;
  pitch?: string;
  pitchLoading?: boolean;
  pitchSource?: "ai" | "local";
  large?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pitchDisplay = useTypewriter(pitch ?? "");
  const swipe = useSwipeDelete(onRemove);

  return (
    <div className="group folder-hover-zoom cursor-pointer transition-transform duration-300 lg:hover:-translate-y-0.5 lg:hover:scale-[1.015]">
      <div
        className={large ? "relative h-[150px]" : "relative h-[118px]"}
        style={{ perspective: "800px" }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Ambient glow — not clipped (the Pieces below need to pop up past
            the folder's own bounds when it opens), so this lives as a soft
            blurred backdrop rather than a proper .bento-orb, echoing the
            same accent-glow language the rest of the app uses without
            fighting that animation. */}
        {large && (
          <div
            className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full opacity-40 blur-2xl"
            style={{ background: data.accent }}
          />
        )}
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
        {/* Lid — a radial highlight layered over the base gradient, matching
            the bento-tile system's glow language elsewhere in the app. */}
        <div
          className="absolute inset-0 rounded-[4px_8px_8px_4px] shadow-lg"
          style={{
            background: `radial-gradient(90% 90% at 100% -10%, color-mix(in srgb, ${data.accent} 55%, transparent), transparent 60%), linear-gradient(150deg, color-mix(in srgb, ${data.accent} 62%, var(--color-ink)), color-mix(in srgb, ${data.accent} 30%, var(--color-ink)) 70%)`,
            transformOrigin: "bottom",
            transform: isOpen ? "rotateX(-125deg)" : "rotateX(0deg)",
            transition: "transform 0.55s cubic-bezier(.2,.9,.25,1.1)",
          }}
        >
          {/* The old `count` field was a fixed seed number that never
              changed as images were actually added or removed — this reads
              the real gallery length instead, so the badge never claims
              content that isn't there. Hidden at 0 rather than showing a
              bare "0" on the cover. */}
          {(data.images?.length ?? 0) > 0 && (
            <span className="absolute bottom-2.5 right-3.5 text-[11px] text-white/75">
              {data.images!.length}
            </span>
          )}
        </div>
      </div>

      <div className={`relative overflow-hidden rounded-lg lg:overflow-visible ${large ? "mt-5" : "mt-4"}`}>
        <SwipeDeleteBackdrop x={swipe.x} />
        <motion.div {...swipe.props}>
          <div className="mb-1 flex items-center justify-between">
            <p
              className="text-[9.5px] uppercase tracking-[2.5px]"
              style={{ color: data.accent }}
            >
              {data.status}
            </p>
            {!swipe.touch && (
              <button
                onClick={onRemove}
                className="text-[9.5px] uppercase tracking-[1.5px] text-muted opacity-60 transition-opacity duration-200 hover:text-rose lg:opacity-0 lg:group-hover:opacity-100"
              >
                Kaldır
              </button>
            )}
          </div>
          <p className={large ? "font-heading text-[20px]" : "font-heading text-[17px]"}>{data.name}</p>
          <p className={large ? "mt-1 text-[13px] text-muted" : "mt-0.5 text-xs text-muted"}>{data.sub}</p>
          {(pitch || pitchLoading) && (
            <p className="mt-2 flex flex-wrap items-center gap-1.5 font-serif text-[12.5px] italic leading-relaxed text-bone-dim">
              {pitchLoading ? "Pitch hazırlanıyor…" : pitchDisplay}
              {!pitchLoading && pitchSource && <AiSourceTag source={pitchSource} />}
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
        </motion.div>
      </div>
    </div>
  );
}

function AddFolderCard({
  onAdd,
  large,
}: {
  onAdd: (f: Omit<FolderData, "id" | "count">) => void;
  large?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sub, setSub] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [accent, setAccent] = useState(ACCENT_PRESETS[0]);

  const reset = () => {
    setName("");
    setSub("");
    setDeadlineDate("");
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
      deadlineDate: deadlineDate || undefined,
    });
    reset();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`flex ${large ? "h-[150px]" : "h-[118px]"} flex-col items-center justify-center gap-2 self-start rounded-[4px_8px_8px_4px] border border-dashed border-line text-muted transition-colors hover:border-gold/40 hover:text-gold`}
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
      className="bento-tile bento-gold flex flex-col gap-2.5 p-4"
      style={{ ["--bento-radius" as string]: "4px 8px 8px 4px" }}
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
      <label className="flex items-center justify-between gap-2 border-b border-line pb-1.5 text-[11.5px] text-bone-dim">
        <span className="text-muted">Teslim tarihi (opsiyonel)</span>
        <input
          type="date"
          value={deadlineDate}
          onChange={(e) => setDeadlineDate(e.target.value)}
          className="bg-transparent text-bone-dim outline-none [color-scheme:dark]"
        />
      </label>
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
  const [aiSource, setAiSource] = useState<"ai" | "local">("local");
  const [posterOpen, setPosterOpen] = useState(false);
  const noteTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const addProjectNote = useStore((s) => s.addProjectNote);

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

  const handleNoteInput = (text: string) => {
    setNotes(text);
    setAiText("");
    if (noteTimer.current) clearTimeout(noteTimer.current);
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 3) return;
    noteTimer.current = setTimeout(async () => {
      let insight = localNoteInsight(folder.name);
      let source: "ai" | "local" = "local";
      try {
        const res = await fetch("/api/note-insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectName: folder.name, notes: text }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.insight) insight = data.insight;
          if (data.source === "gemini") source = "ai";
        }
      } catch {
        // local insight already set above
      }
      setAiSource(source);
      typeText(insight);
    }, 1400);
  };

  const {
    isSupported: micSupported,
    listening: micListening,
    start: startMic,
    stop: stopMic,
  } = useSpeechRecognition(handleNoteInput);

  // The textarea used to be a write-only scratchpad — whatever you typed
  // fed a live AI preview but was never actually kept anywhere, so
  // navigating away lost it silently. This is the one explicit moment it
  // actually lands somewhere.
  const handleSaveNote = () => {
    if (!notes.trim()) return;
    if (noteTimer.current) clearTimeout(noteTimer.current);
    addProjectNote({
      collectionId: folder.id,
      text: notes.trim(),
      insight: aiText || undefined,
      insightSource: aiText ? aiSource : undefined,
    });
    setNotes("");
    setAiText("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14"
    >
      <div className="max-w-[520px] lg:flex-shrink-0">
        <div className="flex items-center justify-between">
          <span
            className="cursor-pointer text-[10.5px] uppercase tracking-[2px] text-muted hover:text-bone"
            onClick={onClose}
          >
            ← Collections
          </span>
          <button
            onClick={() => setPosterOpen(true)}
            className="text-[10.5px] uppercase tracking-[2px] text-muted transition-colors hover:text-gold"
          >
            Poster Oluştur ✦
          </button>
        </div>
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
        {posterOpen && (
          <CollectionPoster folder={folder} onClose={() => setPosterOpen(false)} />
        )}
        <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
          Notlarım
        </p>
        <div className="bento-tile bento-graphite relative mb-5">
          <textarea
            className={`min-h-[136px] w-full resize-none border-none bg-transparent p-[18px] text-sm leading-relaxed text-bone-dim outline-none placeholder:text-muted ${
              micSupported ? "pr-12" : ""
            }`}
            placeholder={micListening ? "Dinliyorum…" : "Bu proje için fikrini yaz — AI kategorize etsin…"}
            value={notes}
            onChange={(e) => handleNoteInput(e.target.value)}
          />
          {micSupported && (
            <button
              type="button"
              onClick={() => (micListening ? stopMic() : startMic(notes))}
              aria-label={micListening ? "Sesli girişi durdur" : "Sesle yaz"}
              title={micListening ? "Sesli girişi durdur" : "Sesle yaz"}
              className={`absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                micListening
                  ? "border-rose/40 text-rose"
                  : "border-white/[0.08] text-muted hover:border-white/20 hover:text-gold"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none">
                <path
                  d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3zM19 11a7 7 0 01-14 0M12 18v3"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {micListening && (
                <motion.span
                  className="pointer-events-none absolute inset-0 rounded-full border border-rose/40"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                />
              )}
            </button>
          )}
        </div>
        {aiText && (
          <div className="mb-3 flex items-start gap-3 border-t border-line pt-4 text-[13px] leading-relaxed text-bone-dim">
            <span
              className="mt-1 h-1.5 w-1.5 flex-shrink-0 animate-[pulse-glow_2.4s_infinite] rounded-full"
              style={{ background: folder.accent }}
            />
            <span className="flex flex-wrap items-center gap-2">
              {aiText}
              <AiSourceTag source={aiSource} />
            </span>
          </div>
        )}
        {notes.trim() && (
          <button
            onClick={handleSaveNote}
            className="mb-8 rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[1.5px] text-ink transition-opacity hover:opacity-90"
            style={{ background: folder.accent }}
          >
            Notu Ekle
          </button>
        )}

        <ProjectNotesList collectionId={folder.id} />

        <LinkedMaterials collectionId={folder.id} />

        <StudioTeam notes={notes} accent={folder.accent} />

        <IterationLog collectionId={folder.id} />
      </div>

      <ProjectGallery folder={folder} />
    </motion.div>
  );
}

// The persisted history of notes saved via "Notu Ekle" above — previously
// nothing here ever actually stuck, so this list is new, not a redesign.
function ProjectNotesList({ collectionId }: { collectionId: string }) {
  const allNotes = useStore((s) => s.projectNotes);
  const removeProjectNote = useStore((s) => s.removeProjectNote);
  const restoreProjectNote = useStore((s) => s.restoreProjectNote);
  const showUndo = useUndoStore((s) => s.show);
  const notes = allNotes.filter((n) => n.collectionId === collectionId);

  if (notes.length === 0) return null;

  const handleRemove = (id: string) => {
    const index = allNotes.findIndex((n) => n.id === id);
    const note = allNotes[index];
    removeProjectNote(id);
    if (note) showUndo("Not kaldırıldı", () => restoreProjectNote(note, index));
  };

  return (
    <div className="mb-8 border-t border-line pt-6">
      <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
        Kaydedilen Notlar
      </p>
      <AnimatePresence mode="popLayout">
        <div className="flex flex-col gap-4">
          {notes.map((n) => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25 }}
              className="group"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] leading-relaxed text-bone-dim">{n.text}</p>
                <button
                  onClick={() => handleRemove(n.id)}
                  className="shrink-0 text-[9.5px] uppercase tracking-[1.5px] text-muted opacity-0 transition-opacity hover:text-rose group-hover:opacity-100"
                >
                  Kaldır
                </button>
              </div>
              {n.insight && (
                <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11.5px] leading-relaxed text-muted">
                  {n.insight}
                  {n.insightSource && <AiSourceTag source={n.insightSource} />}
                </p>
              )}
              <p className="mt-1.5 text-[9.5px] uppercase tracking-[1.5px] text-muted/70">
                {new Date(n.createdAt).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}

// The reverse side of Materials' "+ Koleksiyona bağla" control — shows
// which fabrics were tagged as used in this specific project, so the two
// archives aren't completely isolated from each other.
function LinkedMaterials({ collectionId }: { collectionId: string }) {
  const materials = useStore((s) => s.materials);
  const setView = useStore((s) => s.setView);
  const linked = materials.filter((m) => m.linkedCollectionIds?.includes(collectionId));

  if (linked.length === 0) return null;

  return (
    <div className="mb-8 border-t border-line pt-6">
      <div className="mb-3.5 flex items-center justify-between">
        <p className="text-[9.5px] uppercase tracking-[3px] text-muted">Kumaşlar</p>
        <button
          onClick={() => setView("materials")}
          className="text-[10px] uppercase tracking-[1.5px] text-muted transition-colors hover:text-bone-dim"
        >
          Arşive Git
        </button>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {linked.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-3"
          >
            <span
              className="h-5 w-5 flex-shrink-0 overflow-hidden rounded-full ring-1 ring-white/10"
              style={m.imageUrl ? undefined : { background: m.colorTag }}
            >
              {m.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.imageUrl} alt="" className="h-full w-full object-cover" />
              )}
            </span>
            <span className="text-[12px] text-bone-dim">{m.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Bento span pattern cycled across the gallery for visual variety — every
// 5th and 8th tile in a run gets to be the "hero" of its row, the rest stay
// small squares, echoing a masonry moodboard rather than a plain grid.
const GALLERY_SPAN_PATTERN = ["", "", "col-span-2 row-span-2", "", "", ""];

function MoodboardImage({
  folderId,
  image,
  projectName,
  spanClassName,
}: {
  folderId: string;
  image: NonNullable<FolderData["images"]>[number];
  projectName: string;
  spanClassName: string;
}) {
  const removeProjectImage = useStore((s) => s.removeProjectImage);
  const restoreProjectImage = useStore((s) => s.restoreProjectImage);
  const setProjectImageInsight = useStore((s) => s.setProjectImageInsight);
  const showUndo = useUndoStore((s) => s.show);
  const [analyzing, setAnalyzing] = useState(false);
  // Kept separate from image.insight — a failure shouldn't get written into
  // the store and rendered back as if it were a real AI insight; it's
  // session-local UI state with an actual retry action attached.
  const [failed, setFailed] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleRemove = () => {
    removeProjectImage(folderId, image.id);
    showUndo("Görsel kaldırıldı", () => restoreProjectImage(folderId, image));
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setFailed(false);
    try {
      const res = await fetch("/api/image-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl: image.dataUrl, projectName }),
      });
      const data = await res.json();
      if (data.insight) {
        setProjectImageInsight(folderId, image.id, data.insight);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      <div
        className={`group relative overflow-hidden rounded-[0.7rem] bg-black/20 ${spanClassName}`}
      >
        <button
          onClick={() => setLightboxOpen(true)}
          className="block h-full w-full cursor-zoom-in"
          aria-label="Görseli büyüt"
        >
          {/* User-uploaded data URL, not a remote asset. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.dataUrl} alt="" className="h-full w-full object-cover" />
        </button>
        <button
          onClick={handleRemove}
          className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-[10px] text-bone-dim opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Görseli kaldır"
        >
          ✕
        </button>
        {/* A short badge only — the full insight text lives in the lightbox
            now, not stacked on the photo itself where a real (often
            multi-sentence) Gemini response used to swallow the whole image. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-1.5 pt-6">
          {image.insight ? (
            <span className="pointer-events-auto inline-flex items-center gap-1 text-[8.5px] uppercase tracking-[1.2px] text-gold">
              ✦ İncelendi
            </span>
          ) : failed ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAnalyze();
              }}
              disabled={analyzing}
              className="pointer-events-auto flex items-center gap-1 text-[8.5px] uppercase tracking-[1.2px] text-rose transition-colors hover:text-bone disabled:opacity-40"
            >
              {analyzing ? "İnceleniyor…" : "İnceleme başarısız — tekrar dene"}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAnalyze();
              }}
              disabled={analyzing}
              className="pointer-events-auto text-[8.5px] uppercase tracking-[1.2px] text-gold transition-colors hover:text-bone disabled:opacity-40"
            >
              {analyzing ? "İnceleniyor…" : "AI ile incele"}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <ImageLightbox
            image={image}
            analyzing={analyzing}
            failed={failed}
            onAnalyze={handleAnalyze}
            onClear={() => setProjectImageInsight(folderId, image.id, "")}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function ImageLightbox({
  image,
  analyzing,
  failed,
  onAnalyze,
  onClear,
  onClose,
}: {
  image: NonNullable<FolderData["images"]>[number];
  analyzing: boolean;
  failed: boolean;
  onAnalyze: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return createPortal(
    <motion.div
      className="fixed inset-0 z-[97] flex flex-col bg-ink/95 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        onClick={onClose}
        className="fixed right-6 top-6 z-[98] flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-muted hover:text-bone"
        aria-label="Kapat"
      >
        ✕
      </button>
      <div className="flex flex-1 items-center justify-center overflow-hidden p-6 pb-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.dataUrl}
          alt=""
          className="max-h-full max-w-full rounded-[0.4rem] object-contain"
        />
      </div>
      <div className="mx-auto w-full max-w-[560px] p-6">
        {image.insight ? (
          <div className="rounded-[1rem] border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[9px] uppercase tracking-[2px] text-gold">AI İncelemesi</p>
              <button
                onClick={onClear}
                className="text-[9px] uppercase tracking-[1.5px] text-muted hover:text-rose"
              >
                Sil
              </button>
            </div>
            <p className="text-[13px] leading-relaxed text-bone-dim">{image.insight}</p>
          </div>
        ) : (
          <button
            onClick={onAnalyze}
            disabled={analyzing}
            className={`w-full rounded-[1rem] border border-dashed px-4 py-3 text-[11px] uppercase tracking-[1.5px] transition-colors disabled:opacity-40 ${
              failed
                ? "border-rose/30 text-rose hover:border-rose/50"
                : "border-white/15 text-gold hover:border-gold/40"
            }`}
          >
            {analyzing
              ? "İnceleniyor…"
              : failed
              ? "İnceleme başarısız — tekrar dene"
              : "AI ile incele"}
          </button>
        )}
      </div>
    </motion.div>,
    document.body
  );
}

function ProjectGallery({ folder }: { folder: FolderData }) {
  const addProjectImage = useStore((s) => s.addProjectImage);
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // A moodboard is rarely one photo — pinning a reference board a handful
  // of images at a time used to mean repeating the picker one file at a
  // time. Resizes/adds them one after another rather than in parallel so
  // a slow one doesn't block the rest from landing in order.
  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setUploading(true);
    try {
      for (const file of list) {
        const dataUrl = await resizeImageFile(file);
        addProjectImage(folder.id, dataUrl);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Copy out of the live FileList before resetting value — clearing
    // e.target.value empties the same FileList object in place, since it's
    // backed by the input rather than a snapshot.
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (files.length) handleFiles(files);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const images = folder.images ?? [];

  return (
    <div
      className={`lg:min-w-0 lg:flex-1 ${dragOver ? "rounded-[1rem] outline outline-2 outline-dashed outline-gold/50" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[9.5px] uppercase tracking-[3px] text-muted">
          Moodboard &amp; Referanslar
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cameraRef.current?.click()}
            disabled={uploading}
            aria-label="Fotoğraf çek"
            title="Fotoğraf çek"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-gold/50 hover:text-gold disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-[13px] w-[13px]" fill="none">
              <path
                d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="13" r="3.1" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
          <button
            onClick={() => uploadRef.current?.click()}
            disabled={uploading}
            className="text-[9.5px] uppercase tracking-[1.5px] text-gold transition-colors hover:text-bone disabled:opacity-40"
          >
            {uploading ? "…" : "Yükle"}
          </button>
        </div>
        <input
          ref={uploadRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>
      {images.length > 0 ? (
        <div className="grid auto-rows-[92px] grid-cols-3 gap-2 sm:auto-rows-[110px] sm:grid-cols-4 lg:grid-cols-3">
          {images.map((img, i) => (
            <MoodboardImage
              key={img.id}
              folderId={folder.id}
              image={img}
              projectName={folder.name}
              spanClassName={GALLERY_SPAN_PATTERN[i % GALLERY_SPAN_PATTERN.length]}
            />
          ))}
        </div>
      ) : (
        <button
          onClick={() => uploadRef.current?.click()}
          className="flex min-h-[180px] w-full flex-col items-center justify-center gap-2 rounded-[1rem] border border-dashed border-line px-6 text-center text-muted transition-colors hover:border-gold/40 hover:text-gold"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8.5" cy="9.5" r="1.4" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M21 15.5l-5-5-4 4-3-3-6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="max-w-[220px] text-[11.5px] leading-relaxed">
            Moodboard, bir manipülasyon denemesi ya da ilham aldığın bir nesnenin
            fotoğrafını ekle — AI görsele bakıp yorumlayabilir.
          </span>
        </button>
      )}
    </div>
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
  const [feedbackSource, setFeedbackSource] = useState<"ai" | "local">("local");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!notes.trim() || loading) return;
    setLoading(true);
    setFeedback(null);
    let result = localStudioTeamFeedback(notes);
    let source: "ai" | "local" = "local";
    try {
      const res = await fetch("/api/studio-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: notes }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.feedback)) result = data.feedback;
        if (data.source === "gemini") source = "ai";
      }
    } catch {
      // local result already set above
    }
    setFeedback(result);
    setFeedbackSource(source);
    setLoading(false);
  };

  return (
    <div className="mb-8 border-t border-line pt-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[9.5px] uppercase tracking-[3px] text-muted">
            Stüdyo Ekibi
          </p>
          {feedback && <AiSourceTag source={feedbackSource} />}
        </div>
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
  const restoreIterationEntry = useStore((s) => s.restoreIterationEntry);
  const showUndo = useUndoStore((s) => s.show);
  const entries = allEntries.filter((e) => e.collectionId === collectionId);

  const handleRemove = (id: string) => {
    const entry = allEntries.find((e) => e.id === id);
    removeIterationEntry(id);
    if (entry) showUndo("Günlük girişi kaldırıldı", () => restoreIterationEntry(entry));
  };

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
              onClick={() => handleRemove(e.id)}
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
  const lastOpenedCollectionId = useStore((s) => s.lastOpenedCollectionId);
  const setLastOpenedCollection = useStore((s) => s.setLastOpenedCollection);
  // Seeded from the persisted "last opened" id — so leaving mid-task (to
  // check Journal, say) and coming back to Collections drops you exactly
  // where you left off instead of back at the folder grid.
  const [openProjectId, setOpenProjectId] = useState<string | null>(
    () => lastOpenedCollectionId
  );
  const collections = useStore((s) => s.collections);
  const addCollection = useStore((s) => s.addCollection);
  const removeCollection = useStore((s) => s.removeCollection);
  const restoreCollection = useStore((s) => s.restoreCollection);
  const showUndo = useUndoStore((s) => s.show);
  // Look the open folder up live from the store each render, rather than
  // holding a snapshot object — otherwise mutations like addProjectImage
  // never show up because the held snapshot never updates.
  const openProject = collections.find((c) => c.id === openProjectId) ?? null;

  const openProjectAndRemember = (folder: FolderData) => {
    setOpenProjectId(folder.id);
    setLastOpenedCollection(folder.id);
  };

  const closeProject = () => {
    setOpenProjectId(null);
    setLastOpenedCollection(null);
  };

  const handleRemoveCollection = (id: string) => {
    const index = collections.findIndex((c) => c.id === id);
    const folder = collections[index];
    removeCollection(id);
    if (folder) {
      showUndo(`"${folder.name}" kaldırıldı`, () => restoreCollection(folder, index));
    }
  };

  // Portfolio Autopilot — generates a one-line pitch per collection on
  // demand, always reading live from the collections list, so a project
  // added/removed here is reflected without any separate portfolio doc.
  const [portfolioMode, setPortfolioMode] = useState(false);
  const [pitches, setPitches] = useState<Record<string, string>>({});
  const [pitchSources, setPitchSources] = useState<Record<string, "ai" | "local">>({});
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
      let source: "ai" | "local" = "local";
      try {
        const res = await fetch("/api/portfolio-pitch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: c.name, status: c.status, sub: c.sub }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.pitch) pitch = data.pitch;
          if (data.source === "gemini") source = "ai";
        }
      } catch {
        // local pitch already set above
      }
      setPitches((prev) => ({ ...prev, [c.id]: pitch }));
      setPitchSources((prev) => ({ ...prev, [c.id]: source }));
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
            onClose={closeProject}
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
            {/* Few projects get larger cards in a width-capped, left-anchored
                row instead of spreading thin across the full-width grid —
                that's what used to read as a mostly-empty admin panel with
                only 3-4 collections. Once the archive grows past 3, it
                reverts to the dense multi-column grid. */}
            <div
              className={`mt-12 grid grid-cols-1 gap-x-[26px] gap-y-[34px] sm:grid-cols-2 lg:mt-[90px] ${
                collections.length <= 3
                  ? "lg:max-w-[700px] lg:grid-cols-2"
                  : "lg:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {collections.map((f) => (
                <Folder
                  key={f.id}
                  data={f}
                  onOpenProject={openProjectAndRemember}
                  onRemove={() => handleRemoveCollection(f.id)}
                  pitch={portfolioMode ? pitches[f.id] : undefined}
                  pitchLoading={portfolioMode && pitchLoadingIds.has(f.id)}
                  pitchSource={portfolioMode ? pitchSources[f.id] : undefined}
                  large={collections.length <= 3}
                />
              ))}
              <AddFolderCard onAdd={addCollection} large={collections.length <= 3} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
