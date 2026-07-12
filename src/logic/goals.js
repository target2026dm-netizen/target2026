import { daysBetween, clamp, monthKey, todayISO } from './dates.js'
import { fmtNum } from './currency.js'

export const STATUS_INFO = {
  green: { emoji: '🟢', label: 'In linea', color: 'text-emerald-600 dark:text-emerald-400' },
  yellow: { emoji: '🟡', label: 'Leggermente indietro', color: 'text-amber-600 dark:text-amber-400' },
  red: { emoji: '🔴', label: 'In ritardo critico', color: 'text-red-600 dark:text-red-400' },
  done: { emoji: '✅', label: 'Completato', color: 'text-emerald-600 dark:text-emerald-400' }
}

/**
 * Calcola stato, progresso e ritmo richiesto di un obiettivo.
 * Ricalcolo deterministico: a ogni progresso registrato il ritmo richiesto
 * viene ridistribuito sul tempo rimanente fino alla deadline.
 */
export function computeGoalStats(goal, { logs = [], milestones = [] } = {}, today = todayISO()) {
  const totalDays = Math.max(1, daysBetween(goal.startDate, goal.targetDate))
  const elapsed = clamp(daysBetween(goal.startDate, today), 0, totalDays)
  const daysLeft = Math.max(0, daysBetween(today, goal.targetDate))
  let expectedPct = elapsed / totalDays

  let pct = 0
  let current = null
  let requiredText = null
  let unrealistic = false

  if (goal.type === 'numeric') {
    const s = goal.startValue, t = goal.targetValue
    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
    const latest = sorted[sorted.length - 1]
    current = latest ? latest.value : s
    const span = t - s
    pct = span === 0 ? 1 : clamp((current - s) / span, 0, 1)

    const remaining = t - current
    const reachedTarget = span >= 0 ? current >= t : current <= t
    if (!reachedTarget && daysLeft > 0) {
      const weeksLeft = Math.max(daysLeft / 7, 1 / 7)
      const reqPerWeek = remaining / weeksLeft
      const plannedPerWeek = span / (totalDays / 7)
      const perMonth = remaining / Math.max(daysLeft / 30.44, 1 / 30.44)
      if (goal.metricPeriod === 'month') {
        requiredText = `Servono ~${fmtNum(Math.abs(perMonth), 1)} ${goal.unit} in più al mese`
      } else {
        requiredText = `Servono ~${fmtNum(Math.abs(reqPerWeek), 2)} ${goal.unit}/settimana per ${fmtNum(Math.abs(remaining), 1)} ${goal.unit} rimanenti`
      }
      // Irrealistico se il ritmo richiesto supera il doppio di quello pianificato
      unrealistic = Math.abs(reqPerWeek) > Math.abs(plannedPerWeek) * 2 && expectedPct > 0.1
    }
    if (!reachedTarget && daysLeft === 0) unrealistic = true
    if (reachedTarget) pct = 1
  } else if (goal.type === 'milestone') {
    const total = milestones.length
    const done = milestones.filter(m => m.done).length
    pct = total === 0 ? 0 : done / total
    const expectedDone = milestones.filter(m => m.dueDate <= today).length
    if (total > 0) expectedPct = expectedDone / total
    const overdue = milestones.filter(m => !m.done && m.dueDate < today).length
    if (overdue > 0 && pct < 1) {
      requiredText = `${overdue} ${overdue === 1 ? 'tappa scaduta' : 'tappe scadute'} da recuperare`
    }
    unrealistic = daysLeft === 0 && pct < 1
  } else {
    // binario
    pct = goal.done ? 1 : 0
    unrealistic = !goal.done && daysLeft === 0
  }

  let status
  if (pct >= 1) status = 'done'
  else if (expectedPct < 0.05) status = 'green'
  else {
    const ratio = pct / Math.max(expectedPct, 0.0001)
    status = ratio >= 0.85 ? 'green' : ratio >= 0.55 ? 'yellow' : 'red'
  }

  return { pct, expectedPct, status, current, requiredText, unrealistic, daysLeft, totalDays }
}

/**
 * Quota mensile necessaria per un obiettivo di risparmio,
 * ricalcolata a ogni versamento sul tempo rimanente.
 */
export function computeSavingsStats(sg, deposits, rate, today = todayISO()) {
  const deposited = deposits.reduce((sum, d) => {
    const amt = d.currency === sg.currency ? d.amount
      : d.currency === 'EUR' ? d.amount * rate : d.amount / rate
    return sum + amt
  }, 0)
  const remaining = Math.max(0, sg.targetAmount - deposited)
  const pct = sg.targetAmount > 0 ? clamp(deposited / sg.targetAmount, 0, 1) : 0
  const daysLeft = Math.max(0, daysBetween(today, sg.deadline))
  const monthsLeft = Math.max(daysLeft / 30.44, 1 / 30.44)
  const monthlyQuota = remaining / monthsLeft
  const overdue = daysLeft === 0 && remaining > 0
  return { deposited, remaining, pct, monthlyQuota, daysLeft, overdue }
}

/**
 * Milestone mensili proposte automaticamente per un obiettivo numerico:
 * interpolazione lineare dal valore di partenza al target.
 */
export function proposeMilestones(startDate, targetDate, startValue, targetValue, unit) {
  const totalDays = daysBetween(startDate, targetDate)
  if (totalDays <= 0) return []
  const months = Math.max(1, Math.round(totalDays / 30.44))
  const out = []
  for (let i = 1; i <= months; i++) {
    const frac = i / months
    const dayOffset = Math.round(totalDays * frac)
    const value = startValue + (targetValue - startValue) * frac
    const date = addDaysISO(startDate, dayOffset)
    out.push({
      title: `Raggiungere ${fmtNum(value, 1)} ${unit}`,
      dueDate: date > targetDate ? targetDate : date,
      done: false
    })
  }
  return out
}

function addDaysISO(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

export function currentMonthValue(goal, logs, today = todayISO()) {
  const mk = monthKey(today)
  const inMonth = logs.filter(l => monthKey(l.date) === mk).sort((a, b) => a.date.localeCompare(b.date))
  return inMonth.length ? inMonth[inMonth.length - 1].value : null
}
