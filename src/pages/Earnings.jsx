import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import ProviderLogo from '../components/ProviderLogo'
import { SectionHead, Disclaimer } from '../components/UI'
import { getProvider } from '../data/providers'
import { inr, splitFee, fmtDate } from '../lib/format'
import { useApp } from '../store/AppContext'

const CHART = [320, 210, 480, 360, 540, 420, 620, 500, 700, 610, 780, 720]
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Earnings() {
  const navigate = useNavigate()
  const { stats, ownerBookings, liveStatus } = useApp()
  const max = Math.max(...CHART)
  const sample = splitFee(99)

  const paid = ownerBookings.filter((b) => liveStatus(b) !== 'upcoming')

  return (
    <div className="page">
      <section className="section-tight">
        <div className="container">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')} style={{ marginBottom: 20 }}>
            <Icon name="chevronRight" size={16} style={{ transform: 'rotate(180deg)' }} /> Dashboard
          </button>

          {/* Hero number */}
          <div className="card-elevated pad-lg" style={{ position: 'relative', overflow: 'hidden', marginBottom: 26 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 120% at 100% 0%, rgba(34,197,94,0.12), transparent 60%)' }} />
            <div style={{ position: 'relative' }}>
              <p className="eyebrow" style={{ marginBottom: 10 }}>Total earnings</p>
              <div style={{ fontSize: 'clamp(2.6rem, 6vw, 4rem)', fontWeight: 800, letterSpacing: '-0.03em' }}>{inr(stats.earnings)}</div>
              <div className="row" style={{ gap: 14, marginTop: 8 }}>
                <span className="pill pill-green"><Icon name="trend" size={13} /> +12% this month</span>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Across {stats.bookingsCount} bookings</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="card pad-lg" style={{ marginBottom: 26 }}>
            <SectionHead title="Earnings over time" />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2%', height: 200, marginTop: 10 }}>
              {CHART.map((v, i) => (
                <div key={i} className="grow center" style={{ flexDirection: 'column', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ width: '70%', height: `${(v / max) * 100}%`, borderRadius: 8, background: i === CHART.length - 1 ? 'var(--accent-gradient)' : 'linear-gradient(180deg, #2a2a2a, #1a1a1a)', border: '1px solid var(--border)', transition: 'height 0.5s var(--ease)' }} />
                  <span className="text-muted hide-mobile" style={{ fontSize: '0.68rem' }}>{MONTHS[i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-2" style={{ gap: 26 }}>
            <div className="card pad-lg">
              <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Per-booking breakdown</h3>
              <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: 14 }}>Example on a ₹99 gross transaction</p>
              <Bar label="Your share" value={sample.owner} total={99} color="#4ade80" />
              <Bar label="twelve" value={sample.platformFee} total={99} color="#a5b4fc" />
              <Bar label="Provider / partner" value={sample.provider} total={99} color="#71717a" />
              <Disclaimer style={{ marginTop: 14 }}>Provider portion is a hypothetical future model.</Disclaimer>
            </div>

            <div className="card pad-lg">
              <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Recent payouts</h3>
              <div className="col" style={{ gap: 2 }}>
                {paid.slice(0, 6).map((b) => {
                  const p = getProvider(b.provider)
                  return (
                    <div className="between" key={b.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div className="row" style={{ gap: 12 }}>
                        <ProviderLogo id={p.id} size={0.72} />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.title}</div>
                          <div className="text-muted" style={{ fontSize: '0.76rem' }}>{fmtDate(b.createdAt)} · {b.seeker}</div>
                        </div>
                      </div>
                      <span className="price" style={{ color: '#4ade80', fontSize: '0.95rem' }}>+{inr(b.ownerEarning || 0)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function Bar({ label, value, total, color }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div className="between" style={{ marginBottom: 6 }}>
        <span className="text-secondary" style={{ fontSize: '0.88rem' }}>{label}</span>
        <span style={{ fontWeight: 650, fontSize: '0.9rem' }}>{inr(value)}</span>
      </div>
      <div className="pbar"><span style={{ width: `${(value / total) * 100}%`, background: color }} /></div>
    </div>
  )
}
