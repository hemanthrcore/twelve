import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ListingCard from '../components/ListingCard'
import Icon from '../components/Icon'
import { RowSkeleton } from '../components/Skeleton'
import { Disclaimer, RowScroller } from '../components/UI'
import { LISTINGS } from '../data/listings'
import { providerList, CATEGORIES } from '../data/providers'
import { listingPricing, COUNTRY_LIST } from '../lib/pricing'
import { money } from '../lib/format'
import { useApp } from '../store/AppContext'

const DURATION_FILTERS = [
  { label: 'Any', hours: null },
  { label: '3 hours', hours: 3 }, { label: '6 hours', hours: 6 }, { label: '12 hours', hours: 12 }, { label: '24 hours', hours: 24 },
  { label: '3 days', hours: 72 }, { label: '7 days', hours: 168 }
]
// Thresholds are canonical USD; labels are rendered in the active display currency.
const PRICE_FILTERS = [
  { label: () => 'Any price', test: () => true },
  { label: (m) => `Under ${m(2)}`, test: (p) => p < 2 },
  { label: (m) => `${m(2)} – ${m(4)}`, test: (p) => p >= 2 && p <= 4 },
  { label: (m) => `${m(4)} – ${m(8)}`, test: (p) => p > 4 && p <= 8 },
  { label: (m) => `${m(8)}+`, test: (p) => p > 8 }
]

const HERO = {
  entertainment: { title: 'Watch more.', sub: 'Stream the world’s biggest catalogs — booked by the hour, revoked automatically.', grad: 'linear-gradient(180deg, rgba(229,9,20,0.1), transparent 60%)' },
  education: { title: 'Learn more.', sub: 'Access a course before your deadline. Certificates, projects and expert lessons.', grad: 'linear-gradient(180deg, rgba(41,151,255,0.1), transparent 60%)' },
  ai: { title: 'Build more.', sub: 'Rent premium AI models for a project sprint — pay only for the hours you need.', grad: 'linear-gradient(180deg, rgba(16,163,127,0.12), transparent 60%)' }
}

export default function Discover() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('cat')
  const cat = ['entertainment', 'education', 'ai'].includes(raw) ? raw : 'entertainment'
  const [loading, setLoading] = useState(true)

  const [provider, setProvider] = useState('all')
  const [durIdx, setDurIdx] = useState(0)
  const [priceIdx, setPriceIdx] = useState(0)
  const [availOnly, setAvailOnly] = useState(false)
  const [minRating, setMinRating] = useState(0)

  useEffect(() => {
    setLoading(true)
    setProvider('all')
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [cat])

  const { countryCode, countryName, currencyCode, setCountry, marketListings } = useApp()
  const setCat = (c) => setParams({ cat: c })
  const providers = providerList.filter((p) => p.category === cat)
  const hero = HERO[cat]

  // Real member-posted listings come first, then the starter demo catalog.
  const allListings = useMemo(() => [...marketListings, ...LISTINGS], [marketListings])

  const filtered = useMemo(() => {
    return allListings.filter((l) => l.category === cat)
      .filter((l) => provider === 'all' || l.provider === provider)
      .filter((l) => { const h = DURATION_FILTERS[durIdx].hours; return h === null || l.durations.some((d) => d.hours === h) })
      .filter((l) => PRICE_FILTERS[priceIdx].test(listingPricing(l, countryCode).price))
      .filter((l) => !availOnly || l.availability === 'Available now')
      .filter((l) => l.rating >= minRating)
  }, [allListings, cat, provider, durIdx, priceIdx, availOnly, minRating, countryCode])

  const member = filtered.filter((l) => l.source === 'user')
  const trending = filtered.filter((l) => l.trending)
  const popular = filtered.filter((l) => l.popular && l.source !== 'user')

  return (
    <div className="page">
      {/* Hero */}
      <section className="discover-hero" style={{ position: 'relative', paddingTop: 52, paddingBottom: 30, borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'absolute', inset: 0, background: hero.grad, pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative' }}>
          <div className="between wrap" style={{ gap: 14, alignItems: 'flex-start' }}>
            <div>
              <h1 className="display" style={{ fontSize: 'clamp(2.2rem,5vw,3.4rem)' }}>{hero.title}</h1>
              <p className="lead" style={{ marginTop: 12, maxWidth: 560 }}>{hero.sub}</p>
            </div>
            <div className="card pad" style={{ minWidth: 210 }}>
              <div className="row" style={{ gap: 7, marginBottom: 8 }}>
                <Icon name="globe" size={15} style={{ color: 'var(--accent)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 550 }}>Display currency</span>
              </div>
              <RegionPicker value={countryCode} onChange={setCountry} />
              <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: 8 }}>Auto-detected by IP. Prices are the same worldwide, shown here in {currencyCode} for {countryName}.</p>
            </div>
          </div>

          <div className="cat-tabs" style={{ marginTop: 28, flexWrap: 'wrap' }}>
            {CATEGORIES.map((c) => (
              <button key={c.id} className={`cat-tab ${cat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>
                <Icon name={c.icon} size={16} /> {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section style={{ position: 'sticky', top: 'var(--nav-h)', zIndex: 40, background: 'rgba(0,0,0,0.8)', backdropFilter: 'saturate(180%) blur(18px)', borderBottom: '1px solid var(--border)', padding: '13px 0' }}>
        <div className="container">
          <div className="row wrap" style={{ gap: 10, justifyContent: 'space-between' }}>
            <div className="row wrap" style={{ gap: 10 }}>
              <FilterSelect
                value={provider}
                onChange={setProvider}
                options={[{ value: 'all', label: 'All providers' }, ...providers.map((p) => ({ value: p.id, label: p.name }))]}
              />
              <FilterSelect
                value={durIdx}
                onChange={(value) => setDurIdx(+value)}
                options={DURATION_FILTERS.map((d, i) => ({ value: i, label: d.label === 'Any' ? 'Any duration' : d.label }))}
              />
              <FilterSelect
                value={priceIdx}
                onChange={(value) => setPriceIdx(+value)}
                options={PRICE_FILTERS.map((p, i) => ({ value: i, label: p.label(money) }))}
              />
              <FilterSelect
                value={minRating}
                onChange={(value) => setMinRating(+value)}
                options={[{ value: 0, label: 'Any rating' }, { value: 4.5, label: '4.5+ ★' }, { value: 4.7, label: '4.7+ ★' }, { value: 4.8, label: '4.8+ ★' }]}
              />
            </div>
            <button className={`fpill ${availOnly ? 'active' : ''}`} onClick={() => setAvailOnly((v) => !v)}>
              <span className="badge-live" style={{ display: 'inline-block', marginRight: 6 }} /> Available now
            </button>
          </div>
        </div>
      </section>

      {/* Provider quick pills */}
      <section className="section-tight" style={{ paddingBottom: 0 }}>
        <div className="container">
          <div className="filter-pills">
            <button className={`fpill ${provider === 'all' ? 'active' : ''}`} onClick={() => setProvider('all')}>All</button>
            {providers.map((p) => (
              <button key={p.id} className={`fpill ${provider === p.id ? 'active' : ''}`} onClick={() => setProvider(p.id)}>
                {p.name}{p.kind === 'demo' ? ' · demo' : ''}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Rows */}
      <section className="section-tight">
        <div className="container">
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-ico"><Icon name="search" size={26} className="text-secondary" /></div>
              <h3>No listings match your filters</h3>
              <p className="text-muted" style={{ marginTop: 8 }}>Try widening the price or duration range.</p>
              <button className="btn btn-outline" style={{ marginTop: 18 }} onClick={() => { setProvider('all'); setDurIdx(0); setPriceIdx(0); setAvailOnly(false); setMinRating(0) }}>Clear filters</button>
            </div>
          ) : (
            <>
              {member.length > 0 && (
                <Block title="New from members">
                  <div className="grid grid-4">
                    {member.map((l) => <ListingCard key={l.id} listing={l} width="" />)}
                  </div>
                </Block>
              )}
              {trending.length > 0 && (
                <Block title="Trending access">
                  <RowScroller>{trending.map((l) => <ListingCard key={l.id} listing={l} width="card-w-lg" large />)}</RowScroller>
                </Block>
              )}
              <Block title="Popular right now">
                <div className="grid grid-4">
                  {(popular.length ? popular : filtered.filter((l) => l.source !== 'user')).map((l) => <ListingCard key={l.id} listing={l} width="" />)}
                </div>
              </Block>
              <Disclaimer style={{ marginTop: 20 }} />
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function RegionPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const root = useRef(null)
  const selected = COUNTRY_LIST.find((country) => country.code === value) || COUNTRY_LIST[0]
  const matches = COUNTRY_LIST.filter((country) => country.name.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(() => {
    const close = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const choose = (code) => {
    onChange(code)
    setOpen(false)
    setQuery('')
  }

  return (
    <div className="region-picker" ref={root}>
      <button className={`region-trigger ${open ? 'open' : ''}`} type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((isOpen) => !isOpen)}>
        <span>{selected.name}</span>
        <Icon name="chevronDown" size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div className="region-menu" role="listbox" aria-label="Choose pricing region">
          <div className="region-search">
            <Icon name="search" size={15} className="text-muted" />
            <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === 'Escape' && setOpen(false)} placeholder="Search country" aria-label="Search countries" />
          </div>
          <div className="region-options">
            {matches.map((country) => (
              <button key={country.code} className={country.code === value ? 'selected' : ''} type="button" role="option" aria-selected={country.code === value} onClick={() => choose(country.code)}>
                <span>{country.name}</span>
                {country.code === value && <Icon name="check" size={15} />}
              </button>
            ))}
            {!matches.length && <p className="text-muted" style={{ margin: 0, padding: '14px 12px', fontSize: '0.82rem' }}>No matching country</p>}
          </div>
        </div>
      )}
    </div>
  )
}

function FilterSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const selected = options.find((option) => String(option.value) === String(value)) || options[0]

  useEffect(() => {
    const close = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const choose = (nextValue) => {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div className={`filter-select ${open ? 'open' : ''}`} ref={root}>
      <button className="filter-select-trigger" type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((isOpen) => !isOpen)}>
        <span>{selected.label}</span>
        <Icon name="chevronDown" size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div className="filter-select-menu" role="listbox">
          {options.map((option) => (
            <button key={String(option.value)} className={String(option.value) === String(value) ? 'selected' : ''} type="button" role="option" aria-selected={String(option.value) === String(value)} onClick={() => choose(option.value)}>
              <span>{option.label}</span>
              {String(option.value) === String(value) && <Icon name="check" size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Block({ title, children }) {
  return (
    <div style={{ marginBottom: 44 }}>
      <h2 className="h-section" style={{ fontSize: '1.5rem', marginBottom: 18 }}>{title}</h2>
      {children}
    </div>
  )
}

function SkeletonRow() {
  return (
    <div style={{ marginBottom: 44 }}>
      <div className="skel" style={{ height: 24, width: 220, marginBottom: 18 }} />
      <RowSkeleton count={4} width="card-w-lg" />
    </div>
  )
}
