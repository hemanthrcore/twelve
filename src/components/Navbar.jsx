import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import Icon from './Icon'
import SearchOverlay from './SearchOverlay'
import { useApp } from '../store/AppContext'
import { initials, avatarGradient, userSeed } from '../lib/avatar'
import { COUNTRY_LIST } from '../lib/pricing'
import { currencyForCountry, currencyInfo } from '../lib/currency'

const LINKS = [
  { to: '/discover', label: 'Discover' },
  { to: '/discover?cat=entertainment', label: 'Entertainment' },
  { to: '/discover?cat=education', label: 'Education' },
  { to: '/discover?cat=ai', label: 'AI Models' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/manual', label: 'Manual' }
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { authUser, isAuthed, signOut, toast, countryCode, setCountry } = useApp()
  const menuRef = useRef(null)

  // Close the account menu on outside click or route change
  useEffect(() => {
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])
  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // keyboard shortcut for search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const forceSolid = location.pathname !== '/'

  return (
    <>
      <nav className={`nav ${scrolled || forceSolid ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="row" style={{ gap: 34 }}>
            <Logo />
            <div className="nav-links">
              {LINKS.map((l) => (
                <NavLink
                  key={l.label}
                  to={l.to}
                  className={({ isActive }) => `nav-link ${isActive && l.to === location.pathname ? 'active' : ''}`}
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="nav-right">
            <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search" title="Search (Ctrl+K)">
              <Icon name="search" size={20} />
            </button>
            {isAuthed ? (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button className="avatar-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Account" aria-expanded={menuOpen}
                  style={{ background: avatarGradient(userSeed(authUser)) }}>
                  {initials(authUser.name)}
                </button>
                {menuOpen && (
                  <div className="account-menu fade-in">
                    <div className="account-head">
                      <div className="avatar-lg" style={{ background: avatarGradient(userSeed(authUser)) }}>{initials(authUser.name)}</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{authUser.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.76rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{authUser.email}</div>
                      </div>
                    </div>
                    <hr className="divider" />
                    <button className="account-item" onClick={() => navigate('/dashboard')}><Icon name="grid" size={16} /> Dashboard</button>
                    <button className="account-item" onClick={() => navigate('/wallet')}><Icon name="wallet" size={16} /> Wallet</button>
                    <button className="account-item" onClick={() => navigate('/bookings')}><Icon name="ticket" size={16} /> My bookings</button>
                    <button className="account-item" onClick={() => navigate('/profile')}><Icon name="user" size={16} /> Profile</button>
                    <hr className="divider" />
                    <CurrencyPicker countryCode={countryCode} setCountry={setCountry} />
                    <hr className="divider" />
                    <button className="account-item danger" onClick={() => { signOut(); toast('Signed out', 'info'); navigate('/') }}>
                      <Icon name="logout" size={16} /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button className="btn btn-outline btn-sm nav-desktop-only hide-mobile" onClick={() => navigate('/login')}>
                  Sign In
                </button>
                <button className="btn btn-white btn-sm" onClick={() => navigate('/signup')}>
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  )
}

// Custom (fully styled) display-currency dropdown for the account menu.
function CurrencyPicker({ countryCode, setCountry }) {
  const [open, setOpen] = useState(false)
  const cur = currencyForCountry(countryCode)
  const info = currencyInfo(cur)
  return (
    <div className="cur-picker">
      <button className={`cur-trigger ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="row" style={{ gap: 11 }}><Icon name="globe" size={16} /> Display currency</span>
        <span className="cur-current">{info.symbol.trim()} {cur} <Icon name="chevronDown" size={13} /></span>
      </button>
      {open && (
        <div className="cur-list" role="listbox">
          {COUNTRY_LIST.map((c) => {
            const code = currencyForCountry(c.code)
            const ci = currencyInfo(code)
            const active = c.code === countryCode
            return (
              <button key={c.code} role="option" aria-selected={active}
                className={`cur-opt ${active ? 'active' : ''}`}
                onClick={() => { setCountry(c.code); setOpen(false) }}>
                <span className="cur-sym">{ci.symbol.trim()}</span>
                <span className="cur-code">{code}</span>
                <span className="cur-country">{c.name}</span>
                {active && <Icon name="check" size={14} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
