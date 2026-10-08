import { METHODOLOGY_SYSTEM_PROMPT } from '../methodology.js'

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(new Error('Could not read image file'))
    reader.readAsDataURL(file)
  })
}

async function callClaude(messages, { maxTokens = 2000 } = {}) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system: METHODOLOGY_SYSTEM_PROMPT,
      messages,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Analysis request failed (${response.status}): ${text.slice(0, 200)}`)
  }

  const data = await response.json()
  const text = data.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .filter(Boolean)
    .join('\n')
  return text
}

function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in model response')
  return JSON.parse(cleaned.slice(start, end + 1))
}

const PER_TF_SCHEMA_HINT = `
Respond with ONLY a JSON object, no prose, no markdown fences, matching:
{
  "bias": "bullish" | "bearish" | "ranging",
  "annotations": [
    {
      "type": "swing_high" | "swing_low" | "hh" | "hl" | "lh" | "ll" | "bos_swing" | "bos_internal" | "choch" | "order_block_bullish" | "order_block_bearish" | "imbalance" | "inducement" | "liquidity_pool" | "poi",
      "x": 0.0-1.0,      // normalized horizontal position on the image
      "y": 0.0-1.0,      // normalized vertical position on the image
      "x2": 0.0-1.0,     // optional, for lines/zones
      "y2": 0.0-1.0,     // optional, for zones
      "label": "short label text"
    }
  ],
  "readNotes": "1-3 sentences on what this timeframe shows and what it implies for the next lower timeframe",
  "unmitigatedPOIs": [ { "priceLabel": "string if visible", "kind": "order_block|imbalance|liquidity", "direction": "bullish|bearish" } ]
}
Coordinate origin (0,0) is the top-left of the image, (1,1) is bottom-right.
If you cannot confidently read exact pixel positions for a concept, omit that annotation rather than guessing wildly.
`.trim()

async function analyzeTimeframe(tf, slot) {
  const base64 = await fileToBase64(slot.file)
  const mediaType = slot.file.type || 'image/png'

  const text = await callClaude([
    {
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
        {
          type: 'text',
          text: `This is the ${tf} chart. Analyze market structure per the methodology in your system prompt.\n\n${PER_TF_SCHEMA_HINT}`,
        },
      ],
    },
  ])

  const parsed = extractJson(text)
  return { timeframe: tf, ...parsed }
}

async function synthesizeSignal({ symbol, timeframeResults }) {
  const digest = timeframeResults.map((r) => ({
    timeframe: r.timeframe,
    bias: r.bias,
    readNotes: r.readNotes,
    unmitigatedPOIs: r.unmitigatedPOIs,
  }))

  const schemaHint = `
Respond with ONLY a JSON object, no prose, no markdown fences, matching:
{
  "setups": [
    {
      "direction": "buy" | "sell",
      "timeframe": "which timeframe the entry triggers on",
      "summary": "one sentence",
      "confluence": ["short phrase", "short phrase"],
      "rank": 1,
      "waitingFor": "if not yet confirmed, what condition is still needed"
    }
  ],
  "signal": null | {
    "direction": "buy" | "sell",
    "timeframe": "string",
    "entry": number | null,
    "stopLoss": number | null,
    "takeProfit": number | null,
    "riskReward": number,
    "confluence": ["short phrase", "short phrase"]
  }
}
Only populate "signal" if a setup is fully confirmed per the methodology (inducement swept, POI tapped, LTF CHoCH/flip/single-candle mitigation present) AND achieves at least 1:3 risk:reward. Otherwise set "signal" to null and explain in the top-ranked setup's "waitingFor".
If exact prices are not legible from the charts, set entry/stopLoss/takeProfit to null but still describe the setup and confluence in words.
`.trim()

  const text = await callClaude(
    [
      {
        role: 'user',
        content: `Symbol: ${symbol || '(not specified)'}\n\nPer-timeframe reads (highest to lowest timeframe):\n${JSON.stringify(digest, null, 2)}\n\nRank the available setups and determine the single highest-probability trade signal, if any is confirmed, per the methodology in your system prompt.\n\n${schemaHint}`,
      },
    ],
    { maxTokens: 1500 }
  )

  return extractJson(text)
}

export async function analyzeChart({ slots, symbol, timeframes }) {
  const filled = timeframes.filter((tf) => slots[tf])
  if (filled.length === 0) throw new Error('Upload at least one chart first.')

  const timeframeResults = await Promise.all(
    filled.map((tf) => analyzeTimeframe(tf, slots[tf]))
  )

  const { setups, signal } = await synthesizeSignal({ symbol, timeframeResults })

  return {
    timeframes: timeframeResults,
    setups: (setups || []).sort((a, b) => (a.rank || 99) - (b.rank || 99)),
    signal: signal || null,
  }
}
