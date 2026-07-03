"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { animate, stagger } from "animejs";
import {
  DNA_CATEGORY_META,
  DNA_EDGES,
  DNA_NODES,
  type DnaCategory,
} from "@/lib/dna-data";
import {
  layoutDnaGraph,
  createSimNodes,
  stepDnaSimulation,
  resolveLabelCollisions,
  type SimNode,
} from "@/lib/dna-layout";
import { localWhatWouldTheyDo } from "@/lib/what-would-they-do";
import { useTypewriter } from "@/lib/use-typewriter";

const WIDTH = 900;
const HEIGHT = 560;

function degreeOf(nodeId: string): number {
  return DNA_EDGES.filter((e) => e.from === nodeId || e.to === nodeId).length;
}

function radiusOf(node: { id: string; category: DnaCategory }): number {
  return node.category === "collection" ? 10 : 6 + degreeOf(node.id) * 0.7;
}

function fontSizeOf(node: { category: DnaCategory }): number {
  return node.category === "collection" ? 15 : 12.5;
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
  const [expanded, setExpanded] = useState(false);

  // Metadata-only lookup (label/category/note) — never touched by physics.
  const nodeById = useMemo(() => new Map(DNA_NODES.map((n) => [n.id, n])), []);

  // The one-shot settle, computed once for the very first paint only — a
  // plain memoized value (not a ref) so it's safe to read during render.
  // Positions after that live entirely in simNodesRef below, which the
  // physics effect creates/owns and never gets read during render.
  const initialLaidOut = useMemo(
    () => layoutDnaGraph(DNA_NODES, DNA_EDGES, WIDTH, HEIGHT),
    []
  );
  const initialById = useMemo(
    () => new Map(initialLaidOut.map((n) => [n.id, n])),
    [initialLaidOut]
  );

  // Positions + velocities live in a ref, not React state — an always-on
  // Obsidian-style force sim mutates this every animation frame and writes
  // straight to the DOM (see the effect below), which would be fighting
  // React's reconciliation if this were state driving JSX on every tick.
  const simNodesRef = useRef<Map<string, SimNode> | null>(null);

  // Per-node label (ox, oy) nudge, resolved every frame by
  // resolveLabelCollisions — kept in its own ref for the same reason
  // simNodesRef is: mutated every animation frame, never read during render.
  const labelOffsetsRef = useRef<Map<string, { ox: number; oy: number }>>(
    new Map(DNA_NODES.map((n) => [n.id, { ox: 0, oy: 0 }]))
  );

  const circleRefs = useRef(new Map<string, SVGCircleElement>());
  const hitRefs = useRef(new Map<string, SVGCircleElement>());
  const textRefs = useRef(new Map<string, SVGTextElement>());
  const lineRefs = useRef(new Map<number, SVGLineElement>());

  const dragState = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);

  // Continuous simulation — runs for the component's whole lifetime, not
  // just while dragging, so releasing a node lets it keep settling and
  // dragging one node visibly tugs its spring-connected neighbors along.
  useEffect(() => {
    const nodes = createSimNodes(initialLaidOut);
    simNodesRef.current = nodes;
    let raf: number;

    const tick = () => {
      const draggedId = dragState.current?.moved ? dragState.current.id : null;
      stepDnaSimulation(nodes, DNA_EDGES, WIDTH, HEIGHT, draggedId);

      const nodeList = Array.from(nodes.values());
      resolveLabelCollisions(nodeList, labelOffsetsRef.current, radiusOf, fontSizeOf);

      for (const [id, node] of nodes) {
        const c = circleRefs.current.get(id);
        const h = hitRefs.current.get(id);
        const t = textRefs.current.get(id);
        if (c) {
          c.setAttribute("cx", String(node.x));
          c.setAttribute("cy", String(node.y));
        }
        if (h) {
          h.setAttribute("cx", String(node.x));
          h.setAttribute("cy", String(node.y));
        }
        if (t) {
          const off = labelOffsetsRef.current.get(id) ?? { ox: 0, oy: 0 };
          t.setAttribute("x", String(node.x + off.ox));
          t.setAttribute("y", String(node.y - radiusOf(node) - 8 + off.oy));
        }
      }

      DNA_EDGES.forEach((e, i) => {
        const line = lineRefs.current.get(i);
        const a = nodes.get(e.from);
        const b = nodes.get(e.to);
        if (line && a && b) {
          line.setAttribute("x1", String(a.x));
          line.setAttribute("y1", String(a.y));
          line.setAttribute("x2", String(b.x));
          line.setAttribute("y2", String(b.y));
        }
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [initialLaidOut]);

  const handlePointerDown = (e: React.PointerEvent<SVGGElement>, nodeId: string) => {
    const svg = svgRef.current;
    if (!svg) return;
    const svgPt = toSvgPoint(svg, e.clientX, e.clientY);
    const node = simNodesRef.current?.get(nodeId);
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
    const node = simNodesRef.current?.get(drag.id);
    if (!node) return;
    const svgPt = toSvgPoint(svg, e.clientX, e.clientY);
    const nx = svgPt.x - drag.offsetX;
    const ny = svgPt.y - drag.offsetY;
    if (!drag.moved && Math.hypot(nx - node.x, ny - node.y) > DRAG_THRESHOLD) {
      drag.moved = true;
    }
    if (drag.moved) {
      // Kinematic while held — the simulation (see the effect above) skips
      // force integration for whichever node id is currently dragged and
      // just lets its neighbors react to it moving.
      node.x = Math.max(24, Math.min(WIDTH - 24, nx));
      node.y = Math.max(24, Math.min(HEIGHT - 24, ny));
      node.vx = 0;
      node.vy = 0;
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

  // Focus/zoom transition — panning + scaling the viewBox toward the
  // selected node and its neighbors (like the label offsets above, driven
  // straight onto the DOM attribute so it doesn't fight the always-on
  // physics loop) and back out to the full graph on deselect.
  const viewBoxStateRef = useRef({ x: 0, y: 0, w: WIDTH, h: HEIGHT });
  useEffect(() => {
    const svg = svgRef.current;
    const nodes = simNodesRef.current;
    if (!svg) return;

    const aspect = WIDTH / HEIGHT;
    let target = { x: 0, y: 0, w: WIDTH, h: HEIGHT };

    if (selectedId && connectedIds && nodes) {
      const pts = Array.from(connectedIds)
        .map((id) => nodes.get(id))
        .filter((n): n is SimNode => !!n);
      if (pts.length) {
        const pad = 90;
        let minX = Math.min(...pts.map((p) => p.x)) - pad;
        const maxX = Math.max(...pts.map((p) => p.x)) + pad;
        let minY = Math.min(...pts.map((p) => p.y)) - pad;
        const maxY = Math.max(...pts.map((p) => p.y)) + pad;
        let w = maxX - minX;
        let h = maxY - minY;

        if (w / h > aspect) {
          const targetH = w / aspect;
          const cy = (minY + maxY) / 2;
          minY = cy - targetH / 2;
          h = targetH;
        } else {
          const targetW = h * aspect;
          const cx = (minX + maxX) / 2;
          minX = cx - targetW / 2;
          w = targetW;
        }

        w = Math.max(w, WIDTH * 0.35);
        h = w / aspect;
        target = { x: minX, y: minY, w, h };
      }
    }

    const from = viewBoxStateRef.current;
    const anim = animate(from, {
      x: target.x,
      y: target.y,
      w: target.w,
      h: target.h,
      duration: 700,
      ease: "outQuint",
      onUpdate: () => {
        svg.setAttribute("viewBox", `${from.x} ${from.y} ${from.w} ${from.h}`);
      },
    });

    return () => {
      anim.pause();
    };
  }, [selectedId, connectedIds]);

  const selectedNode = selectedId ? nodeById.get(selectedId) : null;

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
        gösteren bir harita. Bir düğümü sürükle — bağlı olduğu her şey
        peşinden gelir.
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

      {(() => {
        // Framer Motion leaves an inline `transform` on this component's
        // root motion.div even once its enter animation settles, which
        // creates a new CSS containing block — so a plain `fixed inset-0`
        // nested inside it would be positioned relative to that ancestor,
        // not the viewport, and wouldn't actually cover the screen (most
        // visible on mobile, where there's no room to spare). Portal the
        // expanded overlay straight to <body> to escape that; refs stay
        // valid across the portal since it's the same React tree, just a
        // different DOM mount point.
        const mapPanel = (
          <div
            className={
              expanded
                ? "fixed inset-0 z-[90] flex flex-col items-center gap-8 overflow-y-auto bg-ink/95 px-6 pb-10 backdrop-blur-xl lg:flex-row lg:justify-center lg:overflow-visible lg:px-12 lg:py-12 pt-[max(2.5rem,calc(env(safe-area-inset-top)+1.25rem))] lg:pt-[max(3rem,calc(env(safe-area-inset-top)+1.25rem))]"
                : "flex flex-col gap-8 lg:flex-row"
            }
          >
        <div className="bento-tile bento-blue relative">
          <div className="bento-orb" style={{ width: 200, height: 200, bottom: -60, right: -60 }} />
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Haritayı küçült" : "Haritayı genişlet"}
            title={expanded ? "Haritayı küçült" : "Haritayı genişlet"}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-ink/60 text-muted transition-colors hover:border-gold/40 hover:text-gold"
          >
            {expanded ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path d="M9 4v4a1 1 0 01-1 1H4M15 4v4a1 1 0 001 1h4M9 20v-4a1 1 0 00-1-1H4M15 20v-4a1 1 0 011-1h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                <path d="M4 9V5a1 1 0 011-1h4M15 4h4a1 1 0 011 1v4M20 15v4a1 1 0 01-1 1h-4M9 20H5a1 1 0 01-1-1v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <div className="relative">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className={
                expanded
                  ? "h-auto w-full lg:h-[82vh] lg:w-[calc(82vh*900/560)]"
                  : "h-auto w-full lg:h-[460px] lg:w-[620px]"
              }
            >
              {DNA_EDGES.map((e, i) => {
                const a = initialById.get(e.from);
                const b = initialById.get(e.to);
                if (!a || !b) return null;
                const dim =
                  (activeCategory &&
                    a.category !== activeCategory &&
                    b.category !== activeCategory) ||
                  (connectedIds && !(connectedIds.has(e.from) && connectedIds.has(e.to)));
                return (
                  <line
                    key={i}
                    ref={(el) => {
                      if (el) lineRefs.current.set(i, el);
                    }}
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

              {initialLaidOut.map((n) => {
                const meta = DNA_CATEGORY_META[n.category];
                const dim =
                  (activeCategory && n.category !== activeCategory) ||
                  (connectedIds && !connectedIds.has(n.id));
                const r = radiusOf(n);
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
                      ref={(el) => {
                        if (el) hitRefs.current.set(n.id, el);
                      }}
                      cx={n.x}
                      cy={n.y}
                      r={r + 9}
                      fill="transparent"
                      style={{ pointerEvents: "all" }}
                    />
                    <circle
                      ref={(el) => {
                        if (el) circleRefs.current.set(n.id, el);
                      }}
                      cx={n.x}
                      cy={n.y}
                      r={r}
                      fill={meta.color}
                      opacity={dim ? 0.18 : selectedId === n.id ? 1 : 0.75}
                      style={{ transition: "opacity 0.3s ease", pointerEvents: "none" }}
                    />
                    <text
                      ref={(el) => {
                        if (el) textRefs.current.set(n.id, el);
                      }}
                      x={n.x}
                      y={n.y - r - 8}
                      textAnchor="middle"
                      fontSize={n.category === "collection" ? 15 : 12.5}
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
                  const other = nodeById.get(otherId);
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
        );

        return expanded && typeof document !== "undefined"
          ? createPortal(mapPanel, document.body)
          : mapPanel;
      })()}
    </motion.div>
  );
}
