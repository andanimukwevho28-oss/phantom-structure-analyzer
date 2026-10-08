import { useRef } from 'react'

function Slot({ tf, data, active, onSelect, onUpload, onRemove, tfResult }) {
  const inputRef = useRef(null)

  const bias = tfResult?.bias // 'bullish' | 'bearish' | 'ranging'

  return (
    <div className={`tf-slot${active ? ' tf-slot--active' : ''}${data ? ' tf-slot--filled' : ''}`}>
      <button
        className="tf-slot-main"
        onClick={() => (data ? onSelect(tf) : inputRef.current?.click())}
      >
        <div className="tf-slot-thumb">
          {data ? (
            <img src={data.url} alt={`${tf} chart`} />
          ) : (
            <span className="tf-slot-plus">+</span>
          )}
        </div>
        <div className="tf-slot-meta">
          <span className="tf-slot-label">{tf}</span>
          {bias && (
            <span className={`tf-slot-bias tf-slot-bias--${bias}`}>{bias}</span>
          )}
          {!data && <span className="tf-slot-hint">upload</span>}
        </div>
      </button>
      {data && (
        <button
          className="tf-slot-remove"
          onClick={() => onRemove(tf)}
          aria-label={`Remove ${tf} chart`}
        >
          ×
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(tf, file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

export default function TimeframeRail({
  timeframes,
  slots,
  activeTf,
  onSelect,
  onUpload,
  onRemove,
  perTfResults,
}) {
  return (
    <aside className="tf-rail">
      <div className="tf-rail-label">Top-down order</div>
      <div className="tf-rail-list">
        {timeframes.map((tf) => (
          <Slot
            key={tf}
            tf={tf}
            data={slots[tf]}
            active={activeTf === tf}
            onSelect={onSelect}
            onUpload={onUpload}
            onRemove={onRemove}
            tfResult={perTfResults?.find((r) => r.timeframe === tf)}
          />
        ))}
      </div>
      <p className="tf-rail-note">
        Upload the same pair, highest timeframe first. At least one chart is
        required — more timeframes sharpen the read.
      </p>
    </aside>
  )
}
