// Real authentication: bcrypt-hashed passwords, JWT session in an httpOnly
// cookie, and Google Sign-In verification. All account data lives in Postgres.
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import { get, run, getJwtSecret, WALLET_SEED } from './db.js'

const router = express.Router()
const JWT_SECRET = getJwtSecret()
const COOKIE = 'twelve_session'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null

// Invite-only signup: when SIGNUP_CODE is set, creating an account (email OR a
// brand-new Google account) requires the caller to supply this exact code.
// Leave it unset to allow open signups (e.g. local development). Change it any
// time in the host's env vars — no redeploy needed.
const SIGNUP_CODE = (process.env.SIGNUP_CODE || '').trim()
function checkInviteCode(req) {
  if (!SIGNUP_CODE) return true // gate disabled
  return String(req.body?.inviteCode || '').trim() === SIGNUP_CODE
}
const CODE_ERROR = 'Invalid access code. Please enter the twelve access code you were given.'

// ---- helpers -----------------------------------------------------------
const now = () => Date.now()

// Never leak password_hash to the client.
function publicUser(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    provider: row.provider,
    avatar: row.avatar || null,
    walletBalance: Math.round((row.wallet_balance || 0) * 100) / 100,
    createdAt: row.created_at
  }
}

function issueSession(res, user, remember) {
  const maxAgeDays = remember ? 30 : 1
  const token = jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: `${maxAgeDays}d` })
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true', // set true when serving over HTTPS
    path: '/',
    // "remember me" → persistent cookie; otherwise a session cookie (cleared on browser close)
    ...(remember ? { maxAge: maxAgeDays * 24 * 60 * 60 * 1000 } : {})
  })
}

function clearSession(res) {
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: 'lax', path: '/' })
}

const getUserById = (id) => get('SELECT * FROM users WHERE id = $1', [id])
const getUserByEmail = (email) => get('SELECT * FROM users WHERE lower(email) = lower($1)', [email])
async function insertUser({ name, email, password_hash, provider, avatar, wallet_balance, created_at, last_login_at }) {
  const { rows } = await run(
    `INSERT INTO users (name, email, password_hash, provider, avatar, wallet_balance, created_at, last_login_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [name, email, password_hash, provider, avatar, wallet_balance, created_at, last_login_at]
  )
  return rows[0]
}
const touchLogin = (id) => run('UPDATE users SET last_login_at = $1 WHERE id = $2', [now(), id])

// Attach req.user when a valid session cookie is present.
export async function authOptional(req, _res, next) {
  const token = req.cookies?.[COOKIE]
  if (token) {
    try {
      const { uid } = jwt.verify(token, JWT_SECRET)
      req.user = (await getUserById(uid)) || null
    } catch { req.user = null }
  }
  next()
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' })
  next()
}

// ---- routes ------------------------------------------------------------

// POST /api/auth/signup  { name, email, password, remember }
router.post('/signup', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim()
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')
    const remember = req.body?.remember !== false

    if (name.length < 2) return res.status(400).json({ error: 'Please enter your name.' })
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' })
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' })
    if (!checkInviteCode(req)) return res.status(403).json({ error: CODE_ERROR })
    if (await getUserByEmail(email)) return res.status(409).json({ error: 'An account with this email already exists.' })

    const password_hash = await bcrypt.hash(password, 12)
    const t = now()
    const user = await insertUser({ name, email, password_hash, provider: 'email', avatar: null, wallet_balance: WALLET_SEED, created_at: t, last_login_at: t })

    issueSession(res, user, remember)
    res.json({ user: publicUser(user) })
  } catch (e) {
    console.error('signup error', e)
    res.status(500).json({ error: 'Could not create account. Please try again.' })
  }
})

// POST /api/auth/login  { email, password, remember }
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')
    const remember = req.body?.remember !== false

    const user = await getUserByEmail(email)
    // Same generic message whether the email or password is wrong (avoid leaking which).
    if (!user || !user.password_hash) {
      if (user && !user.password_hash) {
        return res.status(400).json({ error: 'This email is registered with Google. Use “Continue with Google”.' })
      }
      return res.status(401).json({ error: 'Incorrect email or password.' })
    }
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'Incorrect email or password.' })

    await touchLogin(user.id)
    issueSession(res, user, remember)
    res.json({ user: publicUser(user) })
  } catch (e) {
    console.error('login error', e)
    res.status(500).json({ error: 'Could not sign in. Please try again.' })
  }
})

// POST /api/auth/google  { credential }  (Google Identity Services ID token)
router.post('/google', async (req, res) => {
  try {
    if (!googleClient) {
      return res.status(501).json({ error: 'Google sign-in is not configured on the server.' })
    }
    const credential = String(req.body?.credential || '')
    if (!credential) return res.status(400).json({ error: 'Missing Google credential.' })

    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID })
    const payload = ticket.getPayload()
    if (!payload?.email || !payload.email_verified) {
      return res.status(401).json({ error: 'Google account email is not verified.' })
    }
    const email = payload.email.toLowerCase()
    const name = payload.name || payload.given_name || email.split('@')[0]
    const avatar = payload.picture || null

    let user = await getUserByEmail(email)
    if (!user) {
      // Creating a NEW account via Google is also invite-gated.
      if (!checkInviteCode(req)) return res.status(403).json({ error: CODE_ERROR })
      const t = now()
      user = await insertUser({ name, email, password_hash: null, provider: 'google', avatar, wallet_balance: WALLET_SEED, created_at: t, last_login_at: t })
    } else {
      await touchLogin(user.id)
    }

    issueSession(res, user, true)
    res.json({ user: publicUser(user) })
  } catch (e) {
    console.error('google auth error', e)
    res.status(401).json({ error: 'Google sign-in failed. Please try again.' })
  }
})

// GET /api/auth/me  → current user (or null)
router.get('/me', (req, res) => {
  res.json({ user: publicUser(req.user) })
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  clearSession(res)
  res.json({ ok: true })
})

export default router
