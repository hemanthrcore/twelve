import { useState } from 'react'
import { getProvider } from '../data/providers'
import { getBrandLogo } from '../data/brandAssets'

/* Renders a provider logo. By default this is an ORIGINAL brand-tinted
   wordmark (a stylized text treatment, not a copy of any official logo).
   If you add an official file and map it in data/brandAssets.js, that
   image is used instead — with the wordmark as an automatic fallback. */
export default function ProviderLogo({ id, size = 1, onArt = false }) {
  const p = getProvider(id)
  const [sourceIndex, setSourceIndex] = useState(0)
  if (!p) return null
  const w = p.wordmark
  const base = 15 * size * (w.size || 1)
  const shadow = onArt ? '0 1px 12px rgba(0,0,0,0.6)' : 'none'

  // Official SVG mark, with a second live company-mark source as fallback.
  const sources = getBrandLogo(id)
  const logoSources = Array.isArray(sources) ? sources : sources ? [sources] : []
  const src = logoSources[sourceIndex]
  if (src) {
    return (
      <img
        src={src}
        alt={`${p.name} logo`}
        onError={() => setSourceIndex((index) => index + 1)}
        style={{ height: base * 1.5, width: 'auto', maxWidth: 160, objectFit: 'contain', display: 'block', filter: onArt ? 'drop-shadow(0 1px 10px rgba(0,0,0,0.55))' : 'none' }}
      />
    )
  }

  if (w.badge) {
    // LinkedIn Learning style: "in" badge + label
    return (
      <span className="pw" style={{ gap: 7, textShadow: shadow }}>
        <span style={{
          background: w.accent, color: '#fff', fontWeight: 900,
          fontSize: base * 0.9, lineHeight: 1, padding: '3px 5px', borderRadius: 4, letterSpacing: '-0.04em'
        }}>in</span>
        <span style={{ color: onArt ? '#fff' : w.color, fontWeight: 700, fontSize: base * 0.86 }}>{w.label}</span>
      </span>
    )
  }

  return (
    <span
      className="pw"
      style={{
        fontSize: base,
        fontWeight: w.weight,
        letterSpacing: w.spacing,
        color: onArt ? '#fff' : (w.color || '#fff'),
        textShadow: shadow,
        fontStyle: w.italic ? 'italic' : 'normal'
      }}
    >
      {w.accent && !onArt ? <Accented text={w.text} color={w.color} accent={w.accent} /> : w.text}
    </span>
  )
}

// Give the first letter an accent color for a touch of brand identity
function Accented({ text, color, accent }) {
  return (
    <>
      <span style={{ color: accent }}>{text[0]}</span>
      <span style={{ color }}>{text.slice(1)}</span>
    </>
  )
}
