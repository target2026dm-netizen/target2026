import React, { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { useApp } from '../context/AppContext.jsx'
import { todayISO, fmtDate, monthKey, addMonthsToKey, fmtMonth, MONTHS_IT } from '../logic/dates.js'
import { convert, fmtMoney, CURRENCY_LABEL } from '../logic/currency.js'
import { Card, Segmented, Select, TextInput, EmptyState } from '../components/ui.jsx'
import { PieChart, MonthBarChart } from '../components/charts.jsx'

export default function Report() {
  const { rate, displayCurrency, setSetting, expenseCategories } = useApp()
  const today = todayISO()
  const [mk, setMk] = useState(monthKey(today))
  const [span, setSpan] = useState(6)

  const txs = useLiveQuery(() => db.transactions.toArray(), []) || []
  const deposits = useLiveQuery(() => db.savingsDeposits.toArray(), []) || []

  const inDC = (t) => convert(t.amount, t.currency, displayCurrency, rate)
  const monthTx = txs.filter(t => t.month === mk)
  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + inDC(t), 0)
  const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + inDC(t), 0)
  const savedThisMonth = deposits.filter(d => monthKey(d.date) === mk)
    .reduce((s, d) => s + convert(d.amount, d.currency, displayCurrency, rate), 0)

  const byCat = {}
  for (const t of monthTx.filter(t => t.type === 'expense')) {
    byCat[t.category] = (byCat[t.category] || 0) + inDC(t)
  }
  const pieData = Object.entries(byCat).map(([label, value]) => ({ label, value }))

  const barData = useMemo(() => {
    const out = []
    let k = monthKey(today)
    for (let i = 0; i < span; i++) { out.unshift(k); k = addMonthsToKey(k, -1) }
    return out.map(m => {
      const list = txs.filter(t => t.month === m)
      return {
        label: `${MONTHS_IT[Number(m.slice(5)) - 1].slice(0, 3)} ${m.slice(2, 4)}`,
        income: list.filter(t => t.type === 'income').reduce((s, t) => s + inDC(t), 0),
        expense: list.filter(t => t.type === 'expense').reduce((s, t) => s + inDC(t), 0)
      }
    })
  }, [txs, span, displayCurrency, rate])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Report</h2>
        <Segmented value={displayCurrency} onChange={v => setSetting('displayCurrency', v)}
          className="w-32" options={[{ value: 'EUR', label: 'EUR' }, { value: 'ALL', label: 'LEK' }]} />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <button className="px-3 py-1 text-lg" onClick={() => setMk(addMonthsToKey(mk, -1))}>‹</button>
          <span className="font-semibold">{fmtMonth(mk)}</span>
          <button className="px-3 py-1 text-lg" onClick={() => setMk(addMonthsToKey(mk, 1))}>›</button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3">
            <p className="text-xs text-zinc-500">Entrate</p>
            <p className="font-bold text-emerald-600 dark:text-emerald-400">{fmtMoney(income, displayCurrency)}</p>
          </div>
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3">
            <p className="text-xs text-zinc-500">Spese</p>
            <p className="font-bold text-red-600 dark:text-red-400">{fmtMoney(expense, displayCurrency)}</p>
          </div>
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3">
            <p className="text-xs text-zinc-500">Saldo</p>
            <p className="font-bold">{fmtMoney(income - expense, displayCurrency)}</p>
          </div>
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3">
            <p className="text-xs text-zinc-500">Risparmiato</p>
            <p className="font-bold text-blue-600 dark:text-blue-400">{fmtMoney(savedThisMonth, displayCurrency)}</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold mb-3">Spese per categoria</h3>
        {pieData.length === 0
          ? <p className="text-sm text-zinc-400 text-center py-4">Nessuna spesa in questo mese.</p>
          : <PieChart data={pieData} currency={displayCurrency} />}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Mese su mese</h3>
          <Segmented value={span} onChange={setSpan} className="w-36"
            options={[{ value: 6, label: '6 mesi' }, { value: 12, label: '12 mesi' }]} />
        </div>
        <MonthBarChart data={barData} currency={displayCurrency} />
      </Card>

      <Storico txs={txs} expenseCategories={expenseCategories} />
    </div>
  )
}

function Storico({ txs, expenseCategories }) {
  const { rate, displayCurrency } = useApp()
  const [fMonth, setFMonth] = useState('')
  const [fCat, setFCat] = useState('')
  const [fCur, setFCur] = useState('')
  const [q, setQ] = useState('')

  const months = [...new Set(txs.map(t => t.month))].sort().reverse()
  const filtered = txs
    .filter(t => (!fMonth || t.month === fMonth) && (!fCat || t.category === fCat) && (!fCur || t.currency === fCur))
    .filter(t => !q || (t.note || '').toLowerCase().includes(q.toLowerCase()) || (t.category || '').toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 100)

  return (
    <Card>
      <h3 className="font-bold mb-3">Storico movimenti</h3>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <Select value={fMonth} onChange={e => setFMonth(e.target.value)} className="!py-2 text-sm">
          <option value="">Tutti i mesi</option>
          {months.map(m => <option key={m} value={m}>{fmtMonth(m)}</option>)}
        </Select>
        <Select value={fCat} onChange={e => setFCat(e.target.value)} className="!py-2 text-sm">
          <option value="">Tutte le cat.</option>
          <option value="Entrata">Entrate</option>
          {expenseCategories.map(c => <option key={c}>{c}</option>)}
        </Select>
        <Select value={fCur} onChange={e => setFCur(e.target.value)} className="!py-2 text-sm">
          <option value="">EUR + LEK</option>
          <option value="EUR">Solo EUR</option>
          <option value="ALL">Solo LEK</option>
        </Select>
      </div>
      <TextInput value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 Cerca nelle note…" className="mb-3 !py-2 text-sm" />
      {filtered.length === 0
        ? <p className="text-sm text-zinc-400 text-center py-4">Nessun movimento trovato.</p>
        : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-700 max-h-96 overflow-y-auto">
            {filtered.map(t => (
              <div key={t.id} className="flex justify-between items-center py-2 text-sm gap-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{t.type === 'income' ? (t.note || 'Entrata') : t.category}</p>
                  <p className="text-xs text-zinc-500">{fmtDate(t.date)}{t.type === 'expense' && t.note ? ` · ${t.note}` : ''}</p>
                </div>
                <p className={`font-semibold tabular-nums shrink-0 ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '−'}{fmtMoney(t.amount, t.currency)}
                </p>
              </div>
            ))}
          </div>
        )}
    </Card>
  )
}
