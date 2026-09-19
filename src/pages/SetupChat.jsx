import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Artwork from '../components/Artwork'
import ProviderLogo from '../components/ProviderLogo'
import Icon from '../components/Icon'
import Modal from '../components/Modal'
import { getProvider } from '../data/providers'
import { fmtTime, durationLabel, inr, pad } from '../lib/format'
import { useNow } from '../lib/time'
import { useApp } from '../store/AppContext'

export default function SetupChat() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { getBooking, loadBooking, loadMessages, sendMessage, confirmSetup, failSetup, authUser, liveStatus, toast } = useApp()
  const booking = getBooking(bookingId)
  const now = useNow(1000)

  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmFail, setConfirmFail] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => { if (!booking) loadBooking(bookingId) }, [booking, bookingId, loadBooking])

  // Poll the private thread (also refreshes the booking's live state).
  useEffect(() => {
    let alive = true
    const tick = async () => {
      try { const d = await loadMessages(bookingId); if (alive) setMessages(d.messages) } catch {}
    }
    tick()
    const iv = setInterval(tick, 2500)
    return () => { alive = false; clearInterval(iv) }
  }, [bookingId, loadMessages])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const status = booking ? liveStatus(booking) : null

  // When the window elapses, ask the server to reconcile (→ failed + refund).
  const setupLeft = booking?.setupDeadline ? Math.max(0, booking.setupDeadline - now) : 0
  useEffect(() => {
    if (status === 'held' && booking?.setupDeadline && now > booking.setupDeadline) {
      loadBooking(bookingId)
    }
  }, [status, booking, now, bookingId, loadBooking])

  if (!booking) return <Missing navigate={navigate} />

  const p = getProvider(booking.provider)
  const isOwner = authUser && booking.ownerId === authUser.id
  const mins = Math.floor(setupLeft / 60000)
  const secs = Math.floor((setupLeft % 60000) / 1000)

  // Two-party handshake state (see server confirm-setup). For demo-catalog
  // listings there is no owner counterparty, so only the buyer's side exists.
  const bothRequired = !!booking.bothRequired
  const myConfirmed = isOwner ? booking.ownerConfirmed : booking.seekerConfirmed
  const otherParty = isOwner ? (booking.seeker || 'the buyer') : (booking.ownerName || 'the owner')
  const confirmLabel = isOwner ? 'I’ve shared access' : bothRequired ? 'I’m in — confirm access' : 'Access confirmed'

  const send = async (e) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body || status !== 'held') return
    setDraft('')
    try { const m = await sendMessage(bookingId, body); setMessages((x) => [...x, m]) }
    catch (err) { toast(err.message || 'Could not send', 'error') }
  }

  const doConfirm = async () => {
    setBusy(true)
    try {
      const b = await confirmSetup(bookingId)
      if (liveStatus(b) === 'active') toast('Access confirmed — session is live', 'success')
      else toast(isOwner ? 'Marked as shared — waiting for the buyer' : 'Confirmed — waiting for the owner', 'info')
    }
    catch (err) { toast(err.message || 'Could not confirm', 'error') }
    finally { setBusy(false) }
  }
  const doFail = async () => {
    setBusy(true)
    try { await failSetup(bookingId); toast('Setup ended — payment refunded', 'info') }
    catch (err) { toast(err.message || 'Could not update', 'error') }
    finally { setBusy(false); setConfirmFail(false) }
  }

  return (
    <div className="page">
      <section className="section-tight">
        <div className="container" style={{ maxWidth: 760 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/bookings')} style={{ marginBottom: 18 }}>
            <Icon name="arrowLeft" size={16} /> Bookings
          </button>

          {/* Header */}
          <div className="card-elevated" style={{ overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ position: 'relative', aspectRatio: '16/5' }}>
              <Artwork grad={p.gradient} seed={7} style={{ position: 'absolute', inset: 0 }} />
              <div className="grad-overlay-bottom" style={{ position: 'absolute', inset: 0 }} />
              <div style={{ position: 'absolute', left: 18, bottom: 14 }}>
                <ProviderLogo id={p.id} size={0.95} onArt />
                <h2 style={{ fontSize: '1.2rem', marginTop: 4 }}>{booking.title}</h2>
              </div>
            </div>
            <div className="pad between wrap" style={{ gap: 10 }}>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                Private setup chat · {durationLabel(booking.hours)} · {inr(booking.price)} <span style={{ color: 'var(--amber)' }}>held</span>
              </div>
              <span className="text-muted row" style={{ gap: 6, fontSize: '0.82rem' }}>
                {isOwner ? <>You’re the owner · {booking.seeker}</> : <>Owner · {booking.ownerName || 'Member'}</>}
              </span>
            </div>
          </div>

          {/* State-driven panels */}
          {status === 'held' && (
            <>
              <div className="card pad between wrap" style={{ gap: 12, marginBottom: 16, borderColor: 'rgba(255,159,10,0.3)', background: 'rgba(255,159,10,0.06)' }}>
                <div className="row" style={{ gap: 10 }}>
                  <span className="trust-ico" style={{ margin: 0, width: 40, height: 40, color: 'var(--amber)' }}><Icon name="clock" size={18} /></span>
                  <div>
                    <div style={{ fontWeight: 600 }}>Access Setup</div>
                    <div className="text-muted" style={{ fontSize: '0.82rem' }}>Complete authorization before the timer ends.</div>
                  </div>
                </div>
                <span className="mono" style={{ fontSize: '1.9rem', fontWeight: 800, color: setupLeft < 60000 ? '#ff8f86' : 'var(--text)' }}>
                  {pad(mins)}:{pad(secs)} <span className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 500 }}>remaining</span>
                </span>
              </div>

              <ChatWindow messages={messages} authUser={authUser} scrollRef={scrollRef} />

              <form className="row" style={{ gap: 8, marginTop: 12 }} onSubmit={send}>
                <input className="input grow" placeholder="Message the other party…" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} />
                <button className="btn btn-white" type="submit" disabled={!draft.trim()}><Icon name="arrowRight" size={16} /></button>
              </form>

              {/* Two-party handshake */}
              <div className="card pad-lg" style={{ marginTop: 16 }}>
                <div className="row" style={{ gap: 8, marginBottom: 8 }}>
                  <Icon name="shieldCheck" size={16} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ fontSize: '1.02rem' }}>{bothRequired ? 'Confirm access — both parties' : 'Confirm your access'}</h3>
                </div>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: bothRequired ? 16 : 14 }}>
                  {bothRequired
                    ? 'The paid session starts only when the owner confirms access was shared and the buyer confirms they’re in — neither side alone can start the clock.'
                    : 'When your access is working, confirm to start your paid session. If it can’t be set up, end setup for a full refund.'}
                </p>

                {bothRequired && (
                  <div className="col" style={{ gap: 10, marginBottom: 16 }}>
                    <HandshakeRow done={booking.ownerConfirmed} label="Owner shared access"
                      who={booking.ownerName || 'Owner'} youAre={isOwner} />
                    <HandshakeRow done={booking.seekerConfirmed} label="Buyer confirmed they’re in"
                      who={booking.seeker || 'Buyer'} youAre={!isOwner} />
                  </div>
                )}

                {!myConfirmed ? (
                  <div className="row" style={{ gap: 10 }}>
                    <button className="btn btn-accent btn-block" onClick={doConfirm} disabled={busy}>
                      <Icon name="check" size={16} /> {confirmLabel}
                    </button>
                    <button className="btn btn-outline btn-block" onClick={() => setConfirmFail(true)} disabled={busy}>
                      Setup failed
                    </button>
                  </div>
                ) : (
                  <div className="col" style={{ gap: 10 }}>
                    <div className="row" style={{ gap: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(48,209,88,0.10)', border: '1px solid rgba(48,209,88,0.28)' }}>
                      <Icon name="check" size={16} style={{ color: '#4ade80' }} />
                      <span style={{ fontSize: '0.88rem' }}>Your side is confirmed. Waiting for {otherParty} to confirm…</span>
                    </div>
                    <button className="btn btn-outline btn-block" onClick={() => setConfirmFail(true)} disabled={busy}>
                      Setup failed
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {status === 'active' && (
            <div className="card-elevated pad-lg" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="check-circle" style={{ flex: 'none' }}>
                <svg className="check-svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <h2 style={{ fontSize: '1.5rem', marginTop: 20 }}>Access confirmed</h2>
              <p className="text-secondary" style={{ marginTop: 8 }}>Your {booking.title} session is ready. The {durationLabel(booking.hours).toLowerCase()} usage period has begun.</p>
              <div className="col" style={{ gap: 10, marginTop: 22, width: '100%', maxWidth: 320 }}>
                <button className="btn btn-white btn-lg btn-block" onClick={() => navigate(`/access/${booking.id}`)}>
                  Open access <Icon name="arrowRight" size={18} />
                </button>
                <button className="btn btn-ghost btn-block" onClick={() => navigate('/bookings')}>View booking</button>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="card-elevated pad-lg" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="trust-ico" style={{ width: 72, height: 72, flex: 'none', margin: 0, color: '#ff8f86', background: 'rgba(255,69,58,0.12)', borderColor: 'rgba(255,69,58,0.3)' }}>
                <Icon name="clock" size={26} />
              </div>
              <h2 style={{ fontSize: '1.4rem', marginTop: 18 }}>Access setup failed</h2>
              <p className="text-secondary" style={{ marginTop: 8 }}>
                Your payment of {inr(booking.price)} has been returned to your twelve Wallet. The listing is available again.
              </p>
              <div className="col" style={{ gap: 10, marginTop: 22, width: '100%', maxWidth: 320 }}>
                <button className="btn btn-white btn-lg btn-block" onClick={() => navigate('/discover')}>Explore access</button>
                <button className="btn btn-ghost btn-block" onClick={() => navigate('/wallet')}>View Wallet</button>
              </div>
            </div>
          )}

          {status === 'completed' && (
            <div className="card-elevated pad-lg" style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.3rem' }}>This booking has ended</h2>
              <button className="btn btn-white" style={{ marginTop: 18 }} onClick={() => navigate('/bookings')}>My bookings</button>
            </div>
          )}
        </div>
      </section>

      <Modal
        open={confirmFail}
        onClose={() => setConfirmFail(false)}
        icon={<Icon name="clock" size={20} />}
        title="End setup and refund?"
        actions={
          <>
            <button className="btn btn-outline btn-block" onClick={() => setConfirmFail(false)}>Keep trying</button>
            <button className="btn btn-accent btn-block" onClick={doFail} disabled={busy}>End &amp; refund</button>
          </>
        }
      >
        This cancels the booking and returns {inr(booking.price)} to the buyer’s twelve Wallet. The listing becomes available again.
      </Modal>
    </div>
  )
}

// One party's row in the mutual-confirmation checklist.
function HandshakeRow({ done, label, who, youAre }) {
  return (
    <div className="row between" style={{ gap: 10 }}>
      <div className="row" style={{ gap: 10 }}>
        <span aria-hidden style={{
          width: 26, height: 26, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center',
          background: done ? 'rgba(48,209,88,0.14)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${done ? 'rgba(48,209,88,0.4)' : 'rgba(255,255,255,0.14)'}`,
          color: done ? '#4ade80' : 'var(--text-muted)'
        }}>
          {done ? <Icon name="check" size={14} /> : null}
        </span>
        <div>
          <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{label}</div>
          <div className="text-muted" style={{ fontSize: '0.78rem' }}>{who}{youAre ? ' · you' : ''}</div>
        </div>
      </div>
      <span style={{ fontSize: '0.78rem', color: done ? '#4ade80' : 'var(--text-muted)' }}>
        {done ? 'Confirmed' : 'Pending'}
      </span>
    </div>
  )
}

function ChatWindow({ messages, authUser, scrollRef }) {
  return (
    <div ref={scrollRef} className="chat-window">
      {messages.length === 0 && (
        <p className="text-muted center" style={{ fontSize: '0.85rem', padding: 20 }}>Starting the private setup chat…</p>
      )}
      {messages.map((m) => {
        if (m.kind === 'system') {
          return <div key={m.id} className="chat-system">{m.body}</div>
        }
        const mine = authUser && m.senderId === authUser.id
        return (
          <div key={m.id} className={`chat-row ${mine ? 'mine' : 'theirs'}`}>
            <div className="chat-bubble">
              {m.body}
              <span className="chat-time">{fmtTime(m.createdAt)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Missing({ navigate }) {
  return (
    <div className="page center" style={{ minHeight: '70vh' }}>
      <div className="empty">
        <div className="empty-ico"><Icon name="clock" size={26} className="text-secondary" /></div>
        <h3>Setup chat not found</h3>
        <button className="btn btn-white" style={{ marginTop: 18 }} onClick={() => navigate('/bookings')}>My bookings</button>
      </div>
    </div>
  )
}
