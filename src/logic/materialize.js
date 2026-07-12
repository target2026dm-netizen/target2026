import { db } from '../db/db.js'
import { todayISO, addDays, monthKey, addMonthsToKey } from './dates.js'
import { occursOn } from './recurrence.js'

const LOOKBACK_DAYS = 60

/**
 * Genera le istanze concrete di task ricorrenti (fino a oggi) e i movimenti
 * ricorrenti (fino al mese corrente). Idempotente: si può chiamare a ogni avvio.
 */
export async function materialize() {
  const today = todayISO()
  await materializeTasks(today)
  await materializeTransactions(today)
}

async function materializeTasks(today) {
  const recs = await db.recurrences.toArray()
  for (const rec of recs) {
    const from = rec.startDate > addDays(today, -LOOKBACK_DAYS) ? rec.startDate : addDays(today, -LOOKBACK_DAYS)
    if (from > today) continue
    const existingDates = new Set(
      (await db.tasks.where('[recurrenceId+date]').between([rec.id, from], [rec.id, today], true, true).toArray())
        .map(t => t.date)
    )
    const toAdd = []
    for (let d = from; d <= today; d = addDays(d, 1)) {
      if (occursOn(rec, d) && !existingDates.has(d)) {
        toAdd.push({
          profileId: rec.profileId, goalId: rec.goalId, recurrenceId: rec.id,
          title: rec.title, date: d, done: false
        })
      }
    }
    if (toAdd.length) await db.tasks.bulkAdd(toAdd)
  }
}

async function materializeTransactions(today) {
  const recs = await db.recurringTransactions.toArray()
  const currentMonth = monthKey(today)
  const todayDay = Number(today.slice(8, 10))
  for (const rt of recs) {
    if (rt.active === false) continue
    let mk = rt.startMonth || monthKey(rt.createdAt || today)
    while (mk <= currentMonth) {
      const day = Math.min(rt.dayOfMonth || 1, lastDayOfMonth(mk))
      const isCurrent = mk === currentMonth
      if (!isCurrent || day <= todayDay) {
        const exists = await db.transactions.where('[recurringId+month]').equals([rt.id, mk]).first()
        if (!exists) {
          await db.transactions.add({
            type: rt.type, amount: rt.amount, currency: rt.currency,
            category: rt.category, note: rt.description,
            date: `${mk}-${String(day).padStart(2, '0')}`,
            month: mk, recurringId: rt.id
          })
        }
      }
      mk = addMonthsToKey(mk, 1)
    }
  }
}

function lastDayOfMonth(mk) {
  const [y, m] = mk.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}
