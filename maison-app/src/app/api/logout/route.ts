import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = Response.json({ ok: true });
  // Overwrite with an already-expired cookie — the standard way to clear
  // one, since there's no server-side session table to revoke against
  // (the token is a stateless signed value).
  res.headers.set(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  );
  return res;
}
