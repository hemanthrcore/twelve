export function CardSkeleton({ width = 'card-w-md' }) {
  return (
    <div className={`card ${width}`} style={{ overflow: 'hidden' }}>
      <div className="skel" style={{ aspectRatio: '16/10', borderRadius: 0 }} />
      <div className="pad">
        <div className="skel" style={{ height: 16, width: '60%' }} />
        <div className="skel" style={{ height: 12, width: '40%', marginTop: 10 }} />
        <div className="skel" style={{ height: 14, width: '30%', marginTop: 16 }} />
      </div>
    </div>
  )
}

export function RowSkeleton({ count = 4, width }) {
  return (
    <div className="scroll-row">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} width={width} />)}
    </div>
  )
}
