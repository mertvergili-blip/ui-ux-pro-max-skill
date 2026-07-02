import { timingSafeEqual } from "crypto";
import { loadAppState, claimNotificationOnce } from "@/lib/db";
import { sendPushToAll } from "@/lib/push";
import { getTodayCapsuleChallenge } from "@/lib/capsule-challenges";
import { selectDaysRemaining, todayKey } from "@/lib/deadline";

// Days-out thresholds worth interrupting the user for — not every day
// counting down, just the moments a real deadline reminder should land.
const DEADLINE_WARNING_DAYS = [3, 1, 0];

interface StoredState {
  deadlineDate?: string;
  deadlineLabel?: string;
}

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch rather than returning false —
  // compare lengths first so a short/malformed header still gets a
  // constant-time rejection instead of a thrown exception.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const today = todayKey();
  const sent: string[] = [];

  const challenge = getTodayCapsuleChallenge();
  if (challenge) {
    const claimed = await claimNotificationOnce("capsule", today);
    if (claimed) {
      await sendPushToAll("Capsule Day ✦", challenge.text);
      sent.push("capsule");
    }
  }

  const state = (await loadAppState()) as StoredState | null;
  if (state?.deadlineDate && state.deadlineLabel) {
    const daysLeft = selectDaysRemaining(state.deadlineDate);
    if (DEADLINE_WARNING_DAYS.includes(daysLeft)) {
      const kind = `deadline-${daysLeft}`;
      const claimed = await claimNotificationOnce(kind, today);
      if (claimed) {
        const body =
          daysLeft === 0
            ? `${state.deadlineLabel} bugün teslim.`
            : `${state.deadlineLabel} için ${daysLeft} gün kaldı.`;
        await sendPushToAll("Teslim Tarihi Yaklaşıyor", body);
        sent.push(kind);
      }
    }
  }

  return Response.json({ ok: true, sent });
}
