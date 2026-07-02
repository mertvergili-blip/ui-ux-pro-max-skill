import type { DnaEdge, DnaNode } from "./dna-data";

export interface LaidOutNode extends DnaNode {
  x: number;
  y: number;
}

/**
 * Minimal force-directed layout: mutual repulsion between all nodes, spring
 * attraction along edges, mild centering pull. Run for a fixed number of
 * iterations up front (not animated frame-by-frame) — this is a one-time
 * settle on mount, not a live physics sim, so a hand-rolled version is
 * plenty and avoids pulling in d3-force for a graph this size (~24 nodes).
 */
export function layoutDnaGraph(
  nodes: DnaNode[],
  edges: DnaEdge[],
  width: number,
  height: number
): LaidOutNode[] {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.38;

  const positioned: LaidOutNode[] = nodes.map((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2;
    return {
      ...n,
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });

  const byId = new Map(positioned.map((n) => [n.id, n]));
  const REPULSION = 2600;
  const SPRING = 0.02;
  const SPRING_LENGTH = 140;
  const CENTER_PULL = 0.008;

  for (let iter = 0; iter < 220; iter++) {
    const forces = new Map(positioned.map((n) => [n.id, { fx: 0, fy: 0 }]));

    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        const a = positioned[i];
        const b = positioned[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let distSq = dx * dx + dy * dy;
        if (distSq < 1) distSq = 1;
        const dist = Math.sqrt(distSq);
        const force = REPULSION / distSq;
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        forces.get(a.id)!.fx += dx;
        forces.get(a.id)!.fy += dy;
        forces.get(b.id)!.fx -= dx;
        forces.get(b.id)!.fy -= dy;
      }
    }

    for (const edge of edges) {
      const a = byId.get(edge.from);
      const b = byId.get(edge.to);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const stretch = dist - SPRING_LENGTH;
      const force = stretch * SPRING;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      forces.get(a.id)!.fx += fx;
      forces.get(a.id)!.fy += fy;
      forces.get(b.id)!.fx -= fx;
      forces.get(b.id)!.fy -= fy;
    }

    for (const n of positioned) {
      const f = forces.get(n.id)!;
      f.fx += (cx - n.x) * CENTER_PULL;
      f.fy += (cy - n.y) * CENTER_PULL;
      n.x += f.fx;
      n.y += f.fy;
      n.x = Math.max(40, Math.min(width - 40, n.x));
      n.y = Math.max(40, Math.min(height - 40, n.y));
    }
  }

  return positioned;
}
