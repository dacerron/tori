import './DuplicateSerialBanner.css'

export function DuplicateSerialBanner({ groups }) {
  if (!groups.length) return null
  return (
    <div className="dup-banner" role="status">
      <strong className="dup-banner__title">Duplicate serial numbers</strong>
      <ul className="dup-banner__list">
        {groups.map(({ serial, ids }) => (
          <li key={serial}>
            <span className="dup-banner__serial">{serial}</span>
            <span className="dup-banner__meta"> — {ids.length} items</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
