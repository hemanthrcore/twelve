import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Artwork from '../components/Artwork'
import ProviderLogo from '../components/ProviderLogo'
import Icon from '../components/Icon'
import CountdownPill from '../components/CountdownPill'
import { EmptyState } from '../components/UI'
import { getProvider } from '../data/providers'
import { inr, durationLabel, fmtDate, fmtDateTime } from '../lib/format'
import { useApp } from '../store/AppContext'
import { useNow } from '../lib/time'

const TABS = [
  { id: 'active', label: 'Active' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' }
]

export default function Bookings() {
  const navigate = useNavigate()
  const { myBookings, liveStatus } = useApp()
  const [tab, setTab] = useState('active')
  useNow(1000)

  const bookings = myBookings.map((b) => ({ ...b, status: liveStatus(b) }))
  const setupList = bookings.filter((b) => b.status === 'held')
  const inTab = (b, id) => id === 'completed' ? (b.status === 'completed' || b.status === 'failed') : b.status === id
  const list = bookings.filter((b) => inTab(b, tab))
  const counts = TABS.reduce((a, t) => ({ ...a, [t.id]: bookings.filter((b) => inTab(b, t.id)).length }), {})

  return (
    <div className="page">
      <section className="section-tight">
        <div className="container" style={{ maxWidth: 920 }}>
          <h1 style={{ fontSize: 'clamp(1.8rem,3.4vw,2.6rem)' }}>Your bookings</h1>
          <p className="text-secondary" style={{ marginTop: 8 }}>Track your temporary access — active, upcoming and completed.</p>

          {setupList.length > 0 && (
            <div className="card pad-lg" style={{ marginTop: 24, borderColor: 'rgba(255,159,10,0.3)', background: 'rgba(255,159,10,0.06)' }}>
              <div className="row" style={{ gap: 8, marginBottom: 12 }}>
                <Icon name="clock" size={16} style={{ color: 'var(--amber)' }} />
                <h3 style={{ fontSize: '1.02rem' }}>Awaiting setup</h3>
              </div>
              <div className="col" style={{ gap: 10 }}>
                {setupList.map((b) => (
                  <div className="between wrap" key={b.id} style={{ gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 550 }}>{b.title}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>{durationLabel(b.hours)} · {inr(b.price)} held · setup window open</div>
                    </div>
                    <button className="btn btn-accent btn-sm" onClick={() => navigate(`/setup/${b.id}`)}>Open setup chat</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="cat-tabs" style={{ marginTop: 24, marginBottom: 26 }}>
            {TABS.map((t) => (
              <button key={t.id} className={`cat-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)} style={{ padding: '10px 18px' }}>
                {t.label} <span className="pill" style={{ padding: '1px 8px', fontSize: '0.72rem', background: tab === t.id ? 'rgba(0,0,0,0.1)' : undefined }}>{counts[t.id]}</span>
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <EmptyState
              icon={tab === 'active' ? 'play' : tab === 'upcoming' ? 'clock' : 'check'}
              title={`No ${tab} bookings`}
              body={tab === 'active' ? 'Book temporary access and it will appear here with a live countdown.' : `You have no ${tab} bookings yet.`}
              action={<button className="btn btn-accent" onClick={() => navigate('/discover')}>Explore access</button>}
            />
          ) : (
            <div className="col" style={{ gap: 14 }}>
              {list.map((b) => <BookingCard key={b.id} b={b} navigate={navigate} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function BookingCard({ b, navigate }) {
  const p = getProvider(b.provider)
  const status = {
    active: { cls: 'pill-green', label: 'Active', dot: true },
    upcoming: { cls: 'pill-amber', label: 'Upcoming' },
    held: { cls: 'pill-amber', label: 'Setup' },
    failed: { cls: 'pill-red', label: 'Refunded' },
    completed: { cls: '', label: b.title && 'Completed' }
  }[b.status] || { cls: '', label: 'Completed' }
  const dim = b.status === 'completed' || b.status === 'failed'

  return (
    <div className="card pad row wrap" style={{ gap: 16 }}>
      <div style={{ position: 'relative', width: 96, height: 72, borderRadius: 12, overflow: 'hidden', flex: 'none' }}>
        <Artwork grad={dim ? ['#1a1a1a', '#262626', '#0d0d0d'] : p.gradient} seed={7} style={{ position: 'absolute', inset: 0 }} />
        <div style={{ position: 'absolute', left: 8, bottom: 6 }}><ProviderLogo id={p.id} size={0.62} onArt /></div>
      </div>

      <div className="grow" style={{ minWidth: 180 }}>
        <div className="row wrap" style={{ gap: 10 }}>
          <h4 style={{ fontSize: '1.05rem' }}>{b.title}</h4>
          <span className={`pill ${status.cls}`}>{status.dot && <span className="badge-live" />}{status.label}</span>
        </div>
        <p className="text-muted" style={{ fontSize: '0.83rem', marginTop: 5 }}>
          {durationLabel(b.hours)} · {inr(b.price)} · {b.status === 'upcoming' ? `Starts ${fmtDateTime(b.startAt)}` : b.status === 'completed' ? `Ended ${fmtDate(b.expiresAt)}` : b.status === 'failed' ? `Refunded ${fmtDate(b.createdAt)}` : b.status === 'held' ? 'Setup in progress' : `Booked ${fmtDate(b.createdAt)}`}
        </p>
        {b.status === 'active' && (
          <div className="row" style={{ gap: 6, marginTop: 8, fontSize: '0.88rem' }}>
            <Icon name="clock" size={14} style={{ color: '#a5b4fc' }} />
            <CountdownPill expiresAt={b.expiresAt} className="mono" /> <span className="text-muted">remaining</span>
          </div>
        )}
      </div>

      <div className="row" style={{ gap: 8 }}>
        {b.status === 'held' && <button className="btn btn-accent btn-sm" onClick={() => navigate(`/setup/${b.id}`)}>Open setup</button>}
        {b.status === 'active' && <button className="btn btn-white btn-sm" onClick={() => navigate(`/access/${b.id}`)}>Open Access</button>}
        {b.status === 'upcoming' && <button className="btn btn-outline btn-sm" onClick={() => navigate(`/access/${b.id}`)}>Details</button>}
        {(b.status === 'completed' || b.status === 'failed') && <button className="btn btn-outline btn-sm" onClick={() => navigate(`/listing/${b.listingId}`)}>Book again</button>}
      </div>
    </div>
  )
}
