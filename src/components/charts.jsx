import React, { useState } from 'react'
import { fmtMoney } from '../logic/currency.js'

// Palette categoriale validata (ordine fisso, CVD-safe) — light/dark
export const SERIES_LIGHT = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834']
export const SERIES_DARK = ['#3987e5', '#199e70', '#c98500', '#008300', '#9085e9', '#e66767', '#d55181', '#d95926']

export function useSeriesColors() {
  const dark = document.documentElement.classList.contains('dark')
  return dark ? SERIES_DARK : SERIES_LIGHT
}

/**
 * Grafico a torta (donut) con etichette dirette in legenda.
 * data: [{label, value}] — ordinato per valore; oltre 8 voci confluiscono in "Altro".
 */
export function PieChart({ data, currency }) {
  const colors = useSeriesColors()
  const [active, setActive] = useState(null)
  let items = [...data].filter(d => d.value > 0).sort((a, b) => b.value - a.value)
  if (items.length > 8) {
    const rest = items.slice(7)
    items = [...items.slice(0, 7), { label: 'Altro (raggruppate)', value: rest.reduce((s, d) => s + d.value, 0) }]
  }
  const total = items.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null

  const cx = 90, cy = 90, r = 70, ir = 42
  let angle = -Math.PI / 2
  const segs = items.map((d, i) => {
    const frac = d.value / total
    const a0 = angle, a1 = angle + frac * Math.PI * 2
    angle = a1
    const large = a1 - a0 > Math.PI ? 1 : 0
    const p = (a, rad) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)]
    const [x0, y0] = p(a0, r), [x1, y1] = p(a1, r), [x2, y2] = p(a1, ir), [x3, y3] = p(a0, ir)
    const path = items.length === 1
      ? null
      : `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${ir} ${ir} 0 ${large} 0 ${x3} ${y3} Z`
    return { ...d, path, frac, color: colors[i % colors.length], i }
  })

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 180 180" className="w-36 h-36 shrink-0" role="img" aria-label="Ripartizione spese per categoria">
        {segs.map(s => s.path ? (
          <path key={s.i} d={s.path} fill={s.color} opacity={active === null || active === s.i ? 1 : 0.35}
            stroke="var(--color-white,#fff)" strokeWidth="2" className="stroke-white dark:stroke-zinc-800"
            onClick={() => setActive(active === s.i ? null : s.i)} />
        ) : (
          <circle key={s.i} cx={cx} cy={cy} r={(r + ir) / 2} fill="none" stroke={s.color} strokeWidth={r - ir} />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-zinc-500 dark:fill-zinc-400" fontSize="10">Totale</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-zinc-900 dark:fill-zinc-50 font-semibold" fontSize="13">
          {fmtMoney(total, currency)}
        </text>
      </svg>
      <ul className="flex-1 space-y-1.5 min-w-0">
        {segs.map(s => (
          <li key={s.i} onClick={() => setActive(active === s.i ? null : s.i)}
            className={`flex items-center gap-2 text-sm cursor-pointer ${active !== null && active !== s.i ? 'opacity-40' : ''}`}>
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="truncate text-zinc-700 dark:text-zinc-200">{s.label}</span>
            <span className="ml-auto text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0">{Math.round(s.frac * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Confronto mese su mese: barre affiancate Entrate/Spese.
 * data: [{label, income, expense}]
 */
export function MonthBarChart({ data, currency }) {
  const colors = useSeriesColors()
  const cIncome = colors[0] // blu
  const cExpense = colors[7] // arancio
  const [active, setActive] = useState(null)
  const max = Math.max(1, ...data.flatMap(d => [d.income, d.expense]))
  const W = 340, H = 170, padB = 22, padT = 6
  const plotH = H - padB - padT
  const group = W / Math.max(1, data.length)
  const barW = Math.min(14, group / 3)

  return (
    <div>
      <div className="flex gap-4 mb-2 text-xs text-zinc-600 dark:text-zinc-300">
        <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm inline-block" style={{ background: cIncome }} />Entrate</span>
        <span className="flex items-center gap-1.5"><i className="w-3 h-3 rounded-sm inline-block" style={{ background: cExpense }} />Spese</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Confronto entrate e spese per mese">
        {[0.25, 0.5, 0.75, 1].map(f => (
          <line key={f} x1="0" x2={W} y1={padT + plotH * (1 - f)} y2={padT + plotH * (1 - f)}
            className="stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="1" />
        ))}
        {data.map((d, i) => {
          const x = i * group + group / 2
          const hI = (d.income / max) * plotH
          const hE = (d.expense / max) * plotH
          return (
            <g key={i} onClick={() => setActive(active === i ? null : i)}
              opacity={active === null || active === i ? 1 : 0.4}>
              <rect x={x - barW - 1} y={padT + plotH - hI} width={barW} height={Math.max(hI, 1)} rx="3" fill={cIncome} />
              <rect x={x + 1} y={padT + plotH - hE} width={barW} height={Math.max(hE, 1)} rx="3" fill={cExpense} />
              <text x={x} y={H - 6} textAnchor="middle" fontSize="10" className="fill-zinc-500 dark:fill-zinc-400">{d.label}</text>
            </g>
          )
        })}
        <line x1="0" x2={W} y1={padT + plotH} y2={padT + plotH} className="stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="1" />
      </svg>
      {active !== null && data[active] && (
        <p className="text-xs text-center mt-1 text-zinc-600 dark:text-zinc-300">
          <b>{data[active].label}</b> — Entrate: {fmtMoney(data[active].income, currency)} · Spese: {fmtMoney(data[active].expense, currency)}
        </p>
      )}
    </div>
  )
}
