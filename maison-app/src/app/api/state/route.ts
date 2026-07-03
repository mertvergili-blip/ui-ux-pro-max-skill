import { loadAppState, saveAppState } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET() {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const data = await loadAppState();
  return Response.json({ data });
}

export async function PUT(request: Request) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  await saveAppState(body);
  return Response.json({ ok: true });
}
