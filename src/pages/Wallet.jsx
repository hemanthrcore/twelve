import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import PaymentMethods, { Spinner } from '../components/PaymentMethods'
import { EmptyState } from '../components/UI'
import { inr, fmtDateTime } from '../lib/format'
import { useApp } from '../store/AppContext'

const PRESETS = [10, 25, 50, 100]

const LEDGER_META = {
  topup:  { label: 'Added money',    icon: 'plus',    color: 'var(--green)' },
  refund: { label: 'Refund',         icon: 'refresh', color: 'var(--green)' },
  settle: { label: 'Owner earnings', icon: 'trend',   color: 'var(--green)' },
  hold:   { label: 'Payment held',   icon: 'lock',    color: 'var(--amber)' }
}

export default function Wallet() {
  const navigate = useNavigate()
  const { wallet, refreshWallet, topUp, toast, authUser } = useApp()
  const [amount, setAmount] = useState(25)
  const [method, setMethod] = useState('card')
  const [canPay, setCanPay] = useState(false)
  const [stage, setStage] = useState('idle') // idle | processing | done

  useEffect(() => { refreshWallet() }, [refreshWallet])

  const value = Number(amount) || 0
  const ready = value > 0 && canPay

  const add = () => {
    if (!ready || stage !== 'idle') return
    setStage('processing')
    setTimeout(async () => {
      const r = await topUp(value)
      if (r.ok) {
        setStage('done')
        toast(`Added ${inr(value)} to your Wallet`, 'success')
        setTimeout(() => setStage('idle'), 900)
      } else {
        setStage('idle')
        toast(r.error || 'Could not add money', 'error')
      }
    }, 1600)
  }

  return (
    <div className="page">
      <section className="section-tight">
        <div className="container" style={{ maxWidth: 760 }}>
          <h1 style={{ fontSize: 'clamp(1.8rem,3.4vw,2.6rem)' }}>twelve Wallet</h1>
          <p className="text-secondary" style={{ marginTop: 8 }}>Your balance funds bookings. When you book, the amount is held until access is set up, then settled or refunded.</p>

          {/* Premium balance card */}
          <div style={{
            position: 'relative', marginTop: 24, borderRadius: 22, overflow: 'hidden',
            padding: '24px 26px 22px', color: '#fff',
            background: 'linear-gradient(135deg, #0a3d91 0%, #0071e3 44%, #05132e 100%)',
            border: '1px solid rgba(255,255,255,0.16)',
            boxShadow: '0 24px 60px -24px rgba(0,113,227,0.65), inset 0 1px 0 rgba(255,255,255,0.14)'
          }}>
            {/* sheen + orbs */}
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(130% 80% at 12% 0%, rgba(255,255,255,0.22), transparent 52%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: -60, bottom: -80, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%)', pointerEvents: 'none' }} />

            <div className="between" style={{ position: 'relative' }}>
              <div className="row" style={{ gap: 8 }}>
                <Icon name="wallet" size={17} style={{ color: '#fff' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, letterSpacing: '-0.01em' }}>twelve Wallet</span>
              </div>
              <span style={{ fontSize: '0.72rem', letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.85, fontWeight: 700 }}>twelve</span>
            </div>

            {/* chip */}
            <div style={{ position: 'relative', width: 44, height: 32, borderRadius: 7, marginTop: 20,
              background: 'linear-gradient(135deg, #f6dc96 0%, #cBA24a 50%, #a8842f 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)' }}>
              <div style={{ position: 'absolute', inset: '6px 8px', borderRadius: 3, border: '1px solid rgba(0,0,0,0.22)' }} />
            </div>

            <div style={{ position: 'relative', fontSize: '0.7rem', letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.75, marginTop: 18 }}>Available balance</div>
            <div style={{ position: 'relative', fontSize: '2.9rem', fontWeight: 800, marginTop: 2, letterSpacing: '-0.02em', lineHeight: 1.05 }}>{inr(wallet.balance)}</div>

            <div className="between" style={{ position: 'relative', marginTop: 20, alignItems: 'flex-end' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.6 }}>Card holder</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{authUser?.name || 'twelve member'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.6 }}>Member</div>
                <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.08em' }}>•••• {String(authUser?.id ?? '00').padStart(2, '0').slice(-4)}</div>
              </div>
            </div>
          </div>

          {/* Add money */}
          <div className="card pad-lg" style={{ marginTop: 18 }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: 4 }}>Add money</h3>
            <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: 16 }}>Simulated top-up for this prototype — no real payment is processed.</p>

            <label className="field-label">Amount</label>
            <div className="row wrap" style={{ gap: 8, marginBottom: 12 }}>
              {PRESETS.map((v) => (
                <button key={v} className={`btn btn-sm ${value === v ? 'btn-white' : 'btn-outline'}`} onClick={() => setAmount(v)}>
                  {inr(v)}
                </button>
              ))}
              <div style={{ position: 'relative', width: 130 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>$</span>
                <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} style={{ paddingLeft: 24 }} />
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <PaymentMethods
                methods={['card', 'upi', 'paypal', 'bank']}
                value={method}
                onChange={setMethod}
                onValidityChange={setCanPay}
              />
            </div>

            <button className="btn btn-accent btn-lg btn-block" style={{ marginTop: 20 }} onClick={add} disabled={!ready || stage !== 'idle'}>
              {stage === 'processing' ? <><Spinner /> Processing…</>
                : stage === 'done' ? <><Icon name="check" size={18} /> Added</>
                : <><Icon name="plus" size={16} /> Add {inr(value)}</>}
            </button>
          </div>

          {/* Ledger */}
          <h3 style={{ fontSize: '1.05rem', margin: '28px 0 14px' }}>Recent activity</h3>
          {(!wallet.ledger || wallet.ledger.length === 0) ? (
            <EmptyState icon="wallet" title="No activity yet" body="Holds, refunds and settlements will show up here as you book." />
          ) : (
            <div className="col" style={{ gap: 8 }}>
              {wallet.ledger.map((e) => {
                const meta = LEDGER_META[e.type] || { label: e.type, icon: 'wallet', color: 'var(--text)' }
                const credit = e.amount >= 0
                return (
                  <div className="card pad row between" key={e.id} style={{ gap: 12 }}>
                    <div className="row" style={{ gap: 12, minWidth: 0 }}>
                      <span className="trust-ico" style={{ margin: 0, width: 38, height: 38, color: meta.color }}><Icon name={meta.icon} size={16} /></span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 550, fontSize: '0.92rem' }}>{meta.label}</div>
                        <div className="text-muted" style={{ fontSize: '0.76rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.note || ''} · {fmtDateTime(e.createdAt)}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flex: 'none' }}>
                      <div style={{ fontWeight: 700, color: credit ? 'var(--green)' : 'var(--text)' }}>{credit ? '+' : '−'}{inr(Math.abs(e.amount))}</div>
                      <div className="text-muted mono" style={{ fontSize: '0.72rem' }}>{inr(e.balanceAfter)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="row" style={{ gap: 10, marginTop: 24 }}>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/bookings')}><Icon name="ticket" size={15} /> My bookings</button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/discover')}>Explore access</button>
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
                <h3 style={{ fontSize: '1.15rem' }}>Adding money</h3>
                <p className="text-secondary" style={{ marginTop: 8, fontSize: '0.9rem' }}>Securely topping up {inr(value)}…</p>
              </>
            ) : (
              <>
                <div className="check-circle" style={{ width: 72, height: 72 }}>
                  <svg className="check-svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#6ee787" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </div>
                <h3 style={{ fontSize: '1.15rem', marginTop: 16 }}>Money added</h3>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
