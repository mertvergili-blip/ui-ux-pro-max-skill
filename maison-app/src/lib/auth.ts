export const SESSION_COOKIE = "maison_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

async function hmac(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Stateless signed token — no session table needed for a single-user app.
// Payload is just an expiry timestamp; the HMAC is what makes it
// unforgeable without AUTH_SECRET.
export async function createSessionToken(): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const signature = await hmac(String(expiresAt), getSecret());
  return `${expiresAt}.${signature}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [expiresAtStr, signature] = token.split(".");
  if (!expiresAtStr || !signature) return false;
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  const expected = await hmac(expiresAtStr, getSecret());
  return expected === signature;
}

export async function verifyPassword(candidate: string): Promise<boolean> {
  const expected = process.env.SITE_PASSWORD;
  if (!expected) throw new Error("SITE_PASSWORD is not set");
  // Constant-time-ish comparison via HMAC of both sides against the same
  // secret, rather than a raw string ===, to avoid short-circuit timing
  // leaks on the password itself.
  const [a, b] = await Promise.all([hmac(candidate, getSecret()), hmac(expected, getSecret())]);
  return a === b;
}

// Route-handler guard — returns a 401 Response if the session is missing/
// invalid, or null if the caller should proceed.
export async function requireSession(): Promise<Response | null> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const valid = await verifySessionToken(token);
  if (!valid) return Response.json({ error: "unauthorized" }, { status: 401 });
  return null;
}
