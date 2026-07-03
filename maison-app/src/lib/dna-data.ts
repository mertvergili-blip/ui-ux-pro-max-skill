import type { CollectionFolder, JournalDay, Material, MoodKey } from "./store/types";

export type DnaCategory = "collection" | "material" | "mood";

export interface DnaNode {
  id: string;
  label: string;
  category: DnaCategory;
  note?: string;
  // Materials carry their own real swatch color; mood nodes carry the same
  // color used everywhere else mood is shown. Falls back to the category
  // color below when unset (collections have no single "color" of their own).
  color?: string;
}

export interface DnaEdge {
  from: string;
  to: string;
}

export const DNA_CATEGORY_META: Record<DnaCategory, { label: string; color: string }> = {
  collection: { label: "Collection", color: "var(--color-bone)" },
  material: { label: "Material", color: "var(--color-sage)" },
  mood: { label: "Mood", color: "var(--color-rose)" },
};

const MOOD_COLOR: Record<MoodKey, string> = {
  flowing: "#c4a469",
  calm: "#3d5a6c",
  stressed: "#7a2e2e",
  grounded: "#5c6b52",
  tired: "#786f5c",
};

const MOOD_LABEL: Record<MoodKey, string> = {
  flowing: "Flowing",
  calm: "Calm",
  stressed: "Stressed",
  grounded: "Grounded",
  tired: "Tired",
};

function dominantMood(entries: JournalDay[]): MoodKey | null {
  const counts: Partial<Record<MoodKey, number>> = {};
  for (const e of entries) if (e.mood) counts[e.mood] = (counts[e.mood] ?? 0) + 1;
  const keys = Object.keys(counts) as MoodKey[];
  if (keys.length === 0) return null;
  return keys.sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0))[0];
}

/**
 * The map used to be a fixed, hand-authored set of designer/color/form/era
 * references — evocative, but static: it never reflected what was actually
 * in your Collections or Materials, so it looked the same no matter what
 * you did in the app. This builds the graph from the real store instead —
 * a node per collection, a node per material that's actually linked to one
 * (unlinked materials would just be disconnected clutter), an edge for
 * every real link between them, and — closing the loop with Journal — one
 * node for whatever mood has been dominant lately, connected to whichever
 * collection is currently active.
 */
export function buildDnaGraph(
  collections: CollectionFolder[],
  materials: Material[],
  journalEntries: JournalDay[]
): { nodes: DnaNode[]; edges: DnaEdge[] } {
  const nodes: DnaNode[] = [];
  const edges: DnaEdge[] = [];

  for (const c of collections) {
    nodes.push({ id: `col-${c.id}`, label: c.name, category: "collection", note: c.sub });
  }

  const linkedMaterials = materials.filter((m) => (m.linkedCollectionIds?.length ?? 0) > 0);
  for (const m of linkedMaterials) {
    nodes.push({ id: `mat-${m.id}`, label: m.name, category: "material", note: m.supplier, color: m.colorTag });
    for (const collectionId of m.linkedCollectionIds ?? []) {
      if (collections.some((c) => c.id === collectionId)) {
        edges.push({ from: `col-${collectionId}`, to: `mat-${m.id}` });
      }
    }
  }

  const mood = dominantMood(journalEntries);
  const activeCollection = collections.find((c) => c.status === "In Progress") ?? collections[0];
  if (mood && activeCollection) {
    nodes.push({
      id: `mood-${mood}`,
      label: MOOD_LABEL[mood],
      category: "mood",
      note: "Baskın ruh hali",
      color: MOOD_COLOR[mood],
    });
    edges.push({ from: `col-${activeCollection.id}`, to: `mood-${mood}` });
  }

  return { nodes, edges };
}
