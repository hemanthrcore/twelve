import { useEffect, useRef } from 'react'
import { useNow } from '../lib/time'
import { breakdown } from '../lib/time'
import { pad } from '../lib/format'

/* Animated progress ring wrapping a live countdown. */
export default function CountdownRing({ startAt, expiresAt, size = 260, stroke = 10, onExpire }) {
  const now = useNow(1000)
  const total = expiresAt - startAt
  const left = Math.max(0, expiresAt - now)
  const pct = total > 0 ? Math.min(1, Math.max(0, left / total)) : 0
  const { h, m, s } = breakdown(left)

  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)

  // Fire onExpire exactly once, as an effect — never during render (which would
  // dispatch the callback's state update / API call on every tick after expiry).
  const firedRef = useRef(false)
  useEffect(() => {
    if (left <= 0 && !firedRef.current) {
      firedRef.current = true
      onExpire?.()
    }
  }, [left, onExpire])

  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg className="ring-svg" width={size} height={size}>
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2997ff" />
            <stop offset="50%" stopColor="#0a84ff" />
            <stop offset="100%" stopColor="#0071e3" />
          </linearGradient>
        </defs>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="ring-progress"
          cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div className="countdown-num mono" style={{ fontSize: size * 0.15 }}>
          {pad(h)}:{pad(m)}:{pad(s)}
        </div>
        <div className="text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 6 }}>
          {left > 0 ? 'Remaining' : 'Expired'}
        </div>
      </div>
    </div>
  )
}
