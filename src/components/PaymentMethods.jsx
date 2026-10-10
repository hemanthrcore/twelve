import { useEffect } from 'react'
import Icon from './Icon'
import { inr } from '../lib/format'

// Shared simulated payment UI (method tabs + animated card) used by Checkout and
// the Wallet top-up. It owns the card/upi/bank field state and reports validity
// to the parent via onValidityChange. No real payment is processed or stored.

export const METHOD_DEFS = {
  card:   { id: 'card',   label: 'Card',   icon: 'card',   sub: 'Simulation' },
  wallet: { id: 'wallet', label: 'Wallet', icon: 'wallet', sub: 'twelve balance' },
  upi:    { id: 'upi',    label: 'UPI',    icon: 'upi',    sub: 'Simulation' },
  paypal: { id: 'paypal', label: 'PayPal', icon: 'globe',  sub: 'Simulation' },
  bank:   { id: 'bank',   label: 'Bank',   icon: 'bank',   sub: 'Simulation' }
}

export function Spinner({ size = 16 }) {
  return (
    <span style={{ width: size, height: size, border: `${Math.max(2, size / 8)}px solid rgba(255,255,255,0.25)`, borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  )
}

export default function PaymentMethods({ methods = ['card', 'paypal', 'bank'], value, onChange, onValidityChange, amount = 0, walletBalance = 0 }) {
  const valid =
    value === 'wallet' ? walletBalance >= amount : true

  useEffect(() => { onValidityChange?.(valid) }, [valid, value]) // eslint-disable-line

  return (
    <div>
      <div className="method-grid">
        {methods.map((id) => {
          const m = METHOD_DEFS[id]
          if (!m) return null
          return (
            <button key={m.id} type="button" className={`method-tab ${value === m.id ? 'active' : ''}`} onClick={() => onChange(m.id)}>
              <Icon name={m.icon} size={20} />
              <div className="col" style={{ alignItems: 'flex-start', gap: 1 }}>
                <span style={{ fontWeight: 550, fontSize: '0.9rem' }}>{m.label}</span>
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>{m.sub}</span>
              </div>
            </button>
          )
        })}
      </div>

      {value === 'card' && <DemoMethod title="Card simulation" body="No card number, expiry date, CVV, or billing details are requested." />}

      {/* WALLET */}
      {value === 'wallet' && (
        <div style={{ marginTop: 20 }}>
          <div className="card pad between" style={{ background: 'var(--card-elevated)' }}>
            <div className="row" style={{ gap: 12 }}>
              <span className="trust-ico" style={{ margin: 0, width: 38, height: 38 }}><Icon name="wallet" size={18} /></span>
              <div>
                <div style={{ fontWeight: 550 }}>twelve Wallet</div>
                <div className="text-muted" style={{ fontSize: '0.78rem' }}>Available balance</div>
              </div>
            </div>
            <span className="price" style={{ fontSize: '1.2rem' }}>{inr(walletBalance)}</span>
          </div>
          {walletBalance < amount
            ? <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: 10, color: 'var(--amber)' }}>Insufficient balance for this booking.</p>
            : <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: 10 }}>Payment is held until access is set up, then settled or refunded.</p>}
        </div>
      )}

      {value === 'upi' && <DemoMethod title="UPI simulation" body="No UPI ID or bank information is requested." />}

      {/* PAYPAL */}
      {value === 'paypal' && (
        <div style={{ marginTop: 20 }}>
          <div className="card pad" style={{ textAlign: 'center' }}>
            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>No redirect occurs. This is a local simulation and no PayPal account details are requested.</p>
          </div>
        </div>
      )}

      {value === 'bank' && <DemoMethod title="Bank transfer simulation" body="No bank login, account number, or routing details are requested." />}

      <div className="row" style={{ gap: 7, marginTop: 18 }}>
        <Icon name="lock" size={13} className="text-muted" />
        <span className="text-muted" style={{ fontSize: '0.76rem' }}>Demo only — no payment is processed and no financial details are collected.</span>
      </div>
    </div>
  )
}

function DemoMethod({ title, body }) {
  return (
    <div className="card pad" style={{ marginTop: 20, background: 'var(--card-elevated)' }}>
      <div className="row" style={{ gap: 10 }}><Icon name="shieldCheck" size={18} style={{ color: 'var(--green)' }} /><strong>{title}</strong></div>
      <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: 8 }}>{body}</p>
    </div>
  )
}
