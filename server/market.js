// Marketplace: user-posted listings + two-sided bookings, all in Postgres.
//
// Temporary-access lifecycle:
//   Book Now → payment HELD in the buyer's Wallet + private setup chat (10 min)
//     → setup confirmed  → ACTIVE (usage period runs) → EXPIRED (payment settled 40/30/30)
//     → setup fails/times out → FAILED (full refund to the Wallet)
import express from 'express'
import { get, all, run, tx } from './db.js'
import { requireAuth } from './auth.js'
import { walletBalance, adjustWallet } from './wallet.js'

const router = express.Router()
const now = () => Date.now()
const round2 = (n) => Math.round(n * 100) / 100
const SETUP_WINDOW_MS = 10 * 60 * 1000 // 10-minute setup window

// Duration-tiered revenue split (fractions). The provider reserve is always 20%
// (paid to the actual provider, e.g. Netflix); the owner's share grows with
// longer bookings while twelve's platform fee shrinks. Kept in sync with the
// client copy in src/lib/pricing.js (splitForHours).
function splitForHours(hours) {
  const h = Number(hours) || 0
  if (h <= 12) return { owner: 0.30, platform: 0.50, provider: 0.20 }
  if (h <= 24) return { owner: 0.35, platform: 0.45, provider: 0.20 }
  if (h <= 72) return { owner: 0.40, platform: 0.40, provider: 0.20 }
  return { owner: 0.45, platform: 0.35, provider: 0.20 }
}

// ---- serializers -------------------------------------------------------
function serializeListing(row) {
  return {
    id: row.id,
    owner_id: row.owner_id,
    owner_name: row.owner_name,
    provider: row.provider,
    category: row.category,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    default_hours: row.default_hours,
    seats: row.seats,
    availability: row.availability,
    created_at: row.created_at,
    bookings_count: row.bookings_count || 0
  }
}

// Status the UI understands: held | upcoming | active | completed | failed | disputed.
function statusOf(row) {
  const t = now()
  if (row.state === 'held') return t > (row.setup_deadline || 0) ? 'failed' : 'held'
  if (row.state === 'failed') return 'failed'
  if (row.state === 'disputed') return 'disputed'
  if (row.state === 'expired' || row.ended) return 'completed'
  if (t < row.start_at) return 'upcoming'
  if (t < row.expires_at) return 'active'
  return 'completed'
}

function serializeBooking(row) {
  return {
    id: row.id,
    listing_ref: row.listing_ref,
    provider: row.provider,
    title: row.title,
    hours: row.hours,
    price: row.price,
    owner_id: row.owner_id,
    owner_earning: row.owner_earning,
    platform_earning: row.platform_earning,
    provider_earning: row.provider_earning,
    seeker_id: row.seeker_id,
    seeker_name: row.seeker_name,
    owner_name: row.owner_name,
    state: row.state,
    setup_deadline: row.setup_deadline,
    // Two-party handshake attestations. both_required is false for demo-catalog
    // listings (no real owner), where the buyer's confirmation alone activates.
    both_required: !!row.owner_id,
    owner_confirmed: !!row.owner_confirmed,
    owner_confirmed_at: row.owner_confirmed_at || null,
    seeker_confirmed: !!row.seeker_confirmed,
    seeker_confirmed_at: row.seeker_confirmed_at || null,
    disputed_at: row.disputed_at || null,
    dispute_reason: row.dispute_reason || null,
    settled: !!row.settled,
    created_at: row.created_at,
    start_at: row.start_at,
    expires_at: row.expires_at,
    status: statusOf(row)
  }
}

// ---- queries -----------------------------------------------------------
const LISTING_SELECT = `
  SELECT l.*, u.name AS owner_name,
    (SELECT COUNT(*) FROM bookings b WHERE b.listing_ref = 'u' || l.id) AS bookings_count
  FROM listings l JOIN users u ON u.id = l.owner_id
`
const BOOKING_SELECT = `
  SELECT b.*, s.name AS seeker_name, o.name AS owner_name
  FROM bookings b JOIN users s ON s.id = b.seeker_id LEFT JOIN users o ON o.id = b.owner_id
`

const listAllListings = () =>
  all(`${LISTING_SELECT} WHERE l.status = 'active' ORDER BY l.created_at DESC`)
const listMyListings = (ownerId) =>
  all(`${LISTING_SELECT} WHERE l.owner_id = $1 ORDER BY l.created_at DESC`, [ownerId])
const getListingById = (id) => get(`${LISTING_SELECT} WHERE l.id = $1`, [id])

const getOwnerEarnings = (ownerId) =>
  get('SELECT COALESCE(SUM(owner_earning),0) AS earnings, COUNT(*) AS cnt FROM bookings WHERE owner_id = $1 AND settled = 1', [ownerId])
const listOwnerBookings = (ownerId) =>
  all(`${BOOKING_SELECT} WHERE b.owner_id = $1 ORDER BY b.created_at DESC`, [ownerId])
const listMyBookings = (seekerId) =>
  all(`${BOOKING_SELECT} WHERE b.seeker_id = $1 ORDER BY b.created_at DESC`, [seekerId])
const getBookingById = (id) => get(`${BOOKING_SELECT} WHERE b.id = $1`, [id])
const userExists = (id) => get('SELECT id FROM users WHERE id = $1', [id])

const listMessages = (bookingId) =>
  all('SELECT * FROM messages WHERE booking_id = $1 ORDER BY created_at ASC, id ASC', [bookingId])

// Insert a system/text message. Pass a transaction client to run inside one.
const insertMessage = ({ booking_id, sender_id, kind, body, created_at }, client) =>
  run(
    `INSERT INTO messages (booking_id, sender_id, kind, body, created_at) VALUES ($1, $2, $3, $4, $5)`,
    [booking_id, sender_id, kind, body, created_at],
    client
  )

// ---- lifecycle helpers -------------------------------------------------
function isParticipant(row, userId) {
  return row.seeker_id === userId || (row.owner_id && row.owner_id === userId)
}

// Fail a held booking and refund the held payment to the buyer's Wallet.
// Pass a `client` to run inside an existing transaction, else opens its own.
async function failBooking(id, note, client) {
  const body = async (c) => {
    const row = await get('SELECT * FROM bookings WHERE id = $1', [id], c)
    if (!row || row.state !== 'held') return
    await run("UPDATE bookings SET state = 'failed' WHERE id = $1", [id], c)
    await adjustWallet({ userId: row.seeker_id, delta: row.price, type: 'refund', bookingId: id, note: note || 'Setup failed — refund' }, c)
    await insertMessage({ booking_id: id, sender_id: null, kind: 'system',
      body: `Access setup failed. Your payment of $${row.price.toFixed(2)} has been returned to your twelve Wallet.`,
      created_at: now() }, c)
  }
  return client ? body(client) : tx(body)
}

// Settle a finished booking: credit the owner's share to their Wallet.
async function settleBooking(id, client) {
  const body = async (c) => {
    const row = await get('SELECT * FROM bookings WHERE id = $1', [id], c)
    if (!row || row.settled) return
    if (row.state !== 'active') return
    await run("UPDATE bookings SET state = 'expired', settled = 1 WHERE id = $1", [id], c)
    if (row.owner_id && row.owner_earning > 0) {
      await adjustWallet({ userId: row.owner_id, delta: row.owner_earning, type: 'settle', bookingId: id,
        note: `Owner share — ${row.title}` }, c)
    }
  }
  return client ? body(client) : tx(body)
}

// Buyer-reported dispute on a live booking (e.g. the owner changed the
// credentials so access no longer works). Access ends immediately, the buyer is
// refunded in full, and the owner is NOT paid — the held payment never settles.
async function disputeBooking(id, reason, client) {
  const body = async (c) => {
    const row = await get('SELECT * FROM bookings WHERE id = $1', [id], c)
    if (!row || row.state !== 'active' || row.settled) return
    const t = now()
    await run(
      "UPDATE bookings SET state = 'disputed', disputed_at = $1, dispute_reason = $2, ended = 1, expires_at = $3 WHERE id = $4",
      [t, reason || null, Math.min(row.expires_at, t), id], c
    )
    // Full refund to the buyer; the owner earns nothing on a disputed booking.
    await adjustWallet({ userId: row.seeker_id, delta: row.price, type: 'refund', bookingId: id, note: 'Access dispute — refund' }, c)
    await insertMessage({ booking_id: id, sender_id: null, kind: 'system',
      body: `Access reported as not working${reason ? ` (“${reason}”)` : ''}. The buyer's payment of $${row.price.toFixed(2)} has been returned to their twelve Wallet and the owner will not be paid. This report is under review.`,
      created_at: t }, c)
  }
  return client ? body(client) : tx(body)
}

// Lazily advance a booking's state when it is read (no background cron needed):
// held past its window → failed+refund; active past expiry → expired+settled.
async function reconcile(row) {
  if (!row) return row
  const t = now()
  if (row.state === 'held' && row.setup_deadline && t > row.setup_deadline) {
    await failBooking(row.id, 'Setup window elapsed — refund')
    return getBookingById(row.id)
  }
  if (row.state === 'active' && !row.settled && t >= row.expires_at) {
    await settleBooking(row.id)
    return getBookingById(row.id)
  }
  return row
}
async function reconcileAll(rows) {
  const out = []
  for (const r of rows) out.push(await reconcile(r))
  return out
}

// ---- routes ------------------------------------------------------------

// GET /api/listings — the shared marketplace (public: browsing needs no login)
router.get('/listings', async (_req, res) => {
  try {
    res.json({ listings: (await listAllListings()).map(serializeListing) })
  } catch (e) {
    console.error('listings error', e)
    res.status(500).json({ error: 'Could not load listings.' })
  }
})

// POST /api/listings — publish a listing (auth)
router.post('/listings', requireAuth, async (req, res) => {
  try {
    const b = req.body || {}
    const provider = String(b.provider || '').trim()
    const category = String(b.category || '').trim()
    const title = String(b.title || '').trim()
    if (!provider || !category || !title) return res.status(400).json({ error: 'Missing listing details.' })
    const { rows } = await run(
      `INSERT INTO listings (owner_id, provider, category, title, subtitle, description, default_hours, seats, availability, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        req.user.id, provider, category, title,
        b.subtitle ? String(b.subtitle) : null,
        b.description ? String(b.description) : null,
        Number(b.defaultHours) || 24,
        Number(b.seats) || 1,
        b.availability ? String(b.availability) : 'Available now',
        now(),
      ]
    )
    res.json({ listing: serializeListing(await getListingById(rows[0].id)) })
  } catch (e) {
    console.error('create listing error', e)
    res.status(500).json({ error: 'Could not publish your listing.' })
  }
})

// GET /api/me/dashboard — owner view: stats, my listings, bookings on my listings
router.get('/me/dashboard', requireAuth, async (req, res) => {
  try {
    const uid = req.user.id
    const listings = (await listMyListings(uid)).map(serializeListing)
    const ownerBookings = (await reconcileAll(await listOwnerBookings(uid))).map(serializeBooking)
    const earn = await getOwnerEarnings(uid)
    const activeOnMine = ownerBookings.filter((x) => x.status === 'active').length
    const utilization = listings.length ? Math.min(100, Math.round((activeOnMine / listings.length) * 100)) : 0
    res.json({
      stats: {
        earnings: round2(earn.earnings), // realized (settled) owner share
        listingsCount: listings.length,
        bookingsCount: ownerBookings.length,
        utilization
      },
      listings,
      ownerBookings
    })
  } catch (e) {
    console.error('dashboard error', e)
    res.status(500).json({ error: 'Could not load your dashboard.' })
  }
})

// GET /api/me/bookings — seeker view: bookings I made
router.get('/me/bookings', requireAuth, async (req, res) => {
  try {
    res.json({ bookings: (await reconcileAll(await listMyBookings(req.user.id))).map(serializeBooking) })
  } catch (e) {
    console.error('my bookings error', e)
    res.status(500).json({ error: 'Could not load your bookings.' })
  }
})

// POST /api/bookings — book a listing (auth)
//   body.hold === true → Wallet-funded temporary-access flow: payment is HELD and
//   a 10-minute setup window opens. Otherwise the legacy instant-access path.
router.post('/bookings', requireAuth, async (req, res) => {
  try {
    const b = req.body || {}
    const listing_ref = String(b.listingRef || '').trim()
    const provider = String(b.provider || '').trim()
    const title = String(b.title || '').trim()
    const hours = Number(b.hours)
    const price = round2(Number(b.price))
    if (!listing_ref || !provider || !title || !hours || !(price >= 0)) {
      return res.status(400).json({ error: 'Invalid booking request.' })
    }
    const rawOwner = Number(b.ownerId)
    // An owner cannot book their own listing.
    if (rawOwner && rawOwner === req.user.id) {
      return res.status(400).json({ error: 'You can’t book your own listing.' })
    }
    // Credit a real owner only when the listing belongs to one (not the demo catalog).
    let owner_id = null
    let owner_earning = 0
    let platform_earning = 0
    let provider_earning = 0
    if (rawOwner && rawOwner !== req.user.id && (await userExists(rawOwner))) {
      owner_id = rawOwner
      const sp = splitForHours(hours)
      owner_earning = round2(price * sp.owner)
      platform_earning = round2(price * sp.platform)
      provider_earning = round2(price - owner_earning - platform_earning)
    }
    const t = now()
    const hold = b.hold === true

    const insertBooking = (row, client) =>
      run(
        `INSERT INTO bookings (seeker_id, owner_id, listing_ref, provider, title, hours, price,
           owner_earning, platform_earning, provider_earning, state, setup_deadline, start_at, expires_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
        [row.seeker_id, row.owner_id, row.listing_ref, row.provider, row.title, row.hours, row.price,
         row.owner_earning, row.platform_earning, row.provider_earning, row.state, row.setup_deadline,
         row.start_at, row.expires_at, row.created_at],
        client
      )

    if (hold) {
      // Hold the money in the buyer's Wallet up front.
      if ((await walletBalance(req.user.id)) < price) {
        return res.status(402).json({ error: 'Insufficient Wallet balance. Add money and try again.' })
      }
      let newId
      try {
        newId = await tx(async (c) => {
          await adjustWallet({ userId: req.user.id, delta: -price, type: 'hold', note: `Held for ${title}` }, c)
          const { rows } = await insertBooking({
            seeker_id: req.user.id, owner_id, listing_ref, provider, title, hours, price,
            owner_earning, platform_earning, provider_earning,
            state: 'held', setup_deadline: t + SETUP_WINDOW_MS, start_at: 0, expires_at: 0, created_at: t
          }, c)
          const id = rows[0].id
          // Kick off the private setup chat with a status message.
          await insertMessage({
            booking_id: id, sender_id: owner_id || null, kind: 'system',
            body: owner_id
              ? `Setup started. The owner shares access to ${title}, then both of you confirm within 10 minutes to begin.`
              : `Setup started. Confirm your ${title} access is working within 10 minutes to begin.`,
            created_at: t
          }, c)
          return id
        })
      } catch (e) {
        if (e.code === 'INSUFFICIENT') return res.status(402).json({ error: 'Insufficient Wallet balance.' })
        throw e
      }
      return res.json({ booking: serializeBooking(await getBookingById(newId)) })
    }

    // Legacy instant-access path (no hold): active immediately, settled on completion.
    const { rows } = await insertBooking({
      seeker_id: req.user.id, owner_id, listing_ref, provider, title, hours, price,
      owner_earning, platform_earning, provider_earning,
      state: 'active', setup_deadline: null, start_at: t, expires_at: t + hours * 3600000, created_at: t
    })
    res.json({ booking: serializeBooking(await getBookingById(rows[0].id)) })
  } catch (e) {
    console.error('booking error', e)
    res.status(500).json({ error: 'Could not complete your booking.' })
  }
})

// GET /api/bookings/:id — one booking (only the seeker or the owner may read it)
router.get('/bookings/:id', requireAuth, async (req, res) => {
  try {
    const row = await reconcile(await getBookingById(Number(req.params.id)))
    if (!row || !isParticipant(row, req.user.id)) {
      return res.status(404).json({ error: 'Booking not found.' })
    }
    res.json({ booking: serializeBooking(row) })
  } catch (e) {
    console.error('get booking error', e)
    res.status(500).json({ error: 'Could not load the booking.' })
  }
})

// GET /api/bookings/:id/messages — the private setup chat
router.get('/bookings/:id/messages', requireAuth, async (req, res) => {
  try {
    const row = await reconcile(await getBookingById(Number(req.params.id)))
    if (!row || !isParticipant(row, req.user.id)) {
      return res.status(404).json({ error: 'Booking not found.' })
    }
    const messages = (await listMessages(row.id)).map((m) => ({
      id: m.id, senderId: m.sender_id, kind: m.kind, body: m.body, createdAt: m.created_at
    }))
    res.json({ booking: serializeBooking(row), messages })
  } catch (e) {
    console.error('messages error', e)
    res.status(500).json({ error: 'Could not load the chat.' })
  }
})

// POST /api/bookings/:id/messages { body } — send a chat message
router.post('/bookings/:id/messages', requireAuth, async (req, res) => {
  try {
    const row = await reconcile(await getBookingById(Number(req.params.id)))
    if (!row || !isParticipant(row, req.user.id)) {
      return res.status(404).json({ error: 'Booking not found.' })
    }
    if (row.state !== 'held' && row.state !== 'active') {
      return res.status(409).json({ error: 'This chat is closed.' })
    }
    const body = String(req.body?.body || '').trim().slice(0, 1000)
    if (!body) return res.status(400).json({ error: 'Message is empty.' })
    const { rows } = await run(
      `INSERT INTO messages (booking_id, sender_id, kind, body, created_at) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [row.id, req.user.id, 'text', body, now()]
    )
    const m = rows[0]
    res.json({ message: { id: m.id, senderId: m.sender_id, kind: m.kind, body: m.body, createdAt: m.created_at } })
  } catch (e) {
    console.error('send message error', e)
    res.status(500).json({ error: 'Could not send your message.' })
  }
})

// True once every party required for this booking has attested. For a real
// two-party booking that means BOTH the owner (shared access) and the buyer
// (received/works). Demo-catalog listings have no owner, so the buyer alone.
function bothConfirmed(row) {
  return row.owner_id ? (!!row.owner_confirmed && !!row.seeker_confirmed) : !!row.seeker_confirmed
}

// POST /api/bookings/:id/confirm-setup — record THIS party's attestation in the
// mutual handshake. The booking goes ACTIVE only once every required party has
// confirmed; a single side confirming just records their half and waits.
router.post('/bookings/:id/confirm-setup', requireAuth, async (req, res) => {
  try {
    const row = await reconcile(await getBookingById(Number(req.params.id)))
    if (!row || !isParticipant(row, req.user.id)) return res.status(404).json({ error: 'Booking not found.' })
    // Idempotent: once active, re-confirming is a harmless no-op.
    if (row.state === 'active') return res.json({ booking: serializeBooking(row) })
    if (row.state !== 'held') return res.status(409).json({ error: 'Setup is no longer open.' })

    const isOwner = !!row.owner_id && row.owner_id === req.user.id
    const t = now()

    await tx(async (c) => {
      // Re-read inside the transaction to avoid double-recording on concurrent confirms.
      const cur0 = await get('SELECT * FROM bookings WHERE id = $1', [row.id], c)
      if (!cur0 || cur0.state !== 'held') return
      let recorded = false
      if (isOwner && !cur0.owner_confirmed) {
        await run('UPDATE bookings SET owner_confirmed = 1, owner_confirmed_at = $1 WHERE id = $2', [t, row.id], c)
        recorded = true
      } else if (!isOwner && !cur0.seeker_confirmed) {
        await run('UPDATE bookings SET seeker_confirmed = 1, seeker_confirmed_at = $1 WHERE id = $2', [t, row.id], c)
        recorded = true
      }

      const cur = await get('SELECT * FROM bookings WHERE id = $1', [row.id], c)
      const ready = bothConfirmed(cur)

      // If one side just confirmed but we're still waiting on the other, say who.
      if (recorded && !ready) {
        await insertMessage({ booking_id: cur.id, sender_id: null, kind: 'system',
          body: isOwner
            ? 'The owner confirmed access has been shared. Waiting for the buyer to confirm they’re in.'
            : 'The buyer confirmed they can get in. Waiting for the owner to confirm access was shared.',
          created_at: t }, c)
      }

      // Once every required party has attested, start the paid session + clock.
      if (ready && cur.state === 'held') {
        await run("UPDATE bookings SET state = 'active', start_at = $1, expires_at = $2 WHERE id = $3",
          [t, t + cur.hours * 3600000, cur.id], c)
        await insertMessage({ booking_id: cur.id, sender_id: null, kind: 'system',
          body: cur.owner_id
            ? 'Both parties confirmed. Access is live — the paid usage period has begun.'
            : 'Access confirmed. Your session is ready — the usage period has begun.',
          created_at: t + 1 }, c)
      }
    })

    res.json({ booking: serializeBooking(await getBookingById(row.id)) })
  } catch (e) {
    console.error('confirm-setup error', e)
    res.status(500).json({ error: 'Could not confirm setup.' })
  }
})

// POST /api/bookings/:id/fail-setup — setup could not be completed → refund
router.post('/bookings/:id/fail-setup', requireAuth, async (req, res) => {
  try {
    const row = await reconcile(await getBookingById(Number(req.params.id)))
    if (!row || !isParticipant(row, req.user.id)) return res.status(404).json({ error: 'Booking not found.' })
    if (row.state !== 'held') return res.status(409).json({ error: 'Setup is no longer open.' })
    await failBooking(row.id, 'Setup reported as failed — refund')
    res.json({ booking: serializeBooking(await getBookingById(row.id)) })
  } catch (e) {
    console.error('fail-setup error', e)
    res.status(500).json({ error: 'Could not update the booking.' })
  }
})

// POST /api/bookings/:id/end — end access early (seeker); settles immediately
router.post('/bookings/:id/end', requireAuth, async (req, res) => {
  try {
    const row = await reconcile(await getBookingById(Number(req.params.id)))
    if (!row || row.seeker_id !== req.user.id) return res.status(404).json({ error: 'Booking not found.' })
    if (row.state === 'active') {
      await run('UPDATE bookings SET ended = 1, expires_at = $1 WHERE id = $2', [Math.min(row.expires_at, now()), row.id])
      await settleBooking(row.id)
    }
    res.json({ booking: serializeBooking(await getBookingById(row.id)) })
  } catch (e) {
    console.error('end booking error', e)
    res.status(500).json({ error: 'Could not end the booking.' })
  }
})

// POST /api/bookings/:id/report — the BUYER reports the access isn't working
// (e.g. the owner changed the credentials). Ends access, refunds the buyer in
// full and blocks the owner's payment. Only the buyer of an active booking may.
router.post('/bookings/:id/report', requireAuth, async (req, res) => {
  try {
    const row = await reconcile(await getBookingById(Number(req.params.id)))
    if (!row || row.seeker_id !== req.user.id) return res.status(404).json({ error: 'Booking not found.' })
    if (row.state !== 'active') return res.status(409).json({ error: 'Only a live booking can be reported.' })
    const reason = String(req.body?.reason || '').trim().slice(0, 500) || null
    await disputeBooking(row.id, reason)
    res.json({ booking: serializeBooking(await getBookingById(row.id)) })
  } catch (e) {
    console.error('report error', e)
    res.status(500).json({ error: 'Could not file the report.' })
  }
})

export default router
