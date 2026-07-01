"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FolderData {
  name: string;
  status: string;
  accent: string;
  count: number;
  sub: string;
}

const FOLDERS: FolderData[] = [
  {
    name: "Koleksiyon III — Terre & Or",
    status: "In Progress",
    accent: "var(--color-gold)",
    count: 12,
    sub: "6 gün kaldı",
  },
  {
    name: "Koleksiyon II — Verre Bleu",
    status: "Archived",
    accent: "var(--color-blue)",
    count: 9,
    sub: "Mart 2026",
  },
  {
    name: "Koleksiyon I — Rosé Poudré",
    status: "Archived",
    accent: "var(--color-rose)",
    count: 7,
    sub: "Okul projesi",
  },
];

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

  const posStyles = {
    p1: { left: "6%", transitionDelay: "0.08s" },
    p2: { left: "32%", transitionDelay: "0.15s" },
    p3: { left: "58%", transitionDelay: "0.22s" },
  };

  const openTransforms = {
    p1: "translateY(-46px) rotate(-9deg) scale(1)",
    p2: "translateY(-58px) rotate(2deg) scale(1)",
    p3: "translateY(-46px) rotate(9deg) scale(1)",
  };

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
    elRef.current.style.transform = `${openTransforms[pos]} translateY(${dy}px)`;
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
        ...posStyles[pos],
        background: `color-mix(in srgb, ${accent} 70%, var(--color-ink))`,
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? openTransforms[pos] : "translateY(10px) scale(0.8)",
        transition: "transform 0.45s cubic-bezier(.2,.9,.25,1.2), opacity 0.35s",
        transitionDelay: isOpen ? posStyles[pos].transitionDelay : "0s",
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
}: {
  data: FolderData;
  onOpenProject: (folder: FolderData) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="group cursor-pointer">
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
        <p
          className="mb-1 text-[9.5px] uppercase tracking-[2.5px]"
          style={{ color: data.accent }}
        >
          {data.status}
        </p>
        <p className="font-heading text-[17px]">{data.name}</p>
        <p className="mt-0.5 text-xs text-muted">{data.sub}</p>
        <span
          className="mt-2.5 inline-block translate-x-[-4px] text-[10.5px] uppercase tracking-[1.5px] opacity-0 transition-all duration-250 group-hover:translate-x-0 group-hover:opacity-100"
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
    noteTimer.current = setTimeout(() => {
      typeText(
        `Not aldım — bunu "${folder.name}" için 'Konsept Notları' altında kategorize ettim. İstersen bir hatırlatma da ekleyeyim.`
      );
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
      <p className="mb-[18px] mt-5 flex items-center gap-2.5 text-[10.5px] uppercase tracking-[3px] text-gold">
        <span className="h-px w-7 bg-gold" />
        {folder.status}
      </p>
      <h1 className="mb-6 font-heading text-[32px] font-normal leading-[1.12] text-[#f7f2e6]">
        {folder.name}
      </h1>
      <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
        Notlarım
      </p>
      <textarea
        className="mb-5 min-h-[140px] w-full rounded-[3px] border border-line bg-transparent p-5 text-sm leading-relaxed text-bone-dim outline-none placeholder:text-muted"
        placeholder="Bu proje için fikrini yaz — AI kategorize etsin…"
        value={notes}
        onChange={(e) => handleNoteInput(e.target.value)}
      />
      {aiText && (
        <div className="flex items-start gap-3 border-t border-line pt-4 text-[13px] leading-relaxed text-bone-dim">
          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 animate-[pulse-glow_2.4s_infinite] rounded-full bg-gold" />
          <span>{aiText}</span>
        </div>
      )}
    </motion.div>
  );
}

export function CollectionsView() {
  const [openProject, setOpenProject] = useState<FolderData | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="pr-14"
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
            <p className="mb-[18px] flex items-center gap-2.5 text-[10.5px] uppercase tracking-[3px] text-gold">
              <span className="h-px w-7 bg-gold" />
              Collections
            </p>
            <h1 className="mb-7 font-heading text-[34px] font-normal leading-[1.12] text-[#f7f2e6]">
              Klasörü aç, içindeki parçaları gör.
            </h1>
            <div className="mt-[90px] grid grid-cols-3 gap-x-[26px] gap-y-[34px]">
              {FOLDERS.map((f) => (
                <Folder
                  key={f.name}
                  data={f}
                  onOpenProject={setOpenProject}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
