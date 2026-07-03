// Vibration API only exists on touch hardware (and only some of it) — every
// call here is a no-op on desktop/unsupported browsers, so call sites never
// need their own feature check.
function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  navigator.vibrate(pattern);
}

// Short, distinct pulses per action weight — a confirm shouldn't feel like
// a delete. Durations are deliberately small; anything longer reads as a
// buzz rather than a tap.
export const haptics = {
  tap: () => vibrate(8),
  confirm: () => vibrate(12),
  success: () => vibrate([10, 40, 10]),
  delete: () => vibrate(18),
};
