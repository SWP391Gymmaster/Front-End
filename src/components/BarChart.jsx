import { formatMoney, formatMoneyShort } from '../store/utils'

const niceStep = (max, ticks = 4) => {
  if (max <= 0) return 1
  const raw = max / ticks
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)
  return step
}

export default function BarChart({ data, height = 220, labelEvery = 1, highlightKey, emptyText = 'Chưa có dữ liệu' }) {
  const W = 720
  const H = height
  const pad = { top: 12, right: 8, bottom: 26, left: 52 }
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom
  const max = Math.max(0, ...data.map((d) => d.value))
  const step = niceStep(max)
  const top = max > 0 ? Math.ceil(max / step) * step : step * 4
  const ticks = []
  for (let v = 0; v <= top + 1e-9; v += step) ticks.push(v)
  const slot = innerW / Math.max(data.length, 1)
  const barW = Math.max(2, Math.min(28, slot * 0.68))
  const y = (v) => pad.top + innerH - (v / top) * innerH

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Biểu đồ doanh thu">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="chart-axis">
              {formatMoneyShort(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.left + slot * i + (slot - barW) / 2
          const h = Math.max(d.value > 0 ? 2 : 0, innerH * (d.value / top))
          return (
            <g key={d.key} className="chart-bar-group">
              <rect
                x={x}
                y={pad.top + innerH - h}
                width={barW}
                height={h}
                rx={Math.min(3, barW / 3)}
                className={'chart-bar' + (d.key === highlightKey ? ' current' : '')}
              >
                <title>{d.title || `${d.label}: ${formatMoney(d.value)}`}</title>
              </rect>
              {/* vùng rê chuột rộng hơn cột */}
              <rect x={pad.left + slot * i} y={pad.top} width={slot} height={innerH} fill="transparent">
                <title>{d.title || `${d.label}: ${formatMoney(d.value)}`}</title>
              </rect>
              {(i % labelEvery === 0 || i === data.length - 1) && (
                <text x={x + barW / 2} y={H - 8} textAnchor="middle" className="chart-axis">
                  {d.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {max === 0 && <div className="chart-empty">{emptyText}</div>}
    </div>
  )
}
