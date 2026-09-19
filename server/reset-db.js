// Wipe the database — drops every table (users, listings, bookings, messages,
// wallet ledger) and recreates them empty. Run with:  npm run reset-db
// Use --yes / -y to skip the confirmation prompt (useful for scripts).
import 'dotenv/config'
import readline from 'readline'
import { pool, ensureSchema } from './db.js'

async function wipe() {
  try {
    await pool.query(`
      DROP TABLE IF EXISTS wallet_ledger, messages, bookings, listings, users CASCADE;
    `)
    await ensureSchema()
    console.log('\n  Database cleared. All users, listings and bookings are gone.')
    console.log('  Fresh empty tables have been recreated.\n')
  } catch (e) {
    console.error('\n  Could not reset the database:', e.message, '\n')
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

if (process.argv.includes('--yes') || process.argv.includes('-y')) {
  await wipe()
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  rl.question('\n  This permanently deletes ALL accounts and data. Continue? (y/N) ', async (ans) => {
    rl.close()
    const yes = ans.trim().toLowerCase()
    if (yes === 'y' || yes === 'yes') await wipe()
    else { console.log('  Cancelled — nothing was deleted.\n'); await pool.end() }
  })
}
