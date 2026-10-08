import { useState, useCallback } from 'react'
import TimeframeRail from './components/TimeframeRail.jsx'
import ChartStage from './components/ChartStage.jsx'
import SignalTicket from './components/SignalTicket.jsx'
import { analyzeChart } from './lib/analyze.js'
import './app.css'

const TIMEFRAMES = ['Weekly', 'Daily', '4H', '15M', '1M']

export default function App() {
  const [slots, setSlots] = useState(() =>
    Object.fromEntries(TIMEFRAMES.map((tf) => [tf, null]))
  )
  const [activeTf, setActiveTf] = useState(null)
  const [symbol, setSymbol] = useState('')
  const [status, setStatus] = useState('idle') // idle | analyzing | done | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleUpload = useCallback((tf, file) => {
    const url = URL.createObjectURL(file)
    setSlots((prev) => ({ ...prev, [tf]: { file, url } }))
    setActiveTf((cur) => cur ?? tf)
  }, [])

  const handleRemove = useCallback((tf) => {
    setSlots((prev) => {
      const next = { ...prev }
      if (next[tf]?.url) URL.revokeObjectURL(next[tf].url)
      next[tf] = null
      return next
    })
    setActiveTf((cur) => (cur === tf ? null : cur))
  }, [])

  const uploadedCount = Object.values(slots).filter(Boolean).length

  const handleAnalyze = useCallback(async () => {
    setStatus('analyzing')
    setError(null)
    try {
      const res = await analyzeChart({ slots, symbol, timeframes: TIMEFRAMES })
      setResult(res)
      setStatus('done')
      const primaryTf = res.timeframes.find((t) => t.annotations?.length)?.timeframe
      if (primaryTf) setActiveTf(primaryTf)
    } catch (e) {
      console.error(e)
      setError(e.message || 'Analysis failed')
      setStatus('error')
    }
  }, [slots, symbol])

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div className="brand-text">
            <span className="brand-name">Structure Analyzer</span>
            <span className="brand-tag">multi-timeframe SMC / ICT read</span>
          </div>
        </div>
        <div className="header-controls">
          <input
            className="symbol-input"
            placeholder="Symbol — e.g. EURUSD"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            maxLength={12}
          />
          <button
            className="analyze-btn"
            disabled={uploadedCount === 0 || status === 'analyzing'}
            onClick={handleAnalyze}
          >
            {status === 'analyzing' ? 'Reading structure…' : 'Analyze'}
          </button>
        </div>
      </header>

      <main className="app-main">
        <TimeframeRail
          timeframes={TIMEFRAMES}
          slots={slots}
          activeTf={activeTf}
          onSelect={setActiveTf}
          onUpload={handleUpload}
          onRemove={handleRemove}
          perTfResults={result?.timeframes}
        />

        <ChartStage
          slot={activeTf ? slots[activeTf] : null}
          timeframe={activeTf}
          annotations={
            result?.timeframes?.find((t) => t.timeframe === activeTf)?.annotations
          }
          status={status}
          error={error}
        />
      </main>

      {result?.signal !== undefined && (
        <SignalTicket signal={result.signal} setups={result.setups} symbol={symbol} />
      )}
    </div>
  )
}
