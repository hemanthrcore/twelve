import { Link } from 'react-router-dom'

/* twelve — original lowercase wordmark with a small "tw" monogram tag,
   echoing the brand's black-bar identity, rendered white on black. */
export function LogoMark({ size = 26 }) {
  return (
    <span
      className="logo-mark"
      style={{
        display: 'inline-grid', placeItems: 'center',
        width: size, height: size, borderRadius: 7,
        background: '#f5f5f7', color: '#000',
        fontWeight: 700, fontSize: size * 0.46, letterSpacing: '-0.04em', flex: 'none'
      }}
      aria-hidden="true"
    >
      tw
    </span>
  )
}

export default function Logo({ mark = false, to = '/' }) {
  return (
    <Link to={to} className="logo" aria-label="twelve home">
      {mark && <LogoMark />}
      <span className="logo-text">twelve</span>
    </Link>
  )
}
