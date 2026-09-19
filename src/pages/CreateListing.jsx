import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Artwork from '../components/Artwork'
import ProviderLogo from '../components/ProviderLogo'
import Icon from '../components/Icon'
import { Stepper, Disclaimer } from '../components/UI'
import { providerList, getProvider } from '../data/providers'
import { inr, splitFee } from '../lib/format'
import { listingPricing, monthlyPrice } from '../lib/pricing'
import { useApp } from '../store/AppContext'

const STEPS = ['Provider', 'Capacity', 'Availability', 'Duration', 'Pricing', 'Review']

const WINDOWS = ['Today · 6 PM – 11 PM', 'Tonight · 8 PM – 12 AM', 'Tomorrow · All day', 'This weekend', 'Always available']
const DUR = [
  { hours: 3, label: '3 Hours' }, { hours: 6, label: '6 Hours' }, { hours: 12, label: '12 Hours' },
  { hours: 24, label: '24 Hours' }, { hours: 72, label: '3 Days' }, { hours: 168, label: '7 Days' }
]

export default function CreateListing() {
  const navigate = useNavigate()
  const { connected, publishListing, toast, countryCode, countryName, currencyCode } = useApp()
  const [params] = useSearchParams()

  const [step, setStep] = useState(0)
  const [provider, setProvider] = useState(params.get('provider') || connected[0] || 'netflix')
  const [seats, setSeats] = useState(1)
  const [availability, setAvailability] = useState(WINDOWS[0])
  const [duration, setDuration] = useState(24)
  const [published, setPublished] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const p = getProvider(provider)
  // Price is set AUTOMATICALLY from the provider's plan price in the owner's region.
  const pricing = listingPricing({ provider, defaultHours: duration }, countryCode)
  const price = pricing.durations.find((d) => d.hours === duration)?.price ?? pricing.price
  const monthly = monthlyPrice(provider, countryCode)
  const { owner, platformFee, provider: provShare } = splitFee(price, duration)
  const durLabel = DUR.find((d) => d.hours === duration)?.label

  const availableProviders = providerList // allow selecting any for the demo

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const publish = async () => {
    if (publishing) return
    setPublishing(true)
    const res = await publishListing({
      provider,
      category: p.category,
      title: p.name,
      subtitle: p.tagline || '',
      defaultHours: duration,
      seats,
      availability
    })
    setPublishing(false)
    if (res.ok) {
      setPublished(true)
      toast('Listing published', 'success')
    } else {
      toast(res.error || 'Could not publish listing.', 'error')
    }
  }

  if (published) {
    return (
      <div className="page center" style={{ minHeight: '80vh' }}>
        <div className="fade-in" style={{ textAlign: 'center', maxWidth: 440 }}>
          <div className="check-circle">
            <svg className="check-svg" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <h1 style={{ fontSize: '1.9rem', marginTop: 24 }}>Listing published</h1>
          <p className="text-secondary" style={{ marginTop: 10 }}>{p.name} · {durLabel} · {inr(price)} is now live on the marketplace.</p>
          <div className="col" style={{ gap: 10, marginTop: 24 }}>
            <button className="btn btn-white btn-lg btn-block" onClick={() => navigate('/dashboard')}>Go to dashboard</button>
            <button className="btn btn-ghost btn-block" onClick={() => navigate('/discover')}>View marketplace</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <section className="section-tight">
        <div className="container" style={{ maxWidth: 900 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/connect')} style={{ marginBottom: 20 }}>
            <Icon name="chevronRight" size={16} style={{ transform: 'rotate(180deg)' }} /> Back
          </button>
          <h1 style={{ fontSize: 'clamp(1.7rem,3vw,2.3rem)', marginBottom: 8 }}>Create a listing</h1>
          <p className="text-secondary" style={{ marginBottom: 26 }}>Turn unused capacity into value in a few steps.</p>

          <div style={{ marginBottom: 30, overflowX: 'auto' }}><Stepper steps={STEPS} current={step} /></div>

          <div className="grid" style={{ gridTemplateColumns: '1.3fr 1fr', gap: 28, alignItems: 'start' }}>
            {/* Step content */}
            <div className="card-elevated pad-lg" style={{ minHeight: 320 }}>
              {step === 0 && (
                <>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: 4 }}>Select provider</h3>
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 18 }}>Choose a subscription you want to list.</p>
                  <div className="grid grid-3" style={{ gap: 10 }}>
                    {availableProviders.map((pr) => (
                      <button key={pr.id} className={`dur-option ${provider === pr.id ? 'selected' : ''}`} style={{ flexDirection: 'column', gap: 8, height: 84 }} onClick={() => setProvider(pr.id)}>
                        <ProviderLogo id={pr.id} size={0.7} />
                        <span className="text-muted" style={{ fontSize: '0.68rem' }}>{pr.category}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: 4 }}>Available capacity</h3>
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 18 }}>How many temporary seats can you spare?</p>
                  <div className="row" style={{ gap: 16 }}>
                    <button className="icon-btn" style={{ border: '1px solid var(--border-bright)' }} onClick={() => setSeats((s) => Math.max(1, s - 1))}><Icon name="close" size={16} /></button>
                    <div className="center" style={{ flexDirection: 'column' }}>
                      <span style={{ fontSize: '3rem', fontWeight: 800 }}>{seats}</span>
                      <span className="text-muted" style={{ fontSize: '0.82rem' }}>temporary seat{seats > 1 ? 's' : ''}</span>
                    </div>
                    <button className="icon-btn" style={{ border: '1px solid var(--border-bright)' }} onClick={() => setSeats((s) => Math.min(4, s + 1))}><Icon name="plus" size={16} /></button>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: 20 }}>Tip: most plans keep 1 seat free for the owner.</p>
                </>
              )}

              {step === 2 && (
                <>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: 4 }}>Availability</h3>
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 18 }}>When can seekers book this access?</p>
                  <div className="col" style={{ gap: 10 }}>
                    {WINDOWS.map((w) => (
                      <div key={w} className={`dur-option ${availability === w ? 'selected' : ''}`} onClick={() => setAvailability(w)}>
                        <div className="row" style={{ gap: 12 }}><span className="dur-radio" /><span style={{ fontWeight: 600 }}>{w}</span></div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: 4 }}>Access duration</h3>
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 18 }}>Default booking length for this listing.</p>
                  <div className="filter-pills">
                    {DUR.map((d) => (
                      <button key={d.hours} className={`fpill ${duration === d.hours ? 'active' : ''}`} style={{ padding: '12px 18px' }} onClick={() => setDuration(d.hours)}>{d.label}</button>
                    ))}
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: 4 }}>Pricing</h3>
                  <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: 16 }}>Set automatically — you can’t edit it.</p>

                  <div className="row" style={{ gap: 8, marginBottom: 18, padding: '10px 13px', borderRadius: 12, background: 'var(--accent-soft)', border: '1px solid rgba(41,151,255,0.2)' }}>
                    <Icon name="globe" size={16} style={{ color: 'var(--accent)', flex: 'none' }} />
                    <span style={{ fontSize: '0.82rem', color: '#7ab8ff' }}>
                      Calculated from {p.name}’s <strong>India</strong> monthly plan — the same for everyone. Owners can’t set the amount; you see it in {currencyCode}.
                    </span>
                  </div>

                  <div className="card pad" style={{ marginBottom: 12 }}>
                    <div className="between"><span className="text-muted" style={{ fontSize: '0.85rem' }}>{p.name} India plan / month</span><span style={{ fontWeight: 600 }}>{inr(monthly)}</span></div>
                    <hr className="divider" style={{ margin: '10px 0' }} />
                    <div className="between"><span className="text-muted" style={{ fontSize: '0.85rem' }}>Estimated hourly rate</span><span style={{ fontWeight: 600 }}>{inr(pricing.hourly)}<span className="text-muted" style={{ fontSize: '0.78rem', fontWeight: 400 }}>/hr</span></span></div>
                  </div>

                  <div className="center" style={{ flexDirection: 'column', gap: 4, padding: '14px 0' }}>
                    <span className="text-muted" style={{ fontSize: '0.78rem' }}>Price for {durLabel}</span>
                    <span className="price" style={{ fontSize: '2.8rem' }}>{inr(price)}</span>
                  </div>

                  <div className="card pad" style={{ background: 'rgba(48,209,88,0.06)', borderColor: 'rgba(48,209,88,0.22)' }}>
                    <div className="between"><span className="text-secondary">Projected earnings per booking</span><span className="price" style={{ color: '#6ee787' }}>{inr(owner)}</span></div>
                  </div>
                </>
              )}

              {step === 5 && (
                <>
                  <h3 style={{ fontSize: '1.15rem', marginBottom: 16 }}>Review & publish</h3>
                  <div className="col" style={{ gap: 2 }}>
                    <Row label="Provider" value={p.name} />
                    <Row label="Capacity" value={`${seats} temporary seat${seats > 1 ? 's' : ''}`} />
                    <Row label="Availability" value={availability} />
                    <Row label="Duration" value={durLabel} />
                    <Row label="Region" value={countryName} />
                    <Row label="Price (auto-set)" value={inr(price)} />
                  </div>
                  <hr className="divider" style={{ margin: '16px 0' }} />
                  <p className="eyebrow" style={{ marginBottom: 10 }}>Revenue split</p>
                  <Row label="Your share" value={inr(owner)} strong />
                  <Row label="twelve fee" value={inr(platformFee)} muted />
                  <Row label="Provider / partner" value={inr(provShare)} muted />
                  <Disclaimer style={{ marginTop: 14 }}>Provider / partner share is a hypothetical future model for this prototype and does not represent an existing agreement.</Disclaimer>
                </>
              )}

              {/* nav */}
              <div className="row" style={{ gap: 10, marginTop: 26 }}>
                {step > 0 && <button className="btn btn-outline" onClick={back}>Back</button>}
                <div className="grow" />
                {step < STEPS.length - 1
                  ? <button className="btn btn-accent" onClick={next}>Continue <Icon name="arrowRight" size={16} /></button>
                  : <button className="btn btn-accent btn-lg" onClick={publish} disabled={publishing}>{publishing ? 'Publishing…' : 'Publish Listing'}</button>}
              </div>
            </div>

            {/* Live preview */}
            <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 16px)' }}>
              <p className="eyebrow" style={{ marginBottom: 12 }}>Live preview</p>
              <div className="listing-card">
                <div className="art-wrap">
                  <Artwork grad={p.gradient} seed={price}>
                    <div className="art-cover-logo"><ProviderLogo id={p.id} size={1.8} onArt /></div>
                  </Artwork>
                  <div className="art-badge"><span className="pill pill-green" style={{ background: 'rgba(0,0,0,0.4)' }}><span className="badge-live" /> {durLabel}</span></div>
                </div>
                <div className="card-body">
                  <div className="between"><h4 style={{ fontSize: '1.02rem' }}>{p.name}</h4><span className="rating"><Icon name="star" size={13} className="star" /> New</span></div>
                  <p className="text-muted" style={{ fontSize: '0.84rem' }}>{p.tagline}</p>
                  <div className="card-cta">
                    <span className="price" style={{ fontSize: '1.05rem' }}>{inr(price)}</span>
                    <span className="go">Book Access <Icon name="arrowRight" size={15} /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function Row({ label, value, muted, strong }) {
  return (
    <div className="between" style={{ padding: '7px 0' }}>
      <span className={muted ? 'text-muted' : 'text-secondary'} style={{ fontSize: '0.92rem' }}>{label}</span>
      <span style={{ fontWeight: strong ? 750 : 600, fontSize: '0.95rem', color: strong ? '#4ade80' : undefined }}>{value}</span>
    </div>
  )
}
