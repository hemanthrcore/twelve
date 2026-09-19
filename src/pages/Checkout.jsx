import { useMemo, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import Artwork from '../components/Artwork'
import ProviderLogo from '../components/ProviderLogo'
import Icon from '../components/Icon'
import PaymentMethods, { Spinner } from '../components/PaymentMethods'
import { getListing } from '../data/listings'
import { getProvider } from '../data/providers'
import { inr, splitFee, durationLabel } from '../lib/format'
import { listingPricing } from '../lib/pricing'
import { useApp } from '../store/AppContext'

export default function Checkout() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { createBooking, resolveListing, toast, countryCode, countryName, walletBalance } = useApp()
  const listing = getListing(id) || resolveListing(id)

  const [method, setMethod] = useState('card')
  const [canPay, setCanPay] = useState(false)
  const [stage, setStage] = useState('idle') // idle | processing | done
  const [showSplit, setShowSplit] = useState(false)

  const pricing = useMemo(() => (listing ? listingPricing(listing, countryCode) : null), [listing, countryCode])
  if (!listing) return null

  // Never let a booking exceed the listing's offered duration.
  const maxHours = listing.defaultHours || 24
  const offered = pricing.durations.filter((d) => d.hours <= maxHours)
  const reqHours = Number(params.get('h')) || maxHours
  const dur = offered.find((d) => d.hours === reqHours) || offered[offered.length - 1]
  const hours = dur.hours
  const price = dur.price
  const total = price
  const { owner, platformFee, provider } = splitFee(price, hours)
  const p = getProvider(listing.provider)
  const orderRef = 'TW-' + (listing.id.slice(0, 3) + hours).toUpperCase() + '-' + String(Math.abs(hashCode(listing.id)) % 9000 + 1000)

  const pay = () => {
    if (!canPay) return
    setStage('processing')
    const isWallet = method === 'wallet'
    setTimeout(async () => {
      try {
        const booking = await createBooking({ listing, hours: dur.hours, price, hold: isWallet })
        setStage('done')
        // Wallet bookings hold the payment and open the setup chat; other methods
        // are the legacy instant-access path.
        setTimeout(() => navigate(isWallet ? `/setup/${booking.id}` : `/success/${booking.id}`), 550)
      } catch (e) {
        setStage('idle')
        toast(e.message || 'Could not complete booking.', 'error')
      }
    }, 1900)
  }

  return (
    <div className="page">
      <section className="section-tight">
        <div className="container" style={{ maxWidth: 1060 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
            <Icon name="arrowLeft" size={16} /> Back
          </button>

          <div className="between wrap" style={{ marginBottom: 26, gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 'clamp(1.7rem,3vw,2.3rem)', marginBottom: 6 }}>Secure checkout</h1>
              <p className="text-secondary">Complete your booking. Payments are encrypted and processed securely.</p>
            </div>
            <span className="pill" style={{ gap: 7 }}><Icon name="shieldCheck" size={14} style={{ color: 'var(--green)' }} /> 256-bit encryption</span>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1.15fr 0.85fr', gap: 28, alignItems: 'start' }}>
            {/* ---------------- LEFT: payment ---------------- */}
            <div>
              <div className="card pad-lg" style={{ marginBottom: 18 }}>
                <SectionLabel n="1" title="Contact" />
                <label className="field-label">Email for receipt</label>
                <input className="input" defaultValue="vasishta.offical@gmail.com" inputMode="email" />
                <div className="row" style={{ gap: 7, marginTop: 12 }}>
                  <Icon name="location" size={14} className="text-muted" />
                  <span className="text-muted" style={{ fontSize: '0.82rem' }}>Billing region: <strong style={{ color: 'var(--text-secondary)' }}>{countryName}</strong> · detected automatically</span>
                </div>
              </div>

              <div className="card pad-lg">
                <SectionLabel n="2" title="Payment method" />
                <PaymentMethods
                  methods={['card', 'wallet', 'paypal', 'bank']}
                  value={method}
                  onChange={setMethod}
                  onValidityChange={setCanPay}
                  amount={total}
                  walletBalance={walletBalance}
                />
              </div>
            </div>

            {/* ---------------- RIGHT: order summary ---------------- */}
            <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 16px)' }}>
              <div className="card-elevated" style={{ overflow: 'hidden' }}>
                <div style={{ position: 'relative', aspectRatio: '16/6' }}>
                  <Artwork grad={p.gradient} seed={7} style={{ position: 'absolute', inset: 0 }} />
                  <div className="grad-overlay-bottom" style={{ position: 'absolute', inset: 0 }} />
                  <div style={{ position: 'absolute', left: 18, bottom: 14 }}>
                    <ProviderLogo id={p.id} size={0.9} onArt />
                    <h3 style={{ fontSize: '1.1rem', marginTop: 4 }}>{listing.title}</h3>
                  </div>
                </div>

                <div className="pad-lg">
                  <Line label="Order" value={<span className="mono text-muted" style={{ fontSize: '0.82rem' }}>{orderRef}</span>} />
                  <Line label="Access duration" value={durationLabel(dur.hours)} />
                  <Line label="Region" value={countryName} />
                  <Line label="Subtotal" value={inr(price)} />
                  <Line label="Taxes & fees" value="Included" muted />

                  <button className="row" onClick={() => setShowSplit((s) => !s)} style={{ gap: 6, marginTop: 8, color: 'var(--accent)', fontSize: '0.82rem' }}>
                    <Icon name="info" size={13} /> How the payment is split
                    <Icon name="chevronDown" size={14} style={{ transform: showSplit ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  {showSplit && (
                    <div className="fade-in" style={{ marginTop: 10, padding: 12, borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)' }}>
                      <Line label="Owner earns" value={inr(owner)} muted small />
                      <Line label="twelve fee" value={inr(platformFee)} muted small />
                      <Line label="Provider / partner" value={inr(provider)} muted small />
                      <p className="disclaimer" style={{ marginTop: 8, fontSize: '0.72rem' }}>Provider / partner share is a hypothetical future model and does not represent an existing agreement.</p>
                    </div>
                  )}

                  <hr className="divider" style={{ margin: '16px 0' }} />
                  <div className="between" style={{ marginBottom: 18 }}>
                    <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>Total due</span>
                    <span className="price" style={{ fontSize: '1.7rem' }}>{inr(total)}</span>
                  </div>

                  <button className="btn btn-accent btn-lg btn-block" onClick={pay} disabled={!canPay || stage !== 'idle'}>
                    {stage === 'processing' ? <><Spinner /> Processing…</>
                      : stage === 'done' ? <><Icon name="check" size={18} /> Confirmed</>
                      : method === 'wallet' ? <><Icon name="lock" size={16} /> Hold {inr(total)}</>
                      : <><Icon name="lock" size={16} /> Pay {inr(total)}</>}
                  </button>
                  <p className="text-muted text-center" style={{ fontSize: '0.74rem', marginTop: 12 }}>
                    {method === 'wallet'
                      ? 'Held in your Wallet until access is set up · auto-refund if it fails.'
                      : 'By paying you agree to twelve’s temporary-access terms. Access expires automatically.'}
                  </p>
                </div>
              </div>

              <div className="row" style={{ gap: 16, justifyContent: 'center', marginTop: 16 }}>
                <span className="text-muted row" style={{ gap: 5, fontSize: '0.74rem' }}><Icon name="shieldCheck" size={13} /> PCI-DSS</span>
                <span className="text-muted row" style={{ gap: 5, fontSize: '0.74rem' }}><Icon name="lock" size={13} /> Encrypted</span>
                <span className="text-muted row" style={{ gap: 5, fontSize: '0.74rem' }}><Icon name="clock" size={13} /> Auto-expiry</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* processing overlay */}
      {stage !== 'idle' && (
        <div className="modal-backdrop" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="text-center fade-in" style={{ maxWidth: 320 }}>
            {stage === 'processing' ? (
              <>
                <div style={{ margin: '0 auto 20px', width: 56, height: 56 }}><Spinner size={56} /></div>
                <h3 style={{ fontSize: '1.15rem' }}>{method === 'wallet' ? 'Holding payment' : 'Processing payment'}</h3>
                <p className="text-secondary" style={{ marginTop: 8, fontSize: '0.9rem' }}>Securely authorizing {inr(total)}…</p>
              </>
            ) : (
              <>
                <div className="check-circle" style={{ width: 72, height: 72 }}>
                  <svg className="check-svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#6ee787" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <h3 style={{ fontSize: '1.15rem', marginTop: 16 }}>{method === 'wallet' ? 'Payment held' : 'Payment confirmed'}</h3>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- sub-components ----------
function SectionLabel({ n, title }) {
  return (
    <div className="row" style={{ gap: 10, marginBottom: 16 }}>
      <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--card)', border: '1px solid var(--border-bright)', display: 'grid', placeItems: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{n}</span>
      <h3 style={{ fontSize: '1.05rem' }}>{title}</h3>
    </div>
  )
}

function Line({ label, value, muted, small }) {
  return (
    <div className="between" style={{ padding: small ? '3px 0' : '5px 0' }}>
      <span className={muted ? 'text-muted' : 'text-secondary'} style={{ fontSize: small ? '0.84rem' : '0.92rem' }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: small ? '0.84rem' : '0.95rem' }}>{value}</span>
    </div>
  )
}

function hashCode(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return h
}
