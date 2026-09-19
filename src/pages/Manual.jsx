import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import { TrustCards, Disclaimer } from '../components/UI'

// ─────────────────────────────────────────────────────────────────────────────
// twelve — User Manual
// A single, in-depth reference page. Purely additive: it documents the public
// concepts the app already exposes and does not touch any marketplace mechanism.
// ─────────────────────────────────────────────────────────────────────────────

const TOC = [
  { id: 'overview', label: 'What is twelve?', icon: 'info' },
  { id: 'getting-started', label: 'Getting started', icon: 'bolt' },
  { id: 'concepts', label: 'Core concepts', icon: 'grid' },
  { id: 'map', label: 'A map of the app', icon: 'compass' },
  { id: 'seekers', label: 'Booking access (seekers)', icon: 'ticket' },
  { id: 'owners', label: 'Listing & earning (owners)', icon: 'tag' },
  { id: 'wallet', label: 'The twelve Wallet', icon: 'wallet' },
  { id: 'payments', label: 'Payment methods', icon: 'card' },
  { id: 'lifecycle', label: 'Booking lifecycle & settlement', icon: 'refresh' },
  { id: 'pricing', label: 'Pricing & currency', icon: 'globe' },
  { id: 'safety', label: 'Safety & privacy', icon: 'shieldCheck' },
  { id: 'demo', label: 'Demo & admin', icon: 'sparkle' },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: 'gear' },
  { id: 'faq', label: 'FAQ', icon: 'bell' },
  { id: 'glossary', label: 'Glossary', icon: 'book' }
]

// Wrapper for a manual section with an anchor that clears the fixed navbar.
function Section({ id, icon, eyebrow, title, children }) {
  return (
    <section id={id} style={{ scrollMarginTop: 90, paddingBottom: 8 }}>
      <div className="row" style={{ gap: 12, marginBottom: 14, alignItems: 'center' }}>
        <div className="trust-ico"><Icon name={icon} size={20} /></div>
        <div>
          {eyebrow && <p className="eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</p>}
          <h2 className="h-section" style={{ fontSize: 'clamp(1.5rem,3vw,2rem)' }}>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  )
}

// A numbered/bulleted step row inside a card.
function Step({ n, title, children }) {
  return (
    <div className="row" style={{ gap: 16, alignItems: 'flex-start', padding: '14px 0' }}>
      <span className="mono gradient-text" style={{ fontSize: '1.1rem', fontWeight: 800, minWidth: 26 }}>{n}</span>
      <div>
        <h4 style={{ fontSize: '1.05rem', marginBottom: 6 }}>{title}</h4>
        <div className="text-secondary" style={{ fontSize: '0.94rem', lineHeight: 1.6 }}>{children}</div>
      </div>
    </div>
  )
}

// A key/definition line (used for concepts, wallet, glossary, faq…).
function Define({ term, children }) {
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{term}</div>
      <div className="text-secondary" style={{ fontSize: '0.92rem', lineHeight: 1.6 }}>{children}</div>
    </div>
  )
}

// A tinted callout box for tips / notes / warnings.
function Callout({ tone = 'accent', icon = 'info', title, children }) {
  const tones = {
    accent: { bg: 'var(--accent-soft)', bd: 'rgba(41,151,255,0.3)', fg: '#7ab8ff' },
    green: { bg: 'rgba(48,209,88,0.12)', bd: 'rgba(48,209,88,0.3)', fg: '#6ee787' },
    amber: { bg: 'rgba(255,159,10,0.12)', bd: 'rgba(255,159,10,0.3)', fg: '#ffca6b' }
  }
  const t = tones[tone] || tones.accent
  return (
    <div style={{ background: t.bg, border: `1px solid ${t.bd}`, borderRadius: 14, padding: '16px 18px', margin: '16px 0' }}>
      <div className="row" style={{ gap: 10, alignItems: 'center', marginBottom: title ? 8 : 0, color: t.fg }}>
        <Icon name={icon} size={16} />
        {title && <strong style={{ fontSize: '0.92rem' }}>{title}</strong>}
      </div>
      <div className="text-secondary" style={{ fontSize: '0.9rem', lineHeight: 1.65 }}>{children}</div>
    </div>
  )
}

// A reusable table.
function Table({ head, rows }) {
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: 440 }}>
        <thead>
          <tr style={{ textAlign: 'left', background: 'var(--bg-secondary)' }}>
            {head.map((h) => <th key={h} style={{ padding: '11px 15px', fontWeight: 600 }}>{h}</th>)}
          </tr>
        </thead>
        <tbody className="text-secondary">
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
              {r.map((c, j) => (
                <td key={j} style={{ padding: '11px 15px', color: j === 0 ? 'var(--text)' : undefined }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Manual() {
  const navigate = useNavigate()

  return (
    <div className="page">
      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '84px 0 32px' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 100% at 50% 0%, rgba(41,151,255,0.14), transparent 60%)' }} />
        <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
          <span className="pill pill-accent" style={{ marginBottom: 20 }}><Icon name="book" size={13} /> User manual</span>
          <h1 className="display" style={{ fontSize: 'clamp(2rem,5vw,3.4rem)' }}>
            The complete guide to <span className="gradient-text">twelve</span>
          </h1>
          <p className="text-secondary" style={{ marginTop: 18, fontSize: '1.12rem', maxWidth: 660, marginInline: 'auto' }}>
            A full walkthrough of every part of twelve — booking temporary access, listing your own
            subscriptions, the Wallet, payment methods, the setup handshake, settlement, pricing,
            safety, and troubleshooting. Read top-to-bottom, or jump to a section.
          </p>
        </div>
      </section>

      <div className="container" style={{ maxWidth: 880, paddingBottom: 40 }}>
        {/* Table of contents */}
        <nav className="card pad-lg" style={{ marginBottom: 40 }}>
          <p className="eyebrow" style={{ marginBottom: 14 }}>On this page</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 4 }}>
            {TOC.map((t, i) => (
              <a key={t.id} href={`#${t.id}`} className="account-item" style={{ borderRadius: 10 }}>
                <span className="mono text-muted" style={{ fontSize: '0.78rem', minWidth: 20 }}>{String(i + 1).padStart(2, '0')}</span>
                <Icon name={t.icon} size={15} /> {t.label}
              </a>
            ))}
          </div>
        </nav>

        {/* ── Overview ─────────────────────────────────────────── */}
        <Section id="overview" icon="info" eyebrow="Start here" title="What is twelve?">
          <p className="text-secondary" style={{ lineHeight: 1.7 }}>
            <strong>twelve</strong> is a subscription-access marketplace. Millions of people pay for
            subscriptions they only half-use. twelve turns that unused capacity into a two-sided
            marketplace, where access is <em>temporary</em>, <em>authorized</em>, and ends
            automatically — no passwords are ever shared. Its tagline sums up the idea:
            <em> “Access more. Subscribe less.”</em>
          </p>

          <div className="row wrap" style={{ gap: 16, marginTop: 18 }}>
            <div className="card pad-lg" style={{ flex: '1 1 240px' }}>
              <div className="trust-ico" style={{ marginBottom: 12 }}><Icon name="tag" size={20} /></div>
              <h4 style={{ marginBottom: 6 }}>Owners</h4>
              <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                List temporary access to a subscription you already pay for, and earn a share every
                time someone books it.
              </p>
            </div>
            <div className="card pad-lg" style={{ flex: '1 1 240px' }}>
              <div className="trust-ico" style={{ marginBottom: 12 }}><Icon name="compass" size={20} /></div>
              <h4 style={{ marginBottom: 6 }}>Seekers</h4>
              <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                Book access for exactly the window you need — from 3 hours to 7 days — at a price far
                below a full month. Access ends automatically when the window closes.
              </p>
            </div>
          </div>

          <h4 style={{ marginTop: 24, marginBottom: 10 }}>Three verticals</h4>
          <Table
            head={['Vertical', 'Examples', 'What the access screen looks like']}
            rows={[
              ['🎬 Entertainment', 'Netflix, Prime, Max, Disney…', 'A streaming-style browse screen with a live countdown'],
              ['🎓 Education', 'Coursera, Udemy, MasterClass…', 'A course dashboard with a remaining-time bar'],
              ['🤖 AI Models', 'ChatGPT, Claude, Gemini…', 'A chat environment with the twelve access strip']
            ]}
          />

          <Callout tone="amber" icon="info" title="This is a prototype (college MVP)">
            twelve accounts use real, securely-hashed passwords, but <strong>no provider passwords,
            OTPs or cookies</strong> are ever collected or shared. Provider authorization is
            <strong> simulated</strong>. Brand names appear as original stylized wordmarks and
            generated artwork for demonstration only — twelve has no affiliation with any provider.
          </Callout>
        </Section>

        <hr className="divider" style={{ margin: '36px 0' }} />

        {/* ── Getting started ──────────────────────────────────── */}
        <Section id="getting-started" icon="bolt" eyebrow="Set up your account" title="Getting started">
          <div className="card pad-lg">
            <Step n="1" title="Create an account">
              Choose <em>Get Started</em> in the top bar and sign up with your email and a password,
              or use Google Sign-In if it's configured. Your twelve password is hashed with bcrypt
              and your session is kept in a secure, httpOnly cookie — so it can't be read by scripts.
            </Step>
            <hr className="divider" />
            <Step n="2" title="Get your starter balance">
              Every new account is seeded with <strong>₹100 (about&nbsp;$1.20)</strong> of demo
              Wallet credit, so you can try the flow immediately. Top up any time on the Wallet page.
            </Step>
            <hr className="divider" />
            <Step n="3" title="Choose your display currency (optional)">
              Open the account menu and pick a country under <em>Display currency</em>. This only
              changes how prices are shown (₹, $, £, €, ¥…) — the underlying value never changes.
            </Step>
            <hr className="divider" />
            <Step n="4" title="Pick a path">
              Go to <em>Discover</em> to book access as a seeker, or to <em>Connect</em> to list a
              subscription as an owner. You can do both from the same account.
            </Step>
          </div>
          <div className="row wrap" style={{ gap: 12, marginTop: 20 }}>
            <button className="btn btn-white" onClick={() => navigate('/signup')}>Create an account</button>
            <button className="btn btn-ghost" onClick={() => navigate('/discover')}>Browse Discover</button>
          </div>
        </Section>

        <hr className="divider" style={{ margin: '36px 0' }} />

        {/* ── Core concepts ────────────────────────────────────── */}
        <Section id="concepts" icon="grid" eyebrow="The vocabulary" title="Core concepts">
          <div className="card pad-lg">
            <Define term="Listing">
              An offer to share temporary access to one subscription, with a ladder of durations and
              prices. Listings come from the bundled demo catalog <em>and</em> from real members
              (shown in a “New from members” row on Discover).
            </Define>
            <Define term="Booking">
              A seeker reserving a listing for a specific window. A booking moves through several
              states — held → active → completed, or refunded — described in the lifecycle section.
            </Define>
            <Define term="twelve Wallet">
              Your real in-app balance, held in USD. Bookings are paid from it, refunds return to it,
              and earnings are credited to it. Every movement is recorded in a ledger.
            </Define>
            <Define term="Hold (escrow-style)">
              When you book, the price is debited from your Wallet immediately but <em>not</em>
              released to the owner. It stays held until access is confirmed and the window ends.
            </Define>
            <Define term="Setup chat">
              A private, booking-scoped thread between the buyer and owner where access is arranged
              and both parties confirm before the clock starts.
            </Define>
            <Define term="Two-party handshake">
              Access only starts when <em>both</em> the owner (“I've shared access”) and the buyer
              (“I'm in — confirm access”) confirm. Enforced on the server, with a timestamp for each.
            </Define>
            <Define term="Settlement">
              When the access window ends, the held payment is split between the owner, twelve, and a
              fixed 20% provider reserve, using a duration-tiered formula.
            </Define>
            <Define term="Provider reserve">
              A hypothetical 20% share always set aside for the real provider (e.g. Netflix). It's
              constant across every booking length.
            </Define>
          </div>
        </Section>

        <hr className="divider" style={{ margin: '36px 0' }} />

        {/* ── Map of the app ───────────────────────────────────── */}
        <Section id="map" icon="compass" eyebrow="Every page, explained" title="A map of the app">
          <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: 16 }}>
            Public pages are open to anyone; account pages require you to be signed in.
          </p>
          <Table
            head={['Page', 'Access', 'What it is for']}
            rows={[
              ['Landing', 'Public', 'The intro / pitch and entry points'],
              ['Discover', 'Public', 'Browse and search all listings by category'],
              ['Listing details', 'Public', 'A single listing — pick a duration and book'],
              ['Checkout', 'Sign-in', 'Confirm and pay for a booking'],
              ['Setup chat', 'Sign-in', 'Arrange & confirm access with the other party'],
              ['Access screen', 'Public link', 'The simulated provider environment + countdown'],
              ['Wallet', 'Sign-in', 'Balance, ledger and top-ups'],
              ['Dashboard', 'Sign-in', 'Your listings, setup requests and live bookings'],
              ['My bookings', 'Sign-in', 'Bookings you have made (awaiting / active / refunded)'],
              ['Connect', 'Sign-in', 'Link a subscription (simulated) to list'],
              ['Create listing', 'Sign-in', 'Publish a listing with a stepper'],
              ['Earnings', 'Sign-in', 'Your owner earnings and revenue split'],
              ['Profile', 'Sign-in', 'Account details and demo reset'],
              ['How it works', 'Public', 'The short six-step journey'],
              ['Manual', 'Public', 'This page']
            ]}
          />
          <Callout icon="search" title="Quick search">
            Press <strong>Ctrl / ⌘ + K</strong> anywhere to open search and jump to a provider or
            listing instantly.
          </Callout>
        </Section>

        <hr className="divider" style={{ margin: '36px 0' }} />

        {/* ── Seekers ──────────────────────────────────────────── */}
        <Section id="seekers" icon="ticket" eyebrow="If you're booking" title="Booking access (seekers)">
          <div className="card pad-lg">
            <Step n="1" title="Discover a listing">
              Browse the marketplace by category (Entertainment, Education, AI Models), or search
              with Ctrl/⌘+K. Real member listings appear alongside the demo catalog.
            </Step>
            <hr className="divider" />
            <Step n="2" title="Pick a duration">
              On a listing, choose one of six windows: <strong>3h · 6h · 12h · 24h · 3 days · 7 days</strong>.
              The price updates as you change the window (longer windows cost more in total but less
              per hour).
            </Step>
            <hr className="divider" />
            <Step n="3" title="Book Now — payment held">
              <em>Book Now</em> holds the price from your Wallet and opens a private setup chat with a
              <strong> 10-minute</strong> window. Prefer to pay another way? Use <em>Pay another way</em>
              at checkout for Card, UPI, PayPal or Bank (all simulated). Paying by Wallet there routes
              through the same hold + chat.
            </Step>
            <hr className="divider" />
            <Step n="4" title="Confirm in the setup chat">
              The owner shares access and marks “I've shared access”. You then mark
              “I'm in — confirm access”. Only when <strong>both</strong> sides confirm does the booking
              go <strong>ACTIVE</strong> and your paid-for time begin. (For demo-catalog listings, your
              confirmation alone is enough — there's no real owner.)
            </Step>
            <hr className="divider" />
            <Step n="5" title="Use it — with a live countdown">
              Open the simulated provider environment for that vertical (streaming, course, or AI
              chat). A twelve access strip shows your remaining time, ticking down live.
            </Step>
            <hr className="divider" />
            <Step n="6" title="Automatic expiry">
              When the window ends — or if you end it early — access is revoked and the booking moves
              to <em>Completed</em>. Track everything under <em>My bookings</em>.
            </Step>
          </div>
          <Callout tone="green" icon="refresh" title="Setup fails? You're refunded in full">
            If setup isn't confirmed by both sides within the 10-minute window, the booking is
            cancelled and the <strong>entire held amount is returned</strong> to your Wallet. The
            listing becomes available again.
          </Callout>
        </Section>

        <hr className="divider" style={{ margin: '36px 0' }} />

        {/* ── Owners ───────────────────────────────────────────── */}
        <Section id="owners" icon="tag" eyebrow="If you're listing" title="Listing & earning (owners)">
          <div className="card pad-lg">
            <Step n="1" title="Connect a subscription">
              From <em>Connect</em>, link a subscription you already pay for. In this MVP the link is
              simulated — no provider passwords, OTPs or cookies are collected.
            </Step>
            <hr className="divider" />
            <Step n="2" title="Create a listing">
              Use the stepper to publish your unused capacity: pick the provider and category, add a
              title/description, choose your default duration and number of seats. The price ladder is
              generated for you, and you can preview your revenue split before publishing.
            </Step>
            <hr className="divider" />
            <Step n="3" title="Respond to setup requests">
              When someone books, an incoming <em>Setup request</em> appears on your Dashboard. Open
              the setup chat, share access to the buyer, and mark “I've shared access”.
            </Step>
            <hr className="divider" />
            <Step n="4" title="Earn on settlement">
              When the buyer's window ends, your share is credited to your Wallet automatically.
              Longer bookings earn you a larger share (see the settlement table). Track totals under
              <em> Earnings</em>.
            </Step>
          </div>
          <Callout icon="info" title="Your dashboard is yours alone">
            You only ever see your own listings, your own earnings, and bookings on your own listings.
            A brand-new account starts empty and greets you by name — it fills up as you list and book.
          </Callout>
          <div className="row wrap" style={{ gap: 12, marginTop: 20 }}>
            <button className="btn btn-white" onClick={() => navigate('/connect')}>Connect a subscription</button>
            <button className="btn btn-ghost" onClick={() => navigate('/create-listing')}>Create a listing</button>
          </div>
        </Section>

        <hr className="divider" style={{ margin: '36px 0' }} />

        {/* ── Wallet ───────────────────────────────────────────── */}
        <Section id="wallet" icon="wallet" eyebrow="Your money" title="The twelve Wallet">
          <p className="text-secondary" style={{ lineHeight: 1.7 }}>
            Every account has a real balance held in <strong>USD</strong> (the canonical unit). The
            Wallet page shows your balance and a ledger of your recent movements. Every ledger entry
            has a type:
          </p>
          <div style={{ marginTop: 16 }}>
            <Table
              head={['Ledger type', 'When it happens', 'Effect on balance']}
              rows={[
                ['Top-up', 'You add demo funds ($1–$1000)', '↑ Increases'],
                ['Hold', 'You book a listing', '↓ Decreases (escrowed)'],
                ['Refund', 'A setup fails or times out', '↑ Returns in full'],
                ['Settlement', 'A booking you own completes', '↑ Your owner share']
              ]}
            />
          </div>
          <Callout tone="amber" icon="info" title="Insufficient balance">
            A booking can't take your balance below zero. If you don't have enough for a booking, top
            up first, or pay another way at checkout. Top-ups are simulated — no real money moves.
          </Callout>
          <div className="row wrap" style={{ gap: 12, marginTop: 4 }}>
            <button className="btn btn-white" onClick={() => navigate('/wallet')}>Open Wallet</button>
          </div>
        </Section>

        <hr className="divider" style={{ margin: '36px 0' }} />

        {/* ── Payment methods ──────────────────────────────────── */}
        <Section id="payments" icon="card" eyebrow="At checkout" title="Payment methods">
          <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: 8 }}>
            Every payment method in twelve is <strong>simulated</strong> — no real charge is made and
            no card or bank details are ever stored. The options are:
          </p>
          <div className="card pad-lg">
            <Define term="twelve Wallet">Pay from your in-app balance. This is the path that uses the hold + setup-chat flow.</Define>
            <Define term="Card">A demo card form with a live card preview. Any well-formed number works; nothing is charged.</Define>
            <Define term="UPI">Enter a UPI ID (name@bank) — simulated approval.</Define>
            <Define term="PayPal">A simulated “redirect to PayPal” confirmation.</Define>
            <Define term="Bank">Pick a bank for simulated net-banking.</Define>
          </div>
          <Callout icon="lock" title="Nothing real is collected">
            The lock line under the payment form says it plainly: prototype payment, no real charge,
            no details stored. Never enter a real card or real credentials.
          </Callout>
        </Section>

        <hr className="divider" style={{ margin: '36px 0' }} />

        {/* ── Lifecycle & settlement ───────────────────────────── */}
        <Section id="lifecycle" icon="refresh" eyebrow="What happens under the hood" title="Booking lifecycle & settlement">
          <p className="text-secondary" style={{ lineHeight: 1.7 }}>
            Access never starts on one person's say-so. It begins on a two-party handshake, enforced
            on the server with a timestamped record for each side. A booking flows like this:
          </p>

          {/* State flow */}
          <div className="row wrap" style={{ gap: 8, marginTop: 18, alignItems: 'center' }}>
            <span className="pill pill-amber">HELD</span>
            <Icon name="arrowRight" size={16} className="text-muted" />
            <span className="pill pill-accent">SETUP CHAT</span>
            <Icon name="arrowRight" size={16} className="text-muted" />
            <span className="pill pill-green">ACTIVE</span>
            <Icon name="arrowRight" size={16} className="text-muted" />
            <span className="pill">COMPLETED</span>
            <span className="text-muted" style={{ margin: '0 6px' }}>or</span>
            <span className="pill pill-red">REFUNDED</span>
          </div>

          <div className="card pad-lg" style={{ marginTop: 20 }}>
            <Step n="•" title="Held">
              Price debited from the buyer's Wallet and held in escrow; a 10-minute setup chat opens.
            </Step>
            <hr className="divider" />
            <Step n="•" title="Confirmed by both">
              Owner shares access; buyer confirms receipt. Only then does the booking go active and
              the settlement clock start. (Demo-catalog listings need only the buyer's confirmation.)
            </Step>
            <hr className="divider" />
            <Step n="•" title="Active">
              The paid-for usage period runs, with a live countdown, until it expires or the buyer
              ends it early.
            </Step>
            <hr className="divider" />
            <Step n="•" title="Settled or refunded">
              At expiry the held payment is split (below). A failed or timed-out setup refunds the
              buyer in full and frees the listing.
            </Step>
          </div>

          <Callout icon="clock" title="Reconciled lazily, on read">
            There is no background worker. Timeouts and expirations resolve the next time a booking is
            read: reading a held booking past its 10-minute window auto-refunds it; reading an active
            booking past its expiry settles it.
          </Callout>

          {/* Settlement table */}
          <h4 style={{ marginTop: 24, marginBottom: 12 }}>Duration-tiered settlement</h4>
          <p className="text-secondary" style={{ fontSize: '0.94rem', lineHeight: 1.6, marginBottom: 14 }}>
            The <strong>provider reserve is always 20%</strong>. The owner's share grows with longer
            bookings as twelve's platform fee shrinks:
          </p>
          <Table
            head={['Access window', 'Owner', 'twelve', 'Provider reserve']}
            rows={[
              ['≤ 12 hours', '30%', '50%', '20%'],
              ['24 hours', '35%', '45%', '20%'],
              ['3 days', '40%', '40%', '20%'],
              ['≥ 7 days', '45%', '35%', '20%']
            ]}
          />

          <h4 style={{ marginTop: 24, marginBottom: 10 }}>Worked example</h4>
          <div className="card pad-lg">
            <p className="text-secondary" style={{ fontSize: '0.94rem', lineHeight: 1.7 }}>
              Say a buyer books a <strong>24-hour</strong> window for <strong>$10.00</strong>. That
              $10 is held on booking. When the window ends and the booking settles:
            </p>
            <div style={{ marginTop: 12 }}>
              <div className="between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}><span>Owner (35%)</span><span className="mono">$3.50</span></div>
              <div className="between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}><span>twelve platform fee (45%)</span><span className="mono">$4.50</span></div>
              <div className="between" style={{ padding: '8px 0' }}><span>Provider reserve (20%)</span><span className="mono">$2.00</span></div>
            </div>
          </div>
          <p className="text-muted" style={{ fontSize: '0.86rem', marginTop: 12, lineHeight: 1.6 }}>
            Booking a <em>demo-catalog</em> listing settles only to the booker — those owners aren't
            real accounts, so no owner share is credited.
          </p>
        </Section>

        <hr className="divider" style={{ margin: '36px 0' }} />

        {/* ── Pricing ──────────────────────────────────────────── */}
        <Section id="pricing" icon="globe" eyebrow="How prices work" title="Pricing & currency">
          <div className="card pad-lg">
            <Define term="One canonical price">
              Every price is derived from the provider's real <strong>monthly plan price in India</strong>
              (in ₹) — the single source of truth, the same for everyone everywhere. twelve does not
              re-price by the buyer's country.
            </Define>
            <Define term="USD internally">
              That India value is expressed in <strong>USD</strong> at a reference rate (₹83/$) so the
              Wallet, ledger and settlement all use one unit.
            </Define>
            <Define term="Local display currency">
              The country selector converts the USD value into a display currency (₹, $, £, €, ¥ and
              more). It only changes what you see, never what is stored. The default is USD.
            </Define>
            <Define term="The rental curve">
              A booking's buyer price follows a convex curve — roughly
              {' '}<span className="mono">monthly × (hours ÷ 720)^0.55</span>. Short bookings carry a
              convenience premium; multi-day bookings taper toward — but always stay below — the full
              monthly plan. A small floor keeps every booking commercially meaningful, and each step
              costs more than the one before it.
            </Define>
          </div>
          <Callout icon="info" title="Why longer looks cheaper per hour">
            Because the curve's exponent is below 1, a 7-day window costs more in total than a 3-hour
            one, but far less per hour — rewarding longer commitments, just like real-world rentals.
          </Callout>
        </Section>

        <hr className="divider" style={{ margin: '36px 0' }} />

        {/* ── Safety ───────────────────────────────────────────── */}
        <Section id="safety" icon="shieldCheck" eyebrow="Built-in by design" title="Safety & privacy">
          <p className="text-secondary" style={{ lineHeight: 1.7, marginBottom: 20 }}>
            twelve is built around temporary, authorized access — never credential sharing.
          </p>
          <TrustCards />
          <div className="card pad-lg" style={{ marginTop: 20 }}>
            <Define term="Passwords">Hashed with bcrypt (cost 12). Your plaintext password is never stored.</Define>
            <Define term="Sessions">A signed JWT kept in an httpOnly cookie — JavaScript can't read it.</Define>
            <Define term="No provider credentials">No provider passwords, OTPs or cookies are ever collected or shared. Provider access is simulated.</Define>
            <Define term="No copyrighted assets">Every logo is an original CSS/SVG wordmark; every “poster” is generated from gradients. No copyrighted logos, posters or model outputs are reproduced.</Define>
          </div>
          <Disclaimer style={{ marginTop: 22 }} />
        </Section>

        <hr className="divider" style={{ margin: '36px 0' }} />

        {/* ── Demo & admin ─────────────────────────────────────── */}
        <Section id="demo" icon="sparkle" eyebrow="Running the prototype" title="Demo & admin">
          <div className="card pad-lg">
            <Define term="Starter credit">
              New accounts begin with <strong>₹100 (~$1.20)</strong> of demo Wallet credit. Top up any
              time (up to $1000 per top-up) on the Wallet page.
            </Define>
            <Define term="Reset demo">
              Use <em>Reset demo</em> on the Dashboard or Profile to restore the in-app seed data
              between run-throughs — without deleting accounts.
            </Define>
            <Define term="Reset the database (developers)">
              To wipe <strong>all</strong> accounts, listings and bookings, stop the server and run
              {' '}<span className="mono">npm run reset-db</span>. A fresh, empty database is created on
              the next start. (Add <span className="mono">-- --yes</span> to skip the prompt.)
            </Define>
            <Define term="Google Sign-In (developers)">
              Optional. Add a free Google OAuth Web Client ID to both{' '}
              <span className="mono">GOOGLE_CLIENT_ID</span> and{' '}
              <span className="mono">VITE_GOOGLE_CLIENT_ID</span> in <span className="mono">.env</span>,
              then restart. Email/password works with no configuration.
            </Define>
            <Define term="Simulated providers">
              The streaming, course and AI-chat screens are simulations. AI responses are generic
              placeholders; nothing connects to a real provider account.
            </Define>
          </div>
        </Section>

        <hr className="divider" style={{ margin: '36px 0' }} />

        {/* ── Troubleshooting ──────────────────────────────────── */}
        <Section id="troubleshooting" icon="gear" eyebrow="If something looks off" title="Troubleshooting">
          <div className="card pad-lg">
            <Define term="My dashboard is empty">
              Dashboards are per-user — you only see your own listings, bookings and earnings. Publish
              a listing or make a booking and it will populate.
            </Define>
            <Define term="My booking never went active">
              Both sides must confirm within the 10-minute window. If either side doesn't, the booking
              times out and your held payment is refunded. Check <em>My bookings</em> for the refund.
            </Define>
            <Define term="“Insufficient balance” at checkout">
              Your Wallet balance is below the booking price. Top up on the Wallet page, or use
              <em> Pay another way</em> to pick a different (simulated) method.
            </Define>
            <Define term="Prices look different from a friend's">
              Prices are identical everywhere — only the <em>display</em> currency differs. Check the
              display currency in your account menu.
            </Define>
            <Define term="Google button doesn't appear">
              Google Sign-In needs a configured OAuth Client ID. Without it, use email/password — it
              always works.
            </Define>
          </div>
        </Section>

        <hr className="divider" style={{ margin: '36px 0' }} />

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <Section id="faq" icon="bell" eyebrow="Common questions" title="FAQ">
          <div className="card pad-lg">
            <Define term="Do I ever share my Netflix / ChatGPT password?">
              No. Provider authorization is simulated. You never enter or share any provider
              credential, OTP or cookie.
            </Define>
            <Define term="What happens if the owner never shares access?">
              If setup isn't confirmed by both sides within the 10-minute window, the booking is
              cancelled and your held payment is refunded in full.
            </Define>
            <Define term="Can I end a booking early?">
              Yes. Ending early stops access and settles the booking at that point.
            </Define>
            <Define term="How much do I earn as an owner?">
              Between 30% and 45% of the booking price, depending on its length — longer bookings pay
              you a larger share. The provider reserve is always 20%.
            </Define>
            <Define term="Is real money involved?">
              No. The Wallet, top-ups and every payment method are simulated for this prototype.
            </Define>
            <Define term="Is Apple / other sign-in available?">
              Email/password and Google Sign-In are supported. Other SSO providers need paid developer
              accounts and an HTTPS domain, so they're left out of this local prototype.
            </Define>
          </div>
        </Section>

        <hr className="divider" style={{ margin: '36px 0' }} />

        {/* ── Glossary ─────────────────────────────────────────── */}
        <Section id="glossary" icon="book" eyebrow="Quick reference" title="Glossary">
          <div className="card pad-lg">
            <Define term="Owner">A member who lists access to a subscription they pay for.</Define>
            <Define term="Seeker / buyer">A member who books temporary access to a listing.</Define>
            <Define term="Listing">An offer of temporary access, with a duration/price ladder.</Define>
            <Define term="Held payment">Money debited and escrowed, not yet released.</Define>
            <Define term="Setup chat">The private thread where access is arranged and confirmed.</Define>
            <Define term="Active">A booking whose access window is currently running.</Define>
            <Define term="Settlement">The split of a completed booking's payment.</Define>
            <Define term="Provider reserve">The fixed 20% set aside for the real provider.</Define>
            <Define term="Lazy reconciliation">Expiry/refund resolved when a booking is next read, not by a worker.</Define>
            <Define term="Canonical USD">The single internal unit for all money; display currency is cosmetic.</Define>
          </div>
        </Section>

        {/* CTA */}
        <div className="center" style={{ flexDirection: 'column', gap: 16, textAlign: 'center', marginTop: 48 }}>
          <h2 className="h-section">Ready to try it?</h2>
          <div className="row" style={{ gap: 12 }}>
            <button className="btn btn-white btn-lg" onClick={() => navigate('/discover')}>Explore Access</button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/how-it-works')}>How it works</button>
          </div>
        </div>
      </div>
    </div>
  )
}
