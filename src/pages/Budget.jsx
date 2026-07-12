import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { useApp } from '../context/AppContext.jsx'
import { todayISO, fmtDate, monthKey, addMonthsToKey, fmtMonth } from '../logic/dates.js'
import { convert, fmtMoney, CURRENCY_LABEL } from '../logic/currency.js'
import { computeSavingsStats } from '../logic/goals.js'
import { materialize } from '../logic/materialize.js'
import { Card, Modal, Field, TextInput, Select, Btn, Fab, ProgressBar, Segmented, EmptyState, Confirm } from '../components/ui.jsx'

export default function Budget() {
  const [sub, setSub] = useState('movimenti')
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Budget familiare</h2>
      <p className="text-xs text-zinc-500 -mt-3">In comune tra tutti i profili</p>
      <Segmented value={sub} onChange={setSub} options={[
        { value: 'movimenti', label: 'Movimenti' },
        { value: 'budget', label: 'Budget' },
        { value: 'risparmio', label: 'Risparmio' }
      ]} />
      {sub === 'movimenti' && <Movimenti />}
      {sub === 'budget' && <BudgetCategorie />}
      {sub === 'risparmio' && <Risparmio />}
    </div>
  )
}

/* ------------------------------ MOVIMENTI ------------------------------ */

function Movimenti() {
  const { rate, displayCurrency } = useApp()
  const [mk, setMk] = useState(monthKey(todayISO()))
  const [addOpen, setAddOpen] = useState(false)
  const [editTx, setEditTx] = useState(null)
  const [recOpen, setRecOpen] = useState(false)

  const txs = useLiveQuery(() => db.transactions.where('month').equals(mk).toArray(), [mk]) || []
  const inDC = (t) => convert(t.amount, t.currency, displayCurrency, rate)
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + inDC(t), 0)
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + inDC(t), 0)

  const byDay = {}
  for (const t of [...txs].sort((a, b) => b.date.localeCompare(a.date))) {
    (byDay[t.date] = byDay[t.date] || []).push(t)
  }

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center justify-between mb-2">
          <button className="px-3 py-1 text-lg" onClick={() => setMk(addMonthsToKey(mk, -1))}>‹</button>
          <span className="font-semibold">{fmtMonth(mk)}</span>
          <button className="px-3 py-1 text-lg" onClick={() => setMk(addMonthsToKey(mk, 1))}>›</button>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="text-xs text-zinc-500">Entrate</p><p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{fmtMoney(income, displayCurrency)}</p></div>
          <div><p className="text-xs text-zinc-500">Spese</p><p className="font-bold text-red-600 dark:text-red-400 text-sm">{fmtMoney(expense, displayCurrency)}</p></div>
          <div><p className="text-xs text-zinc-500">Saldo</p><p className="font-bold text-sm">{fmtMoney(income - expense, displayCurrency)}</p></div>
        </div>
      </Card>

      <button onClick={() => setRecOpen(true)} className="w-full text-left text-sm font-medium text-blue-600 dark:text-blue-400 px-1">
        🔁 Gestisci entrate e spese ricorrenti ›
      </button>

      {Object.keys(byDay).length === 0 && <EmptyState icon="🧾" text="Nessun movimento in questo mese." />}
      {Object.entries(byDay).map(([date, list]) => (
        <div key={date}>
          <p className="text-xs font-semibold text-zinc-500 mb-1 px-1">{fmtDate(date)}</p>
          <div className="space-y-2">
            {list.map(t => (
              <Card key={t.id} className="flex items-center gap-3 !py-3" onClick={() => setEditTx(t)}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{t.type === 'income' ? (t.note || 'Entrata') : t.category}</p>
                  {t.type === 'expense' && t.note && <p className="text-xs text-zinc-500 truncate">{t.note}</p>}
                  {t.recurringId && <p className="text-xs text-zinc-400">🔁 ricorrente</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold tabular-nums ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {t.type === 'income' ? '+' : '−'}{fmtMoney(t.amount, t.currency)}
                  </p>
                  {t.currency !== displayCurrency && (
                    <p className="text-xs text-zinc-400">≈ {fmtMoney(inDC(t), displayCurrency)}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Fab onClick={() => setAddOpen(true)} />
      {addOpen && <TxModal onClose={() => setAddOpen(false)} />}
      {editTx && <TxModal tx={editTx} onClose={() => setEditTx(null)} />}
      {recOpen && <RecurringTxModal onClose={() => setRecOpen(false)} />}
    </div>
  )
}

/** Inserimento rapido: importo → categoria = salvato (max 3 tocchi) */
function TxModal({ tx, onClose }) {
  const { expenseCategories } = useApp()
  const [type, setType] = useState(tx?.type || 'expense')
  const [amount, setAmount] = useState(tx ? String(tx.amount) : '')
  const [currency, setCurrency] = useState(tx?.currency || 'EUR')
  const [date, setDate] = useState(tx?.date || todayISO())
  const [note, setNote] = useState(tx?.note || '')
  const [category, setCategory] = useState(tx?.category || '')
  const [delOpen, setDelOpen] = useState(false)

  const num = parseFloat(amount.replace(',', '.'))
  const valid = !isNaN(num) && num > 0

  const persist = async (cat) => {
    const data = {
      type, amount: num, currency, date, month: monthKey(date),
      note: note.trim() || undefined, category: type === 'expense' ? cat : 'Entrata'
    }
    if (tx) await db.transactions.update(tx.id, data)
    else await db.transactions.add(data)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={tx ? 'Modifica movimento' : 'Nuovo movimento'}>
      <Segmented value={type} onChange={setType} className="mb-3" options={[
        { value: 'expense', label: '💸 Spesa' }, { value: 'income', label: '💰 Entrata' }
      ]} />
      <div className="flex gap-2 mb-3 items-center">
        <TextInput inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="0,00" autoFocus={!tx} className="flex-1 !text-3xl !font-bold text-center !py-3" />
        <Segmented value={currency} onChange={setCurrency} className="w-32 shrink-0" options={[
          { value: 'EUR', label: '€' }, { value: 'ALL', label: 'LEK' }
        ]} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data"><TextInput type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="Nota (opzionale)"><TextInput value={note} onChange={e => setNote(e.target.value)} placeholder="…" /></Field>
      </div>
      {type === 'expense' ? (
        <>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-2">
            {tx ? 'Categoria' : 'Tocca una categoria per salvare'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {expenseCategories.map(c => (
              <button key={c} disabled={!valid}
                onClick={() => tx ? setCategory(c) : persist(c)}
                className={`rounded-xl px-2 py-3 text-xs font-semibold disabled:opacity-40 ${category === c ? 'bg-blue-600 text-white' : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'}`}>
                {c}
              </button>
            ))}
          </div>
          {tx && <Btn className="w-full mt-4" disabled={!valid || !category} onClick={() => persist(category)}>Salva modifiche</Btn>}
        </>
      ) : (
        <Btn className="w-full mt-2" disabled={!valid} onClick={() => persist()}>Salva entrata</Btn>
      )}
      {tx && (
        <>
          <Btn variant="danger" className="w-full mt-3" onClick={() => setDelOpen(true)}>🗑️ Elimina movimento</Btn>
          <Confirm open={delOpen} onClose={() => setDelOpen(false)} title="Eliminare il movimento?"
            message="Questa azione non può essere annullata."
            onConfirm={async () => { await db.transactions.delete(tx.id); onClose() }} />
        </>
      )}
    </Modal>
  )
}

function RecurringTxModal({ onClose }) {
  const { expenseCategories } = useApp()
  const recs = useLiveQuery(() => db.recurringTransactions.toArray(), []) || []
  const [form, setForm] = useState(null)

  const save = async () => {
    const amount = parseFloat(String(form.amount).replace(',', '.'))
    if (isNaN(amount) || !form.description.trim()) return
    await db.recurringTransactions.add({
      type: form.type, amount, currency: form.currency,
      dayOfMonth: Math.min(28, Math.max(1, Number(form.dayOfMonth) || 1)),
      description: form.description.trim(),
      category: form.type === 'expense' ? form.category : 'Entrata',
      startMonth: monthKey(todayISO()), createdAt: todayISO(), active: true
    })
    await materialize()
    setForm(null)
  }

  return (
    <Modal open onClose={onClose} title="Entrate e spese ricorrenti">
      <p className="text-xs text-zinc-500 mb-3">Generate automaticamente ogni mese nel giorno indicato.</p>
      <div className="space-y-2 mb-4">
        {recs.length === 0 && <p className="text-sm text-zinc-400 text-center py-2">Nessuna voce ricorrente.</p>}
        {recs.map(r => (
          <Card key={r.id} className="flex items-center gap-3 !py-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{r.description}</p>
              <p className="text-xs text-zinc-500">{r.type === 'income' ? 'Entrata' : r.category} · giorno {r.dayOfMonth} del mese</p>
            </div>
            <p className={`font-bold text-sm tabular-nums ${r.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
              {r.type === 'income' ? '+' : '−'}{fmtMoney(r.amount, r.currency)}
            </p>
            <button onClick={() => db.recurringTransactions.delete(r.id)} className="text-zinc-400" aria-label="Elimina">🗑️</button>
          </Card>
        ))}
      </div>

      {!form ? (
        <Btn className="w-full" onClick={() => setForm({ type: 'expense', amount: '', currency: 'EUR', dayOfMonth: 1, description: '', category: expenseCategories[0] })}>
          + Nuova voce ricorrente
        </Btn>
      ) : (
        <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3">
          <Segmented value={form.type} onChange={v => setForm({ ...form, type: v })} className="mb-3" options={[
            { value: 'expense', label: 'Spesa fissa' }, { value: 'income', label: 'Entrata fissa' }
          ]} />
          <Field label="Descrizione"><TextInput value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Es. Affitto, Stipendio…" /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Importo"><TextInput inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></Field>
            <Field label="Valuta">
              <Select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                <option value="EUR">EUR</option><option value="ALL">LEK</option>
              </Select>
            </Field>
            <Field label="Giorno"><TextInput inputMode="numeric" value={form.dayOfMonth} onChange={e => setForm({ ...form, dayOfMonth: e.target.value })} /></Field>
          </div>
          {form.type === 'expense' && (
            <Field label="Categoria">
              <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {expenseCategories.map(c => <option key={c}>{c}</option>)}
              </Select>
            </Field>
          )}
          <div className="flex gap-2">
            <Btn variant="secondary" className="flex-1" onClick={() => setForm(null)}>Annulla</Btn>
            <Btn className="flex-1" onClick={save}>Salva</Btn>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* --------------------------- BUDGET PER CATEGORIA --------------------------- */

function BudgetCategorie() {
  const { rate, displayCurrency, expenseCategories } = useApp()
  const mk = monthKey(todayISO())
  const txs = useLiveQuery(() => db.transactions.where('month').equals(mk).toArray(), [mk]) || []
  const budgets = useLiveQuery(() => db.categoryBudgets.toArray(), []) || []
  const [editCat, setEditCat] = useState(null)
  const [limitVal, setLimitVal] = useState('')

  const spentFor = (cat) => txs
    .filter(t => t.type === 'expense' && t.category === cat)
    .reduce((s, t) => s + convert(t.amount, t.currency, displayCurrency, rate), 0)

  const saveLimit = async () => {
    const v = parseFloat(limitVal.replace(',', '.'))
    if (isNaN(v) || v <= 0) await db.categoryBudgets.delete(editCat)
    else await db.categoryBudgets.put({ category: editCat, limit: v, currency: displayCurrency })
    setEditCat(null)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">Limiti mensili per {fmtMonth(mk).toLowerCase()} (in {CURRENCY_LABEL[displayCurrency]}). Tocca una categoria per impostare il limite.</p>
      {expenseCategories.map(cat => {
        const b = budgets.find(x => x.category === cat)
        const spent = spentFor(cat)
        const limit = b ? convert(b.limit, b.currency, displayCurrency, rate) : null
        const pct = limit ? spent / limit : 0
        const status = !limit ? 'ok' : pct > 1 ? 'over' : pct >= 0.8 ? 'warn' : 'ok'
        return (
          <Card key={cat} onClick={() => { setEditCat(cat); setLimitVal(b ? String(b.limit) : '') }}>
            <div className="flex justify-between items-baseline mb-1">
              <p className="font-medium">{cat}</p>
              <p className="text-sm tabular-nums">
                <b>{fmtMoney(spent, displayCurrency)}</b>
                {limit && <span className="text-zinc-500"> / {fmtMoney(limit, displayCurrency)}</span>}
              </p>
            </div>
            {limit ? (
              <>
                <ProgressBar pct={pct} status={status} />
                {status === 'over' && <p className="text-xs mt-1 font-medium text-red-600 dark:text-red-400">🚨 Limite superato di {fmtMoney(spent - limit, displayCurrency)}</p>}
                {status === 'warn' && <p className="text-xs mt-1 font-medium text-amber-600 dark:text-amber-400">⚠️ Hai superato l'80% del budget</p>}
              </>
            ) : (
              <p className="text-xs text-zinc-400">Nessun limite impostato</p>
            )}
          </Card>
        )
      })}
      <Modal open={!!editCat} onClose={() => setEditCat(null)} title={`Budget mensile — ${editCat}`}>
        <Field label={`Limite mensile (${CURRENCY_LABEL[displayCurrency]}) — lascia vuoto per rimuovere`}>
          <TextInput inputMode="decimal" value={limitVal} onChange={e => setLimitVal(e.target.value)} autoFocus />
        </Field>
        <Btn className="w-full mt-2" onClick={saveLimit}>Salva</Btn>
      </Modal>
    </div>
  )
}

/* ------------------------------- RISPARMIO ------------------------------- */

function Risparmio() {
  const { rate } = useApp()
  const today = todayISO()
  const sgs = useLiveQuery(() => db.savingsGoals.toArray(), []) || []
  const deposits = useLiveQuery(() => db.savingsDeposits.toArray(), []) || []
  const goals = useLiveQuery(() => db.goals.toArray(), []) || []
  const [addOpen, setAddOpen] = useState(false)
  const [depositFor, setDepositFor] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [delTarget, setDelTarget] = useState(null)

  return (
    <div className="space-y-3">
      {sgs.length === 0 && <EmptyState icon="🏦" text="Nessun obiettivo di risparmio. Creane uno!" />}
      {sgs.map(sg => {
        const deps = deposits.filter(d => d.savingsGoalId === sg.id)
        const s = computeSavingsStats(sg, deps, rate, today)
        const linked = goals.find(g => g.id === sg.linkedGoalId || g.savingsGoalId === sg.id)
        return (
          <Card key={sg.id}>
            <div className="flex justify-between items-start mb-1">
              <div className="min-w-0">
                <p className="font-bold truncate">{sg.name}</p>
                <p className="text-xs text-zinc-500">entro {fmtDate(sg.deadline)}{linked ? ` · 🎯 ${linked.title}` : ''}</p>
              </div>
              <button onClick={() => setDelTarget(sg)} className="text-zinc-400 px-1" aria-label="Elimina">🗑️</button>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <ProgressBar pct={s.pct} status="ok" className="flex-1" />
              <span className="text-sm font-semibold tabular-nums">{Math.round(s.pct * 100)}%</span>
            </div>
            <p className="text-sm">{fmtMoney(s.deposited, sg.currency)} su <b>{fmtMoney(sg.targetAmount, sg.currency)}</b></p>
            {s.remaining > 0 ? (
              <p className={`text-sm mt-0.5 ${s.overdue ? 'text-red-600 font-medium' : 'text-zinc-600 dark:text-zinc-300'}`}>
                {s.overdue ? '⚠️ Deadline superata' : <>📈 Servono <b>{fmtMoney(s.monthlyQuota, sg.currency)}/mese</b> per arrivare al target</>}
              </p>
            ) : (
              <p className="text-sm mt-0.5 text-emerald-600 font-medium">🎉 Target raggiunto!</p>
            )}
            <div className="flex gap-2 mt-3">
              <Btn className="flex-1 !py-2 text-sm" onClick={() => setDepositFor(sg)}>+ Versa</Btn>
              <Btn variant="secondary" className="flex-1 !py-2 text-sm" onClick={() => setExpanded(expanded === sg.id ? null : sg.id)}>
                {expanded === sg.id ? 'Nascondi' : 'Versamenti'} ({deps.length})
              </Btn>
            </div>
            {expanded === sg.id && (
              <div className="mt-2 divide-y divide-zinc-100 dark:divide-zinc-700">
                {deps.length === 0 && <p className="text-sm text-zinc-400 py-2">Nessun versamento ancora.</p>}
                {[...deps].sort((a, b) => b.date.localeCompare(a.date)).map(d => (
                  <div key={d.id} className="flex justify-between items-center py-2 text-sm">
                    <span className="text-zinc-500">{fmtDate(d.date)}</span>
                    <span className="font-semibold tabular-nums">+{fmtMoney(d.amount, d.currency)}</span>
                    <button onClick={() => db.savingsDeposits.delete(d.id)} className="text-zinc-400" aria-label="Elimina">✕</button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )
      })}
      <Btn variant="secondary" className="w-full" onClick={() => setAddOpen(true)}>+ Nuovo obiettivo di risparmio</Btn>

      {addOpen && <SavingsGoalModal onClose={() => setAddOpen(false)} goals={goals} />}
      {depositFor && <DepositModal sg={depositFor} onClose={() => setDepositFor(null)} />}
      <Confirm open={!!delTarget} onClose={() => setDelTarget(null)}
        title="Eliminare l'obiettivo di risparmio?"
        message={`"${delTarget?.name}" e i suoi versamenti registrati saranno eliminati.`}
        onConfirm={async () => {
          await db.savingsDeposits.where('savingsGoalId').equals(delTarget.id).delete()
          await db.savingsGoals.delete(delTarget.id)
        }} />
    </div>
  )
}

function SavingsGoalModal({ onClose, goals }) {
  const [f, setF] = useState({ name: '', target: '', currency: 'EUR', deadline: '', linkedGoalId: '' })
  const save = async () => {
    const target = parseFloat(f.target.replace(',', '.'))
    if (!f.name.trim() || isNaN(target) || !f.deadline) return
    await db.savingsGoals.add({
      name: f.name.trim(), targetAmount: target, currency: f.currency,
      deadline: f.deadline, linkedGoalId: f.linkedGoalId ? Number(f.linkedGoalId) : undefined,
      createdAt: todayISO()
    })
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Nuovo obiettivo di risparmio">
      <Field label="Nome"><TextInput value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Es. Anticipo casa" autoFocus /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Importo target"><TextInput inputMode="decimal" value={f.target} onChange={e => setF({ ...f, target: e.target.value })} /></Field>
        <Field label="Valuta">
          <Select value={f.currency} onChange={e => setF({ ...f, currency: e.target.value })}>
            <option value="EUR">EUR</option><option value="ALL">LEK</option>
          </Select>
        </Field>
      </div>
      <Field label="Deadline"><TextInput type="date" value={f.deadline} onChange={e => setF({ ...f, deadline: e.target.value })} /></Field>
      <Field label="Collega a un obiettivo (opzionale)">
        <Select value={f.linkedGoalId} onChange={e => setF({ ...f, linkedGoalId: e.target.value })}>
          <option value="">Nessuno</option>
          {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
        </Select>
      </Field>
      <Btn className="w-full mt-2" onClick={save} disabled={!f.name.trim() || !f.deadline}>Crea</Btn>
    </Modal>
  )
}

function DepositModal({ sg, onClose }) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(sg.currency)
  const [date, setDate] = useState(todayISO())
  const save = async () => {
    const v = parseFloat(amount.replace(',', '.'))
    if (isNaN(v) || v <= 0) return
    await db.savingsDeposits.add({ savingsGoalId: sg.id, amount: v, currency, date, month: monthKey(date) })
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={`Versamento — ${sg.name}`}>
      <div className="flex gap-2 mb-3 items-center">
        <TextInput inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)}
          placeholder="0,00" autoFocus className="flex-1 !text-3xl !font-bold text-center !py-3" />
        <Segmented value={currency} onChange={setCurrency} className="w-32 shrink-0" options={[
          { value: 'EUR', label: '€' }, { value: 'ALL', label: 'LEK' }
        ]} />
      </div>
      <Field label="Data"><TextInput type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
      <Btn className="w-full mt-2" onClick={save} disabled={!amount.trim()}>Registra versamento</Btn>
    </Modal>
  )
}
