// Vercel serverless entry for the API.
//
// The filename `[...path].js` is a Vercel "catch-all" route: every request to
// /api/* is handed to this one function with the original URL preserved, so the
// Express app (whose routes are /api/auth/..., /api/wallet/..., etc.) matches as
// usual. The frontend is served separately by Vercel's CDN from /dist.
import app from '../server/app.js'

export default app
