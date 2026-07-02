import "server-only";
import postgres, { type JSONValue } from "postgres";

let client: ReturnType<typeof postgres> | null = null;
let schemaEnsured: Promise<void> | null = null;

// Lazy singleton, mirrors the getGeminiClient() pattern — avoids opening a
// connection at module load for routes that never touch the DB.
function getClient() {
  if (!client) {
    const url = process.env.POSTGRES_URL;
    if (!url) throw new Error("POSTGRES_URL is not set");
    client = postgres(url, { max: 1 });
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
}

function ready() {
  if (!schemaEnsured) schemaEnsured = ensureSchema();
  return schemaEnsured;
}

export async function loadAppState(): Promise<unknown | null> {
  await ready();
  const sql = getClient();
  const rows = await sql`SELECT data FROM app_state WHERE id = 'default'`;
  return rows[0]?.data ?? null;
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
