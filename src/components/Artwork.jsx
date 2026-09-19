/* Original generated "cinematic" artwork — layered CSS gradients.
   Used in place of real copyrighted posters/artwork. */

export default function Artwork({ grad, seed = 0, children, className = '', style, image, radius }) {
  const [a, b, c] = grad || ['#1a1a1a', '#2a2a2a', '#0d0d0d']
  // deterministic-ish light positions from seed
  const lx = 20 + ((seed * 37) % 60)
  const ly = 10 + ((seed * 53) % 40)
  const angle = 120 + ((seed * 17) % 90)

  return (
    <div
      className={`artwork ${className}`}
      style={{
        background: `
          radial-gradient(90% 70% at ${lx}% ${ly}%, ${hex(b, 0.9)} 0%, transparent 60%),
          radial-gradient(120% 120% at 90% 110%, ${hex(c, 1)} 0%, transparent 70%),
          linear-gradient(${angle}deg, ${a} 0%, ${b} 55%, ${c} 100%)`,
        borderRadius: radius,
        ...style
      }}
    >
      {/* Optional real cover image (fills over the gradient; gradient shows if it fails to load) */}
      {image && (
        <img
          src={image}
          alt=""
          onError={(e) => { e.currentTarget.style.display = 'none' }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
        />
      )}
      {/* subtle streak / lens flare */}
      {!image && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(75deg, transparent 40%, ${hex(b, 0.35)} 50%, transparent 60%)`,
          mixBlendMode: 'screen', opacity: 0.5
        }} />
      )}
      <div className="noise" />
      {children}
    </div>
  )
}

// hex + alpha helper
function hex(h, a) {
  const c = h.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}
