import { formatMoney, percentChange } from '../store/utils'

// Hiện % so với kỳ trước
export function Delta({ cur, prev, suffix = 'so với tháng trước' }) {
  const pct = percentChange(cur, prev)
  if (pct === null) return <em className="muted">{cur > 0 ? 'Tháng trước chưa có doanh thu' : 'Chưa có doanh thu'}</em>
  const up = pct >= 0
  return (
    <em className={up ? 'up' : 'down'}>
      {up ? '▲' : '▼'} {Math.abs(pct).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}% {suffix}
    </em>
  )
}

// Thanh tỉ trọng: [{ key, amount, count }]
export function ShareList({ items, total, labelOf = (k) => k }) {
  if (!items.length) return <p className="muted">Chưa có dữ liệu.</p>
  return (
    <div className="share-list">
      {items.map((it) => {
        const pct = total ? (it.amount / total) * 100 : 0
        return (
          <div key={it.key} className="share-row">
            <div className="share-top">
              <span>{labelOf(it.key)}</span>
              <span><strong>{formatMoney(it.amount)}</strong> <span className="muted small">· {pct.toFixed(0)}% · {it.count} GD</span></span>
            </div>
            <div className="share-track"><div className="share-fill" style={{ width: `${pct}%` }} /></div>
          </div>
        )
      })}
    </div>
  )
}
