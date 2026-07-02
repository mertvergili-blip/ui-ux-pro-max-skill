import { createSessionToken, verifyPassword, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };

  if (!password || !(await verifyPassword(password))) {
    return Response.json({ error: "Şifre yanlış" }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = Response.json({ ok: true });
  res.headers.set(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
  );
  return res;
}
