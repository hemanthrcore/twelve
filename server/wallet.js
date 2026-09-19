// twelve Wallet — the funding source for the temporary-access flow.
// Booking a listing HOLDS money here; a completed booking SETTLES it (owner
// share credited), a failed setup REFUNDS it. Every movement is recorded in
// wallet_ledger. All amounts are USD.
import express from 'express'
import { get, all, run, tx } from './db.js'
import { requireAuth } from './auth.js'

const router = express.Router()
const now = () => Date.now()
const round2 = (n) => Math.round(n * 100) / 100

export async function walletBalance(userId, client) {
  const row = await get('SELECT wallet_balance FROM users WHERE id = $1', [userId], client)
  return row ? round2(row.wallet_balance || 0) : 0
}

// The atomic core of a wallet change — must run inside a transaction (uses the
// passed client). Throws { code: 'INSUFFICIENT' } if a debit would go negative.
async function adjustWalletInner({ userId, delta, type, bookingId = null, note = null }, client) {
  const row = await get('SELECT wallet_balance FROM users WHERE id = $1', [userId], client)
  if (!row) throw new Error('User not found')
  const next = round2((row.wallet_balance || 0) + delta)
  if (next < -0.001) { const e = new Error('Insufficient balance'); e.code = 'INSUFFICIENT'; throw e }
  await run('UPDATE users SET wallet_balance = $1 WHERE id = $2', [next, userId], client)
  await run(
    `INSERT INTO wallet_ledger (user_id, type, amount, balance_after, booking_id, note, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, type, round2(delta), next, bookingId, note, now()],
    client
  )
  return next
}

// Apply a signed delta to a user's balance and record it. Atomic. Pass a
// transaction `client` to join an in-progress transaction (e.g. a booking hold);
// omit it to run as its own standalone transaction (e.g. a top-up).
export async function adjustWallet(args, client) {
  if (client) return adjustWalletInner(args, client)
  return tx((c) => adjustWalletInner(args, c))
}

const qLedger = `
  SELECT * FROM wallet_ledger WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT 40
`

function serializeEntry(row) {
  return {
    id: row.id, type: row.type, amount: row.amount, balanceAfter: row.balance_after,
    bookingId: row.booking_id, note: row.note, createdAt: row.created_at
  }
}

// GET /api/wallet — balance + recent ledger
router.get('/', requireAuth, async (req, res) => {
  try {
    const [balance, ledger] = await Promise.all([
      walletBalance(req.user.id),
      all(qLedger, [req.user.id]),
    ])
    res.json({ balance, ledger: ledger.map(serializeEntry) })
  } catch (e) {
    console.error('wallet error', e)
    res.status(500).json({ error: 'Could not load your wallet.' })
  }
})

// POST /api/wallet/topup { amount } — add demo funds (simulated)
router.post('/topup', requireAuth, async (req, res) => {
  try {
    const amount = round2(Number(req.body?.amount))
    if (!(amount > 0) || amount > 1000) {
      return res.status(400).json({ error: 'Enter an amount between $1 and $1000.' })
    }
    const balance = await adjustWallet({ userId: req.user.id, delta: amount, type: 'topup', note: 'Added money' })
    const ledger = await all(qLedger, [req.user.id])
    res.json({ balance, ledger: ledger.map(serializeEntry) })
  } catch (e) {
    console.error('topup error', e)
    res.status(500).json({ error: 'Could not add money. Please try again.' })
  }
})

export default router
