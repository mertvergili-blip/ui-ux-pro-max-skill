import { XMLParser } from "fast-xml-parser";
import { Type } from "@google/genai";
import { getGeminiClient, generateWithFallback } from "@/lib/gemini";
import { fetchOgImage } from "@/lib/og-image";
import { LOCAL_RUNWAY_NEWS, type RunwayNewsItem, type RunwayTag } from "@/lib/runway-news";

const FEED_URL = "https://wwd.com/feed/";
const CACHE_TTL_MS = 45 * 60 * 1000; // 45 minutes — fashion news doesn't need to be second-fresh
const ITEM_COUNT = 4;
const TAGS: RunwayTag[] = ["Marka Haberi", "Tasarımcı", "Materyal & Zanaat", "Trend"];

// "gemini": real WWD items, AI-translated/summarized.
// "rss": real WWD items, but the AI summary step failed — untranslated
// titles, still live content (not the hardcoded placeholder).
// "local": the feed itself was unreachable — hardcoded placeholder.
type NewsSource = "gemini" | "rss" | "local";

interface CacheEntry {
  items: RunwayNewsItem[];
  source: NewsSource;
  fetchedAt: number;
}

// Module-level cache — persists across requests within the same server
// process. Resets on redeploy, which is fine: worst case is one cold fetch.
let cache: CacheEntry | null = null;

interface RawFeedItem {
  title: string;
  link: string;
  description?: string;
}

// fast-xml-parser leaves CDATA fields as { __cdata: string } rather than
// auto-unwrapping them to a plain string (inconsistently — title usually
// comes through as a string, description usually doesn't), so every field
// needs to handle both shapes.
function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "__cdata" in value) {
    return String((value as { __cdata: unknown }).__cdata);
  }
  return "";
}

async function fetchWwdItems(): Promise<RawFeedItem[]> {
  const res = await fetch(FEED_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; MaisonApp/1.0)" },
  });
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
  const xml = await res.text();

  const parser = new XMLParser({ ignoreAttributes: true, cdataPropName: "__cdata" });
  const parsed = parser.parse(xml);
  const rawItems = parsed?.rss?.channel?.item;
  const list = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

  return list.slice(0, 8).map((item) => {
    const description = textOf(item.description).replace(/<[^>]+>/g, "").trim();
    return {
      title: textOf(item.title).trim(),
      link: textOf(item.link).trim(),
      description: description || undefined,
    };
  });
}

async function summarizeWithGemini(items: RawFeedItem[]): Promise<RunwayNewsItem[]> {
  const client = getGeminiClient();
  if (!client) throw new Error("No Gemini client");

  const digest = items
    .map((it, i) => `${i + 1}. ${it.title}${it.description ? ` — ${it.description}` : ""}`)
    .join("\n");

  const response = await generateWithFallback(client, {
    contents: digest,
    config: {
      systemInstruction: `Sen Maison adlı bir moda tasarım stüdyosu uygulamasının
"Runway Intel" bölümünü hazırlıyorsun. Sana numaralı İngilizce moda haberi
başlıkları verilecek. Bunlardan en ilginç ${ITEM_COUNT} tanesini seç ve her
biri için:
- sourceIndex: seçtiğin haberin listedeki numarası (1'den başlar)
- title: Türkçe'ye çevrilmiş, kısa ve çarpıcı bir başlık (60 karakteri geçme)
- sub: 1 cümlelik Türkçe özet (sadece en önemli haber için doldur, diğerlerinde boş bırakabilirsin)
- tag: "Marka Haberi", "Tasarımcı", "Materyal & Zanaat", "Trend" kategorilerinden en uygun olanı
üret. Düz metin yaz, markdown kullanma. En önemli/ilginç haberi listenin başına koy.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sourceIndex: { type: Type.INTEGER },
            title: { type: Type.STRING },
            sub: { type: Type.STRING },
            tag: { type: Type.STRING, enum: TAGS },
          },
          required: ["sourceIndex", "title", "tag"],
        },
      },
    },
  });

  const parsed = JSON.parse(response.text ?? "[]") as {
    sourceIndex: number;
    title: string;
    sub?: string;
    tag: string;
  }[];

  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty Gemini response");

  return parsed.slice(0, ITEM_COUNT).map((p, i) => {
    const original = items[p.sourceIndex - 1];
    return {
      tag: (TAGS.includes(p.tag as RunwayTag) ? p.tag : "Trend") as RunwayTag,
      title: p.title,
      sub: i === 0 ? p.sub : undefined,
      link: original?.link,
      source: original ? "WWD" : undefined,
      large: i === 0,
    };
  });
}

// Used when the feed itself is fine but Gemini couldn't summarize it —
// still real, live WWD items (untranslated) rather than discarding them
// for the hardcoded placeholder.
function buildRssOnlySummary(items: RawFeedItem[]): RunwayNewsItem[] {
  return items.slice(0, ITEM_COUNT).map((it, i) => ({
    tag: "Trend" as RunwayTag,
    title: it.title,
    sub: i === 0 ? it.description : undefined,
    link: it.link,
    source: "WWD",
    large: i === 0,
  }));
}

// Best-effort real preview images from each article's own og:image — see
// src/lib/og-image.ts for why this isn't scraping.
async function attachImages(items: RunwayNewsItem[]): Promise<RunwayNewsItem[]> {
  return Promise.all(
    items.map(async (item) => {
      if (!item.link) return item;
      const image = await fetchOgImage(item.link);
      return image ? { ...item, image } : item;
    })
  );
}

function localFallback(): CacheEntry {
  const fallback: CacheEntry = { items: LOCAL_RUNWAY_NEWS, source: "local", fetchedAt: Date.now() };
  // Cache the fallback too, briefly — avoids hammering a broken feed on
  // every page load, but retries again soon rather than sticking to stale
  // local content for the full 45 minutes.
  cache = { ...fallback, fetchedAt: Date.now() - CACHE_TTL_MS + 5 * 60 * 1000 };
  return fallback;
}

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return Response.json(cache);
  }

  let rawItems: RawFeedItem[];
  try {
    rawItems = await fetchWwdItems();
    if (rawItems.length === 0) throw new Error("No items in feed");
  } catch {
    return Response.json(localFallback());
  }

  let items: RunwayNewsItem[];
  let source: NewsSource;
  try {
    items = await summarizeWithGemini(rawItems);
    source = "gemini";
  } catch {
    items = buildRssOnlySummary(rawItems);
    source = "rss";
  }

  items = await attachImages(items);

  cache = { items, source, fetchedAt: Date.now() };
  return Response.json(cache);
}
