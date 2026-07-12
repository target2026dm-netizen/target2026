import { weekDates } from './dates.js'
import { weekOccurrences, occursOn } from './recurrence.js'

/**
 * Elenco task per una data: istanze salvate + occorrenze virtuali delle
 * ricorrenze (con ridistribuzione settimanale dei giorni saltati).
 * `allTasks` deve coprire almeno l'intera settimana di `date`.
 */
export function tasksForDate(date, recs, allTasks, today) {
  const persisted = allTasks.filter(t => t.date === date)
  const items = [...persisted]
  const wk = weekDates(date)
  for (const rec of recs) {
    const recTasks = allTasks.filter(t => t.recurrenceId === rec.id && t.date >= wk[0] && t.date <= wk[6])
    const occ = weekOccurrences(rec, wk, recTasks, today)
    if (occ.has(date) && !persisted.some(t => t.recurrenceId === rec.id)) {
      items.push({
        virtual: true, recurrenceId: rec.id, goalId: rec.goalId,
        profileId: rec.profileId, title: rec.title, date, done: false
      })
    }
  }
  return items.sort((a, b) => Number(a.done) - Number(b.done))
}

/** Conteggio rapido per la vista mese (senza ridistribuzione). */
export function countForDate(date, recs, allTasks, today) {
  const persisted = allTasks.filter(t => t.date === date)
  let total = persisted.length
  let done = persisted.filter(t => t.done).length
  if (date > today) {
    for (const rec of recs) {
      if (occursOn(rec, date) && !persisted.some(t => t.recurrenceId === rec.id)) total++
    }
  }
  return { total, done }
}
