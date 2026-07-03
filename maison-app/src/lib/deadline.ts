// Pure date math, deliberately with no "use client" boundary — the store
// (client-only) and the notification cron route (server-only) both need
// these, and neither should have to import across that boundary.

// Shaped like CollectionFolder, but kept minimal here so this file doesn't
// need to import from lib/store (which is "use client").
interface DeadlineSource {
  status: string;
  name: string;
  deadlineDate?: string;
}

// Studio's "Next Deadline" card, the Calendar's deadline marker and Path's
// "Şimdi" section all used to each read their own idea of what's due next —
// a hardcoded global field, an editable-but-disconnected date, and the raw
// collection list. This is the one place that answers it, from the same
// collections everything else already reads.
export function selectActiveDeadline(
  collections: DeadlineSource[]
): { label: string; date: string } | null {
  const withDates = collections.filter(
    (c) => c.status !== "Archived" && c.deadlineDate
  ) as (DeadlineSource & { deadlineDate: string })[];
  if (withDates.length === 0) return null;
  const soonest = withDates.reduce((a, b) => (a.deadlineDate < b.deadlineDate ? a : b));
  return { label: soonest.name, date: soonest.deadlineDate };
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function selectDaysRemaining(deadlineDate: string): number {
  const deadline = new Date(deadlineDate + "T00:00:00");
  const today = new Date(todayKey() + "T00:00:00");
  return Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / 86400000));
}

// 0 = calm/cool, 1 = maximum urgency/warm — drives the ambient tint, not any banner
export function selectUrgency(deadlineDate: string): number {
  const daysLeft = selectDaysRemaining(deadlineDate);
  const URGENCY_WINDOW = 10; // days out where urgency starts ramping in
  return Math.max(0, Math.min(1, 1 - daysLeft / URGENCY_WINDOW));
}
