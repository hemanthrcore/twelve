import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { TrustCards, Disclaimer } from '../components/UI'

const JOURNEY = [
  { n: '01', t: 'Connect', d: 'Link a subscription you already pay for. Simulated in this MVP — no passwords.', ic: 'grid' },
  { n: '02', t: 'List', d: 'Publish your unused capacity with a duration and price in a simple stepper.', ic: 'plus' },
  { n: '03', t: 'Discover', d: 'Seekers browse a cinematic marketplace of entertainment & education access.', ic: 'compass' },
  { n: '04', t: 'Book', d: 'Pick a window — 6h to 7 days — and pay through a secure simulated checkout.', ic: 'ticket' },
  { n: '05', t: 'Access', d: 'Instant temporary access with a live countdown into a simulated provider.', ic: 'play' },
  { n: '06', t: 'Expire', d: 'Access ends automatically. The booking moves to Completed. No leftovers.', ic: 'clock' }
]

export default function HowItWorks() {
  const navigate = useNavigate()
  return (
    <div className="page">
      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '90px 0 40px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 100% at 50% 0%, rgba(99,102,241,0.14), transparent 60%)' }} />
        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
          <span className="pill pill-accent" style={{ marginBottom: 20 }}><Icon name="bolt" size={13} /> How it works</span>
          <h1 className="display" style={{ fontSize: 'clamp(2.2rem,5vw,3.8rem)' }}>One subscription.<br /><span className="gradient-text">More value.</span></h1>
          <p className="text-secondary" style={{ marginTop: 18, fontSize: '1.15rem', maxWidth: 620, marginInline: 'auto' }}>
            Turn unused capacity into value while giving others flexible, temporary access — without ever sharing a password.
          </p>
        </div>
      </section>

      {/* Journey */}
      <section className="section-tight">
        <div className="container">
          <div className="scroll-row" style={{ paddingBottom: 24 }}>
            {JOURNEY.map((s, i) => (
              <div key={s.n} className="card pad-lg card-w-md" style={{ position: 'relative' }}>
                <div className="between">
                  <div className="trust-ico"><Icon name={s.ic} size={20} /></div>
                  <span className="mono gradient-text" style={{ fontSize: '1.4rem', fontWeight: 800 }}>{s.n}</span>
                </div>
                <h3 style={{ fontSize: '1.3rem', marginTop: 18 }}>{s.t}</h3>
                <p className="text-secondary" style={{ marginTop: 8, fontSize: '0.95rem' }}>{s.d}</p>
                {i < JOURNEY.length - 1 && (
                  <div className="desktop-hide" style={{ display: 'none' }} />
                )}
              </div>
            ))}
          </div>

          {/* Horizontal flow line (desktop) */}
          <div className="row hide-mobile" style={{ justifyContent: 'center', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
            {JOURNEY.map((s, i) => (
              <span key={s.n} className="row" style={{ gap: 8 }}>
                <span className="pill">{s.t}</span>
                {i < JOURNEY.length - 1 && <Icon name="arrowRight" size={16} className="text-muted" />}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ maxWidth: 620, marginBottom: 26 }}>
            <p className="eyebrow" style={{ marginBottom: 10 }}>Safety by design</p>
            <h2 className="h-section">Built around temporary authorized access</h2>
            <p className="text-secondary" style={{ marginTop: 10 }}>
              No passwords. No OTPs. No cookies. In this MVP provider authorization is simulated. Future architecture may
              use official APIs, OAuth, delegated access, temporary seats or provider partnerships — none of which are
              claimed to exist today.
            </p>
          </div>
          <TrustCards />
          <Disclaimer style={{ marginTop: 26 }} />
        </div>
      </section>

      {/* CTA */}
      <section className="section-tight">
        <div className="container center" style={{ flexDirection: 'column', gap: 16, textAlign: 'center' }}>
          <h2 className="h-section">Ready to try the flow?</h2>
          <div className="row" style={{ gap: 12 }}>
            <button className="btn btn-white btn-lg" onClick={() => navigate('/discover')}>Explore Access</button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/connect')}>List Your Subscription</button>
          </div>
        </div>
      </section>
    </div>
  )
}
