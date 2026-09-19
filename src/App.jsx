import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useApp } from './store/AppContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import MobileNav from './components/MobileNav'
import Toaster from './components/Toaster'

import Landing from './pages/Landing'
import Discover from './pages/Discover'
import ListingDetails from './pages/ListingDetails'
import Checkout from './pages/Checkout'
import Success from './pages/Success'
import SetupChat from './pages/SetupChat'
import Wallet from './pages/Wallet'
import AccessScreen from './pages/AccessScreen'
import Dashboard from './pages/Dashboard'
import Connect from './pages/Connect'
import CreateListing from './pages/CreateListing'
import Earnings from './pages/Earnings'
import Bookings from './pages/Bookings'
import Profile from './pages/Profile'
import HowItWorks from './pages/HowItWorks'
import Manual from './pages/Manual'
import Auth from './pages/Auth'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// Gate account/owner pages behind a real session. Sends visitors to /login and
// returns them to where they were headed after they sign in.
function RequireAuth({ children }) {
  const { isAuthed, authReady } = useApp()
  const location = useLocation()
  if (!authReady) {
    return (
      <div className="page" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <span className="text-muted">Loading…</span>
      </div>
    )
  }
  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return children
}

// The success screen hides the global chrome for full immersion
const IMMERSIVE = ['/success/']

export default function App() {
  const location = useLocation()
  const immersive = IMMERSIVE.some((p) => location.pathname.startsWith(p))

  return (
    <>
      <ScrollToTop />
      {!immersive && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/listing/:id" element={<ListingDetails />} />
        <Route path="/checkout/:id" element={<RequireAuth><Checkout /></RequireAuth>} />
        <Route path="/success/:bookingId" element={<Success />} />
        <Route path="/setup/:bookingId" element={<RequireAuth><SetupChat /></RequireAuth>} />
        <Route path="/wallet" element={<RequireAuth><Wallet /></RequireAuth>} />
        <Route path="/access/:bookingId" element={<AccessScreen />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/connect" element={<RequireAuth><Connect /></RequireAuth>} />
        <Route path="/create-listing" element={<RequireAuth><CreateListing /></RequireAuth>} />
        <Route path="/earnings" element={<RequireAuth><Earnings /></RequireAuth>} />
        <Route path="/bookings" element={<RequireAuth><Bookings /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/manual" element={<Manual />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />
        <Route path="*" element={<Landing />} />
      </Routes>
      {!immersive && <Footer />}
      {!immersive && <MobileNav />}
      <Toaster />
    </>
  )
}
