import { useState } from 'react'

const TYPE_STYLES = {
  swing_high: { color: 'var(--c-neutral)', shape: 'dot' },
  swing_low: { color: 'var(--c-neutral)', shape: 'dot' },
  hh: { color: 'var(--c-bull)', shape: 'dot' },
  hl: { color: 'var(--c-bull)', shape: 'dot' },
  lh: { color: 'var(--c-bear)', shape: 'dot' },
  ll: { color: 'var(--c-bear)', shape: 'dot' },
  bos_swing: { color: 'var(--c-gold)', shape: 'line' },
  bos_internal: { color: 'var(--c-gold-dim)', shape: 'line' },
  choch: { color: 'var(--c-violet)', shape: 'line' },
  order_block_bullish: { color: 'var(--c-bull)', shape: 'zone' },
  order_block_bearish: { color: 'var(--c-bear)', shape: 'zone' },
  imbalance: { color: 'var(--c-gold)', shape: 'zone' },
  inducement: { color: 'var(--c-violet)', shape: 'dot' },
  liquidity_pool: { color: 'var(--c-neutral)', shape: 'line' },
  poi: { color: 'var(--c-gold)', shape: 'zone' },
  entry: { color: 'var(--c-accent)', shape: 'marker' },
  stop_loss: { color: 'var(--c-bear)', shape: 'marker' },
  take_profit: { color: 'var(--c-bull)', shape: 'marker' },
}

function AnnotationLayer({ annotations }) {
  const [hovered, setHovered] = useState(null)
  if (!annotations?.length) return null

  return (
    <svg
      className="annotation-layer"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="none"
    >
      {annotations.map((a, i) => {
        const style = TYPE_STYLES[a.type] || { color: 'var(--c-neutral)', shape: 'dot' }
        const x = a.x * 1000
        const y = a.y * 1000
        const key = `${a.type}-${i}`

        if (style.shape === 'zone' && a.x2 != null && a.y2 != null) {
          const x2 = a.x2 * 1000
          const y2 = a.y2 * 1000
          return (
            <g
              key={key}
              onMouseEnter={() => setHovered(key)}
              onMouseLeave={() => setHovered(null)}
            >
              <rect
                x={Math.min(x, x2)}
                y={Math.min(y, y2)}
                width={Math.abs(x2 - x)}
                height={Math.abs(y2 - y)}
                fill={style.color}
                fillOpacity={hovered === key ? 0.28 : 0.14}
                stroke={style.color}
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
              {a.label && (
                <text x={Math.min(x, x2) + 6} y={Math.min(y, y2) + 14} className="ann-label">
                  {a.label}
                </text>
              )}
            </g>
          )
        }

        if (style.shape === 'line' && a.x2 != null) {
          const x2 = a.x2 * 1000
          return (
            <g key={key}>
              <line
                x1={x}
                y1={y}
                x2={x2}
                y2={y}
                stroke={style.color}
                strokeWidth={1.5}
                strokeDasharray="6 4"
                vectorEffect="non-scaling-stroke"
              />
              {a.label && (
                <text x={x2 + 6} y={y - 4} className="ann-label">
                  {a.label}
                </text>
              )}
            </g>
          )
        }

        if (style.shape === 'marker') {
          return (
            <g key={key}>
              <line
                x1={0}
                y1={y}
                x2={1000}
                y2={y}
                stroke={style.color}
                strokeWidth={1}
                strokeDasharray="2 6"
                vectorEffect="non-scaling-stroke"
              />
              <text x={12} y={y - 5} className="ann-label ann-label--marker" fill={style.color}>
                {a.label}
              </text>
            </g>
          )
        }

        return (
          <g key={key}>
            <circle cx={x} cy={y} r={4} fill={style.color} />
            {a.label && (
              <text x={x + 8} y={y - 8} className="ann-label">
                {a.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default function ChartStage({ slot, timeframe, annotations, status, error }) {
  if (!slot) {
    return (
      <section className="chart-stage chart-stage--empty">
        <div className="empty-state">
          <span className="empty-glyph" aria-hidden="true">▤</span>
          <p>Upload a chart screenshot to begin.</p>
          <p className="empty-sub">
            Add multiple timeframes for a full top-down read — Weekly/Daily for
            bias, 4H–15M for structure, 1M for execution confirmation.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="chart-stage">
      <div className="chart-stage-header">
        <span className="chart-stage-tf">{timeframe}</span>
        {status === 'analyzing' && <span className="chart-stage-status">Reading structure…</span>}
        {status === 'error' && <span className="chart-stage-status chart-stage-status--error">{error}</span>}
      </div>
      <div className="chart-canvas">
        <img src={slot.url} alt={`${timeframe} chart`} className="chart-image" />
        <AnnotationLayer annotations={annotations} />
      </div>
    </section>
  )
}
