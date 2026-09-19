// Create the database tables in whatever Postgres DATABASE_URL points at.
// Run once after setting up Supabase (safe to re-run — it only creates what's
// missing):   npm run migrate
import 'dotenv/config'
import { ensureSchema, pool } from './db.js'

try {
  await ensureSchema()
  console.log('\n  Tables are ready.\n')
} catch (e) {
  console.error('\n  Migration failed:', e.message, '\n')
  process.exitCode = 1
} finally {
  await pool.end()
}
