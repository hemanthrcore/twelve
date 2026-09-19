import { useState, useEffect } from 'react'
import Icon from './Icon'
import { inr } from '../lib/format'

// Shared simulated payment UI (method tabs + animated card) used by Checkout and
// the Wallet top-up. It owns the card/upi/bank field state and reports validity
// to the parent via onValidityChange. No real payment is processed or stored.

export const METHOD_DEFS = {
  card:   { id: 'card',   label: 'Card',   icon: 'card',   sub: 'Credit or debit' },
  wallet: { id: 'wallet', label: 'Wallet', icon: 'wallet', sub: 'twelve balance' },
  upi:    { id: 'upi',    label: 'UPI',    icon: 'upi',    sub: 'Pay by UPI ID' },
  paypal: { id: 'paypal', label: 'PayPal', icon: 'globe',  sub: 'Pay via PayPal' },
  bank:   { id: 'bank',   label: 'Bank',   icon: 'bank',   sub: 'Net banking' }
}

function detectBrand(num) {
  const n = num.replace(/\s/g, '')
  if (/^4/.test(n)) return 'Visa'
  if (/^(5[1-5]|22[2-9]|2[3-7])/.test(n)) return 'Mastercard'
  if (/^3[47]/.test(n)) return 'Amex'
  if (/^6/.test(n)) return 'Discover'
  if (/^3(0|6|8)/.test(n)) return 'Diners'
  return ''
}
function formatCard(v) {
  const d = v.replace(/\D/g, '').slice(0, 16)
  return d.replace(/(.{4})/g, '$1 ').trim()
}
function formatExpiry(v) {
  const d = v.replace(/\D/g, '').slice(0, 4)
  if (d.length <= 2) return d
  return d.slice(0, 2) + '/' + d.slice(2)
}

export function Spinner({ size = 16 }) {
  return (
    <span style={{ width: size, height: size, border: `${Math.max(2, size / 8)}px solid rgba(255,255,255,0.25)`, borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  )
}

export default function PaymentMethods({ methods = ['card', 'paypal', 'bank'], value, onChange, onValidityChange, amount = 0, walletBalance = 0 }) {
  const [card, setCard] = useState('')
  const [name, setName] = useState('')
  const [exp, setExp] = useState('')
  const [cvv, setCvv] = useState('')
  const [focus, setFocus] = useState('')
  const [upi, setUpi] = useState('')
  const [bank, setBank] = useState('')

  const brand = detectBrand(card)
  const cardValid = card.replace(/\s/g, '').length >= 15 && name.trim().length > 1 && exp.length === 5 && cvv.length >= 3
  const valid =
    value === 'card' ? cardValid :
    value === 'upi' ? upi.includes('@') :
    value === 'bank' ? !!bank :
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

      {/* CARD */}
      {value === 'card' && (
        <div style={{ marginTop: 22 }}>
          <CardPreview number={card} name={name} exp={exp} brand={brand} focus={focus} cvv={cvv} />
          <div className="col" style={{ gap: 12, marginTop: 20 }}>
            <div>
              <label className="field-label">Card number</label>
              <div style={{ position: 'relative' }}>
                <input className="input mono" inputMode="numeric" placeholder="1234 5678 9012 3456"
                  value={card} onChange={(e) => setCard(formatCard(e.target.value))}
                  onFocus={() => setFocus('number')} onBlur={() => setFocus('')} style={{ paddingRight: 74 }} />
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', fontWeight: 600, color: brand ? 'var(--text)' : 'var(--muted)' }}>{brand || 'Card'}</span>
              </div>
            </div>
            <div>
              <label className="field-label">Name on card</label>
              <input className="input" placeholder="Full name" value={name}
                onChange={(e) => setName(e.target.value)} onFocus={() => setFocus('name')} onBlur={() => setFocus('')} />
            </div>
            <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
              <div className="grow">
                <label className="field-label">Expiry</label>
                <input className="input mono" inputMode="numeric" placeholder="MM/YY" value={exp}
                  onChange={(e) => setExp(formatExpiry(e.target.value))} onFocus={() => setFocus('exp')} onBlur={() => setFocus('')} />
              </div>
              <div className="grow">
                <label className="field-label">CVV</label>
                <input className="input mono" inputMode="numeric" placeholder="123" maxLength={4} value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} onFocus={() => setFocus('cvv')} onBlur={() => setFocus('')} />
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* UPI */}
      {value === 'upi' && (
        <div style={{ marginTop: 20 }}>
          <label className="field-label">Your UPI ID</label>
          <input className="input" placeholder="name@bank" value={upi} onChange={(e) => setUpi(e.target.value)} />
        </div>
      )}

      {/* PAYPAL */}
      {value === 'paypal' && (
        <div style={{ marginTop: 20 }}>
          <div className="card pad" style={{ textAlign: 'center' }}>
            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>You’ll be redirected to PayPal to approve this payment securely. (Simulated in this prototype.)</p>
          </div>
        </div>
      )}

      {/* BANK */}
      {value === 'bank' && (
        <div style={{ marginTop: 20 }}>
          <label className="field-label">Select your bank</label>
          <select className="select" style={{ width: '100%' }} value={bank} onChange={(e) => setBank(e.target.value)}>
            <option value="">Choose a bank…</option>
            <option>Global Trust Bank</option>
            <option>First National</option>
            <option>Meridian Bank</option>
            <option>Union Digital</option>
          </select>
        </div>
      )}

      <div className="row" style={{ gap: 7, marginTop: 18 }}>
        <Icon name="lock" size={13} className="text-muted" />
        <span className="text-muted" style={{ fontSize: '0.76rem' }}>Prototype payment — no real charge is made and no details are stored.</span>
      </div>
    </div>
  )
}

function CardPreview({ number, name, exp, brand, focus, cvv }) {
  const shown = (number || '').padEnd(19, '•').slice(0, 19)
  const isBack = focus === 'cvv'
  return (
    <div style={{ position: 'relative', aspectRatio: '1.6/1', maxWidth: 360, perspective: '1100px' }} aria-label={isBack ? 'Card back' : 'Card front'}>
      <div style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d', transition: 'transform 620ms cubic-bezier(0.22, 1, 0.36, 1)', transform: isBack ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 18, padding: 22,
          background: 'linear-gradient(135deg, #1b1b1f 0%, #2a2a30 45%, #0e0e11 100%)',
          border: '1px solid var(--border-bright)', boxShadow: 'var(--shadow-elevated)',
          backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', overflow: 'hidden'
        }}>
          <div className="between">
            <div style={{ width: 42, height: 32, borderRadius: 7, background: 'linear-gradient(135deg, #d9b25b, #b8862f)', opacity: 0.9 }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: '#f5f5f7' }}>{brand || 'twelve'}</span>
          </div>
          <div className="mono" style={{ marginTop: 24, fontSize: '1.15rem', letterSpacing: '0.08em', color: '#f5f5f7', wordSpacing: '4px' }}>
            {shown.replace(/(.{4})/g, '$1 ').trim()}
          </div>
          <div className="between" style={{ marginTop: 18, alignItems: 'flex-end' }}>
            <div>
              <div className="text-muted" style={{ fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Card holder</div>
              <div style={{ fontSize: '0.86rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#e5e5e7' }}>{name || 'YOUR NAME'}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Expires</div>
              <div className="mono" style={{ fontSize: '0.86rem', color: '#e5e5e7' }}>{exp || 'MM/YY'}</div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'linear-gradient(135deg, #1b1b1f 0%, #2a2a30 45%, #0e0e11 100%)', border: '1px solid var(--border-bright)', boxShadow: 'var(--shadow-elevated)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', overflow: 'hidden' }}>
          <div style={{ height: 46, marginTop: 24, background: '#060607' }} />
          <div style={{ padding: '18px 22px 0' }}>
            <div style={{ height: 32, borderRadius: 4, background: 'repeating-linear-gradient(0deg, #e7e7e9, #e7e7e9 3px, #d4d4d7 3px, #d4d4d7 6px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10 }}>
              <span className="mono" style={{ color: '#17171a', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.12em' }}>{cvv || '•••'}</span>
            </div>
            <div className="between" style={{ marginTop: 18 }}>
              <span className="text-muted" style={{ fontSize: '0.62rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Authorized signature</span>
              <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f5f5f7' }}>{brand || 'twelve'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
