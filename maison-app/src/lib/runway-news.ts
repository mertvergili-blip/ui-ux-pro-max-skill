export type RunwayTag = "Marka Haberi" | "Tasarımcı" | "Materyal & Zanaat" | "Trend";

export interface RunwayNewsItem {
  tag: RunwayTag;
  title: string;
  sub?: string;
  link?: string;
  source?: string;
  large?: boolean;
}

export const RUNWAY_TAG_COLOR: Record<RunwayTag, string> = {
  "Marka Haberi": "var(--color-blue)",
  Tasarımcı: "var(--color-rose)",
  "Materyal & Zanaat": "var(--color-sage)",
  Trend: "var(--color-gold)",
};

// Fallback content — shown if the RSS fetch or Gemini summarization fails,
// so Runway never renders empty.
export const LOCAL_RUNWAY_NEWS: RunwayNewsItem[] = [
  {
    tag: "Trend",
    title: "Maison Margiela, SS26 koleksiyonunu sundu",
    sub: "Deconstructed tailoring ve ham kenar detayları öne çıktı.",
    large: true,
  },
  {
    tag: "Trend",
    title: "Sezonun rengi: Terracotta Rosé",
  },
  {
    tag: "Marka Haberi",
    title: "2027 için sivri omuz siluetleri geri dönüyor",
  },
  {
    tag: "Materyal & Zanaat",
    title: "Geri dönüştürülmüş deri kullanımı %30 arttı",
  },
];
