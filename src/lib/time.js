import { useEffect, useState } from 'react'

// A ticking "now" hook — re-renders every `interval` ms.
export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [interval])
  return now
}

export function remaining(expiresAt, now = Date.now()) {
  return Math.max(0, expiresAt - now)
}

export function breakdown(ms) {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return { h, m, s, total }
}
