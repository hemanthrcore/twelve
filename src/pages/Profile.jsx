import { useNavigate } from 'react-router-dom'
import Artwork from '../components/Artwork'
import ProviderLogo from '../components/ProviderLogo'
import Icon from '../components/Icon'
import { getProvider, providerList } from '../data/providers'
import { inr } from '../lib/format'
import { avatarGradient, userSeed } from '../lib/avatar'
import { useApp } from '../store/AppContext'

export default function Profile() {
  const navigate = useNavigate()
  const { authUser, connected, stats, myBookings, countryName } = useApp()
  const name = authUser?.name || 'Member'

  const menu = [
    { icon: 'verified', label: 'Verification status', value: 'Verified', color: '#4ade80' },
    { icon: 'grid', label: 'Listed subscriptions', value: `${connected.length} listed` },
    { icon: 'ticket', label: 'Bookings', value: `${myBookings.length} total` },
    { icon: 'wallet', label: 'Earnings', value: inr(stats.earnings) },
    { icon: 'shield', label: 'Security', value: 'No passwords stored' },
    { icon: 'bell', label: 'Notifications', value: 'On' }
  ]

  return (
    <div className="page">
      <section className="section-tight">
        <div className="container" style={{ maxWidth: 820 }}>
          {/* Header with cover banner */}
          <div className="card-elevated" style={{ position: 'relative', overflow: 'hidden', marginBottom: 24 }}>
            {/* cover strip */}
            <div style={{ position: 'relative', height: 130 }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                {(connected.length ? connected : ['netflix', 'max', 'disney']).map((id) => getProvider(id)).filter(Boolean).concat(providerList.slice(0, 6)).slice(0, 6).map((p, i) => (
                  <Artwork key={i} grad={p.gradient} seed={i * 4 + 3} style={{ flex: 1 }} />
                ))}
              </div>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), var(--card-elevated) 96%)' }} />
            </div>
            {/* identity */}
            <div className="profile-identity pad-lg" style={{ paddingTop: 0 }}>
              <div className="row wrap" style={{ gap: 18, alignItems: 'flex-end', marginTop: -40 }}>
                <div style={{ width: 88, height: 88, borderRadius: 22, background: avatarGradient(userSeed(authUser)), display: 'grid', placeItems: 'center', fontSize: '2rem', fontWeight: 700, color: '#fff', flex: 'none', border: '3px solid var(--card-elevated)', boxShadow: 'var(--shadow-elevated)' }}>
                  {name[0]?.toUpperCase()}
                </div>
                <div className="grow" style={{ paddingBottom: 4 }}>
                  <div className="row" style={{ gap: 10 }}>
                    <h1 style={{ fontSize: '1.7rem' }}>{name}</h1>
                    <span className="pill pill-green"><Icon name="verified" size={13} /> Verified</span>
                  </div>
                  <p className="text-secondary" style={{ marginTop: 6 }}>Owner + Seeker</p>
                </div>
              </div>
              <div className="row wrap" style={{ gap: 8, marginTop: 14 }}>
                <span className="pill"><Icon name="mail" size={13} /> {authUser?.email}</span>
                <span className="pill"><Icon name="globe" size={13} /> {countryName}</span>
              </div>
            </div>
          </div>

          {/* Connected */}
          <div className="card pad-lg" style={{ marginBottom: 24 }}>
            <div className="between" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem' }}>Connected subscriptions</h3>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/connect')}><Icon name="plus" size={14} /> Add</button>
            </div>
            <div className="row wrap" style={{ gap: 12 }}>
              {connected.map((id) => {
                const p = getProvider(id)
                return (
                  <div key={id} className="card pad row" style={{ gap: 12, padding: '12px 16px' }}>
                    <ProviderLogo id={id} size={0.75} />
                    <span className="pill pill-green" style={{ fontSize: '0.68rem' }}>Simulated</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Menu */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {menu.map((m, i) => (
              <button key={m.label} className="between clickable" style={{ width: '100%', padding: '16px 20px', borderBottom: i < menu.length - 1 ? '1px solid var(--border)' : 'none', textAlign: 'left' }}>
                <div className="row" style={{ gap: 14 }}>
                  <span className="text-secondary"><Icon name={m.icon} size={19} /></span>
                  <span style={{ fontWeight: 550 }}>{m.label}</span>
                </div>
                <div className="row" style={{ gap: 10 }}>
                  <span style={{ fontSize: '0.88rem', color: m.color || 'var(--muted)' }}>{m.value}</span>
                  <Icon name="chevronRight" size={16} className="text-muted" />
                </div>
              </button>
            ))}
          </div>

          <div className="row" style={{ gap: 10, marginTop: 24 }}>
            <button className="btn btn-accent" onClick={() => navigate('/dashboard')}>Owner dashboard</button>
            <button className="btn btn-outline" onClick={() => navigate('/bookings')}>My bookings</button>
          </div>

          <p className="disclaimer" style={{ marginTop: 24 }}>
            twelve never collects or stores passwords, OTPs or credentials. Connected subscriptions shown here are
            simulated for this prototype.
          </p>
        </div>
      </section>
    </div>
  )
}
