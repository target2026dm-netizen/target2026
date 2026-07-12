import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { useApp } from '../context/AppContext.jsx'
import { todayISO, fmtDate, addMonths } from '../logic/dates.js'
import { computeGoalStats, STATUS_INFO, proposeMilestones, computeSavingsStats } from '../logic/goals.js'
import { fmtNum, fmtMoney, CURRENCY_LABEL } from '../logic/currency.js'
import { WEEKDAYS_IT } from '../logic/dates.js'
import { Card, Modal, Field, TextInput, Select, Btn, Fab, ProgressBar, Segmented, EmptyState, Confirm } from '../components/ui.jsx'

export default function Obiettivi() {
  const { activeProfile } = useApp()
  const pid = activeProfile.id
  const [wizardOpen, setWizardOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)

  const goals = useLiveQuery(() => db.goals.where('profileId').equals(pid).toArray(), [pid]) || []
  const milestones = useLiveQuery(() => db.milestones.toArray(), []) || []
  const logs = useLiveQuery(() => db.progressLogs.toArray(), []) || []

  const today = todayISO()

  if (detailId !== null) {
    return <GoalDetail goalId={detailId} onBack={() => setDetailId(null)} />
  }

  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold">I tuoi obiettivi</h2>
      {goals.length === 0 && <EmptyState icon="🎯" text="Nessun obiettivo ancora. Creane uno con il pulsante +" />}
      {goals.map(g => {
        const stats = computeGoalStats(g, {
          logs: logs.filter(l => l.goalId === g.id),
          milestones: milestones.filter(m => m.goalId === g.id)
        }, today)
        const si = STATUS_INFO[stats.status]
        return (
          <Card key={g.id} onClick={() => setDetailId(g.id)}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0">
                <p className="font-bold truncate">{g.title}</p>
                <p className="text-xs text-zinc-500">{g.category} · entro {fmtDate(g.targetDate)}</p>
              </div>
              <span className="text-lg shrink-0" title={si.label}>{si.emoji}</span>
            </div>
            <div className="flex items-center gap-2">
              <ProgressBar pct={stats.pct} status={stats.status} className="flex-1" />
              <span className="text-sm font-semibold tabular-nums">{Math.round(stats.pct * 100)}%</span>
            </div>
            {stats.requiredText && (
              <p className="text-xs mt-1.5 text-zinc-600 dark:text-zinc-300">📈 {stats.requiredText}</p>
            )}
            {stats.unrealistic && (
              <p className="text-xs mt-1 font-medium text-red-600 dark:text-red-400">⚠️ Ritmo irrealistico: valuta di rivedere la deadline</p>
            )}
          </Card>
        )
      })}
      <Fab onClick={() => setWizardOpen(true)} />
      {wizardOpen && <GoalWizard onClose={() => setWizardOpen(false)} profileId={pid} />}
    </div>
  )
}

/* ------------------------- DETTAGLIO OBIETTIVO ------------------------- */

function GoalDetail({ goalId, onBack }) {
  const { rate } = useApp()
  const today = todayISO()
  const goal = useLiveQuery(() => db.goals.get(goalId), [goalId])
  const milestones = useLiveQuery(() => db.milestones.where('goalId').equals(goalId).toArray(), [goalId]) || []
  const logs = useLiveQuery(() => db.progressLogs.where('goalId').equals(goalId).toArray(), [goalId]) || []
  const recs = useLiveQuery(() => db.recurrences.where('goalId').equals(goalId).toArray(), [goalId]) || []
  const savings = useLiveQuery(() => goal?.savingsGoalId ? db.savingsGoals.get(goal.savingsGoalId) : null, [goal?.savingsGoalId])
  const deposits = useLiveQuery(() => goal?.savingsGoalId ? db.savingsDeposits.where('savingsGoalId').equals(goal.savingsGoalId).toArray() : [], [goal?.savingsGoalId]) || []

  const [editOpen, setEditOpen] = useState(false)
  const [delOpen, setDelOpen] = useState(false)
  const [msOpen, setMsOpen] = useState(false)
  const [recOpen, setRecOpen] = useState(false)
  const [progressOpen, setProgressOpen] = useState(false)

  if (!goal) return null
  const sorted = [...milestones].sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const stats = computeGoalStats(goal, { logs, milestones }, today)
  const si = STATUS_INFO[stats.status]

  const deleteGoal = async () => {
    await db.transaction('rw', [db.goals, db.milestones, db.recurrences, db.tasks, db.progressLogs], async () => {
      await db.milestones.where('goalId').equals(goalId).delete()
      const recIds = (await db.recurrences.where('goalId').equals(goalId).toArray()).map(r => r.id)
      await db.recurrences.where('goalId').equals(goalId).delete()
      await db.tasks.where('goalId').equals(goalId).delete()
      await db.progressLogs.where('goalId').equals(goalId).delete()
      await db.goals.delete(goalId)
    })
    onBack()
  }

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-blue-600 dark:text-blue-400 font-semibold">‹ Obiettivi</button>
      <div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-2xl font-bold">{goal.title}</h2>
          <span className="text-2xl">{si.emoji}</span>
        </div>
        <p className="text-sm text-zinc-500">{goal.category} · {fmtDate(goal.startDate)} → {fmtDate(goal.targetDate)}</p>
        {goal.description && <p className="text-sm mt-1 text-zinc-600 dark:text-zinc-300">{goal.description}</p>}
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-2">
          <ProgressBar pct={stats.pct} status={stats.status} className="flex-1" />
          <span className="font-bold tabular-nums">{Math.round(stats.pct * 100)}%</span>
        </div>
        <p className={`text-sm font-medium ${si.color}`}>{si.emoji} {si.label}</p>
        {goal.type === 'numeric' && stats.current !== null && (
          <p className="text-sm mt-1">Valore attuale: <b>{fmtNum(stats.current, 1)} {goal.unit}</b>{goal.metricPeriod === 'month' ? '/mese' : ''} · Target: <b>{fmtNum(goal.targetValue, 1)} {goal.unit}</b></p>
        )}
        {stats.requiredText && <p className="text-sm mt-1 text-zinc-600 dark:text-zinc-300">📈 {stats.requiredText}</p>}
        <p className="text-xs text-zinc-500 mt-1">{stats.daysLeft} giorni alla deadline</p>
        {stats.unrealistic && (
          <div className="mt-2 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">⚠️ Al ritmo attuale l'obiettivo non è raggiungibile entro la deadline.</p>
            <Btn variant="danger" className="mt-2 !py-1.5 text-sm" onClick={() => setEditOpen(true)}>Rivedi la deadline</Btn>
          </div>
        )}
      </Card>

      {goal.type === 'numeric' && (
        <Btn className="w-full" onClick={() => setProgressOpen(true)}>➕ Registra progresso</Btn>
      )}
      {goal.type === 'binary' && (
        <Btn className="w-full" variant={goal.done ? 'secondary' : 'primary'}
          onClick={() => db.goals.update(goalId, { done: !goal.done })}>
          {goal.done ? '↩️ Segna come da fare' : '✅ Segna come completato'}
        </Btn>
      )}

      {savings && (
        <Card>
          <h3 className="font-bold mb-1">💰 Risparmio collegato: {savings.name}</h3>
          {(() => {
            const s = computeSavingsStats(savings, deposits, rate, today)
            return (
              <>
                <ProgressBar pct={s.pct} status="ok" className="mb-1" />
                <p className="text-sm">{fmtMoney(s.deposited, savings.currency)} su {fmtMoney(savings.targetAmount, savings.currency)} · quota necessaria: <b>{fmtMoney(s.monthlyQuota, savings.currency)}/mese</b></p>
              </>
            )
          })()}
        </Card>
      )}

      {(goal.type === 'milestone' || sorted.length > 0) && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold">Tappe (milestone)</h3>
            <Btn variant="ghost" className="!py-1 text-sm" onClick={() => setMsOpen(true)}>+ Aggiungi</Btn>
          </div>
          <div className="space-y-2">
            {sorted.map(m => (
              <Card key={m.id} className="flex items-center gap-3 !py-3"
                onClick={() => db.milestones.update(m.id, { done: !m.done })}>
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm shrink-0 ${m.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-600'}`}>{m.done ? '✓' : ''}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${m.done ? 'line-through text-zinc-400' : ''}`}>{m.title}</p>
                  <p className={`text-xs ${!m.done && m.dueDate < today ? 'text-red-600 font-medium' : 'text-zinc-500'}`}>
                    entro {fmtDate(m.dueDate)}{!m.done && m.dueDate < today ? ' — scaduta' : ''}
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); db.milestones.delete(m.id) }} className="text-zinc-400 px-1" aria-label="Elimina">🗑️</button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold">Abitudini ricorrenti</h3>
          <Btn variant="ghost" className="!py-1 text-sm" onClick={() => setRecOpen(true)}>+ Aggiungi</Btn>
        </div>
        {recs.length === 0 && <p className="text-sm text-zinc-500">Nessuna abitudine collegata.</p>}
        <div className="space-y-2">
          {recs.map(r => (
            <Card key={r.id} className="flex items-center gap-3 !py-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-zinc-500">
                  {r.freqType === 'timesPerWeek'
                    ? `${r.timesPerWeek} volte a settimana (ridistribuzione automatica)`
                    : (r.days || []).map(d => WEEKDAYS_IT[d]).join(', ')}
                </p>
              </div>
              <button onClick={async () => {
                await db.tasks.where('recurrenceId').equals(r.id).and(t => !t.done).delete()
                await db.recurrences.delete(r.id)
              }} className="text-zinc-400 px-1" aria-label="Elimina">🗑️</button>
            </Card>
          ))}
        </div>
      </div>

      {logs.length > 0 && (
        <div>
          <h3 className="font-bold mb-2">Storico progressi</h3>
          <Card className="divide-y divide-zinc-100 dark:divide-zinc-700 !py-1">
            {[...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(l => (
              <div key={l.id} className="flex justify-between py-2 text-sm">
                <span className="text-zinc-500">{fmtDate(l.date)}</span>
                <span className="font-semibold tabular-nums">{fmtNum(l.value, 1)} {goal.unit}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Btn variant="secondary" className="flex-1" onClick={() => setEditOpen(true)}>✏️ Modifica</Btn>
        <Btn variant="danger" className="flex-1" onClick={() => setDelOpen(true)}>🗑️ Elimina</Btn>
      </div>

      <Confirm open={delOpen} onClose={() => setDelOpen(false)} onConfirm={deleteGoal}
        title="Eliminare l'obiettivo?" message={`"${goal.title}" e tutti i suoi task, tappe e progressi saranno eliminati definitivamente.`} />
      {editOpen && <GoalEditModal goal={goal} onClose={() => setEditOpen(false)} />}
      {msOpen && <MilestoneModal goalId={goalId} onClose={() => setMsOpen(false)} />}
      {recOpen && <RecurrenceModal goal={goal} onClose={() => setRecOpen(false)} />}
      {progressOpen && <QuickProgress goal={goal} onClose={() => setProgressOpen(false)} />}
    </div>
  )
}

function QuickProgress({ goal, onClose }) {
  const [value, setValue] = useState('')
  const save = async () => {
    const v = parseFloat(value.replace(',', '.'))
    if (isNaN(v)) return
    await db.progressLogs.add({ goalId: goal.id, date: todayISO(), value: v })
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Registra progresso">
      <Field label={goal.metricPeriod === 'month' ? `${goal.unit} questo mese` : `Valore attuale (${goal.unit})`}>
        <TextInput inputMode="decimal" value={value} onChange={e => setValue(e.target.value)} autoFocus />
      </Field>
      <Btn className="w-full mt-2" onClick={save} disabled={!value.trim()}>Salva</Btn>
    </Modal>
  )
}

function GoalEditModal({ goal, onClose }) {
  const { goalCategories } = useApp()
  const [f, setF] = useState({ ...goal })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const save = async () => {
    const upd = {
      title: f.title, description: f.description, category: f.category,
      startDate: f.startDate, targetDate: f.targetDate
    }
    if (goal.type === 'numeric') {
      upd.startValue = parseFloat(String(f.startValue).replace(',', '.'))
      upd.targetValue = parseFloat(String(f.targetValue).replace(',', '.'))
      upd.unit = f.unit
    }
    await db.goals.update(goal.id, upd)
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Modifica obiettivo">
      <Field label="Titolo"><TextInput value={f.title} onChange={e => set('title', e.target.value)} /></Field>
      <Field label="Descrizione"><TextInput value={f.description || ''} onChange={e => set('description', e.target.value)} /></Field>
      <Field label="Categoria">
        <Select value={f.category} onChange={e => set('category', e.target.value)}>
          {[...new Set([...goalCategories, f.category])].map(c => <option key={c}>{c}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data inizio"><TextInput type="date" value={f.startDate} onChange={e => set('startDate', e.target.value)} /></Field>
        <Field label="Deadline"><TextInput type="date" value={f.targetDate} onChange={e => set('targetDate', e.target.value)} /></Field>
      </div>
      {goal.type === 'numeric' && (
        <div className="grid grid-cols-3 gap-3">
          <Field label="Partenza"><TextInput inputMode="decimal" value={f.startValue} onChange={e => set('startValue', e.target.value)} /></Field>
          <Field label="Target"><TextInput inputMode="decimal" value={f.targetValue} onChange={e => set('targetValue', e.target.value)} /></Field>
          <Field label="Unità"><TextInput value={f.unit} onChange={e => set('unit', e.target.value)} /></Field>
        </div>
      )}
      <Btn className="w-full mt-2" onClick={save}>Salva modifiche</Btn>
    </Modal>
  )
}

function MilestoneModal({ goalId, onClose }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayISO())
  const save = async () => {
    if (!title.trim()) return
    await db.milestones.add({ goalId, title: title.trim(), dueDate: date, done: false })
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Nuova tappa">
      <Field label="Titolo"><TextInput value={title} onChange={e => setTitle(e.target.value)} autoFocus /></Field>
      <Field label="Entro il"><TextInput type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
      <Btn className="w-full mt-2" onClick={save} disabled={!title.trim()}>Aggiungi</Btn>
    </Modal>
  )
}

export function RecurrenceModal({ goal, onClose, profileId }) {
  const [title, setTitle] = useState('')
  const [freqType, setFreqType] = useState('timesPerWeek')
  const [times, setTimes] = useState(3)
  const [days, setDays] = useState([0, 2, 4])
  const save = async () => {
    if (!title.trim()) return
    await db.recurrences.add({
      goalId: goal?.id, profileId: goal?.profileId ?? profileId, title: title.trim(),
      freqType, timesPerWeek: freqType === 'timesPerWeek' ? times : days.length,
      days: freqType === 'daysOfWeek' ? days : [],
      startDate: todayISO(), endDate: goal?.targetDate
    })
    onClose()
  }
  return (
    <Modal open onClose={onClose} title="Nuova abitudine ricorrente">
      <Field label="Titolo"><TextInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Es. Palestra" autoFocus /></Field>
      <Field label="Frequenza">
        <Segmented value={freqType} onChange={setFreqType} options={[
          { value: 'timesPerWeek', label: 'X volte a settimana' },
          { value: 'daysOfWeek', label: 'Giorni specifici' }
        ]} />
      </Field>
      {freqType === 'timesPerWeek' ? (
        <Field label={`${times} volte a settimana`}>
          <input type="range" min="1" max="7" value={times} onChange={e => setTimes(Number(e.target.value))} className="w-full" />
        </Field>
      ) : (
        <Field label="Giorni della settimana">
          <div className="flex gap-1">
            {WEEKDAYS_IT.map((d, i) => (
              <button key={d} onClick={() => setDays(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i].sort())}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold ${days.includes(i) ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                {d}
              </button>
            ))}
          </div>
        </Field>
      )}
      <Btn className="w-full mt-2" onClick={save} disabled={!title.trim()}>Aggiungi</Btn>
    </Modal>
  )
}

/* ------------------------- WIZARD NUOVO OBIETTIVO ------------------------- */

function GoalWizard({ onClose, profileId }) {
  const { goalCategories, setSetting } = useApp()
  const today = todayISO()
  const [step, setStep] = useState(1)
  const [f, setF] = useState({
    title: '', description: '', category: goalCategories[0] || 'Personale',
    startDate: today, targetDate: addMonths(today, 6),
    type: 'numeric', startValue: '', targetValue: '', unit: '', metricPeriod: '',
    milestones: [], recurrences: [],
    savingsChoice: 'none', savingsGoalId: '', newSavings: { name: '', target: '', currency: 'EUR' }
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const [newCat, setNewCat] = useState('')
  const savingsGoals = useLiveQuery(() => db.savingsGoals.toArray(), []) || []

  const num = (s) => parseFloat(String(s).replace(',', '.'))

  const genMilestones = () => {
    if (f.type === 'numeric' && !isNaN(num(f.startValue)) && !isNaN(num(f.targetValue))) {
      return proposeMilestones(f.startDate, f.targetDate, num(f.startValue), num(f.targetValue), f.unit || '')
    }
    return []
  }

  const next = () => {
    if (step === 2 && f.type === 'numeric' && f.milestones.length === 0) {
      set('milestones', genMilestones())
    }
    setStep(step + 1)
  }

  const save = async () => {
    let savingsGoalId
    if (f.savingsChoice === 'existing' && f.savingsGoalId) savingsGoalId = Number(f.savingsGoalId)
    if (f.savingsChoice === 'new' && f.newSavings.name.trim() && !isNaN(num(f.newSavings.target))) {
      savingsGoalId = await db.savingsGoals.add({
        name: f.newSavings.name.trim(), targetAmount: num(f.newSavings.target),
        currency: f.newSavings.currency, deadline: f.targetDate, createdAt: today
      })
    }
    const goal = {
      profileId, title: f.title.trim(), description: f.description.trim(), category: f.category,
      startDate: f.startDate, targetDate: f.targetDate, type: f.type, createdAt: today, savingsGoalId
    }
    if (f.type === 'numeric') {
      goal.startValue = num(f.startValue); goal.targetValue = num(f.targetValue); goal.unit = f.unit
      if (f.metricPeriod === 'month') goal.metricPeriod = 'month'
    }
    if (f.type === 'binary') goal.done = false
    const goalId = await db.goals.add(goal)
    for (const m of f.milestones) {
      if (m.title.trim()) await db.milestones.add({ goalId, title: m.title.trim(), dueDate: m.dueDate, done: false })
    }
    for (const r of f.recurrences) {
      await db.recurrences.add({
        goalId, profileId, title: r.title, freqType: r.freqType,
        timesPerWeek: r.freqType === 'timesPerWeek' ? r.times : r.days.length,
        days: r.freqType === 'daysOfWeek' ? r.days : [],
        startDate: f.startDate < today ? today : f.startDate, endDate: f.targetDate
      })
    }
    if (f.type === 'numeric' && !isNaN(num(f.startValue))) {
      await db.progressLogs.add({ goalId, date: f.startDate, value: num(f.startValue) })
    }
    onClose()
  }

  const canNext1 = f.title.trim() && f.startDate && f.targetDate && f.targetDate > f.startDate
  const canNext2 = f.type !== 'numeric' || (!isNaN(num(f.startValue)) && !isNaN(num(f.targetValue)) && f.unit.trim())

  return (
    <Modal open onClose={onClose} title={`Nuovo obiettivo — passo ${step} di 4`}>
      <div className="flex gap-1 mb-4">
        {[1, 2, 3, 4].map(s => <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700'}`} />)}
      </div>

      {step === 1 && (
        <>
          <Field label="Titolo *"><TextInput value={f.title} onChange={e => set('title', e.target.value)} placeholder="Es. Perdere 10 kg" autoFocus /></Field>
          <Field label="Descrizione"><TextInput value={f.description} onChange={e => set('description', e.target.value)} placeholder="Opzionale" /></Field>
          <Field label="Categoria">
            <div className="flex gap-2">
              <Select value={f.category} onChange={e => set('category', e.target.value)} className="flex-1">
                {goalCategories.map(c => <option key={c}>{c}</option>)}
              </Select>
            </div>
            <div className="flex gap-2 mt-2">
              <TextInput value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nuova categoria…" className="flex-1" />
              <Btn variant="secondary" disabled={!newCat.trim()} onClick={() => {
                const c = newCat.trim()
                setSetting('goalCategories', [...goalCategories, c]); set('category', c); setNewCat('')
              }}>+</Btn>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inizio"><TextInput type="date" value={f.startDate} onChange={e => set('startDate', e.target.value)} /></Field>
            <Field label="Deadline *"><TextInput type="date" value={f.targetDate} onChange={e => set('targetDate', e.target.value)} /></Field>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <Field label="Come misuri il progresso?">
            <div className="space-y-2">
              {[
                { v: 'numeric', t: 'Numerico', d: 'Da un valore di partenza a un target (kg, €, polizze…)' },
                { v: 'milestone', t: 'A tappe (milestone)', d: 'Una lista di tappe intermedie con date' },
                { v: 'binary', t: 'Fatto / Non fatto', d: 'Completato o no entro la deadline' }
              ].map(o => (
                <button key={o.v} onClick={() => set('type', o.v)}
                  className={`w-full text-left rounded-xl border-2 p-3 ${f.type === o.v ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'}`}>
                  <p className="font-semibold">{o.t}</p>
                  <p className="text-xs text-zinc-500">{o.d}</p>
                </button>
              ))}
            </div>
          </Field>
          {f.type === 'numeric' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Partenza *"><TextInput inputMode="decimal" value={f.startValue} onChange={e => set('startValue', e.target.value)} placeholder="90" /></Field>
                <Field label="Target *"><TextInput inputMode="decimal" value={f.targetValue} onChange={e => set('targetValue', e.target.value)} placeholder="80" /></Field>
                <Field label="Unità *"><TextInput value={f.unit} onChange={e => set('unit', e.target.value)} placeholder="kg" /></Field>
              </div>
              <label className="flex items-center gap-2 text-sm mb-3">
                <input type="checkbox" checked={f.metricPeriod === 'month'} onChange={e => set('metricPeriod', e.target.checked ? 'month' : '')} className="w-5 h-5" />
                Target mensile ricorrente (es. 80 polizze al mese)
              </label>
            </>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Tappe intermedie</h3>
            {f.type === 'numeric' && (
              <Btn variant="ghost" className="!py-1 text-sm" onClick={() => set('milestones', genMilestones())}>↻ Riproponi</Btn>
            )}
          </div>
          <p className="text-xs text-zinc-500 mb-2">
            {f.type === 'numeric' ? 'Proposte automaticamente in base al target: modificale liberamente.' : 'Aggiungi le tappe del tuo percorso.'}
          </p>
          <div className="space-y-2 mb-3 max-h-56 overflow-y-auto">
            {f.milestones.map((m, i) => (
              <div key={i} className="flex gap-2 items-center">
                <TextInput value={m.title} onChange={e => set('milestones', f.milestones.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} className="flex-1 !py-2 text-sm" />
                <TextInput type="date" value={m.dueDate} onChange={e => set('milestones', f.milestones.map((x, j) => j === i ? { ...x, dueDate: e.target.value } : x))} className="!w-36 !py-2 text-sm" />
                <button onClick={() => set('milestones', f.milestones.filter((_, j) => j !== i))} className="text-zinc-400">✕</button>
              </div>
            ))}
          </div>
          <Btn variant="secondary" className="w-full mb-4 !py-2 text-sm"
            onClick={() => set('milestones', [...f.milestones, { title: '', dueDate: f.targetDate, done: false }])}>+ Aggiungi tappa</Btn>

          <h3 className="font-semibold text-sm mb-2">Abitudini / task ricorrenti</h3>
          <WizardRecurrences recurrences={f.recurrences} onChange={v => set('recurrences', v)} />
        </>
      )}

      {step === 4 && (
        <>
          <Field label="Vuoi collegare un obiettivo di risparmio?">
            <div className="space-y-2">
              {[
                { v: 'none', t: 'No, nessun risparmio' },
                { v: 'existing', t: 'Collega uno esistente' },
                { v: 'new', t: 'Creane uno nuovo' }
              ].map(o => (
                <button key={o.v} onClick={() => set('savingsChoice', o.v)}
                  className={`w-full text-left rounded-xl border-2 p-3 font-medium ${f.savingsChoice === o.v ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800'}`}>
                  {o.t}
                </button>
              ))}
            </div>
          </Field>
          {f.savingsChoice === 'existing' && (
            <Field label="Obiettivo di risparmio">
              <Select value={f.savingsGoalId} onChange={e => set('savingsGoalId', e.target.value)}>
                <option value="">Scegli…</option>
                {savingsGoals.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
          )}
          {f.savingsChoice === 'new' && (
            <>
              <Field label="Nome"><TextInput value={f.newSavings.name} onChange={e => set('newSavings', { ...f.newSavings, name: e.target.value })} placeholder="Es. Anticipo casa" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Importo target"><TextInput inputMode="decimal" value={f.newSavings.target} onChange={e => set('newSavings', { ...f.newSavings, target: e.target.value })} /></Field>
                <Field label="Valuta">
                  <Select value={f.newSavings.currency} onChange={e => set('newSavings', { ...f.newSavings, currency: e.target.value })}>
                    <option value="EUR">EUR</option><option value="ALL">LEK</option>
                  </Select>
                </Field>
              </div>
            </>
          )}
        </>
      )}

      <div className="flex gap-3 mt-4">
        {step > 1 && <Btn variant="secondary" className="flex-1" onClick={() => setStep(step - 1)}>‹ Indietro</Btn>}
        {step < 4
          ? <Btn className="flex-1" onClick={next} disabled={step === 1 ? !canNext1 : step === 2 ? !canNext2 : false}>Avanti ›</Btn>
          : <Btn className="flex-1" onClick={save}>✓ Crea obiettivo</Btn>}
      </div>
    </Modal>
  )
}

function WizardRecurrences({ recurrences, onChange }) {
  const [title, setTitle] = useState('')
  const [freqType, setFreqType] = useState('timesPerWeek')
  const [times, setTimes] = useState(3)
  const [days, setDays] = useState([0, 1, 2, 3, 4])
  const add = () => {
    if (!title.trim()) return
    onChange([...recurrences, { title: title.trim(), freqType, times, days: [...days] }])
    setTitle('')
  }
  return (
    <div>
      {recurrences.map((r, i) => (
        <div key={i} className="flex items-center gap-2 text-sm bg-white dark:bg-zinc-800 rounded-xl p-2.5 mb-2">
          <span className="flex-1">🔁 {r.title} — {r.freqType === 'timesPerWeek' ? `${r.times}×/settimana` : r.days.map(d => WEEKDAYS_IT[d]).join(', ')}</span>
          <button onClick={() => onChange(recurrences.filter((_, j) => j !== i))} className="text-zinc-400">✕</button>
        </div>
      ))}
      <TextInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Es. Palestra, 5 chiamate clienti…" className="mb-2" />
      <Segmented value={freqType} onChange={setFreqType} className="mb-2" options={[
        { value: 'timesPerWeek', label: 'X volte/settimana' },
        { value: 'daysOfWeek', label: 'Giorni fissi' }
      ]} />
      {freqType === 'timesPerWeek' ? (
        <label className="block text-sm mb-2">{times} volte a settimana
          <input type="range" min="1" max="7" value={times} onChange={e => setTimes(Number(e.target.value))} className="w-full" />
        </label>
      ) : (
        <div className="flex gap-1 mb-2">
          {WEEKDAYS_IT.map((d, i) => (
            <button key={d} onClick={() => setDays(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i].sort())}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold ${days.includes(i) ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
              {d}
            </button>
          ))}
        </div>
      )}
      <Btn variant="secondary" className="w-full !py-2 text-sm" onClick={add} disabled={!title.trim()}>+ Aggiungi abitudine</Btn>
    </div>
  )
}
