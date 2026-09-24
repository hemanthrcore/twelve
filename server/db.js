// PostgreSQL database layer (Supabase-hosted in production, any Postgres locally).
//
// Why Postgres and not SQLite: on serverless hosts like Vercel there is no
// persistent disk, so a SQLite file cannot survive between requests. Supabase is
// just hosted Postgres — the app connects to it over the network with a
// connection string (the DATABASE_URL env var).
//
// better-sqlite3 was synchronous; `pg` is asynchronous, so every query here
// returns a Promise and must be awaited. The helpers below (get/all/run/tx) keep
// the call sites short.
import pg from 'pg'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const { Pool, types } = pg

// Postgres returns BIGINT (int8) as a string by default to avoid precision loss.
// All our bigints are millisecond timestamps and IDs — comfortably within JS's
// safe-integer range — so parse them straight to numbers, matching the old
// SQLite behaviour the rest of the code expects.
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10))) // 20 = int8 / bigint

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const DATA_DIR = path.join(__dirname, 'data')

const DATABASE_URL = process.env.DATABASE_URL || ''
if (!DATABASE_URL) {
  console.error(
    '\n  DATABASE_URL is not set. Create a Postgres/Supabase database and put its\n' +
    '  connection string in .env (see .env.example). The app cannot start without it.\n'
  )
}

// A local Postgres needs no SSL; Supabase (and any hosted DB) does. We accept
// its certificate without pinning it, which is standard for these managed pools.
const isLocal = /(?:localhost|127\.0\.0\.1)/.test(DATABASE_URL)

// Reuse a single pool across warm serverless invocations (stored on globalThis so
// repeated module evaluation doesn't open a new pool each time).
const g = globalThis
export const pool =
  g.__twelvePool ||
  (g.__twelvePool = new Pool({
    connectionString: DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 3,                    // small pool: many serverless instances share the DB
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  }))

// Demo credit every new twelve Wallet starts with. Stored in the canonical USD
// unit; at the reference rate (₹83/$) this shows as ₹100 — the default balance.
export const WALLET_SEED = 100 / 83

// ---- query helpers -----------------------------------------------------
// Each helper takes an optional `client`: pass the transaction's client to run
// inside an open transaction, or omit it to run as a standalone query on the pool.
export async function all(text, params = [], client) {
  const { rows } = await (client || pool).query(text, params)
  return rows
}
export async function get(text, params = [], client) {
  const { rows } = await (client || pool).query(text, params)
  return rows[0]
}
export async function run(text, params = [], client) {
  return (client || pool).query(text, params)
}

// Run `fn` inside a single transaction, committing on success and rolling back on
// any thrown error. `fn` receives the dedicated client to pass to the helpers.
export async function tx(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (e) {
    try { await client.query('ROLLBACK') } catch {}
    throw e
  } finally {
    client.release()
  }
}

// ---- schema ------------------------------------------------------------
export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name           TEXT    NOT NULL,
    email          TEXT    NOT NULL,
    password_hash  TEXT,                                    -- NULL for OAuth-only accounts
    provider       TEXT    NOT NULL DEFAULT 'email',        -- 'email' | 'google'
    avatar         TEXT,
    wallet_balance DOUBLE PRECISION NOT NULL DEFAULT 0,     -- twelve Wallet balance (USD)
    created_at     BIGINT  NOT NULL,
    last_login_at  BIGINT
  );
  -- Case-insensitive uniqueness of email (replaces SQLite's COLLATE NOCASE).
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (lower(email));

  CREATE TABLE IF NOT EXISTS listings (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id      BIGINT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider      TEXT    NOT NULL,
    category      TEXT    NOT NULL,
    title         TEXT    NOT NULL,
    subtitle      TEXT,
    description   TEXT,
    default_hours INTEGER NOT NULL DEFAULT 24,
    seats         INTEGER NOT NULL DEFAULT 1,
    availability  TEXT    NOT NULL DEFAULT 'Available now',
    status        TEXT    NOT NULL DEFAULT 'active',
    created_at    BIGINT  NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_listings_owner ON listings (owner_id);

  CREATE TABLE IF NOT EXISTS bookings (
    id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seeker_id        BIGINT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id         BIGINT  REFERENCES users(id) ON DELETE SET NULL,
    listing_ref      TEXT    NOT NULL,          -- 'u<id>' (user listing) or a catalog id
    provider         TEXT    NOT NULL,
    title            TEXT    NOT NULL,
    hours            INTEGER NOT NULL,
    price            DOUBLE PRECISION NOT NULL,
    owner_earning    DOUBLE PRECISION NOT NULL DEFAULT 0,
    platform_earning DOUBLE PRECISION NOT NULL DEFAULT 0,
    provider_earning DOUBLE PRECISION NOT NULL DEFAULT 0,
    state            TEXT    NOT NULL DEFAULT 'active', -- held | active | expired | failed | disputed
    setup_deadline   BIGINT,
    owner_confirmed     INTEGER NOT NULL DEFAULT 0,   -- 0/1 (kept as int, like the old schema)
    owner_confirmed_at  BIGINT,
    seeker_confirmed    INTEGER NOT NULL DEFAULT 0,
    seeker_confirmed_at BIGINT,
    disputed_at      BIGINT,
    dispute_reason   TEXT,
    settled          INTEGER NOT NULL DEFAULT 0,
    start_at         BIGINT  NOT NULL,
    expires_at       BIGINT  NOT NULL,
    ended            INTEGER NOT NULL DEFAULT 0,
    created_at       BIGINT  NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_bookings_seeker ON bookings (seeker_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_owner  ON bookings (owner_id);

  CREATE TABLE IF NOT EXISTS messages (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    booking_id  BIGINT  NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id   BIGINT  REFERENCES users(id) ON DELETE SET NULL,
    kind        TEXT    NOT NULL DEFAULT 'text',  -- 'text' | 'system'
    body        TEXT    NOT NULL,
    created_at  BIGINT  NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_messages_booking ON messages (booking_id);

  CREATE TABLE IF NOT EXISTS wallet_ledger (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id       BIGINT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type          TEXT    NOT NULL,          -- topup | hold | refund | settle
    amount        DOUBLE PRECISION NOT NULL, -- signed: negative = debit
    balance_after DOUBLE PRECISION NOT NULL,
    booking_id    BIGINT,
    note          TEXT,
    created_at    BIGINT  NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_ledger_user ON wallet_ledger (user_id);
`

// Create the tables if they don't exist. Idempotent and safe to call repeatedly;
// memoised so it runs at most once per process.
let schemaReady
export function ensureSchema() {
  if (!schemaReady) {
    schemaReady = pool.query(SCHEMA_SQL).then(() => true).catch((e) => {
      schemaReady = undefined // allow a retry on the next request
      throw e
    })
  }
  return schemaReady
}

// ---- JWT signing secret ------------------------------------------------
// In a hosted deployment ALWAYS set JWT_SECRET (an env var), otherwise every
// serverless cold start would sign with a different secret and log everyone out.
// The local-file fallback below only helps during local development.
export function getJwtSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 16) {
    return process.env.JWT_SECRET
  }
  // Serverless instances do not share the local filesystem. Derive a stable
  // fallback from the database secret so a cold start cannot invalidate all
  // existing cookies. JWT_SECRET should still be configured explicitly.
  if (process.env.VERCEL && DATABASE_URL) {
    console.warn('JWT_SECRET is not set; deriving a stable session secret from DATABASE_URL. Set JWT_SECRET for production.')
    return crypto.createHash('sha256').update(`twelve-session:${DATABASE_URL}`).digest('hex')
  }
  const file = path.join(DATA_DIR, '.jwt-secret')
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim()
    const secret = crypto.randomBytes(48).toString('hex')
    fs.writeFileSync(file, secret, { mode: 0o600 })
    return secret
  } catch {
    // Read-only filesystem (e.g. serverless) with no JWT_SECRET set: fall back to
    // an ephemeral secret so the process still runs, but warn loudly.
    console.warn('JWT_SECRET is not set and no writable data dir — sessions will not persist. Set JWT_SECRET.')
    return crypto.randomBytes(48).toString('hex')
  }
}
