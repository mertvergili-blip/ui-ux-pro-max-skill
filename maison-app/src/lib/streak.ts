import type { JournalDay } from "./store";
import { todayKey } from "./deadline";

function hasActivity(entry: JournalDay | undefined): boolean {
  return Boolean(entry?.mood || entry?.reflection?.trim());
}

function dateKeyDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// Consecutive days of journal activity, counting back from today. A day
// without activity yet (today, still in progress) doesn't break the streak
// — only a fully-missed prior day does, so writing at 11pm doesn't feel
// like a race against a clock that's already decided you failed.
export function selectCurrentStreak(journalEntries: JournalDay[]): number {
  const byDate = new Map(journalEntries.map((e) => [e.date, e]));
  const today = todayKey();
  let streak = 0;
  let offset = hasActivity(byDate.get(today)) ? 0 : 1;

  while (true) {
    const key = dateKeyDaysAgo(offset);
    if (!hasActivity(byDate.get(key))) break;
    streak++;
    offset++;
  }
  return streak;
}

// The longest run of consecutive active days anywhere in the history, not
// just the current run — so a broken streak still leaves something to be
// proud of instead of erasing the record.
export function selectLongestStreak(journalEntries: JournalDay[]): number {
  const activeDates = journalEntries
    .filter((e) => hasActivity(e))
    .map((e) => new Date(e.date + "T00:00:00").getTime())
    .sort((a, b) => a - b);

  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const t of activeDates) {
    if (prev !== null && t - prev === 86400000) {
      run++;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = t;
  }
  return longest;
}

export function selectBestStreak(journalEntries: JournalDay[], storedBest: number): number {
  return Math.max(storedBest, selectCurrentStreak(journalEntries), selectLongestStreak(journalEntries));
}
