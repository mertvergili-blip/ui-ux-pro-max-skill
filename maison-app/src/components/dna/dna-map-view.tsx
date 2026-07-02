"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { animate, stagger } from "animejs";
import {
  DNA_CATEGORY_META,
  DNA_EDGES,
  DNA_NODES,
  type DnaCategory,
} from "@/lib/dna-data";
import { layoutDnaGraph, type LaidOutNode } from "@/lib/dna-layout";
import { localWhatWouldTheyDo } from "@/lib/what-would-they-do";
import { useTypewriter } from "@/lib/use-typewriter";

const WIDTH = 900;
const HEIGHT = 560;

function degreeOf(nodeId: string): number {
  return DNA_EDGES.filter((e) => e.from === nodeId || e.to === nodeId).length;
}

// Client coords -> SVG viewBox coords, accounting for the element's current
// scaled/rendered size vs its viewBox.
function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const p = pt.matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

const DRAG_THRESHOLD = 4;

export function DnaMapView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeCategory, setActiveCategory] = useState<DnaCategory | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const laidOut = useMemo<LaidOutNode[]>(
    () => layoutDnaGraph(DNA_NODES, DNA_EDGES, WIDTH, HEIGHT),
    []
  );

  // Positions start from the force-directed settle, then become freely
  // draggable — an Obsidian-style graph you can rearrange by hand.
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(
    () => Object.fromEntries(laidOut.map((n) => [n.id, { x: n.x, y: n.y }]))
  );
  const dragState = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);

  const positioned = useMemo<LaidOutNode[]>(
    () =>
      laidOut.map((n) => ({
        ...n,
        x: positions[n.id]?.x ?? n.x,
        y: positions[n.id]?.y ?? n.y,
      })),
    [laidOut, positions]
  );
  const byId = useMemo(() => new Map(positioned.map((n) => [n.id, n])), [positioned]);

  const handlePointerDown = (e: React.PointerEvent<SVGGElement>, nodeId: string) => {
    const svg = svgRef.current;
    if (!svg) return;
    const svgPt = toSvgPoint(svg, e.clientX, e.clientY);
    const node = byId.get(nodeId);
    if (!node) return;
    dragState.current = {
      id: nodeId,
      offsetX: svgPt.x - node.x,
      offsetY: svgPt.y - node.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGGElement>) => {
    const drag = dragState.current;
    const svg = svgRef.current;
    if (!drag || !svg) return;
    const svgPt = toSvgPoint(svg, e.clientX, e.clientY);
    const nx = svgPt.x - drag.offsetX;
    const ny = svgPt.y - drag.offsetY;
    if (!drag.moved) {
      const node = byId.get(drag.id);
      if (node && Math.hypot(nx - node.x, ny - node.y) > DRAG_THRESHOLD) {
        drag.moved = true;
      }
    }
    if (drag.moved) {
      setPositions((prev) => ({
        ...prev,
        [drag.id]: {
          x: Math.max(24, Math.min(WIDTH - 24, nx)),
          y: Math.max(24, Math.min(HEIGHT - 24, ny)),
        },
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGGElement>, nodeId: string) => {
    const drag = dragState.current;
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (drag && !drag.moved) {
      setSelectedId((cur) => (cur === nodeId ? null : nodeId));
    }
    dragState.current = null;
  };

  const connectedIds = useMemo(() => {
    if (!selectedId) return null;
    const ids = new Set<string>([selectedId]);
    for (const e of DNA_EDGES) {
      if (e.from === selectedId) ids.add(e.to);
      if (e.to === selectedId) ids.add(e.from);
    }
    return ids;
  }, [selectedId]);

  const selectedNode = selectedId ? byId.get(selectedId) : null;

  const [wwtd, setWwtd] = useState<{ id: string; text: string } | null>(null);
  const wwtdDisplay = useTypewriter(wwtd?.text ?? "");
  const [wwtdLoading, setWwtdLoading] = useState(false);

  const askWhatWouldTheyDo = async (nodeId: string, designerName: string) => {
    setWwtdLoading(true);
    setWwtd(null);
    let text = localWhatWouldTheyDo(designerName);
    try {
      const res = await fetch("/api/what-would-they-do", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designerName }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.perspective) text = data.perspective;
      }
    } catch {
      // local perspective already set above
    }
    setWwtd({ id: nodeId, text });
    setWwtdLoading(false);
  };

  useEffect(() => {
    if (!svgRef.current) return;
    const nodeEls = svgRef.current.querySelectorAll("[data-node]");
    const edgeEls = svgRef.current.querySelectorAll("[data-edge]");

    animate(edgeEls, {
      strokeDashoffset: [1, 0],
      opacity: [0, 1],
      duration: 900,
      delay: stagger(12),
      ease: "outSine",
    });

    animate(nodeEls, {
      scale: [0, 1],
      opacity: [0, 1],
      duration: 600,
      delay: stagger(18, { start: 300 }),
      ease: "outElastic(1, .6)",
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="lg:pr-14"
    >
      <p className="mb-[18px] flex items-center gap-2.5 text-[10.5px] uppercase tracking-[3.5px] text-muted">
        <span className="h-px w-7 bg-gradient-to-r from-gold/70 to-transparent" />
        Reference DNA Map
      </p>
      <h1 className="mb-2 font-heading text-[28px] font-normal leading-[1.12] text-[#f7f2e6] lg:text-[34px]">
        Yaratıcı kimliğini zaman içinde gör.
      </h1>
      <p className="mb-7 max-w-[460px] text-[13.5px] leading-relaxed text-bone-dim">
        Moodboard değil — koleksiyonlarını besleyen tasarımcı, renk, form,
        doku, dönem ve zanaat referanslarının birbirine nasıl bağlandığını
        gösteren bir harita.
      </p>

      <div className="mb-6 flex flex-wrap gap-1.5">
        {(Object.keys(DNA_CATEGORY_META) as DnaCategory[]).map((cat) => {
          const meta = DNA_CATEGORY_META[cat];
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(active ? null : cat);
                setSelectedId(null);
              }}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9.5px] uppercase tracking-[1.5px] transition-colors duration-250"
              style={{
                borderColor: active ? meta.color : "rgba(255,255,255,0.08)",
                color: active ? meta.color : "var(--color-muted)",
                background: active ? "rgba(255,255,255,0.03)" : "transparent",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: meta.color }}
              />
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="bento-tile bento-blue relative">
          <div className="bento-orb" style={{ width: 200, height: 200, bottom: -60, right: -60 }} />
          <div className="relative">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="h-auto w-full lg:h-[460px] lg:w-[620px]"
            >
              {DNA_EDGES.map((e, i) => {
                const a = byId.get(e.from);
                const b = byId.get(e.to);
                if (!a || !b) return null;
                const dim =
                  (activeCategory &&
                    a.category !== activeCategory &&
                    b.category !== activeCategory) ||
                  (connectedIds && !(connectedIds.has(e.from) && connectedIds.has(e.to)));
                return (
                  <line
                    key={i}
                    data-edge
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="var(--color-bone-dim)"
                    strokeWidth={1}
                    strokeOpacity={dim ? 0.06 : 0.22}
                    pathLength={1}
                    strokeDasharray={1}
                    style={{ transition: "stroke-opacity 0.4s ease" }}
                  />
                );
              })}

              {positioned.map((n) => {
                const meta = DNA_CATEGORY_META[n.category];
                const dim =
                  (activeCategory && n.category !== activeCategory) ||
                  (connectedIds && !connectedIds.has(n.id));
                const r = n.category === "collection" ? 10 : 6 + degreeOf(n.id) * 0.7;
                return (
                  <g
                    key={n.id}
                    data-node
                    className="cursor-grab touch-none active:cursor-grabbing"
                    onPointerDown={(e) => handlePointerDown(e, n.id)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={(e) => handlePointerUp(e, n.id)}
                    onPointerCancel={(e) => handlePointerUp(e, n.id)}
                    style={{ transformOrigin: `${n.x}px ${n.y}px` }}
                  >
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={r + 9}
                      fill="transparent"
                      style={{ pointerEvents: "all" }}
                    />
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={r}
                      fill={meta.color}
                      opacity={dim ? 0.18 : selectedId === n.id ? 1 : 0.75}
                      style={{ transition: "opacity 0.3s ease", pointerEvents: "none" }}
                    />
                    <text
                      x={n.x}
                      y={n.y - r - 8}
                      textAnchor="middle"
                      fontSize={n.category === "collection" ? 13 : 11}
                      fill={dim ? "transparent" : "var(--color-bone-dim)"}
                      style={{
                        fontFamily: "var(--font-sans)",
                        transition: "fill 0.3s ease",
                        pointerEvents: "none",
                      }}
                    >
                      {n.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="w-full flex-shrink-0 pt-2 lg:w-[220px]">
          {selectedNode ? (
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p
                className="mb-2 text-[9.5px] uppercase tracking-[2.5px]"
                style={{ color: DNA_CATEGORY_META[selectedNode.category].color }}
              >
                {DNA_CATEGORY_META[selectedNode.category].label}
              </p>
              <p className="mb-1 font-heading text-lg text-bone">
                {selectedNode.label}
              </p>
              {selectedNode.note && (
                <p className="mb-4 text-xs text-muted">{selectedNode.note}</p>
              )}
              <p className="mb-2 text-[9.5px] uppercase tracking-[2.5px] text-muted">
                Bağlantılar
              </p>
              <div className="flex flex-col gap-1.5">
                {DNA_EDGES.filter(
                  (e) => e.from === selectedNode.id || e.to === selectedNode.id
                ).map((e, i) => {
                  const otherId = e.from === selectedNode.id ? e.to : e.from;
                  const other = byId.get(otherId);
                  if (!other) return null;
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedId(other.id)}
                      className="text-left text-[12.5px] text-bone-dim transition-colors hover:text-bone"
                    >
                      {other.label}
                    </button>
                  );
                })}
              </div>

              {selectedNode.category === "designer" && (
                <div className="mt-6 border-t border-dashed border-line pt-5">
                  {wwtd && wwtd.id === selectedNode.id ? (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-serif text-[13.5px] italic leading-relaxed text-bone-dim"
                    >
                      {wwtdDisplay}
                    </motion.p>
                  ) : (
                    <button
                      onClick={() => askWhatWouldTheyDo(selectedNode.id, selectedNode.label)}
                      disabled={wwtdLoading}
                      className="text-left text-[11px] uppercase tracking-[1.5px] text-muted transition-colors hover:text-gold disabled:opacity-40"
                    >
                      {wwtdLoading
                        ? "Düşünüyor…"
                        : `${selectedNode.label} olsa ne yapardı?`}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <p className="text-[12.5px] leading-relaxed text-muted">
              Bir düğüme tıkla — bağlantılarını gör. Yukarıdaki etiketlerle
              kategoriye göre filtrele.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
