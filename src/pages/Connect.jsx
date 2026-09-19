import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Artwork from '../components/Artwork'
import ProviderLogo from '../components/ProviderLogo'
import Icon from '../components/Icon'
import Modal from '../components/Modal'
import { Disclaimer, DemoTag } from '../components/UI'
import { providerList } from '../data/providers'
import { useApp } from '../store/AppContext'

export default function Connect() {
  const navigate = useNavigate()
  const { connected, toast } = useApp()
  const [pending, setPending] = useState(null)
  const [connecting, setConnecting] = useState(false)

  const ent = providerList.filter((p) => p.category === 'entertainment')
  const edu = providerList.filter((p) => p.category === 'education')
  const ai = providerList.filter((p) => p.category === 'ai')

  const doConnect = () => {
    setConnecting(true)
    setTimeout(() => {
      toast(`${pending.name} connected (simulated)`, 'success')
      setConnecting(false)
      const p = pending
      setPending(null)
      navigate('/create-listing?provider=' + p.id)
    }, 1400)
  }

  const Card = ({ p }) => {
    const isConnected = connected.includes(p.id)
    return (
      <div className="card clickable" style={{ overflow: 'hidden' }} onClick={() => setPending(p)}>
        <div style={{ position: 'relative', aspectRatio: '16/8' }}>
          <Artwork grad={p.gradient} seed={p.id.length * 3} style={{ position: 'absolute', inset: 0 }} />
          <div className="grad-overlay-bottom" style={{ position: 'absolute', inset: 0 }} />
          <div style={{ position: 'absolute', left: 16, bottom: 12 }}><ProviderLogo id={p.id} size={1.05} onArt /></div>
          {p.kind === 'demo' && <span className="pill pill-accent" style={{ position: 'absolute', right: 12, top: 12, fontSize: '0.68rem' }}>Demo provider</span>}
        </div>
        <div className="pad">
          <div className="between">
            <div>
              <h4 style={{ fontSize: '1.02rem' }}>{p.name}</h4>
              <p className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{p.category}</p>
            </div>
            {isConnected
              ? <span className="pill pill-green"><Icon name="check" size={13} /> Connected</span>
              : <span className="btn btn-outline btn-sm">Connect</span>}
          </div>
          <p className="text-muted" style={{ fontSize: '0.76rem', marginTop: 10 }}>
            {p.kind === 'real' ? 'Prototype connection — simulated' : 'Fictional demo provider'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <section className="section-tight">
        <div className="container">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')} style={{ marginBottom: 20 }}>
            <Icon name="chevronRight" size={16} style={{ transform: 'rotate(180deg)' }} /> Dashboard
          </button>
          <h1 style={{ fontSize: 'clamp(1.8rem,3.4vw,2.6rem)' }}>Connect a subscription</h1>
          <p className="text-secondary" style={{ marginTop: 8, maxWidth: 620 }}>
            Choose a service you subscribe to. We’ll set up a listing for your unused capacity. All connections here are
            simulated — no passwords, OTPs or credentials are collected.
          </p>

          <GroupHead icon="film" label="Entertainment" />
          <div className="grid grid-3">{ent.map((p) => <Card key={p.id} p={p} />)}</div>

          <GroupHead icon="book" label="Education" />
          <div className="grid grid-3">{edu.map((p) => <Card key={p.id} p={p} />)}</div>

          <GroupHead icon="sparkle" label="AI Models" />
          <div className="grid grid-3">{ai.map((p) => <Card key={p.id} p={p} />)}</div>

          <Disclaimer style={{ marginTop: 30 }} />
        </div>
      </section>

      <Modal
        open={!!pending}
        onClose={() => !connecting && setPending(null)}
        icon={pending && <Icon name="link" size={20} />}
        title={pending ? `Connect ${pending.name}?` : ''}
        actions={pending && (
          <>
            <button className="btn btn-outline btn-block" onClick={() => setPending(null)} disabled={connecting}>Cancel</button>
            <button className="btn btn-accent btn-block" onClick={doConnect} disabled={connecting}>
              {connecting ? 'Connecting…' : 'Connect (simulated)'}
            </button>
          </>
        )}
      >
        {pending && (
          <>
            This is a <strong>prototype connection</strong>. twelve does not connect to {pending.name}’s systems and never
            asks for your password or OTP. Provider authorization is simulated so you can demo the full flow.
          </>
        )}
      </Modal>
    </div>
  )
}

function GroupHead({ icon, label }) {
  return (
    <div className="row" style={{ gap: 10, margin: '34px 0 16px' }}>
      <span className="text-secondary"><Icon name={icon} size={18} /></span>
      <h3 style={{ fontSize: '1.15rem' }}>{label}</h3>
    </div>
  )
}
