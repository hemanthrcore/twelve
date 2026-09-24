import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { detectCountry } from '../lib/geo'
import { countryName } from '../lib/pricing'
import { setDisplayCurrency } from '../lib/format'
import { currencyForCountry, currencyInfo } from '../lib/currency'
import { getProvider } from '../data/providers'
import { DURATIONS } from '../data/listings'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

const COUNTRY_KEY = 'twelve_country_v1'

// ---------------------------------------------------------------------------
// All account, listing and booking data lives in the backend (Express +
// SQLite). This context is a thin client over /api. The demo catalog
// (data/listings.js) is still bundled in the app as "starter" marketplace
// inventory and merged with real user listings in Discover.
// ---------------------------------------------------------------------------
async function api(path, { method = 'GET', body, retries = 2 } = {}) {
  const retryable = method === 'GET' || method === 'HEAD'
  const maxRetries = retryable ? retries : 0
  let lastError
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch('/api' + path, {
        method,
        credentials: 'same-origin', // send/receive the session cookie
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined
      })
      let data = null
      try { data = await res.json() } catch {}
      if (!res.ok) {
        const err = new Error((data && data.error) || `Request failed (${res.status})`)
        err.status = res.status
        // A cold serverless function or database may briefly return 5xx.
        if (attempt < maxRetries && res.status >= 500) {
          await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
          continue
        }
        throw err
      }
      return data
    } catch (error) {
      lastError = error
      if (attempt >= maxRetries || (error.status && error.status < 500)) throw error
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
    }
  }
  throw lastError
}

// Live status from timestamps (so tabs/countdowns update without a refetch).
// Mirrors the server: held | upcoming | active | completed | failed.
export function liveStatus(b) {
  const now = Date.now()
  if (b.state === 'held') return now > (b.setupDeadline || 0) ? 'failed' : 'held'
  if (b.state === 'failed') return 'failed'
  if (b.state === 'disputed') return 'disputed'
  if (b.state === 'expired' || b.ended) return 'completed'
  if (b.status === 'completed' && b.expiresAt <= now) return 'completed'
  if (now < b.startAt) return 'upcoming'
  if (now < b.expiresAt) return 'active'
  return 'completed'
}

// Turn a DB listing row into the shape the UI components expect (same as the
// demo catalog listings). Prices are computed at render time from the region.
function normListing(row) {
  const p = getProvider(row.provider) || {}
  return {
    id: 'u' + row.id,
    dbId: row.id,
    source: 'user',
    provider: row.provider,
    category: row.category || p.category || 'entertainment',
    title: row.title || p.name || 'Listing',
    subtitle: row.subtitle || p.tagline || 'Shared by a member',
    description: row.description ||
      `Temporary authorized access to ${row.title || p.name}. Access is time-boxed and revoked automatically — no passwords, no OTPs.`,
    owner: row.owner_name || 'Member',
    ownerId: row.owner_id,
    defaultHours: row.default_hours || 24,
    seats: row.seats || 1,
    availability: row.availability || 'Available now',
    rating: 5.0,
    reviews: 0,
    bookings: row.bookings_count || 0,
    verified: true,
    quality: p.tagline || 'Member listing',
    price: 0, // fallback only; real price comes from listingPricing()
    trending: false,
    popular: true, // so member listings surface in Discover
    durations: DURATIONS.map((d) => ({ ...d, price: 0 }))
  }
}

function normBooking(row) {
  return {
    id: String(row.id),
    listingId: row.listing_ref,
    provider: row.provider,
    title: row.title,
    hours: row.hours,
    price: row.price,
    seeker: row.seeker_name || 'Someone',
    seekerId: row.seeker_id,
    ownerId: row.owner_id,
    ownerName: row.owner_name || null,
    ownerEarning: row.owner_earning || 0,
    platformEarning: row.platform_earning || 0,
    providerEarning: row.provider_earning || 0,
    state: row.state || 'active',
    setupDeadline: row.setup_deadline || null,
    bothRequired: row.both_required ?? !!row.owner_id,
    ownerConfirmed: !!row.owner_confirmed,
    seekerConfirmed: !!row.seeker_confirmed,
    disputeReason: row.dispute_reason || null,
    settled: !!row.settled,
    createdAt: row.created_at,
    startAt: row.start_at,
    expiresAt: row.expires_at,
    ended: !!row.ended,
    status: row.status
  }
}

const EMPTY_STATS = { earnings: 0, listingsCount: 0, bookingsCount: 0, utilization: 0 }

function loadCountry() {
  try {
    const raw = localStorage.getItem(COUNTRY_KEY)
    if (raw) { const c = JSON.parse(raw); if (c && c.code) return c }
  } catch {}
  return { code: 'US', name: 'United States', chosen: false, detecting: true }
}

export function AppProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [country, setCountryState] = useState(loadCountry)
  // Keep the display-currency formatters in sync with the selected country,
  // synchronously, so children render amounts in the right currency this pass.
  setDisplayCurrency(country.code)
  const [authUser, setAuthUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const toastId = useRef(0)

  // Marketplace + per-user data (from the API)
  const [marketListings, setMarketListings] = useState([])
  const [myListings, setMyListings] = useState([])
  const [ownerBookings, setOwnerBookings] = useState([])
  const [myBookings, setMyBookings] = useState([])
  const [stats, setStats] = useState(EMPTY_STATS)
  const [bookingCache, setBookingCache] = useState({})
  const [wallet, setWallet] = useState({ balance: 0, ledger: [] })

  const toast = useCallback((message, type = 'info') => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  // ---- data loaders ----
  const refreshMarket = useCallback(async () => {
    try { const d = await api('/listings'); setMarketListings(d.listings.map(normListing)) } catch {}
  }, [])

  const refreshWallet = useCallback(async () => {
    try { const d = await api('/wallet'); setWallet({ balance: d.balance, ledger: d.ledger || [] }) } catch {}
  }, [])

  const refreshMine = useCallback(async () => {
    const [dashboard, bookings, walletData] = await Promise.allSettled([
      api('/me/dashboard'),
      api('/me/bookings'),
      api('/wallet')
    ])
    if (dashboard.status === 'fulfilled') {
      setMyListings(dashboard.value.listings.map(normListing))
      setOwnerBookings(dashboard.value.ownerBookings.map(normBooking))
      setStats(dashboard.value.stats)
    }
    if (bookings.status === 'fulfilled') setMyBookings(bookings.value.bookings.map(normBooking))
    if (walletData.status === 'fulfilled') {
      setWallet({ balance: walletData.value.balance, ledger: walletData.value.ledger || [] })
    }
  }, [])

  // ---- auth ----
  useEffect(() => {
    let alive = true
    api('/auth/me', { retries: 3 })
      .then((d) => { if (alive) setAuthUser(d.user) })
      .catch(() => { if (alive) setAuthUser(null) })
      .finally(() => { if (alive) setAuthReady(true) })
    return () => { alive = false }
  }, [])

  // Load the marketplace once, and (re)load per-user data whenever auth changes.
  useEffect(() => { refreshMarket() }, [refreshMarket])
  useEffect(() => {
    if (authUser) {
      refreshMine()
    } else {
      setMyListings([]); setOwnerBookings([]); setMyBookings([]); setStats(EMPTY_STATS)
      setWallet({ balance: 0, ledger: [] })
    }
  }, [authUser, refreshMine])

  const signUp = useCallback(async ({ name, email, password, remember = true, inviteCode }) => {
    try { const d = await api('/auth/signup', { method: 'POST', body: { name, email, password, remember, inviteCode } }); setAuthUser(d.user); return { ok: true, user: d.user } }
    catch (e) { return { ok: false, error: e.message } }
  }, [])

  const signIn = useCallback(async ({ email, password, remember = true }) => {
    try { const d = await api('/auth/login', { method: 'POST', body: { email, password, remember } }); setAuthUser(d.user); return { ok: true, user: d.user } }
    catch (e) { return { ok: false, error: e.message } }
  }, [])

  const signInWithProvider = useCallback(async (provider, payload = {}) => {
    if (provider !== 'google') return { ok: false, error: 'This sign-in method is not available yet.' }
    try { const d = await api('/auth/google', { method: 'POST', body: { credential: payload.credential } }); setAuthUser(d.user); return { ok: true, user: d.user } }
    catch (e) { return { ok: false, error: e.message } }
  }, [])

  const signOut = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST' }) } catch {}
    setAuthUser(null)
  }, [])

  // ---- region ----
  useEffect(() => {
    try { localStorage.setItem(COUNTRY_KEY, JSON.stringify(country)) } catch {}
  }, [country])

  useEffect(() => {
    if (country.chosen) return
    let alive = true
    detectCountry().then((c) => {
      if (alive) setCountryState({ code: c.code, name: c.name || countryName(c.code), chosen: false, detecting: false })
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setCountry = useCallback((code) => {
    setCountryState({ code, name: countryName(code), chosen: true, detecting: false })
  }, [])

  // ---- listings & bookings ----
  const resolveListing = useCallback((id) => {
    return marketListings.find((l) => l.id === id) || null
  }, [marketListings])

  const publishListing = useCallback(async (payload) => {
    try {
      const d = await api('/listings', { method: 'POST', body: payload })
      await Promise.all([refreshMine(), refreshMarket()])
      return { ok: true, listing: normListing(d.listing) }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  }, [refreshMine, refreshMarket])

  const createBooking = useCallback(async ({ listing, hours, price, hold = false }) => {
    const d = await api('/bookings', {
      method: 'POST',
      body: {
        listingRef: listing.id,
        provider: listing.provider,
        title: listing.title,
        hours,
        price,
        ownerId: listing.ownerId || null,
        hold
      }
    })
    const b = normBooking(d.booking)
    setMyBookings((prev) => [b, ...prev])
    setBookingCache((c) => ({ ...c, [b.id]: b }))
    if (hold) refreshWallet()
    return b
  }, [refreshWallet])

  const topUp = useCallback(async (amount) => {
    try {
      const d = await api('/wallet/topup', { method: 'POST', body: { amount } })
      setWallet({ balance: d.balance, ledger: d.ledger || [] })
      return { ok: true, balance: d.balance }
    } catch (e) { return { ok: false, error: e.message } }
  }, [])

  // ---- setup chat + lifecycle ----
  const patchBooking = useCallback((b) => {
    const patch = (list) => list.map((x) => (x.id === b.id ? b : x))
    setMyBookings(patch)
    setOwnerBookings(patch)
    setBookingCache((c) => ({ ...c, [b.id]: b }))
  }, [])

  const loadMessages = useCallback(async (id) => {
    const d = await api('/bookings/' + id + '/messages')
    const b = normBooking(d.booking)
    patchBooking(b)
    return { booking: b, messages: d.messages || [] }
  }, [patchBooking])

  const sendMessage = useCallback(async (id, body) => {
    const d = await api('/bookings/' + id + '/messages', { method: 'POST', body: { body } })
    return d.message
  }, [])

  const confirmSetup = useCallback(async (id) => {
    const d = await api('/bookings/' + id + '/confirm-setup', { method: 'POST' })
    const b = normBooking(d.booking)
    patchBooking(b)
    return b
  }, [patchBooking])

  const failSetup = useCallback(async (id) => {
    const d = await api('/bookings/' + id + '/fail-setup', { method: 'POST' })
    const b = normBooking(d.booking)
    patchBooking(b)
    refreshWallet()
    return b
  }, [patchBooking, refreshWallet])

  const getBooking = useCallback((id) =>
    myBookings.find((b) => b.id === id) ||
    ownerBookings.find((b) => b.id === id) ||
    bookingCache[id] || null,
  [myBookings, ownerBookings, bookingCache])

  // For deep links / reloads on booking pages: fetch a single booking if missing.
  const loadBooking = useCallback(async (id) => {
    try {
      const d = await api('/bookings/' + id)
      const b = normBooking(d.booking)
      setBookingCache((c) => ({ ...c, [b.id]: b }))
      return b
    } catch { return null }
  }, [])

  // Buyer reports the access isn't working → refund to Wallet, owner not paid.
  const reportProblem = useCallback(async (id, reason) => {
    const d = await api('/bookings/' + id + '/report', { method: 'POST', body: { reason } })
    const b = normBooking(d.booking)
    patchBooking(b)
    refreshWallet()
    return b
  }, [patchBooking, refreshWallet])

  const endBooking = useCallback(async (id) => {
    try {
      const d = await api('/bookings/' + id + '/end', { method: 'POST' })
      const b = normBooking(d.booking)
      const patch = (list) => list.map((x) => (x.id === b.id ? b : x))
      setMyBookings(patch)
      setOwnerBookings(patch)
      setBookingCache((c) => ({ ...c, [b.id]: b }))
      refreshWallet()
    } catch {}
  }, [refreshWallet])

  // Providers the current user has listed (drives "connected" UI, per-user).
  const connected = useMemo(
    () => [...new Set(myListings.map((l) => l.provider))],
    [myListings]
  )

  const value = {
    toasts,
    toast,
    country,
    countryCode: country.code,
    countryName: country.name,
    currencyCode: currencyForCountry(country.code),
    currencySymbol: currencyInfo(currencyForCountry(country.code)).symbol.trim(),
    setCountry,
    // marketplace + per-user data
    marketListings,
    myListings,
    ownerBookings,
    myBookings,
    stats,
    connected,
    resolveListing,
    publishListing,
    createBooking,
    getBooking,
    loadBooking,
    endBooking,
    reportProblem,
    expireBooking: endBooking, // alias used by access/provider screens
    liveStatus,
    // wallet
    wallet,
    walletBalance: wallet.balance,
    refreshWallet,
    topUp,
    // setup chat + lifecycle
    loadMessages,
    sendMessage,
    confirmSetup,
    failSetup,
    // auth
    authUser,
    authReady,
    isAuthed: !!authUser,
    signUp,
    signIn,
    signInWithProvider,
    signOut
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
