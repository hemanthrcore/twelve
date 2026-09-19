import Icon from './Icon'

// Section heading with optional "see all"
export function SectionHead({ eyebrow, title, sub, action }) {
  return (
    <div className="between wrap" style={{ marginBottom: 20, gap: 14 }}>
      <div>
        {eyebrow && <p className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</p>}
        <h2 className="h-section">{title}</h2>
        {sub && <p className="text-secondary" style={{ marginTop: 8, maxWidth: 560 }}>{sub}</p>}
      </div>
      {action}
    </div>
  )
}

// The trust triad — no credential sharing / auto expiry / authorized access
export function TrustCards() {
  const items = [
    { icon: 'lock', title: 'No credential sharing', body: 'No passwords, OTPs or cookies. Ever.' },
    { icon: 'clock', title: 'Automatic expiration', body: 'Access ends the moment your booking does.' },
    { icon: 'shieldCheck', title: 'Authorized access', body: 'Provider authorization is simulated for this MVP.' }
  ]
  return (
    <div className="trust-grid">
      {items.map((i) => (
        <div className="trust-card" key={i.title}>
          <div className="trust-ico"><Icon name={i.icon} size={20} /></div>
          <h4 style={{ fontSize: '1rem', marginBottom: 6 }}>{i.title}</h4>
          <p className="text-muted" style={{ fontSize: '0.86rem' }}>{i.body}</p>
        </div>
      ))}
    </div>
  )
}

export function Stepper({ steps, current }) {
  return (
    <div className="stepper" style={{ flexWrap: 'wrap', rowGap: 12 }}>
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div className={`step ${active ? 'active' : ''} ${done ? 'done' : ''}`} key={label}>
            {i > 0 && <span className="step-line" />}
            <span className="step-dot">{done ? <Icon name="check" size={14} stroke={2.6} /> : i + 1}</span>
            <span className="step-label hide-mobile">{label}</span>
          </div>
        )
      })}
    </div>
  )
}

export function DemoTag({ children = 'Prototype / demo listing', style }) {
  return (
    <span className="pill" style={{ fontSize: '0.72rem', color: 'var(--muted)', ...style }}>
      <Icon name="sparkle" size={12} /> {children}
    </span>
  )
}

export function Disclaimer({ children, style }) {
  return (
    <p className="disclaimer" style={{ ...style }}>
      {children ||
        'Third-party trademarks and imagery are shown for demonstration purposes only. twelve has no affiliation with these providers in this prototype.'}
    </p>
  )
}

export function EmptyState({ icon = 'ticket', title, body, action }) {
  return (
    <div className="empty">
      <div className="empty-ico"><Icon name={icon} size={26} className="text-secondary" /></div>
      <h3 style={{ fontSize: '1.15rem' }}>{title}</h3>
      {body && <p className="text-muted" style={{ marginTop: 8, maxWidth: 380, marginInline: 'auto' }}>{body}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  )
}

export function RowScroller({ children }) {
  return <div className="scroll-row">{children}</div>
}
