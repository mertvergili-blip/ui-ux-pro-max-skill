import { timingSafeEqual } from "crypto";
import { loadAppState, claimNotificationOnce } from "@/lib/db";
import { sendPushToAll } from "@/lib/push";
import { getTodayCapsuleChallenge } from "@/lib/capsule-challenges";
import { selectDaysRemaining, todayKey } from "@/lib/deadline";
import { computeQuarterlyStats, localQuarterlyReview } from "@/lib/quarterly-review";
import type { JournalDay, CollectionFolder } from "@/lib/store";

// Days-out thresholds worth interrupting the user for — not every day
// counting down, just the moments a real deadline reminder should land.
const DEADLINE_WARNING_DAYS = [3, 1, 0];

interface StoredState {
  deadlineDate?: string;
  deadlineLabel?: string;
  journalEntries?: JournalDay[];
  collections?: CollectionFolder[];
  streak?: number;
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

async function runMorning(state: StoredState | null, today: string, sent: string[]) {
  const challenge = getTodayCapsuleChallenge();
  if (challenge) {
    const claimed = await claimNotificationOnce("capsule", today);
    if (claimed) {
      await sendPushToAll("Capsule Day ✦", challenge.text);
      sent.push("capsule");
    }
  }

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
}

async function runEvening(state: StoredState | null, today: string, sent: string[]) {
  const journalEntries = state?.journalEntries ?? [];
  const todayEntry = journalEntries.find((e) => e.date === today);
  const hasActivityToday = Boolean(todayEntry?.mood || todayEntry?.reflection?.trim());

  if (!hasActivityToday) {
    const claimed = await claimNotificationOnce("streak-break", today);
    if (claimed) {
      const streak = state?.streak ?? 0;
      const body =
        streak > 0
          ? `Bugün henüz journal girişi yok — birkaç kelime yazmaya ne dersin? ${streak} günlük bir ritmin var.`
          : "Bugün henüz journal girişi yok — birkaç kelime yazmaya ne dersin?";
      await sendPushToAll("Günün Kapanmadan", body);
      sent.push("streak-break");
    }
  }

  // Sunday in both UTC and Turkey time at this hour (18:00 UTC = 21:00
  // TRT — same calendar day, no rollover to check for).
  const isSunday = new Date().getUTCDay() === 0;
  if (isSunday) {
    const claimed = await claimNotificationOnce("weekly-summary", today);
    if (claimed) {
      const collections = state?.collections ?? [];
      const stats = computeQuarterlyStats(
        journalEntries.slice(-7),
        state?.streak ?? 0,
        collections.length
      );
      const body = localQuarterlyReview(stats);
      await sendPushToAll("Haftalık Özet", body);
      sent.push("weekly-summary");
    }
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slot = searchParams.get("slot") === "evening" ? "evening" : "morning";

  const today = todayKey();
  const sent: string[] = [];
  const state = (await loadAppState()) as StoredState | null;

  if (slot === "morning") {
    await runMorning(state, today, sent);
  } else {
    await runEvening(state, today, sent);
  }

  return Response.json({ ok: true, slot, sent });
}
