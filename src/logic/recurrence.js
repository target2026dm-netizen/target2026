import { itDow } from './dates.js'

// Giorni predefiniti per "X volte a settimana" (0=Lun ... 6=Dom)
const FREQ_DAYS_DEFAULT = {
  1: [0], 2: [1, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5], 7: [0, 1, 2, 3, 4, 5, 6]
}

export function scheduledDays(rec) {
  if (rec.freqType === 'daysOfWeek') return rec.days || []
  const n = Math.min(Math.max(rec.timesPerWeek || 1, 1), 7)
  return FREQ_DAYS_DEFAULT[n]
}

// La ricorrenza è prevista (da piano originale) in questa data?
export function occursOn(rec, iso) {
  if (rec.startDate && iso < rec.startDate) return false
  if (rec.endDate && iso > rec.endDate) return false
  return scheduledDays(rec).includes(itDow(iso))
}

export function inRange(rec, iso) {
  if (rec.startDate && iso < rec.startDate) return false
  if (rec.endDate && iso > rec.endDate) return false
  return true
}

/**
 * RICALCOLO SETTIMANALE (funzione chiave).
 * Per le ricorrenze "X volte a settimana": se dei giorni sono stati saltati,
 * le occorrenze rimanenti vengono ridistribuite sui giorni che restano della settimana.
 *
 * @param rec ricorrenza
 * @param weekISOs i 7 giorni ISO della settimana (Lun→Dom)
 * @param persisted istanze task già salvate per questa ricorrenza in questa settimana [{date, done}]
 * @param today data odierna ISO
 * @returns Set di date ISO in cui mostrare il task
 */
export function weekOccurrences(rec, weekISOs, persisted, today) {
  const base = weekISOs.filter(d => occursOn(rec, d))
  const persistedDates = new Set(persisted.map(t => t.date))

  if (rec.freqType !== 'timesPerWeek') {
    // Giorni fissi: nessuna ridistribuzione, ma mostra anche istanze salvate fuori piano
    return new Set([...base.filter(d => inRange(rec, d)), ...persistedDates])
  }

  const result = new Set()
  // Passato: mostra solo ciò che è stato materializzato (fatto o saltato)
  for (const d of weekISOs) {
    if (d < today && persistedDates.has(d)) result.add(d)
  }

  const doneCount = persisted.filter(t => t.done).length
  let needed = Math.max(0, (rec.timesPerWeek || 1) - doneCount)

  // Oggi e futuro: prima i giorni previsti dal piano, poi giorni extra per recuperare
  const future = weekISOs.filter(d => d >= today && inRange(rec, d))
  const futureScheduled = future.filter(d => base.includes(d))
  const futureExtra = future.filter(d => !base.includes(d))

  for (const d of futureScheduled) {
    if (needed <= 0) break
    result.add(d); needed--
  }
  for (const d of futureExtra) {
    if (needed <= 0) break
    result.add(d); needed--
  }
  // Istanze già salvate oggi/futuro (es. completate oggi) restano visibili
  for (const t of persisted) {
    if (t.date >= today) result.add(t.date)
  }
  return result
}
