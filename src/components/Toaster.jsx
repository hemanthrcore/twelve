import { useApp } from '../store/AppContext'
import Icon from './Icon'

const ICONS = {
  success: { name: 'check', bg: 'rgba(34,197,94,0.16)', color: '#4ade80' },
  info: { name: 'sparkle', bg: 'var(--accent-soft)', color: '#a5b4fc' },
  error: { name: 'close', bg: 'rgba(239,68,68,0.16)', color: '#f87171' },
  lock: { name: 'lock', bg: 'rgba(41,151,255,0.16)', color: '#7ab8ff' }
}

export default function Toaster() {
  const { toasts } = useApp()
  return (
    <div className="toast-wrap">
      {toasts.map((t) => {
        const c = ICONS[t.type] || ICONS.info
        return (
          <div className="toast" key={t.id}>
            <span className="toast-icon" style={{ background: c.bg, color: c.color }}>
              <Icon name={c.name} size={15} stroke={2.4} />
            </span>
            <span style={{ fontSize: '0.92rem', fontWeight: 550 }}>{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
