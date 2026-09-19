// Per-user avatar identity — a deterministic color derived from a stable seed
// (the user's id, else email/name), so every user gets their own distinct color.

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'U'
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
}

// FNV-1a hash — avalanches well, so even seeds that differ by one character
// (e.g. sequential user ids "1", "2", "3") produce very different values.
function hashSeed(seed) {
  const s = (seed === 0 || seed) ? String(seed) : 'twelve'
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// A stable hue (0–359). The golden-angle mapping (frac(hash × φ⁻¹)) is a
// low-discrepancy sequence, so distinct users land far apart on the color wheel
// instead of clustering — even when their ids are consecutive integers.
function hueFromSeed(seed = '') {
  const frac = (hashSeed(seed) * 0.6180339887498949) % 1
  return Math.round(frac * 360)
}

// A premium two-stop gradient unique to the seed, for use as an avatar background.
export function avatarGradient(seed = '') {
  const h = hueFromSeed(seed)
  const h2 = (h + 36) % 360
  return `linear-gradient(135deg, hsl(${h} 72% 58%), hsl(${h2} 66% 44%))`
}

// Convenience: pick the most stable seed available on a user object.
export const userSeed = (user) => (user && (user.id ?? user.email ?? user.name)) || 'twelve'
