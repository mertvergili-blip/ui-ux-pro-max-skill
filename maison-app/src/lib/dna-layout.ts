import type { DnaEdge, DnaNode } from "./dna-data";

export interface LaidOutNode extends DnaNode {
  x: number;
  y: number;
}

export interface SimNode extends LaidOutNode {
  vx: number;
  vy: number;
}

/**
 * Minimal force-directed layout: mutual repulsion between all nodes, spring
 * attraction along edges, mild centering pull. Run for a fixed number of
 * iterations up front — this only produces the *starting* arrangement; the
 * live simulation (see stepDnaSimulation below) takes over once mounted.
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

// Tuned to fill the 900×560 viewBox — the earlier 2600/140 settle left the
// whole graph huddled in the middle with tiny unreadable labels. Shared by
// both the one-shot initial settle above and the live simulation below so
// the graph doesn't visibly "jump" the moment physics takes over.
// Bumped again from 4400/170 — still too tight, adjacent node labels
// overlapped each other at the map's rendered on-screen size.
const REPULSION = 5800;
const SPRING = 0.02;
const SPRING_LENGTH = 190;
const CENTER_PULL = 0.008;

// Live-sim-only tuning — a continuous sim needs momentum + damping (an
// object in motion carries velocity between frames) rather than the
// snap-to-new-position-every-iteration approach the one-shot settle above
// uses, or dragging would feel stiff/laggy instead of springy.
const DAMPING = 0.82;
const MAX_SPEED = 26;
const BOUNDS_MARGIN = 24;

export function createSimNodes(laidOut: LaidOutNode[]): Map<string, SimNode> {
  return new Map(laidOut.map((n) => [n.id, { ...n, vx: 0, vy: 0 }]));
}

// Label collision-avoidance — the node repulsion above spaces out the dots
// themselves, but two dots can still be close enough that their labels
// (which float above each node, sized by label text length) overlap. This
// runs a small separate pass over estimated label bounding boxes and nudges
// each label's own (ox, oy) offset away from anything it overlaps, then lets
// that offset decay back toward zero once the crowding clears — so labels
// only drift from their default "directly above the node" position when
// they actually need to.
const LABEL_ITERATIONS = 6;
const LABEL_PUSH = 0.5;
const LABEL_DECAY = 0.9;

function estimateLabelWidth(label: string, fontSize: number): number {
  return label.length * fontSize * 0.56 + 8;
}

export function resolveLabelCollisions(
  nodes: SimNode[],
  offsets: Map<string, { ox: number; oy: number }>,
  radiusOf: (n: SimNode) => number,
  fontSizeOf: (n: SimNode) => number
): void {
  for (const off of offsets.values()) {
    off.ox *= LABEL_DECAY;
    off.oy *= LABEL_DECAY;
  }

  for (let iter = 0; iter < LABEL_ITERATIONS; iter++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const oa = offsets.get(a.id);
        const ob = offsets.get(b.id);
        if (!oa || !ob) continue;

        const aFs = fontSizeOf(a);
        const bFs = fontSizeOf(b);
        const aw = estimateLabelWidth(a.label, aFs);
        const bw = estimateLabelWidth(b.label, bFs);
        const ah = aFs + 4;
        const bh = bFs + 4;
        const ax = a.x + oa.ox;
        const ay = a.y - radiusOf(a) - 8 + oa.oy;
        const bx = b.x + ob.ox;
        const by = b.y - radiusOf(b) - 8 + ob.oy;

        const dx = ax - bx;
        const dy = ay - by;
        const overlapX = aw / 2 + bw / 2 - Math.abs(dx);
        const overlapY = ah / 2 + bh / 2 - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          const pushY = overlapY * LABEL_PUSH;
          const dir = dy < 0 ? -1 : 1;
          oa.oy += dir * (pushY / 2);
          ob.oy -= dir * (pushY / 2);

          const pushX = overlapX * LABEL_PUSH * 0.3;
          const dirX = dx < 0 ? -1 : 1;
          oa.ox += dirX * (pushX / 2);
          ob.ox -= dirX * (pushX / 2);
        }
      }
    }
  }
}

/**
 * Advances the graph by one frame, in place — an always-on Obsidian-style
 * force simulation. `draggedId`, if set, is treated as kinematic: it's
 * pinned to wherever the pointer put it (handled by the caller before this
 * runs) rather than pushed around by forces, but it still radiates
 * repulsion/spring forces onto everything else — so dragging one node
 * visibly tugs its connected neighbors along, and unrelated nodes drift out
 * of its way.
 */
export function stepDnaSimulation(
  nodes: Map<string, SimNode>,
  edges: DnaEdge[],
  width: number,
  height: number,
  draggedId: string | null
): void {
  const cx = width / 2;
  const cy = height / 2;
  const list = Array.from(nodes.values());
  const forces = new Map(list.map((n) => [n.id, { fx: 0, fy: 0 }]));

  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
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
    const a = nodes.get(edge.from);
    const b = nodes.get(edge.to);
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

  for (const n of list) {
    if (n.id === draggedId) {
      // Kinematic — position already set by the pointer handler this frame.
      n.vx = 0;
      n.vy = 0;
      continue;
    }
    const f = forces.get(n.id)!;
    f.fx += (cx - n.x) * CENTER_PULL;
    f.fy += (cy - n.y) * CENTER_PULL;

    n.vx = (n.vx + f.fx) * DAMPING;
    n.vy = (n.vy + f.fy) * DAMPING;
    const speed = Math.hypot(n.vx, n.vy);
    if (speed > MAX_SPEED) {
      n.vx = (n.vx / speed) * MAX_SPEED;
      n.vy = (n.vy / speed) * MAX_SPEED;
    }

    n.x = Math.max(BOUNDS_MARGIN, Math.min(width - BOUNDS_MARGIN, n.x + n.vx));
    n.y = Math.max(BOUNDS_MARGIN, Math.min(height - BOUNDS_MARGIN, n.y + n.vy));
  }
}
