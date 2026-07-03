export type RunwayTag = "Marka Haberi" | "Tasarımcı" | "Materyal & Zanaat" | "Trend";

export interface RunwayNewsItem {
  tag: RunwayTag;
  title: string;
  sub?: string;
  link?: string;
  source?: string;
  large?: boolean;
  // The article's own og:image — fetched from the page WWD's RSS feed
  // already pointed us to, not a scraped gallery. Absent when the fetch
  // failed or the article has no preview image.
  image?: string;
}

export const RUNWAY_TAG_COLOR: Record<RunwayTag, string> = {
  "Marka Haberi": "var(--color-blue)",
  Tasarımcı: "var(--color-rose)",
  "Materyal & Zanaat": "var(--color-sage)",
  Trend: "var(--color-gold)",
};

// Used when Gemini couldn't classify each headline (no key, quota, or a
// summarization failure) but the raw RSS titles are still real/live — a
// crude keyword guess beats tagging every single item "Trend", which made
// all 4 cards render with the identical gold placeholder when their
// og:images also failed to fetch.
const TAG_KEYWORDS: [RunwayTag, RegExp][] = [
  ["Materyal & Zanaat", /fabric|leather|textile|recycled|sustainable|material|craft|denim|silk|cotton|wool|weav/i],
  ["Marka Haberi", /appoints|names|ceo|acqui|ipo|revenue|sales|opens|store|launch|campaign|ambassador|partnership|stake/i],
  ["Tasarımcı", /designer|creative director|founder|debut collection|farewell|departs|steps down/i],
];

export function guessRunwayTag(title: string): RunwayTag {
  for (const [tag, pattern] of TAG_KEYWORDS) {
    if (pattern.test(title)) return tag;
  }
  return "Trend";
}

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
