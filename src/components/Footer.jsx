import { Link } from 'react-router-dom'
import Logo from './Logo'
import Icon from './Icon'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo />
            <p className="text-secondary" style={{ marginTop: 16, maxWidth: 300, fontSize: '0.95rem' }}>
              Access more. Subscribe less. Temporary access to entertainment and education subscriptions — without sharing passwords.
            </p>
            <div className="row" style={{ gap: 8, marginTop: 18 }}>
              <span className="pill"><Icon name="lock" size={13} /> No password sharing</span>
              <span className="pill"><Icon name="clock" size={13} /> Auto expiry</span>
            </div>
          </div>
          <div>
            <h5>Marketplace</h5>
            <Link className="footer-link" to="/discover">Discover</Link>
            <Link className="footer-link" to="/discover?cat=entertainment">Entertainment</Link>
            <Link className="footer-link" to="/discover?cat=education">Education</Link>
            <Link className="footer-link" to="/how-it-works">How It Works</Link>
          </div>
          <div>
            <h5>Owners</h5>
            <Link className="footer-link" to="/dashboard">Dashboard</Link>
            <Link className="footer-link" to="/connect">Connect a subscription</Link>
            <Link className="footer-link" to="/create-listing">Create a listing</Link>
            <Link className="footer-link" to="/earnings">Earnings</Link>
          </div>
          <div>
            <h5>Company</h5>
            <Link className="footer-link" to="/manual">Manual</Link>
            <Link className="footer-link" to="/how-it-works">Safety</Link>
            <a className="footer-link" href="#">Terms</a>
            <a className="footer-link" href="#">Privacy</a>
            <Link className="footer-link" to="/profile">Account</Link>
          </div>
        </div>

        <hr className="divider" style={{ margin: '40px 0 24px' }} />

        <div className="between wrap" style={{ gap: 20 }}>
          <p className="disclaimer" style={{ maxWidth: 760 }}>
            twelve is a college MVP / prototype. Third-party brands, logos and imagery are used for demonstration
            purposes only and are shown as original stylized representations. twelve is not affiliated with or
            endorsed by those providers unless explicitly stated. Provider authorization is simulated; no passwords,
            OTPs or credentials are ever collected or shared.
          </p>
          <p className="text-muted" style={{ fontSize: '0.82rem' }}>© {new Date().getFullYear()} twelve</p>
        </div>
      </div>
    </footer>
  )
}
