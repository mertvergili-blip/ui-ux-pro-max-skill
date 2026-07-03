import { createSessionToken, verifyPassword, SESSION_COOKIE } from "@/lib/auth";
import { checkLoginLockout, recordLoginFailure, clearLoginFailures } from "@/lib/db";

function clientIp(request: Request): string {
  // Vercel sets this; fall back to a shared bucket if it's ever missing
  // (e.g. local dev) rather than throwing.
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export async function POST(request: Request) {
  const ip = clientIp(request);

  // Rate limiting is a hardening layer, not the primary defense (the
  // password check below is) — if Postgres hiccups, fail open on the
  // lockout check rather than locking everyone out of an otherwise-working
  // password check.
  try {
    const lockedUntil = await checkLoginLockout(ip);
    if (lockedUntil) {
      const retryAfterSec = Math.ceil((lockedUntil.getTime() - Date.now()) / 1000);
      return Response.json(
        { error: "Çok fazla yanlış deneme. Birkaç dakika sonra tekrar dene." },
        { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
      );
    }
  } catch {
    // proceed to the password check
  }

  const { password } = (await request.json()) as { password?: string };

  if (!password || !(await verifyPassword(password))) {
    try {
      await recordLoginFailure(ip);
    } catch {
      // best-effort — a dropped write here shouldn't block the 401 below
    }
    return Response.json({ error: "Şifre yanlış" }, { status: 401 });
  }

  try {
    await clearLoginFailures(ip);
  } catch {
    // best-effort
  }

  const token = await createSessionToken();
  const res = Response.json({ ok: true });
  res.headers.set(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
  );
  return res;
}
