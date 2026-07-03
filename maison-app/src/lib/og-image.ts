// Extracts a page's og:image — the exact mechanism publishers use to
// control how their own pages preview when shared (Twitter, Slack,
// iMessage, etc.). This is not scraping restricted content: it's reading
// a single meta tag off a page the publisher's own RSS feed already
// pointed us to, the same way any link-preview feature works.
const OG_IMAGE_RE = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i;
const OG_IMAGE_RE_REVERSED = /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i;

// Every call site passes either a hardcoded editorial URL or a link lifted
// from WWD's own RSS feed — never anything a site visitor supplies. This
// allowlist is defense-in-depth against SSRF if that feed were ever
// compromised or redirected somewhere internal, not a response to any
// current user-input path.
const ALLOWED_HOSTS = ["wwd.com"];

function isAllowedTarget(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return ALLOWED_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

export async function fetchOgImage(url: string, timeoutMs = 4000): Promise<string | null> {
  if (!isAllowedTarget(url)) return null;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MaisonApp/1.0)" },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "manual",
    });
    // Refuses to follow redirects rather than silently trusting wherever
    // they point — legitimate WWD article pages don't need one to render
    // their og:image tag.
    if (res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400)) {
      return null;
    }
    if (!res.ok) return null;
    const html = await res.text();
    const match = OG_IMAGE_RE.exec(html) ?? OG_IMAGE_RE_REVERSED.exec(html);
    if (!match) return null;
    return match[1].replace(/&amp;|&#0?38;/g, "&");
  } catch {
    return null;
  }
}
