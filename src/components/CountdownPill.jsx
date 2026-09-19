import { useNow, breakdown } from '../lib/time'
import { pad } from '../lib/format'

// Compact inline countdown "23:21:45"
export default function CountdownPill({ expiresAt, className = '' }) {
  const now = useNow(1000)
  const left = Math.max(0, expiresAt - now)
  const { h, m, s } = breakdown(left)
  return (
    <span className={`mono ${className}`}>
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  )
}
