import { fetchOgImage } from "@/lib/og-image";
import { CURATED_RUNWAY_SHOWS } from "@/lib/runway-looks";
import { requireSession } from "@/lib/auth";

// These four review pages don't change once published, so a long cache is
// fine — no reason to re-fetch WWD on every page load. Resets on redeploy.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let cache: { images: Record<string, string | null>; fetchedAt: number } | null = null;

export async function GET() {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return Response.json(cache.images);
  }

  const entries = await Promise.all(
    CURATED_RUNWAY_SHOWS.map(async (show) => {
      const image = await fetchOgImage(show.reviewUrl);
      return [show.id, image] as const;
    })
  );

  const images = Object.fromEntries(entries);
  cache = { images, fetchedAt: Date.now() };
  return Response.json(images);
}
