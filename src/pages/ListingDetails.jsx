import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Artwork from '../components/Artwork'
import ProviderLogo from '../components/ProviderLogo'
import Icon from '../components/Icon'
import { TrustCards, Disclaimer, DemoTag } from '../components/UI'
import { getListing } from '../data/listings'
import { getProvider } from '../data/providers'
import { inr, splitFee, durationLabel } from '../lib/format'
import { listingPricing } from '../lib/pricing'
import { useApp } from '../store/AppContext'

export default function ListingDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { countryCode, countryName, currencyCode, resolveListing, createBooking, walletBalance, isAuthed, authUser, toast } = useApp()
  const listing = getListing(id) || resolveListing(id)
  const [selHours, setSelHours] = useState(listing?.defaultHours || 24)
  const [booking, setBooking] = useState(false)

  if (!listing) return <NotFound />
  const p = getProvider(listing.provider)
  const seed = listing.id.length + listing.price
  const pricing = listingPricing(listing, countryCode)
  // A buyer can book the listed duration or any shorter step — never more.
  const maxHours = listing.defaultHours || 24
  const offered = pricing.durations.filter((d) => d.hours <= maxHours)
  const selected = offered.find((d) => d.hours === selHours) || offered[offered.length - 1]
  const canAfford = walletBalance >= selected.price
  // You cannot book your own listing.
  const isOwn = !!(authUser && listing.ownerId && listing.ownerId === authUser.id)

  const bookNow = async () => {
    if (isOwn) { toast('You can’t book your own listing.', 'error'); return }
    if (!isAuthed) { navigate('/login', { state: { from: `/listing/${listing.id}` } }); return }
    if (!canAfford) { toast('Not enough Wallet balance — add money first.', 'error'); navigate('/wallet'); return }
    setBooking(true)
    try {
      const b = await createBooking({ listing, hours: selected.hours, price: selected.price, hold: true })
      toast('Payment held · setup started', 'success')
      navigate(`/setup/${b.id}`)
    } catch (e) {
      toast(e.message || 'Could not start booking.', 'error')
      setBooking(false)
    }
  }

  return (
    <div className="page" style={{ paddingTop: 0 }}>
      {/* Cinematic backdrop */}
      <section style={{ position: 'relative', minHeight: '58vh', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
        <Artwork grad={p.gradient} seed={seed} style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #050505 6%, rgba(5,5,5,0.4) 55%, rgba(5,5,5,0.6) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(5,5,5,0.85), transparent 65%)' }} />

        <div className="container" style={{ position: 'relative', zIndex: 2, paddingTop: 'calc(var(--nav-h) + 40px)', paddingBottom: 40 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 24 }}>
            <Icon name="chevronRight" size={16} style={{ transform: 'rotate(180deg)' }} /> Back
          </button>
          <div style={{ marginBottom: 16 }}><ProviderLogo id={p.id} size={1.5} onArt /></div>
          <div className="row wrap" style={{ gap: 10, marginBottom: 14 }}>
            <span className="pill pill-accent">{listing.category === 'entertainment' ? 'Entertainment' : listing.category === 'education' ? 'Education' : 'AI Models'}</span>
            {p.kind === 'demo' && <DemoTag>Demo provider</DemoTag>}
          </div>
          <h1 className="display" style={{ fontSize: 'clamp(2.2rem, 6vw, 4rem)' }}>{listing.title}</h1>
          <p className="text-secondary" style={{ fontSize: '1.15rem', marginTop: 12 }}>{listing.subtitle}</p>

          <div className="row wrap" style={{ gap: 20, marginTop: 20 }}>
            <span className="rating" style={{ fontSize: '1rem' }}><Icon name="star" size={16} className="star" /> {listing.rating}</span>
            <span className="text-secondary row" style={{ gap: 6 }}><Icon name="verified" size={16} style={{ color: '#a5b4fc' }} /> Verified owner · {listing.owner}</span>
            <span className="text-secondary">{listing.bookings} previous bookings</span>
            <span className="pill pill-green"><span className="badge-live" /> {listing.availability}</span>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="section-tight">
        <div className="container">
          <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: 40, alignItems: 'start' }}>
            {/* Left */}
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 12 }}>About this access</h3>
              <p className="text-secondary" style={{ fontSize: '1rem', lineHeight: 1.7 }}>{listing.description}</p>

              <div className="row wrap" style={{ gap: 10, marginTop: 20 }}>
                <span className="pill">{listing.quality}</span>
                <span className="pill"><Icon name="star" size={12} className="star" /> {listing.rating} ({listing.reviews} reviews)</span>
                <span className="pill">Owner: {listing.owner}</span>
              </div>

              {/* Trust */}
              <div style={{ marginTop: 36 }}>
                <div className="card pad" style={{ marginBottom: 18, background: 'linear-gradient(135deg, rgba(41,151,255,0.08), rgba(0,113,227,0.05))', borderColor: 'rgba(41,151,255,0.2)' }}>
                  <h3 style={{ fontSize: '1.05rem' }}>No passwords. No OTPs.</h3>
                  <p className="text-secondary" style={{ fontSize: '0.9rem', marginTop: 6 }}>twelve is designed around temporary authorized access. Provider authorization is simulated in this MVP.</p>
                </div>
                <TrustCards />
              </div>

              <Disclaimer style={{ marginTop: 28 }} />
            </div>

            {/* Right — booking */}
            <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 20px)' }}>
              <div className="card-elevated pad-lg">
                <h3 style={{ fontSize: '1.15rem', marginBottom: 4 }}>Choose your duration</h3>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 14 }}>Access starts immediately and expires automatically.</p>
                <div className="row" style={{ gap: 7, marginBottom: 16, padding: '9px 12px', borderRadius: 10, background: 'var(--accent-soft)', border: '1px solid rgba(41,151,255,0.2)' }}>
                  <Icon name="globe" size={14} style={{ color: 'var(--accent)', flex: 'none' }} />
                  <span style={{ fontSize: '0.78rem', color: '#7ab8ff' }}>This listing offers up to {durationLabel(maxHours)} — book that or less. Prices from the India plan, shown in {currencyCode}.</span>
                </div>

                <div className="col" style={{ gap: 10 }}>
                  {offered.map((d) => (
                    <div
                      key={d.hours}
                      className={`dur-option ${selected.hours === d.hours ? 'selected' : ''}`}
                      onClick={() => setSelHours(d.hours)}
                    >
                      <div className="row" style={{ gap: 12 }}>
                        <span className="dur-radio" />
                        <span style={{ fontWeight: 600 }}>{d.label}</span>
                      </div>
                      <span className="price" style={{ fontSize: '1.05rem' }}>{inr(d.price)}</span>
                    </div>
                  ))}
                </div>

                <div className="between" style={{ margin: '20px 0', padding: '14px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                  <span className="text-secondary">Total</span>
                  <span className="price" style={{ fontSize: '1.5rem' }}>{inr(selected.price)}</span>
                </div>

                {isOwn ? (
                  <>
                    <div className="row" style={{ gap: 8, marginBottom: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.28)' }}>
                      <Icon name="user" size={15} style={{ color: 'var(--amber)', flex: 'none' }} />
                      <span style={{ fontSize: '0.82rem' }}>This is your listing — you can’t book your own access. This is what buyers pay.</span>
                    </div>
                    <button className="btn btn-white btn-lg btn-block" onClick={() => navigate('/dashboard')}>
                      Manage on Dashboard <Icon name="arrowRight" size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    {isAuthed && (
                      <div className="between" style={{ marginBottom: 12, fontSize: '0.82rem' }}>
                        <span className="text-muted row" style={{ gap: 6 }}><Icon name="wallet" size={14} /> Wallet balance</span>
                        <span className="row" style={{ gap: 8, color: canAfford ? 'var(--text-secondary)' : 'var(--amber)' }}>
                          {inr(walletBalance)}
                          {!canAfford && <button className="link-accent" onClick={() => navigate('/wallet')}>Add money</button>}
                        </span>
                      </div>
                    )}

                    <button className="btn btn-accent btn-lg btn-block" onClick={bookNow} disabled={booking}>
                      {booking ? 'Starting…' : <>Book Now · hold {inr(selected.price)}</>}
                    </button>
                    <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => navigate(`/checkout/${listing.id}?h=${selected.hours}`)}>
                      Pay another way
                    </button>
                  </>
                )}
                <p className="text-muted center" style={{ fontSize: '0.78rem', marginTop: 12, gap: 6 }}>
                  <Icon name="lock" size={13} /> Held in your Wallet · 10-min setup · auto-refund if it fails
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="page center" style={{ minHeight: '70vh' }}>
      <div className="empty">
        <div className="empty-ico"><Icon name="search" size={26} className="text-secondary" /></div>
        <h3>Listing not found</h3>
        <button className="btn btn-white" style={{ marginTop: 18 }} onClick={() => navigate('/discover')}>Back to Discover</button>
      </div>
    </div>
  )
}
