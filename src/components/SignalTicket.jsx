function fmt(n) {
  if (n == null) return '—'
  return typeof n === 'number' ? n.toFixed(5).replace(/0+$/, '').replace(/\.$/, '') : n
}

export default function SignalTicket({ signal, setups, symbol }) {
  if (!signal) {
    return (
      <div className="ticket ticket--empty">
        <div className="ticket-head">
          <span className="ticket-title">No confirmed setup yet</span>
        </div>
        <p className="ticket-reason">
          {setups?.[0]?.waitingFor ||
            'Structure has not confirmed a valid, 1:3+ setup on the supplied timeframes.'}
        </p>
        {setups?.length > 0 && (
          <ul className="ticket-alt-list">
            {setups.slice(0, 3).map((s, i) => (
              <li key={i}>
                <span className={`dir-tag dir-tag--${s.direction || 'neutral'}`}>
                  {s.direction || 'watch'}
                </span>
                {s.summary}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  const rr = signal.riskReward ?? signal.rr

  return (
    <div className={`ticket ticket--${signal.direction}`}>
      <div className="ticket-head">
        <span className={`dir-tag dir-tag--${signal.direction}`}>{signal.direction}</span>
        <span className="ticket-symbol">{symbol || signal.symbol || ''}</span>
        <span className="ticket-tf">{signal.timeframe}</span>
      </div>

      <div className="ticket-prices">
        <div className="price-row">
          <span className="price-label">Entry</span>
          <span className="price-value">{fmt(signal.entry)}</span>
        </div>
        <div className="price-row">
          <span className="price-label">Stop loss</span>
          <span className="price-value price-value--bear">{fmt(signal.stopLoss)}</span>
        </div>
        <div className="price-row">
          <span className="price-label">Take profit</span>
          <span className="price-value price-value--bull">{fmt(signal.takeProfit)}</span>
        </div>
        <div className="price-row price-row--rr">
          <span className="price-label">R:R</span>
          <span className="price-value">{rr ? `1 : ${rr.toFixed(1)}` : '—'}</span>
        </div>
      </div>

      {signal.confluence?.length > 0 && (
        <div className="ticket-confluence">
          {signal.confluence.map((c, i) => (
            <span key={i} className="confluence-chip">{c}</span>
          ))}
        </div>
      )}

      <p className="ticket-caveat">
        Extracted from a screenshot read — confirm entry, stop, and target
        against your live chart before placing anything.
      </p>
    </div>
  )
}
