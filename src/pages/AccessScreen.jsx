import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Artwork from '../components/Artwork'
import ProviderLogo from '../components/ProviderLogo'
import Icon from '../components/Icon'
import CountdownRing from '../components/CountdownRing'
import Modal from '../components/Modal'
import { getProvider } from '../data/providers'
import { fmtTime, fmtDateTime, durationLabel, inr } from '../lib/format'
import { useApp } from '../store/AppContext'

export default function AccessScreen() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { getBooking, loadBooking, expireBooking, reportProblem, liveStatus, authUser, toast } = useApp()
  const booking = getBooking(bookingId)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [confirmReport, setConfirmReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [showCreds, setShowCreds] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => { if (!booking) loadBooking(bookingId) }, [booking, bookingId, loadBooking])

  const status = booking ? liveStatus(booking) : null
  // A booking that hasn't finished setup lives in the setup chat, not here.
  useEffect(() => {
    if (status === 'held') navigate(`/setup/${bookingId}`, { replace: true })
    if (status === 'failed') navigate('/bookings', { replace: true })
  }, [status, bookingId, navigate])

  if (!booking) return <Missing navigate={navigate} />
  const p = getProvider(booking.provider)

  // Role decides the whole screen. The OWNER (giver) provides access — they never
  // see the buyer's credentials or the End Access / Report controls; they wait for
  // the period to complete and get paid then. The BUYER (receiver) holds the
  // credentials, can end early, and can report if the access stops working.
  const isOwner = authUser && booking.ownerId === authUser.id
  const disputed = status === 'disputed'
  const finished = status === 'completed' || disputed
  const creds = buildCredentials(booking, p)

  const copy = (text, label) => {
    try { navigator.clipboard?.writeText(text); toast(`${label} copied`, 'success') } catch {}
  }

  const doReport = async () => {
    setBusy(true)
    try {
      await reportProblem(booking.id, reportReason.trim())
      toast('Reported — your payment has been refunded', 'info')
    } catch (err) { toast(err.message || 'Could not report', 'error') }
    finally { setBusy(false); setConfirmReport(false); setReportReason('') }
  }

  return (
    <div className="page" style={{ paddingTop: 0 }}>
      <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Artwork grad={finished ? ['#1a1a1a', '#2a2a2a', '#0a0a0a'] : p.gradient} seed={11} style={{ position: 'absolute', inset: 0, filter: finished ? 'grayscale(0.6)' : 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(90% 90% at 50% 20%, rgba(5,5,5,0.55), #050505 78%)' }} />

        <div className="container center grow" style={{ position: 'relative', zIndex: 2, paddingTop: 'calc(var(--nav-h) + 24px)', paddingBottom: 40 }}>
          <div style={{ textAlign: 'center', maxWidth: 520, width: '100%' }} className="fade-in">
            <div style={{ marginBottom: 14 }}><ProviderLogo id={p.id} size={1.3} onArt /></div>
            <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.6rem)' }}>{booking.title}</h1>
            <div className="center" style={{ marginTop: 12, marginBottom: 34 }}>
              {disputed
                ? <span className="pill pill-red"><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} /> Reported</span>
                : finished
                  ? <span className="pill pill-red"><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} /> Expired</span>
                  : isOwner
                    ? <span className="pill pill-green"><span className="badge-live" /> Providing access</span>
                    : <span className="pill pill-green"><span className="badge-live" /> Access Active</span>}
            </div>

            {/* Countdown ring */}
            <div className="center">
              {finished ? <ExpiredRing /> : (
                <CountdownRing startAt={booking.startAt} expiresAt={booking.expiresAt} size={280}
                  onExpire={() => { if (!isOwner && booking.status === 'active') { expireBooking(booking.id); toast('Your access has expired', 'lock') } }} />
              )}
            </div>

            {/* meta */}
            <div className="card-elevated pad" style={{ marginTop: 34, textAlign: 'left' }}>
              <div className="between" style={{ padding: '4px 0' }}>
                <span className="text-muted">Started</span>
                <span style={{ fontWeight: 600 }}>{fmtTime(booking.startAt)}</span>
              </div>
              <hr className="divider" style={{ margin: '8px 0' }} />
              <div className="between" style={{ padding: '4px 0' }}>
                <span className="text-muted">Expires</span>
                <span style={{ fontWeight: 600 }}>{fmtDateTime(booking.expiresAt)}</span>
              </div>
              <hr className="divider" style={{ margin: '8px 0' }} />
              <div className="between" style={{ padding: '4px 0' }}>
                <span className="text-muted">{isOwner ? 'You earn' : 'Access'}</span>
                <span style={{ fontWeight: 600 }}>
                  {isOwner
                    ? `${durationLabel(booking.hours)} · ${inr(booking.ownerEarning)}`
                    : `${durationLabel(booking.hours)} · ${inr(booking.price)}`}
                </span>
              </div>
            </div>

            {/* OWNER (giver) — passive provider view: earnings pending, no credentials/controls */}
            {isOwner && !finished && (
              <div className="card-elevated pad fade-in" style={{ marginTop: 16, textAlign: 'left' }}>
                <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                  <Icon name="shieldCheck" size={15} style={{ color: 'var(--accent)' }} />
                  <h4 style={{ fontSize: '0.98rem' }}>You’re providing this access</h4>
                </div>
                <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                  {booking.seeker} is using your {booking.title} access now. Your <strong>{inr(booking.ownerEarning)}</strong> is
                  released to your Wallet <strong>only when the {durationLabel(booking.hours).toLowerCase()} period completes</strong>.
                </p>
                <p className="disclaimer" style={{ marginTop: 10, fontSize: '0.72rem' }}>
                  Keep the sign-in details unchanged for the whole booking. If you change them, the buyer can report it —
                  their payment is refunded and you won’t be paid.
                </p>
              </div>
            )}

            {/* BUYER (receiver) — credentials, only when live */}
            {!isOwner && !finished && showCreds && (
              <div className="card-elevated pad fade-in" style={{ marginTop: 16, textAlign: 'left' }}>
                <div className="between" style={{ marginBottom: 12 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <Icon name="lock" size={15} style={{ color: 'var(--accent)' }} />
                    <h4 style={{ fontSize: '0.98rem' }}>Access credentials</h4>
                  </div>
                  <button className="link-accent" style={{ fontSize: '0.8rem' }} onClick={() => setRevealed((r) => !r)}>
                    {revealed ? 'Hide' : 'Reveal'}
                  </button>
                </div>
                <CredRow label="Profile" value={creds.profile} onCopy={() => copy(creds.profile, 'Profile')} />
                <CredRow label="Sign-in email" value={creds.email} onCopy={() => copy(creds.email, 'Email')} />
                <CredRow label="One-time access code" value={creds.code} secret hidden={!revealed} onCopy={() => copy(creds.code, 'Code')} />
                <p className="disclaimer" style={{ marginTop: 10, fontSize: '0.72rem' }}>
                  Simulated authorization for this prototype — no real provider passwords or OTPs are collected or shared. Valid only until this booking expires.
                </p>
              </div>
            )}

            {/* disputed summary */}
            {disputed && (
              <div className="card-elevated pad fade-in" style={{ marginTop: 16, textAlign: 'left' }}>
                <h4 style={{ fontSize: '0.98rem', marginBottom: 6 }}>Access reported</h4>
                <p className="text-muted" style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                  {isOwner
                    ? `${booking.seeker} reported this access stopped working. Their payment was refunded and this booking earns you nothing. It’s under review.`
                    : `Thanks for reporting. Your ${inr(booking.price)} has been returned to your twelve Wallet and the owner will not be paid. Our team may follow up.`}
                </p>
              </div>
            )}

            {/* actions */}
            <div className="col" style={{ gap: 10, marginTop: 24 }}>
              {finished ? (
                <>
                  <button className="btn btn-white btn-lg btn-block" onClick={() => navigate(isOwner ? '/dashboard' : '/discover')}>
                    {isOwner ? 'Back to Dashboard' : 'Explore More Access'} <Icon name="arrowRight" size={18} />
                  </button>
                  {disputed && !isOwner && (
                    <button className="btn btn-ghost btn-block" onClick={() => navigate('/wallet')}>View Wallet</button>
                  )}
                </>
              ) : isOwner ? (
                <button className="btn btn-white btn-lg btn-block" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard <Icon name="arrowRight" size={18} />
                </button>
              ) : (
                <>
                  <button className="btn btn-white btn-lg btn-block" onClick={() => { setShowCreds((s) => !s); setRevealed(false) }}>
                    <Icon name={showCreds ? 'eye' : 'lock'} size={16} /> {showCreds ? 'Hide credentials' : 'Show credentials'}
                  </button>
                  <div className="row" style={{ gap: 10 }}>
                    <button className="btn btn-ghost btn-block" onClick={() => navigate('/bookings')}>Manage Booking</button>
                    <button className="btn btn-outline btn-block" onClick={() => setConfirmEnd(true)}>End Access</button>
                  </div>
                  <button className="btn btn-ghost btn-block" style={{ color: '#ff8f86' }} onClick={() => setConfirmReport(true)}>
                    <Icon name="shieldCheck" size={15} /> Report a problem
                  </button>
                </>
              )}
            </div>

            <p className="text-muted center" style={{ fontSize: '0.78rem', marginTop: 18, gap: 6 }}>
              <Icon name="lock" size={13} /> Simulated authorized access · no passwords, no OTPs
            </p>
          </div>
        </div>
      </section>

      <Modal
        open={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        icon={<Icon name="clock" size={20} />}
        title="End access now?"
        actions={
          <>
            <button className="btn btn-outline btn-block" onClick={() => setConfirmEnd(false)}>Cancel</button>
            <button className="btn btn-accent btn-block" onClick={() => { expireBooking(booking.id); setConfirmEnd(false); toast('Access ended', 'lock') }}>End access</button>
          </>
        }
      >
        This will immediately revoke your temporary access and move the booking to Completed. This can’t be undone.
      </Modal>

      <Modal
        open={confirmReport}
        onClose={() => { setConfirmReport(false); setReportReason('') }}
        icon={<Icon name="shieldCheck" size={20} />}
        title="Report a problem?"
        actions={
          <>
            <button className="btn btn-outline btn-block" onClick={() => { setConfirmReport(false); setReportReason('') }} disabled={busy}>Cancel</button>
            <button className="btn btn-accent btn-block" onClick={doReport} disabled={busy}>Report &amp; refund</button>
          </>
        }
      >
        <p style={{ marginBottom: 12 }}>
          Use this if the access stopped working — for example the owner changed the sign-in details. Your {inr(booking.price)} is
          returned to your twelve Wallet and the owner won’t be paid. The report is reviewed by twelve.
        </p>
        <textarea
          className="input"
          style={{ width: '100%', minHeight: 72, resize: 'vertical' }}
          placeholder="What went wrong? (optional)"
          value={reportReason}
          maxLength={500}
          onChange={(e) => setReportReason(e.target.value)}
        />
      </Modal>
    </div>
  )
}

// Deterministic, simulated session credentials for the booking (no real secrets).
function buildCredentials(booking, p) {
  let h = 0
  const s = 'tw' + booking.id + (booking.provider || '')
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  const n = Math.abs(h)
  const tag = (n % 9000 + 1000)
  const code = String(n % 900000 + 100000)
  const service = (p?.name || booking.provider || 'service').toLowerCase().replace(/[^a-z]/g, '').slice(0, 8) || 'access'
  return {
    profile: `twelve Guest ${tag}`,
    email: `guest${tag}@${service}.twelve-access.app`,
    code
  }
}

function CredRow({ label, value, secret, hidden, onCopy }) {
  const shown = secret && hidden ? '••••••' : value
  return (
    <div className="between" style={{ gap: 10, padding: '7px 0' }}>
      <span className="text-muted" style={{ fontSize: '0.82rem', flex: 'none' }}>{label}</span>
      <span className="row" style={{ gap: 8, minWidth: 0 }}>
        <span className="mono" style={{ fontSize: '0.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shown}</span>
        <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={onCopy} aria-label={`Copy ${label}`} title="Copy">
          <Icon name="link" size={14} />
        </button>
      </span>
    </div>
  )
}

function ExpiredRing() {
  return (
    <div className="ring-wrap" style={{ width: 280, height: 280 }}>
      <svg width={280} height={280}>
        <circle cx={140} cy={140} r={135} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: 42, fontWeight: 800, color: 'var(--muted)' }}>00:00:00</div>
        <div className="text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 6 }}>Expired</div>
      </div>
    </div>
  )
}

function Missing({ navigate }) {
  return (
    <div className="page center" style={{ minHeight: '70vh' }}>
      <div className="empty">
        <div className="empty-ico"><Icon name="clock" size={26} className="text-secondary" /></div>
        <h3>Booking not found</h3>
        <button className="btn btn-white" style={{ marginTop: 18 }} onClick={() => navigate('/bookings')}>My bookings</button>
      </div>
    </div>
  )
}
