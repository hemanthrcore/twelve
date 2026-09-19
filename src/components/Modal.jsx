import { useEffect } from 'react'
import Icon from './Icon'

export default function Modal({ open, onClose, title, children, actions, icon }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {icon && (
          <div className="trust-ico" style={{ marginBottom: 16 }}>{icon}</div>
        )}
        {title && <h3 style={{ fontSize: '1.25rem', marginBottom: 8 }}>{title}</h3>}
        <div className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{children}</div>
        {actions && <div className="row" style={{ marginTop: 22, gap: 10 }}>{actions}</div>}
      </div>
    </div>
  )
}
