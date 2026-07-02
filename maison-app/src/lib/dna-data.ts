export type DnaCategory =
  | "collection"
  | "designer"
  | "color"
  | "form"
  | "texture"
  | "era"
  | "craft"
  | "silhouette";

export interface DnaNode {
  id: string;
  label: string;
  category: DnaCategory;
  note?: string;
}

export interface DnaEdge {
  from: string;
  to: string;
}

export const DNA_CATEGORY_META: Record<
  DnaCategory,
  { label: string; color: string }
> = {
  collection: { label: "Collection", color: "var(--color-bone)" },
  designer: { label: "Designer", color: "var(--color-gold)" },
  color: { label: "Color", color: "var(--color-rose)" },
  form: { label: "Form", color: "var(--color-blue)" },
  texture: { label: "Texture", color: "var(--color-sage)" },
  era: { label: "Era", color: "var(--color-wine)" },
  craft: { label: "Craft", color: "#8f8570" },
  silhouette: { label: "Silhouette", color: "#a8666a" },
};

// Seed data — three collection hubs, each pulling from shared and distinct
// reference nodes. This is the "creative identity" graph: as more
// inspirations get logged, the shared nodes (e.g. a recurring designer or
// texture) become the visible throughline across the whole body of work.
export const DNA_NODES: DnaNode[] = [
  { id: "col-terre-or", label: "Terre & Or", category: "collection", note: "Koleksiyon III" },
  { id: "col-verre-bleu", label: "Verre Bleu", category: "collection", note: "Koleksiyon II" },
  { id: "col-rose-poudre", label: "Rosé Poudré", category: "collection", note: "Koleksiyon I" },

  { id: "des-margiela", label: "Maison Margiela", category: "designer" },
  { id: "des-demeulemeester", label: "Ann Demeulemeester", category: "designer" },
  { id: "des-yamamoto", label: "Yohji Yamamoto", category: "designer" },

  { id: "col-terracotta", label: "Terracotta", category: "color" },
  { id: "col-gold-ochre", label: "Gold Ochre", category: "color" },
  { id: "col-glass-blue", label: "Glass Blue", category: "color" },
  { id: "col-powder-rose", label: "Powder Rose", category: "color" },

  { id: "form-deconstructed", label: "Deconstructed Tailoring", category: "form" },
  { id: "form-draped", label: "Draped Silhouette", category: "form" },
  { id: "form-oversized", label: "Oversized Volume", category: "form" },

  { id: "tex-raw-edge", label: "Raw Edge", category: "texture" },
  { id: "tex-layering", label: "Kumaş Katmanlama", category: "texture" },
  { id: "tex-organza", label: "Organza Sheen", category: "texture" },

  { id: "era-japanese-avant", label: "1980s Japanese Avant-Garde", category: "era" },
  { id: "era-belle-epoque", label: "Belle Époque", category: "era" },

  { id: "craft-hand-stitch", label: "El Dikişi", category: "craft" },
  { id: "craft-recycled-leather", label: "Geri Dönüştürülmüş Deri", category: "craft" },

  { id: "sil-sharp-shoulder", label: "Sivri Omuz", category: "silhouette" },
  { id: "sil-fluid-line", label: "Akışkan Hat", category: "silhouette" },
];

export const DNA_EDGES: DnaEdge[] = [
  // Terre & Or
  { from: "col-terre-or", to: "des-margiela" },
  { from: "col-terre-or", to: "col-terracotta" },
  { from: "col-terre-or", to: "col-gold-ochre" },
  { from: "col-terre-or", to: "form-deconstructed" },
  { from: "col-terre-or", to: "tex-raw-edge" },
  { from: "col-terre-or", to: "era-japanese-avant" },
  { from: "col-terre-or", to: "craft-recycled-leather" },
  { from: "col-terre-or", to: "sil-sharp-shoulder" },

  // Verre Bleu
  { from: "col-verre-bleu", to: "des-demeulemeester" },
  { from: "col-verre-bleu", to: "col-glass-blue" },
  { from: "col-verre-bleu", to: "form-draped" },
  { from: "col-verre-bleu", to: "tex-organza" },
  { from: "col-verre-bleu", to: "sil-fluid-line" },
  { from: "col-verre-bleu", to: "craft-hand-stitch" },

  // Rosé Poudré
  { from: "col-rose-poudre", to: "des-yamamoto" },
  { from: "col-rose-poudre", to: "col-powder-rose" },
  { from: "col-rose-poudre", to: "form-oversized" },
  { from: "col-rose-poudre", to: "tex-layering" },
  { from: "col-rose-poudre", to: "era-belle-epoque" },
  { from: "col-rose-poudre", to: "craft-hand-stitch" },

  // Cross-collection throughlines — the shared DNA
  { from: "des-margiela", to: "form-deconstructed" },
  { from: "des-yamamoto", to: "form-oversized" },
  { from: "des-yamamoto", to: "era-japanese-avant" },
  { from: "des-demeulemeester", to: "sil-fluid-line" },
  { from: "form-deconstructed", to: "tex-raw-edge" },
  { from: "craft-hand-stitch", to: "tex-layering" },
];
