// Pure date math, deliberately with no "use client" boundary — the store
// (client-only) and the notification cron route (server-only) both need
// these, and neither should have to import across that boundary.

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
