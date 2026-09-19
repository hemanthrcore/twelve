import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Artwork from '../components/Artwork'
import ProviderLogo from '../components/ProviderLogo'
import Icon from '../components/Icon'
import { getProvider } from '../data/providers'
import { durationLabel, inr } from '../lib/format'
import { useApp } from '../store/AppContext'

export default function Success() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const { getBooking, loadBooking, toast } = useApp()
  const booking = getBooking(bookingId)

  useEffect(() => { toast('Payment successful', 'success') }, []) // eslint-disable-line
  useEffect(() => { if (!booking) loadBooking(bookingId) }, [booking, bookingId, loadBooking])

  if (!booking) return null
  const p = getProvider(booking.provider)

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* backdrop */}
      <Artwork grad={p.gradient} seed={9} style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(80% 80% at 50% 30%, rgba(5,5,5,0.7), #050505 80%)' }} />
      <Confetti />

      <div className="center grow" style={{ position: 'relative', zIndex: 2, padding: 24 }}>
        <div className="fade-in" style={{ textAlign: 'center', maxWidth: 460, width: '100%' }}>
          <div className="check-circle">
            <svg className="check-svg" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 style={{ fontSize: '2rem', marginTop: 26 }}>Payment successful</h1>
          <p className="text-secondary" style={{ marginTop: 10, fontSize: '1.05rem' }}>Your temporary access is ready.</p>

          <div className="card-elevated pad" style={{ marginTop: 28, textAlign: 'left' }}>
            <div className="row" style={{ gap: 14 }}>
              <Artwork grad={p.gradient} seed={3} style={{ width: 64, height: 64, borderRadius: 12, flex: 'none' }} />
              <div className="grow">
                <ProviderLogo id={p.id} size={0.9} onArt />
                <h3 style={{ fontSize: '1.1rem', marginTop: 4 }}>{booking.title}</h3>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>{durationLabel(booking.hours)} access · {inr(booking.price)}</p>
              </div>
              <span className="pill pill-green"><span className="badge-live" /> Active</span>
            </div>
          </div>

          <div className="col" style={{ gap: 10, marginTop: 24 }}>
            <button className="btn btn-white btn-lg btn-block" onClick={() => navigate(`/access/${booking.id}`)}>
              Open Access <Icon name="arrowRight" size={18} />
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => navigate('/bookings')}>View Booking</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Confetti() {
  const colors = ['#2997ff', '#0a84ff', '#0071e3', '#30d158', '#ffffff']
  const pieces = Array.from({ length: 40 })
  return (
    <div className="confetti">
      {pieces.map((_, i) => (
        <i key={i} style={{
          left: `${(i * 2.5) % 100}%`,
          background: colors[i % colors.length],
          animationDuration: `${2.2 + (i % 5) * 0.5}s`,
          animationDelay: `${(i % 10) * 0.12}s`,
          borderRadius: i % 2 ? '2px' : '50%'
        }} />
      ))}
    </div>
  )
}
