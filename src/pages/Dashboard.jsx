import { useNavigate } from 'react-router-dom'
import Artwork from '../components/Artwork'
import ProviderLogo from '../components/ProviderLogo'
import Icon from '../components/Icon'
import CountdownPill from '../components/CountdownPill'
import { SectionHead } from '../components/UI'
import { getProvider, providerList } from '../data/providers'
import { inr, durationLabel } from '../lib/format'
import { listingPricing } from '../lib/pricing'
import { avatarGradient, userSeed } from '../lib/avatar'
import { useApp } from '../store/AppContext'

export default function Dashboard() {
  const navigate = useNavigate()
  const { authUser, stats, myListings, connected, ownerBookings, liveStatus, countryCode, walletBalance } = useApp()

  const name = authUser?.name || 'there'
  const active = ownerBookings.filter((b) => liveStatus(b) === 'active')
  const setupRequests = ownerBookings.filter((b) => liveStatus(b) === 'held')
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const STATS = [
    { label: 'Total earnings', value: inr(stats.earnings), trend: 'Your owner share (40%)', color: 'var(--green)', icon: 'wallet' },
    { label: 'Active listings', value: myListings.length, trend: myListings.length ? 'Published' : 'None yet', color: 'var(--accent)', icon: 'grid' },
    { label: 'Bookings', value: stats.bookingsCount, trend: 'On your listings', color: 'var(--accent)', icon: 'ticket' },
    { label: 'Utilization', value: stats.utilization + '%', trend: active.length ? `${active.length} live now` : 'Idle', color: 'var(--green)', icon: 'trend' }
  ]

  // provider gradients for the cover mosaic
  const coverProviders = (connected.length ? connected : ['netflix', 'max', 'disney', 'coursera', 'chatgpt'])
    .map((id) => getProvider(id)).filter(Boolean)

  return (
    <div className="page">
      {/* ===================== COVER BANNER ===================== */}
      <section style={{ paddingTop: 20 }}>
        <div className="container">
          <div style={{ position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            {/* mosaic */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
              {coverProviders.concat(providerList.slice(0, 6)).slice(0, 7).map((p, i) => (
                <Artwork key={i} grad={p.gradient} seed={i * 5 + 2} style={{ flex: 1 }} />
              ))}
            </div>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #000 8%, rgba(0,0,0,0.72) 45%, rgba(0,0,0,0.5) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000 2%, transparent 60%)' }} />

            <div style={{ position: 'relative', padding: 'clamp(28px, 5vw, 48px)', minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div className="between wrap" style={{ gap: 18, alignItems: 'flex-end' }}>
                <div className="row" style={{ gap: 18 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 16, background: avatarGradient(userSeed(authUser)), display: 'grid', placeItems: 'center', fontSize: '1.6rem', fontWeight: 700, color: '#fff', flex: 'none', boxShadow: 'var(--shadow-elevated)' }}>
                    {name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="eyebrow" style={{ marginBottom: 6 }}>Owner dashboard</p>
                    <h1 style={{ fontSize: 'clamp(1.7rem,3.4vw,2.6rem)' }}>{greeting}, {name}</h1>
                    <p className="text-secondary" style={{ marginTop: 6 }}>Manage your unused subscription capacity.</p>
                  </div>
                </div>
                <div className="row" style={{ gap: 10 }}>
                  <button className="btn btn-outline" onClick={() => navigate('/wallet')}><Icon name="wallet" size={16} /> {inr(walletBalance)}</button>
                  <button className="btn btn-white" onClick={() => navigate('/connect')}><Icon name="plus" size={16} /> Connect subscription</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-tight" style={{ paddingTop: 28 }}>
        <div className="container">
          {/* Stats */}
          <div className="grid grid-4" style={{ marginBottom: 34 }}>
            {STATS.map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="between">
                  <span className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 500 }}>{s.label}</span>
                  <span style={{ color: s.color }}><Icon name={s.icon} size={18} /></span>
                </div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-trend" style={{ color: s.color, marginTop: 6 }}>{s.trend}</div>
              </div>
            ))}
          </div>

          {/* Setup requests — buyers waiting for you to authorize access */}
          {setupRequests.length > 0 && (
            <div style={{ marginBottom: 34 }}>
              <SectionHead title="Setup requests" sub="Buyers are waiting — authorize access within the 10-minute window or the booking auto-refunds." />
              <div className="grid grid-2">
                {setupRequests.map((b) => {
                  const p = getProvider(b.provider)
                  return (
                    <div className="card pad row" key={b.id} style={{ gap: 14, borderColor: 'rgba(255,159,10,0.3)' }}>
                      <Artwork grad={p?.gradient} seed={4} style={{ width: 66, height: 66, borderRadius: 12, flex: 'none' }} />
                      <div className="grow">
                        <div className="between">
                          <h4 style={{ fontSize: '1.02rem' }}>{b.title}</h4>
                          <span className="pill pill-amber">Setup</span>
                        </div>
                        <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: 4 }}>{b.seeker} · {durationLabel(b.hours)} · earns {inr(b.ownerEarning)}</p>
                        <button className="btn btn-accent btn-sm" style={{ marginTop: 10 }} onClick={() => navigate(`/setup/${b.id}`)}>Open setup chat</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Active bookings */}
          {active.length > 0 && (
            <div style={{ marginBottom: 34 }}>
              <SectionHead title="Live right now" sub="Seekers currently accessing your listings." />
              <div className="grid grid-2">
                {active.map((b) => {
                  const p = getProvider(b.provider)
                  return (
                    <div className="card pad row" key={b.id} style={{ gap: 14 }}>
                      <Artwork grad={p?.gradient} seed={5} style={{ width: 66, height: 66, borderRadius: 12, flex: 'none' }} />
                      <div className="grow">
                        <div className="between">
                          <h4 style={{ fontSize: '1.02rem' }}>{b.title}</h4>
                          <span className="pill pill-green"><span className="badge-live" /> Active</span>
                        </div>
                        <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: 4 }}>{b.seeker} · {durationLabel(b.hours)} · earns {inr(b.ownerEarning)}</p>
                        <div className="between" style={{ marginTop: 8 }}>
                          <div className="row" style={{ gap: 6, fontSize: '0.85rem' }}>
                            <Icon name="clock" size={14} className="text-muted" />
                            <CountdownPill expiresAt={b.expiresAt} className="mono" /> <span className="text-muted">left</span>
                          </div>
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/access/${b.id}`)}>View</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* My listings */}
          <SectionHead
            title="Your listings"
            action={<button className="btn btn-outline btn-sm" onClick={() => navigate('/create-listing')}><Icon name="plus" size={15} /> New listing</button>}
          />
          <div className="grid grid-3">
            {myListings.map((l) => {
              const p = getProvider(l.provider)
              if (!p) return null
              const price = listingPricing(l, countryCode).price
              return (
                <div className="listing-card" key={l.id} onClick={() => navigate(`/listing/${l.id}`)}>
                  <div className="art-wrap">
                    <Artwork grad={p.gradient} seed={l.rating * 10}>
                      <div className="art-cover-logo"><ProviderLogo id={p.id} size={1.8} onArt /></div>
                    </Artwork>
                    <span className="pill pill-green" style={{ position: 'absolute', right: 12, top: 12, fontSize: '0.68rem', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}><span className="badge-live" /> Published</span>
                  </div>
                  <div className="card-body">
                    <div className="between">
                      <h4 style={{ fontSize: '1rem' }}>{l.title}</h4>
                      <span className="price">{inr(price)}</span>
                    </div>
                    <div className="between" style={{ marginTop: 8 }}>
                      <span className="text-muted row" style={{ fontSize: '0.8rem', gap: 4 }}>{l.bookings} bookings · <Icon name="star" size={11} className="star" /> {l.rating}</span>
                      <span className="link-accent" style={{ fontSize: '0.82rem' }}>Manage</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {/* Add card */}
            <button className="card center clickable" style={{ minHeight: 240, flexDirection: 'column', gap: 12, borderStyle: 'dashed' }} onClick={() => navigate('/connect')}>
              <div className="trust-ico" style={{ margin: 0 }}><Icon name="plus" size={22} /></div>
              <span style={{ fontWeight: 600 }}>Connect a subscription</span>
              <span className="text-muted" style={{ fontSize: '0.82rem' }}>List unused capacity</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
