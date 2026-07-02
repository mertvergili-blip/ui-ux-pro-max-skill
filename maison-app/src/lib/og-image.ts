// Extracts a page's og:image — the exact mechanism publishers use to
// control how their own pages preview when shared (Twitter, Slack,
// iMessage, etc.). This is not scraping restricted content: it's reading
// a single meta tag off a page the publisher's own RSS feed already
// pointed us to, the same way any link-preview feature works.
const OG_IMAGE_RE = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i;
const OG_IMAGE_RE_REVERSED = /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i;

export async function fetchOgImage(url: string, timeoutMs = 4000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MaisonApp/1.0)" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = OG_IMAGE_RE.exec(html) ?? OG_IMAGE_RE_REVERSED.exec(html);
    if (!match) return null;
    return match[1].replace(/&amp;|&#0?38;/g, "&");
  } catch {
    return null;
  }
}
