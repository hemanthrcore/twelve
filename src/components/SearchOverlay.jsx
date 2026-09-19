import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'
import ProviderLogo from './ProviderLogo'
import Artwork from './Artwork'
import { LISTINGS } from '../data/listings'
import { SEARCH_INDEX } from '../data/content'
import { getProvider } from '../data/providers'
import { inr } from '../lib/format'

const SUGGESTIONS = ['Netflix', 'Prime Video', 'Python', 'UI/UX', 'Data Science', 'Movies', 'Courses']

export default function SearchOverlay({ onClose }) {
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    inputRef.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return { listings: [], content: [] }
    const listings = LISTINGS.filter((l) =>
      l.title.toLowerCase().includes(s) ||
      getProvider(l.provider).name.toLowerCase().includes(s) ||
      l.category.includes(s)
    ).slice(0, 5)
    const content = SEARCH_INDEX.filter((c) =>
      c.title.toLowerCase().includes(s) ||
      (c.genres && c.genres.join(' ').toLowerCase().includes(s)) ||
      c.kind.includes(s)
    ).slice(0, 4)
    return { listings, content }
  }, [q])

  const go = (path) => { onClose(); navigate(path) }
  const hasResults = results.listings.length || results.content.length

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="search-panel" onClick={(e) => e.stopPropagation()}>
        <div className="search-box">
          <Icon name="search" size={22} className="text-muted" />
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search movies, courses, platforms…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results.listings[0]) go(`/listing/${results.listings[0].id}`)
            }}
          />
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Esc</button>
        </div>

        {!q && (
          <>
            <p className="eyebrow" style={{ marginTop: 22, marginBottom: 10, paddingLeft: 4 }}>Try searching</p>
            <div className="search-suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="fpill" onClick={() => setQ(s)}>{s}</button>
              ))}
            </div>
          </>
        )}

        {q && !hasResults && (
          <div className="search-results">
            <div className="empty" style={{ padding: '40px 20px' }}>
              <div className="empty-ico"><Icon name="search" size={26} className="text-secondary" /></div>
              <p style={{ fontWeight: 600 }}>No matches for “{q}”</p>
              <p className="text-muted" style={{ fontSize: '0.88rem', marginTop: 4 }}>Try “Netflix”, “Python”, or “Courses”.</p>
            </div>
          </div>
        )}

        {hasResults && (
          <div className="search-results">
            {results.listings.map((l) => {
              const p = getProvider(l.provider)
              return (
                <div className="sresult" key={l.id} onClick={() => go(`/listing/${l.id}`)}>
                  <Artwork grad={p.gradient} seed={5} style={{ width: 58, height: 40, borderRadius: 8, flex: 'none' }} />
                  <div className="grow">
                    <div className="row" style={{ gap: 8 }}>
                      <span style={{ fontWeight: 650 }}>{l.title}</span>
                      <span className="pill" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>{l.category}</span>
                    </div>
                    <p className="text-muted" style={{ fontSize: '0.8rem' }}>{l.subtitle}</p>
                  </div>
                  <span className="price">{inr(l.price)}</span>
                  <Icon name="chevronRight" size={18} className="text-muted" />
                </div>
              )
            })}
            {results.content.map((c) => (
              <div className="sresult" key={c.id} onClick={() => go('/discover?cat=' + c.kind)}>
                <Artwork grad={c.grad} seed={c.id.length} style={{ width: 58, height: 40, borderRadius: 8, flex: 'none' }} />
                <div className="grow">
                  <span style={{ fontWeight: 650 }}>{c.title}</span>
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                    {c.kind === 'education' ? 'Course' : (c.tag || 'Title')} · {c.kind}
                  </p>
                </div>
                <Icon name="chevronRight" size={18} className="text-muted" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
