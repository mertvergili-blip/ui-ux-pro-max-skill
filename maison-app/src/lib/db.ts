import "server-only";
import postgres, { type JSONValue } from "postgres";

let client: ReturnType<typeof postgres> | null = null;
let schemaEnsured: Promise<void> | null = null;

// Lazy singleton, mirrors the getGeminiClient() pattern — avoids opening a
// connection at module load for routes that never touch the DB.
//
// Uses the direct (non-pooled) connection rather than Supabase's PgBouncer
// pooler: this app does one query per request from a single user, so
// pooling buys nothing, while PgBouncer's transaction-mode pooling
// actively breaks postgres.js's prepared statements — every query can land
// on a different backend connection, which intermittently corrupted writes
// (a JSON object would get double-encoded as a string) until this was
// switched. `prepare: false` is kept as a second line of defense in case
// this ever falls back to the pooled URL.
function getClient() {
  if (!client) {
    const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
    if (!url) throw new Error("POSTGRES_URL_NON_POOLING is not set");
    client = postgres(url, { max: 1, prepare: false });
  }
  return client;
}

// Single-user app — one row holds the entire persisted Zustand slice as a
// JSON blob. A relational schema per entity would be more "correct" but
// there's one user and the shape already matches what the store persists;
// splitting into tables would add migration surface with no real payoff.
// The table is created lazily on first access rather than via a separate
// migration step — there's exactly one table, so a formal migration
// pipeline would be ceremony without benefit here.
async function ensureSchema() {
  const sql = getClient();
  await sql`
    CREATE TABLE IF NOT EXISTS app_state (
      id TEXT PRIMARY KEY DEFAULT 'default',
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  // A separate table rather than folding into app_state's JSON blob — a
  // push subscription is a browser/device credential, not app data, and
  // there can be more than one (phone + desktop both installed).
  await sql`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      endpoint TEXT PRIMARY KEY,
      subscription JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  // Idempotency guard for the notification cron — a manual re-trigger or a
  // Vercel retry on a slow invocation shouldn't double-send the same day's
  // capsule/deadline push.
  await sql`
    CREATE TABLE IF NOT EXISTS notification_log (
      kind TEXT NOT NULL,
      sent_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (kind, sent_date)
    )
  `;
  // Login brute-force guard — the site password is the only thing standing
  // between a stranger and every private note/photo/deadline in here.
  await sql`
    CREATE TABLE IF NOT EXISTS login_attempts (
      ip TEXT PRIMARY KEY,
      failures INTEGER NOT NULL DEFAULT 0,
      window_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      locked_until TIMESTAMPTZ
    )
  `;
}

function ready() {
  if (!schemaEnsured) schemaEnsured = ensureSchema();
  return schemaEnsured;
}

export async function loadAppState(): Promise<unknown | null> {
  await ready();
  const sql = getClient();
  const rows = await sql`SELECT data FROM app_state WHERE id = 'default'`;
  const data = rows[0]?.data ?? null;
  // Self-heal rows written while the pooler bug above was still live —
  // those got double-encoded (a JSON object stored as its own string
  // representation instead of as an object).
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  return data;
}

export async function saveAppState(data: unknown): Promise<void> {
  await ready();
  const sql = getClient();
  const json = sql.json(data as JSONValue);
  await sql`
    INSERT INTO app_state (id, data, updated_at)
    VALUES ('default', ${json}, now())
    ON CONFLICT (id) DO UPDATE SET data = ${json}, updated_at = now()
  `;
}

export async function savePushSubscription(
  endpoint: string,
  subscription: unknown
): Promise<void> {
  await ready();
  const sql = getClient();
  const json = sql.json(subscription as JSONValue);
  await sql`
    INSERT INTO push_subscriptions (endpoint, subscription)
    VALUES (${endpoint}, ${json})
    ON CONFLICT (endpoint) DO UPDATE SET subscription = ${json}
  `;
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  await ready();
  const sql = getClient();
  await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint}`;
}

export async function loadPushSubscriptions(): Promise<unknown[]> {
  await ready();
  const sql = getClient();
  const rows = await sql`SELECT subscription FROM push_subscriptions`;
  return rows.map((r) => r.subscription);
}

const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;

// Returns the lockout end time if `ip` is currently locked out, else null.
export async function checkLoginLockout(ip: string): Promise<Date | null> {
  await ready();
  const sql = getClient();
  const rows = await sql`
    SELECT locked_until FROM login_attempts WHERE ip = ${ip}
  `;
  const lockedUntil = rows[0]?.locked_until as Date | undefined;
  if (lockedUntil && lockedUntil.getTime() > Date.now()) return lockedUntil;
  return null;
}

// Call on a failed password attempt. Resets the failure count if the
// previous window has expired, otherwise increments it and locks out once
// the threshold is crossed.
export async function recordLoginFailure(ip: string): Promise<void> {
  await ready();
  const sql = getClient();
  const rows = await sql`
    SELECT failures, window_started_at FROM login_attempts WHERE ip = ${ip}
  `;
  const existing = rows[0] as { failures: number; window_started_at: Date } | undefined;
  const windowExpired =
    !existing || Date.now() - existing.window_started_at.getTime() > LOGIN_ATTEMPT_WINDOW_MS;

  const failures = windowExpired ? 1 : existing.failures + 1;
  const lockedUntil =
    failures >= LOGIN_MAX_ATTEMPTS ? new Date(Date.now() + LOGIN_LOCKOUT_MS) : null;

  await sql`
    INSERT INTO login_attempts (ip, failures, window_started_at, locked_until)
    VALUES (${ip}, ${failures}, ${windowExpired ? new Date() : existing!.window_started_at}, ${lockedUntil})
    ON CONFLICT (ip) DO UPDATE SET
      failures = ${failures},
      window_started_at = ${windowExpired ? new Date() : existing!.window_started_at},
      locked_until = ${lockedUntil}
  `;
}

export async function clearLoginFailures(ip: string): Promise<void> {
  await ready();
  const sql = getClient();
  await sql`DELETE FROM login_attempts WHERE ip = ${ip}`;
}

// Returns true (and records it) the first time `kind` is claimed for
// `date` — false on every subsequent call for the same pair, so the caller
// can skip sending a duplicate notification.
export async function claimNotificationOnce(kind: string, date: string): Promise<boolean> {
  await ready();
  const sql = getClient();
  const rows = await sql`
    INSERT INTO notification_log (kind, sent_date)
    VALUES (${kind}, ${date})
    ON CONFLICT (kind, sent_date) DO NOTHING
    RETURNING kind
  `;
  return rows.length > 0;
}
