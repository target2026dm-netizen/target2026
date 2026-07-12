import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'
import { useApp } from '../context/AppContext.jsx'
import {
  todayISO, fmtDateLong, fmtDate, weekDates, addDays, monthKey, monthDates,
  addMonthsToKey, fmtMonth, WEEKDAYS_IT, itDow
} from '../logic/dates.js'
import { tasksForDate, countForDate } from '../logic/dayTasks.js'
import { convert, fmtMoney, fmtNum } from '../logic/currency.js'
import { Card, Segmented, Modal, Field, TextInput, Btn, Fab, EmptyState } from '../components/ui.jsx'

export default function Oggi({ goToBudget }) {
  const { activeProfile, rate, displayCurrency } = useApp()
  const pid = activeProfile.id
  const today = todayISO()
  const [view, setView] = useState('oggi')
  const [selectedDay, setSelectedDay] = useState(today)
  const [viewMonth, setViewMonth] = useState(monthKey(today))
  const [addOpen, setAddOpen] = useState(false)
  const [progressGoal, setProgressGoal] = useState(null)

  // Intervallo dati: mese visualizzato ± una settimana (copre anche le viste oggi/settimana)
  const rangeStart = addDays(monthDates(viewMonth)[0], -7)
  const rangeEnd = addDays(monthDates(viewMonth).at(-1), 7)
  const wk = weekDates(selectedDay)
  const lo = wk[0] < rangeStart ? wk[0] : rangeStart
  const hi = wk[6] > rangeEnd ? wk[6] : rangeEnd

  const recs = useLiveQuery(() => db.recurrences.where('profileId').equals(pid).toArray(), [pid]) || []
  const tasks = useLiveQuery(
    () => db.tasks.where('[profileId+date]').between([pid, lo], [pid, hi], true, true).toArray(),
    [pid, lo, hi]
  ) || []
  const goals = useLiveQuery(() => db.goals.where('profileId').equals(pid).toArray(), [pid]) || []
  const numericGoals = goals.filter(g => g.type === 'numeric')
  const logs = useLiveQuery(() => db.progressLogs.toArray(), []) || []

  const mk = monthKey(today)
  const monthTx = useLiveQuery(() => db.transactions.where('month').equals(mk).toArray(), [mk]) || []
  const inDC = (t) => convert(t.amount, t.currency, displayCurrency, rate)
  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + inDC(t), 0)
  const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + inDC(t), 0)

  const toggle = async (t) => {
    if (t.id) await db.tasks.update(t.id, { done: !t.done })
    else await db.tasks.add({ ...t, virtual: undefined, done: true })
  }

  const dayItems = tasksForDate(selectedDay, recs, tasks, today)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{fmtDateLong(today)}</p>
        <h2 className="text-2xl font-bold">Ciao, {activeProfile.name} 👋</h2>
      </div>

      <Card onClick={goToBudget}>
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-semibold text-sm text-zinc-500 dark:text-zinc-400">Budget di {fmtMonth(mk).toLowerCase()}</h3>
          <span className="text-zinc-400">›</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="text-xs text-zinc-500">Entrate</p><p className="font-bold text-emerald-600 dark:text-emerald-400">{fmtMoney(income, displayCurrency)}</p></div>
          <div><p className="text-xs text-zinc-500">Spese</p><p className="font-bold text-red-600 dark:text-red-400">{fmtMoney(expense, displayCurrency)}</p></div>
          <div><p className="text-xs text-zinc-500">Saldo</p><p className="font-bold">{fmtMoney(income - expense, displayCurrency)}</p></div>
        </div>
      </Card>

      <Segmented value={view} onChange={(v) => { setView(v); if (v === 'oggi') setSelectedDay(today) }}
        options={[{ value: 'oggi', label: 'Oggi' }, { value: 'settimana', label: 'Settimana' }, { value: 'mese', label: 'Mese' }]} />

      {view === 'settimana' && (
        <div className="flex gap-1">
          {weekDates(today).map((d, i) => (
            <button key={d} onClick={() => setSelectedDay(d)}
              className={`flex-1 rounded-xl py-2 text-center ${d === selectedDay ? 'bg-blue-600 text-white' : d === today ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-white dark:bg-zinc-800'}`}>
              <div className="text-[10px] opacity-70">{WEEKDAYS_IT[i]}</div>
              <div className="font-bold text-sm">{Number(d.slice(8, 10))}</div>
            </button>
          ))}
        </div>
      )}

      {view === 'mese' && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <button className="px-3 py-1 text-lg" onClick={() => setViewMonth(addMonthsToKey(viewMonth, -1))}>‹</button>
            <span className="font-semibold">{fmtMonth(viewMonth)}</span>
            <button className="px-3 py-1 text-lg" onClick={() => setViewMonth(addMonthsToKey(viewMonth, 1))}>›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS_IT.map(d => <div key={d} className="text-[10px] text-zinc-400 py-1">{d}</div>)}
            {Array.from({ length: itDow(monthDates(viewMonth)[0]) }).map((_, i) => <div key={'e' + i} />)}
            {monthDates(viewMonth).map(d => {
              const { total, done } = countForDate(d, recs, tasks, today)
              return (
                <button key={d} onClick={() => setSelectedDay(d)}
                  className={`rounded-lg py-1.5 text-sm relative ${d === selectedDay ? 'bg-blue-600 text-white' : d === today ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}>
                  {Number(d.slice(8, 10))}
                  {total > 0 && (
                    <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${done >= total ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  )}
                </button>
              )
            })}
          </div>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold">
            {selectedDay === today ? 'Task di oggi' : `Task del ${fmtDate(selectedDay)}`}
          </h3>
          <span className="text-sm text-zinc-500">{dayItems.filter(t => t.done).length}/{dayItems.length}</span>
        </div>
        {dayItems.length === 0 ? (
          <EmptyState icon="🌤️" text="Nessun task per questo giorno. Goditi la giornata o aggiungine uno!" />
        ) : (
          <div className="space-y-2">
            {dayItems.map((t, i) => {
              const goal = goals.find(g => g.id === t.goalId)
              return (
                <Card key={t.id || 'v' + i} className="flex items-center gap-3 !py-3" onClick={() => toggle(t)}>
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm shrink-0 ${t.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-600'}`}>
                    {t.done ? '✓' : ''}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium ${t.done ? 'line-through text-zinc-400' : ''}`}>{t.title}</p>
                    {goal && <p className="text-xs text-zinc-500 truncate">🎯 {goal.title}</p>}
                  </div>
                  {t.id && !t.recurrenceId && (
                    <button onClick={(e) => { e.stopPropagation(); db.tasks.delete(t.id) }}
                      className="text-zinc-400 px-2" aria-label="Elimina task">🗑️</button>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {numericGoals.length > 0 && (
        <div>
          <h3 className="font-bold mb-2">Progressi rapidi</h3>
          <div className="space-y-2">
            {numericGoals.map(g => {
              const gl = logs.filter(l => l.goalId === g.id).sort((a, b) => a.date.localeCompare(b.date))
              const current = gl.length ? gl.at(-1).value : g.startValue
              return (
                <Card key={g.id} className="flex items-center justify-between !py-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{g.title}</p>
                    <p className="text-xs text-zinc-500">
                      Attuale: <b>{fmtNum(current, 1)} {g.unit}</b>{g.metricPeriod === 'month' ? ' questo mese' : ''} · Target: {fmtNum(g.targetValue, 1)} {g.unit}
                    </p>
                  </div>
                  <Btn variant="secondary" className="!py-1.5 !px-3 text-sm shrink-0" onClick={() => setProgressGoal(g)}>Aggiorna</Btn>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      <Fab onClick={() => setAddOpen(true)} />
      <AddTaskModal open={addOpen} onClose={() => setAddOpen(false)} profileId={pid} goals={goals} defaultDate={selectedDay} />
      <ProgressModal goal={progressGoal} onClose={() => setProgressGoal(null)} />
    </div>
  )
}

function AddTaskModal({ open, onClose, profileId, goals, defaultDate }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate)
  const [goalId, setGoalId] = useState('')
  React.useEffect(() => { if (open) setDate(defaultDate) }, [open, defaultDate])

  const save = async () => {
    if (!title.trim()) return
    await db.tasks.add({ profileId, title: title.trim(), date, done: false, goalId: goalId ? Number(goalId) : undefined })
    setTitle(''); onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuovo task">
      <Field label="Cosa devi fare?">
        <TextInput value={title} onChange={e => setTitle(e.target.value)} placeholder="Es. Chiamare l'agenzia" autoFocus />
      </Field>
      <Field label="Data">
        <TextInput type="date" value={date} onChange={e => setDate(e.target.value)} />
      </Field>
      <Field label="Collega a un obiettivo (opzionale)">
        <select value={goalId} onChange={e => setGoalId(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2.5">
          <option value="">Nessuno</option>
          {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
        </select>
      </Field>
      <Btn className="w-full mt-2" onClick={save} disabled={!title.trim()}>Aggiungi</Btn>
    </Modal>
  )
}

function ProgressModal({ goal, onClose }) {
  const [value, setValue] = useState('')
  React.useEffect(() => { setValue('') }, [goal])
  if (!goal) return null
  const save = async () => {
    const v = parseFloat(value.replace(',', '.'))
    if (isNaN(v)) return
    await db.progressLogs.add({ goalId: goal.id, date: todayISO(), value: v })
    onClose()
  }
  return (
    <Modal open={!!goal} onClose={onClose} title={`Progresso — ${goal.title}`}>
      <Field label={goal.metricPeriod === 'month' ? `${goal.unit} questo mese` : `Valore attuale (${goal.unit})`}>
        <TextInput inputMode="decimal" value={value} onChange={e => setValue(e.target.value)}
          placeholder={`Es. ${goal.targetValue}`} autoFocus />
      </Field>
      <Btn className="w-full mt-2" onClick={save} disabled={!value.trim()}>Salva progresso</Btn>
    </Modal>
  )
}
