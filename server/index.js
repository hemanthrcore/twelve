// Local server entry point. Starts the shared Express app on a port.
// (On Vercel the app is served by api/[...path].js instead — no listen() there.)
import app from './app.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dist = path.join(__dirname, '..', 'dist')
const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`\n  twelve API listening on http://localhost:${PORT}`)
  console.log(`  Database: ${process.env.DATABASE_URL ? 'configured' : 'NOT configured — set DATABASE_URL in .env'}`)
  console.log(`  Google sign-in: ${process.env.GOOGLE_CLIENT_ID ? 'configured' : 'NOT configured (email/password still works)'}`)
  if (fs.existsSync(dist)) console.log(`  Serving built app from /dist`)
  console.log('')
})
