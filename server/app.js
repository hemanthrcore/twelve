// The Express app, with no server started here. `index.js` starts it for local
// use (`npm start` / `npm run dev`); `api/[...path].js` exports it as a Vercel
// serverless function. Keeping the app in one place means both run identical code.
import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { ensureSchema } from './db.js'
import authRouter, { authOptional } from './auth.js'
import marketRouter from './market.js'
import walletRouter from './wallet.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

const app = express()
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

// Make sure the Postgres tables exist before any request touches the database.
// Runs the (idempotent) schema once per process; near-instant thereafter.
app.use(async (_req, res, next) => {
  try {
    await ensureSchema()
    next()
  } catch (e) {
    console.error('schema init failed', e)
    res.status(503).json({ error: 'Database is not ready. Please try again shortly.' })
  }
})

app.use(authOptional) // makes req.user available to every route

// --- API ---------------------------------------------------------------
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }))
app.use('/api/auth', authRouter)
app.use('/api/wallet', walletRouter)
app.use('/api', marketRouter)

// --- Static app (local production / `npm start`) -----------------------
// On Vercel the built frontend is served by its CDN, so this block is only used
// when running the server yourself after `npm run build`.
const dist = path.join(ROOT, 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
} else {
  app.get('/', (_req, res) =>
    res.send('API is running. In development, open the Vite app at http://localhost:5173')
  )
}

export default app
