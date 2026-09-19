import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Artwork from '../components/Artwork'
import ProviderLogo from '../components/ProviderLogo'
import ListingCard from '../components/ListingCard'
import Icon from '../components/Icon'
import { TrustCards, Disclaimer, RowScroller } from '../components/UI'
import { LISTINGS } from '../data/listings'
import { providerList } from '../data/providers'

// Reveal-on-scroll: add `.in` to any `.reveal` element as it enters the viewport.
function useScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal'))
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach((el) => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

export default function Landing() {
  const navigate = useNavigate()
  const trending = LISTINGS.filter((l) => l.trending).slice(0, 8)
  const marquee = providerList.slice(0, 16)
  useScrollReveal()

  const CATS = [
    { id: 'entertainment', kicker: 'Entertainment', title: 'Watch more.', body: 'Netflix, Prime, JioHotstar, Crunchyroll, Max and more — by the hour.', providers: ['netflix', 'prime', 'hotstar', 'crunchyroll'], grad: ['#3a0d0d', '#7f0d14', '#0a0303'] },
    { id: 'education', kicker: 'Education', title: 'Learn more.', body: 'Coursera, Udemy, MasterClass and LinkedIn Learning — access a course before a deadline.', providers: ['coursera', 'udemy', 'masterclass', 'linkedin'], grad: ['#08234f', '#0f47a1', '#040e1f'] },
    { id: 'ai', kicker: 'AI Models', title: 'Build more.', body: 'ChatGPT Plus, Claude Pro, Gemini Advanced, Perplexity, Midjourney — for a project sprint.', providers: ['chatgpt', 'claude', 'gemini', 'perplexity'], grad: ['#062b22', '#0d6b54', '#03120f'] }
  ]

  return (
    <div className="page" style={{ paddingTop: 0 }}>
      {/* ===================== HERO (premium, animated) ===================== */}
      <section className="hero">
        {/* drifting aurora */}
        <div className="hero-aurora" aria-hidden="true">
          <span className="orb orb-a" /><span className="orb orb-b" /><span className="orb orb-c" />
        </div>
        {/* faint provider mosaic */}
        <div className="hero-mosaic" aria-hidden="true">
          {LISTINGS.slice(0, 18).map((l, i) => {
            const p = providerList.find((pp) => pp.id === l.provider)
            return <Artwork key={i} grad={p.gradient} seed={i * 3 + 1} style={{ borderRadius: 14 }} />
          })}
        </div>
        <div className="hero-veil" />

        <div className="container hero-inner">
          <h1 className="display fade-up-2" style={{ marginTop: 22 }}>
            Access more.<br /><span className="gradient-text-animated">Subscribe less.</span>
          </h1>
          <p className="fade-up-3 lead" style={{ maxWidth: 660, margin: '22px auto 0' }}>
            Temporary access to entertainment, education and AI subscriptions —
            without sharing passwords. Pay by the hour, anywhere in the world.
          </p>
          <div className="fade-up-4 row" style={{ gap: 12, marginTop: 34, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-white btn-lg" onClick={() => navigate('/discover')}>Get started <Icon name="arrowRight" size={17} /></button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/how-it-works')}>How it works</button>
          </div>

          <div className="fade-up-4 hero-stats">
            <div className="hero-stat"><b>{providerList.length}+</b><span>Services</span></div>
            <div className="hero-stat"><b>3</b><span>Categories</span></div>
            <div className="hero-stat"><b>By the hour</b><span>Flexible</span></div>
          </div>

          <div className="row" style={{ gap: 22, marginTop: 26, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Feature icon="lock" text="No password sharing" />
            <Feature icon="clock" text="Automatic expiration" />
            <Feature icon="shield" text="Authorized access" />
          </div>

          {/* provider marquee */}
          <div className="marquee fade-up-4" aria-hidden="true">
            <div className="marquee-track">
              {[...marquee, ...marquee].map((p, i) => (
                <ProviderLogo key={i} id={p.id} size={0.9} onArt />
              ))}
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 26, left: '50%', transform: 'translateX(-50%)', zIndex: 3 }} className="hide-mobile">
          <Icon name="chevronDown" size={22} className="text-muted" />
        </div>
      </section>

      {/* ===================== TRENDING ===================== */}
      <section className="section-tight">
        <div className="container container-wide">
          <div className="between reveal" style={{ marginBottom: 22 }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>Trending access</p>
              <h2 className="h-section">Popular right now.</h2>
            </div>
            <button className="link-apple hide-mobile" onClick={() => navigate('/discover')}>Browse all</button>
          </div>
          <RowScroller>
            {trending.map((l) => <ListingCard key={l.id} listing={l} width="card-w-lg" large />)}
          </RowScroller>
          <Disclaimer style={{ marginTop: 10 }} />
        </div>
      </section>

      {/* ===================== CATEGORY PRODUCT SECTIONS (Apple bento) ===================== */}
      <section className="section-tight">
        <div className="container container-wide">
          <div className="text-center reveal" style={{ marginBottom: 34 }}>
            <p className="eyebrow" style={{ marginBottom: 10 }}>One marketplace. Three worlds.</p>
            <h2 className="display" style={{ fontSize: 'clamp(2rem, 5vw, 3.6rem)' }}>What do you want to access?</h2>
          </div>

          <div className="bento" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {CATS.map((c) => (
              <div key={c.id} className="bento-tile reveal" onClick={() => navigate('/discover?cat=' + c.id)}>
                <Artwork grad={c.grad} seed={c.id.length * 4} style={{ position: 'absolute', inset: 0 }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #000 6%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.55) 100%)' }} />
                <div className="bento-content">
                  <p className="eyebrow" style={{ marginBottom: 10 }}>{c.kicker}</p>
                  <h3 style={{ fontSize: '2rem', fontWeight: 600 }}>{c.title}</h3>
                  <p className="text-secondary" style={{ marginTop: 12, maxWidth: 320 }}>{c.body}</p>
                  <span className="link-apple" style={{ marginTop: 18, display: 'inline-flex' }}>Explore</span>
                </div>
                <div className="row wrap" style={{ gap: 16, position: 'absolute', left: 44, right: 44, bottom: 40, zIndex: 2 }}>
                  {c.providers.map((pid) => <ProviderLogo key={pid} id={pid} size={0.72} onArt />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== TRUST ===================== */}
      <section className="section">
        <div className="container">
          <div className="text-center reveal" style={{ maxWidth: 680, margin: '0 auto 34px' }}>
            <h2 className="h-section">No passwords. No OTPs.</h2>
            <p className="lead" style={{ marginTop: 14 }}>
              twelve is designed around temporary authorized access. In this MVP provider authorization is simulated —
              future architecture may use official APIs, OAuth or provider partnerships, none of which are claimed to exist today.
            </p>
          </div>
          <TrustCards />
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="section-tight">
        <div className="container">
          <div className="reveal" style={{ borderRadius: 'var(--radius-lg)', padding: 'clamp(44px, 7vw, 90px)', position: 'relative', overflow: 'hidden', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 130% at 50% 0%, rgba(41,151,255,0.16), transparent 60%)' }} />
            <div style={{ position: 'relative' }}>
              <h2 className="display" style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)' }}>Got a subscription you<br />don’t always use?</h2>
              <p className="lead" style={{ marginTop: 16 }}>List your unused capacity and earn — while others get flexible access.</p>
              <div className="row" style={{ justifyContent: 'center', gap: 12, marginTop: 28 }}>
                <button className="btn btn-accent btn-lg" onClick={() => navigate('/connect')}>List your subscription</button>
                <button className="btn btn-ghost btn-lg" onClick={() => navigate('/discover')}>Explore access</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function Feature({ icon, text }) {
  return (
    <span className="row" style={{ gap: 8, color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 450 }}>
      <span style={{ color: 'var(--accent)' }}><Icon name={icon} size={16} /></span> {text}
    </span>
  )
}
