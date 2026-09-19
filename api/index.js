// Vercel serverless entry for the API.
//
// vercel.json rewrites every /api/* request to this function while preserving
// the original URL, so the Express app (whose routes are /api/auth/..., etc.)
// matches as usual. The frontend is served separately by Vercel's CDN from /dist.
import app from '../server/app.js'

export default app
