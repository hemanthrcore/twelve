import { useLocation, useNavigate } from 'react-router-dom'
import Icon from './Icon'

const ITEMS = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/discover', label: 'Discover', icon: 'compass' },
  { to: '/bookings', label: 'Bookings', icon: 'ticket' },
  { to: '/earnings', label: 'Wallet', icon: 'wallet' },
  { to: '/profile', label: 'Profile', icon: 'user' }
]

export default function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <div className="mobile-nav">
      {ITEMS.map((it) => {
        const active = location.pathname === it.to
        return (
          <button key={it.to} className={`mobile-nav-item ${active ? 'active' : ''}`} onClick={() => navigate(it.to)}>
            <Icon name={it.icon} size={22} stroke={active ? 2 : 1.7} />
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
