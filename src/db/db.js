import Dexie from 'dexie'
import { seed } from './seed.js'

export const db = new Dexie('rotta')

db.version(1).stores({
  profiles: '++id',
  settings: 'key',
  goals: '++id, profileId',
  milestones: '++id, goalId',
  recurrences: '++id, goalId, profileId',
  tasks: '++id, profileId, date, goalId, [profileId+date], [recurrenceId+date]',
  progressLogs: '++id, goalId, [goalId+date]',
  transactions: '++id, type, date, category, month, [recurringId+month]',
  recurringTransactions: '++id, type',
  categoryBudgets: 'category',
  savingsGoals: '++id',
  savingsDeposits: '++id, savingsGoalId, date'
})

db.version(2).stores({
  goals: '++id, profileId, status'
}).upgrade(tx =>
  tx.table('goals').toCollection().modify(g => { if (!g.status) g.status = 'active' })
)

db.on('populate', (tx) => seed(tx))

export const ALL_TABLES = [
  'profiles', 'settings', 'goals', 'milestones', 'recurrences', 'tasks',
  'progressLogs', 'transactions', 'recurringTransactions', 'categoryBudgets',
  'savingsGoals', 'savingsDeposits'
]

export async function exportAll() {
  const data = { app: 'rotta', version: 1, exportedAt: new Date().toISOString() }
  for (const t of ALL_TABLES) data[t] = await db.table(t).toArray()
  return data
}

export async function importAll(data) {
  if (data.app !== 'rotta') throw new Error('File non valido: non è un backup di questa app')
  await db.transaction('rw', ALL_TABLES.map(t => db.table(t)), async () => {
    for (const t of ALL_TABLES) {
      await db.table(t).clear()
      if (Array.isArray(data[t]) && data[t].length) await db.table(t).bulkAdd(data[t])
    }
  })
}
