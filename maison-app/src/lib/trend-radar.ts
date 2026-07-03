import type { RunwayNewsItem } from "./runway-news";
import type { DnaNode } from "./dna-data";

// Every DNA label except the collection hubs themselves — those are outputs,
// not taste signals, so they'd just noise up the match. Takes the live
// graph (built from the user's real collections/materials) rather than a
// fixed list, since there's no static taste profile anymore.
export function dnaTasteLabels(nodes: DnaNode[]): string[] {
  return nodes.filter((n) => n.category !== "collection").map((n) => n.label);
}

export interface TrendMatch {
  item: RunwayNewsItem;
  matchedLabels: string[];
}

const DIACRITIC_MARKS = /[̀-ͯ]/g;

function normalize(s: string) {
  return s.toLocaleLowerCase("tr").normalize("NFD").replace(DIACRITIC_MARKS, "");
}

function matchLabels(item: RunwayNewsItem, labels: string[]): string[] {
  const text = normalize(`${item.title} ${item.sub ?? ""}`);
  const matched: string[] = [];
  for (const label of labels) {
    const words = normalize(label)
      .split(/\s+/)
      .filter((w) => w.length >= 4);
    if (words.some((w) => text.includes(w))) matched.push(label);
  }
  return matched;
}

// Ranks the current news set by overlap with the user's own DNA Map —
// this is the "radar" part: no separate feed, just the existing Runway
// Intel re-read through the designer's own taste profile.
export function rankTrendRadar(items: RunwayNewsItem[], labels: string[]): TrendMatch[] {
  return items
    .map((item) => ({ item, matchedLabels: matchLabels(item, labels) }))
    .filter((m) => m.matchedLabels.length > 0)
    .sort((a, b) => b.matchedLabels.length - a.matchedLabels.length);
}
