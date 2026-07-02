// Server-side crypto prices for the Finance Pulse widget. The widget used
// to call CoinGecko straight from the browser, where ad blockers, CORS
// hiccups and rate limits regularly left it stuck on "···" forever.
// Server-side fetch + last-good-value cache makes it degrade to stale
// numbers instead of nothing.
const SOURCE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true";
const CACHE_TTL_MS = 60 * 1000;

interface CoinData {
  usd: number;
  usd_24h_change: number;
}

type PriceMap = Record<string, CoinData>;

let cache: { prices: PriceMap; fetchedAt: number } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return Response.json({ prices: cache.prices, stale: false });
  }

  try {
    const res = await fetch(SOURCE_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`coingecko ${res.status}`);
    const prices = (await res.json()) as PriceMap;
    if (!prices.bitcoin) throw new Error("unexpected payload");
    cache = { prices, fetchedAt: Date.now() };
    return Response.json({ prices, stale: false });
  } catch {
    // Serve the last good snapshot (however old) over serving nothing.
    if (cache) {
      return Response.json({ prices: cache.prices, stale: true });
    }
    return Response.json({ error: "unavailable" }, { status: 503 });
  }
}
