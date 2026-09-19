import { useNavigate } from 'react-router-dom'
import Artwork from './Artwork'
import ProviderLogo from './ProviderLogo'
import Icon from './Icon'
import { getProvider } from '../data/providers'
import { inr, durationLabel } from '../lib/format'
import { listingPricing } from '../lib/pricing'
import { useApp } from '../store/AppContext'

export default function ListingCard({ listing, width = 'card-w-md', large = false }) {
  const navigate = useNavigate()
  const { countryCode, authUser } = useApp()
  const p = getProvider(listing.provider)
  const seed = listing.id.length + listing.price
  const price = listingPricing(listing, countryCode).price
  const isOwn = !!(authUser && listing.ownerId && listing.ownerId === authUser.id)

  return (
    <article
      className={`listing-card ${width}`}
      onClick={() => navigate(`/listing/${listing.id}`)}
      role="button"
    >
      <div className="art-wrap">
        <Artwork grad={p.gradient} seed={seed}>
          <div className="art-cover-logo"><ProviderLogo id={p.id} size={2} onArt /></div>
        </Artwork>
        {p.kind === 'demo' && (
          <span className="pill pill-accent" style={{ position: 'absolute', left: 14, bottom: 12, zIndex: 3, fontSize: '0.68rem', padding: '3px 9px' }}>Demo provider</span>
        )}
        {isOwn && (
          <span className="pill" style={{ position: 'absolute', right: 14, top: 12, zIndex: 3, fontSize: '0.68rem', padding: '3px 9px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>Your listing</span>
        )}
      </div>

      <div className="card-body">
        <div className="between">
          <h4 style={{ fontSize: large ? '1.12rem' : '1.02rem' }}>{listing.title}</h4>
          <span className="rating"><Icon name="star" size={13} className="star" /> {listing.rating}</span>
        </div>
        <p className="text-muted" style={{ fontSize: '0.84rem' }}>{listing.subtitle}</p>
        <div className="card-cta">
          <div className="row" style={{ gap: 8 }}>
            <span className="price" style={{ fontSize: '1.05rem' }}>{inr(price)}</span>
            <span className="text-muted" style={{ fontSize: '0.78rem' }}>/ {durationLabel(listing.defaultHours)}</span>
          </div>
          <span className="go">Book Access <Icon name="arrowRight" size={15} /></span>
        </div>
      </div>
    </article>
  )
}
