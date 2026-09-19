import { useMemo, useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo'
import Icon from '../components/Icon'
import { useApp } from '../store/AppContext'

// Brand marks for the social buttons. These buttons are a DEMO / display piece
// only — real accounts are created and signed in with email + password below.
function GoogleMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
function AppleMark({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.36 12.9c-.02-2.06 1.68-3.05 1.76-3.1-.96-1.4-2.45-1.6-2.98-1.62-1.27-.13-2.48.75-3.12.75-.64 0-1.64-.73-2.7-.71-1.39.02-2.67.81-3.38 2.05-1.44 2.5-.37 6.2 1.04 8.23.69.99 1.51 2.1 2.58 2.06 1.04-.04 1.43-.67 2.69-.67 1.25 0 1.6.67 2.69.65 1.11-.02 1.81-1.01 2.49-2.01.78-1.15 1.1-2.26 1.12-2.32-.02-.01-2.15-.83-2.17-3.28zM14.3 6.6c.57-.69.95-1.65.85-2.6-.82.03-1.81.54-2.4 1.23-.53.61-.99 1.58-.86 2.51.91.07 1.84-.46 2.41-1.14z" />
    </svg>
  )
}

// Simple client-side password strength estimate.
function scorePassword(pw) {
  let s = 0
  if (!pw) return 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(s, 4)
}
const STRENGTH = [
  { label: '', color: 'var(--border)' },
  { label: 'Weak', color: 'var(--red)' },
  { label: 'Fair', color: 'var(--amber)' },
  { label: 'Good', color: '#7ab8ff' },
  { label: 'Strong', color: 'var(--green)' }
]

export default function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const { signUp, signIn, toast } = useApp()

  const startMode = location.pathname === '/signup' ? 'signup' : (params.get('mode') === 'signup' ? 'signup' : 'signin')
  const [mode, setMode] = useState(startMode)
  const isSignup = mode === 'signup'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const strength = useMemo(() => scorePassword(password), [password])

  // After login/signup, go to the page the user was headed to, otherwise the home page.
  const from = (location.state && location.state.from) || '/'
  const finish = (user) => {
    toast(`Welcome${user?.name ? ', ' + user.name.split(' ')[0] : ''}`, 'success')
    navigate(from, { replace: true })
  }

  const switchMode = (m) => { setMode(m); setError('') }

  // Social buttons are display-only — nudge people to the email form.
  const demoSocial = (label) => {
    toast(`${label} sign-in is a demo — please continue with your email below.`, 'info')
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (busy) return
    setError('')
    setBusy(true)
    try {
      const res = isSignup
        ? await signUp({ name, email, password, remember, inviteCode })
        : await signIn({ email, password, remember })
      if (res.ok) finish(res.user)
      else setError(res.error)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const canSubmit = emailValid && password.length >= (isSignup ? 8 : 1)
    && (!isSignup || (name.trim().length >= 2 && inviteCode.trim().length > 0))

  return (
    <div className="page">
      <section className="section-tight">
        <div className="container" style={{ maxWidth: 460 }}>
          <div className="text-center" style={{ marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', marginBottom: 18 }}><Logo /></div>
            <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.1rem)', letterSpacing: '-0.02em' }}>
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-secondary" style={{ marginTop: 8, fontSize: '0.95rem' }}>
              {isSignup ? 'Access more. Subscribe less.' : 'Sign in to manage your listings and bookings.'}
            </p>
          </div>

          <div className="card-elevated pad-lg">
            {/* segmented tabs */}
            <div className="auth-tabs">
              <button className={`auth-tab ${!isSignup ? 'active' : ''}`} onClick={() => switchMode('signin')} type="button">Sign in</button>
              <button className={`auth-tab ${isSignup ? 'active' : ''}`} onClick={() => switchMode('signup')} type="button">Create account</button>
            </div>

            {/* social (display / demo only) */}
            <div className="col" style={{ gap: 10, marginTop: 22 }}>
              <button type="button" className="auth-provider" onClick={() => demoSocial('Google')} disabled={busy}>
                <GoogleMark /> <span>Continue with Google</span>
              </button>
              <button type="button" className="auth-provider apple" onClick={() => demoSocial('Apple')} disabled={busy}>
                <AppleMark /> <span>Continue with Apple</span>
              </button>
            </div>

            <div className="auth-divider"><span>or</span></div>

            {/* email / password — the real sign-up / sign-in */}
            <form onSubmit={onSubmit} className="col" style={{ gap: 14 }} noValidate>
              {isSignup && (
                <div>
                  <label className="field-label">Full name</label>
                  <input className="input" placeholder="Your name" value={name} autoComplete="name"
                    onChange={(e) => setName(e.target.value)} />
                </div>
              )}
              <div>
                <label className="field-label">Email</label>
                <input className="input" type="email" inputMode="email" placeholder="you@example.com" value={email}
                  autoComplete="email" onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <div className="between" style={{ marginBottom: 7 }}>
                  <label className="field-label" style={{ margin: 0 }}>Password</label>
                  {!isSignup && (
                    <button type="button" className="link-accent" style={{ fontSize: '0.76rem' }}
                      onClick={() => toast('Password reset is not enabled yet.', 'info')}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input className="input" type={show ? 'text' : 'password'} placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
                    value={password} autoComplete={isSignup ? 'new-password' : 'current-password'}
                    onChange={(e) => setPassword(e.target.value)} style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}
                    style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', padding: 8, color: 'var(--muted)' }}>
                    <Icon name="eye" size={18} />
                  </button>
                </div>
                {isSignup && password.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div className="auth-meter">
                      {[0, 1, 2, 3].map((i) => (
                        <span key={i} style={{ background: i < strength ? STRENGTH[strength].color : 'var(--border)' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.74rem', color: STRENGTH[strength].color, marginTop: 6, display: 'inline-block' }}>
                      {STRENGTH[strength].label || 'Too short'}
                    </span>
                  </div>
                )}
              </div>

              {isSignup && (
                <div>
                  <label className="field-label">twelve access code</label>
                  <input className="input" placeholder="Code provided by twelve" value={inviteCode}
                    autoComplete="off" onChange={(e) => setInviteCode(e.target.value)} />
                  <span className="text-muted" style={{ fontSize: '0.74rem', marginTop: 6, display: 'inline-block' }}>
                    twelve is invite-only. Enter the access code you were given to create an account.
                  </span>
                </div>
              )}

              <label className="auth-remember">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span>Keep me signed in on this device</span>
              </label>

              {error && (
                <div className="auth-error" role="alert">
                  <Icon name="info" size={15} /> <span>{error}</span>
                </div>
              )}

              <button type="submit" className="btn btn-accent btn-lg btn-block" disabled={!canSubmit || busy}>
                {busy ? <><Spinner /> {isSignup ? 'Creating account…' : 'Signing in…'}</>
                  : (isSignup ? 'Create account' : 'Sign in')}
              </button>
            </form>

            <p className="text-center" style={{ marginTop: 16, fontSize: '0.86rem' }}>
              <span className="text-muted">{isSignup ? 'Already have an account?' : 'New to twelve?'} </span>
              <button type="button" className="link-accent" onClick={() => switchMode(isSignup ? 'signin' : 'signup')}>
                {isSignup ? 'Sign in' : 'Create one'}
              </button>
            </p>
          </div>

          <div className="row" style={{ gap: 7, justifyContent: 'center', marginTop: 18 }}>
            <Icon name="lock" size={13} className="text-muted" />
            <span className="text-muted text-center" style={{ fontSize: '0.74rem', maxWidth: 380 }}>
              Passwords are encrypted and stored securely. By continuing you agree to twelve’s terms.
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

function Spinner({ size = 16 }) {
  return (
    <span style={{ width: size, height: size, border: `2px solid rgba(255,255,255,0.28)`, borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </span>
  )
}
