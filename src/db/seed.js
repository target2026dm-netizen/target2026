import { todayISO, addMonths } from '../logic/dates.js'

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Casa/Affitto', 'Alimentari', 'Trasporti', 'Bollette', 'Salute',
  'Svago', 'Ristoranti', 'Abbigliamento', 'Altro'
]

export const DEFAULT_GOAL_CATEGORIES = ['Salute', 'Casa', 'Lavoro', 'Finanze', 'Progetti']

// Dati iniziali: profili, impostazioni e obiettivi di esempio (modificabili/eliminabili)
export function seed(tx) {
  const today = todayISO()

  tx.table('profiles').bulkAdd([
    { id: 1, name: 'Utente 1', pin: null },
    { id: 2, name: 'Marinela', pin: null }
  ])

  tx.table('settings').bulkAdd([
    { key: 'activeProfileId', value: 1 },
    { key: 'exchangeRate', value: 98 },
    { key: 'rateUpdatedAt', value: today },
    { key: 'displayCurrency', value: 'EUR' },
    { key: 'theme', value: 'system' },
    { key: 'expenseCategories', value: DEFAULT_EXPENSE_CATEGORIES },
    { key: 'goalCategories', value: DEFAULT_GOAL_CATEGORIES }
  ])

  tx.table('savingsGoals').add({
    id: 1, name: 'Anticipo casa', targetAmount: 20000, currency: 'EUR',
    deadline: '2027-01-31', linkedGoalId: 2, createdAt: today
  })

  tx.table('goals').bulkAdd([
    {
      id: 1, profileId: 1, title: 'Perdere 10 kg', category: 'Salute',
      description: 'Raggiungere il peso forma con costanza: palestra e alimentazione.',
      type: 'numeric', startValue: 90, targetValue: 80, unit: 'kg',
      startDate: today, targetDate: addMonths(today, 8), createdAt: today
    },
    {
      id: 2, profileId: 1, title: 'Acquistare la prima casa', category: 'Casa',
      description: 'Percorso completo fino al rogito, collegato al risparmio "Anticipo casa".',
      type: 'milestone', startDate: today, targetDate: '2027-01-31',
      savingsGoalId: 1, createdAt: today
    },
    {
      id: 3, profileId: 1, title: 'Arrivare a 80 polizze al mese', category: 'Lavoro',
      description: 'Crescita costante della produzione mensile di polizze.',
      type: 'numeric', metricPeriod: 'month', startValue: 40, targetValue: 80, unit: 'polizze',
      startDate: today, targetDate: '2027-01-31', createdAt: today
    },
    {
      id: 4, profileId: 1, title: 'Automatizzare Cortexa Bot', category: 'Progetti',
      description: 'Completare l\'automazione del servizio bot per tutte le compagnie.',
      type: 'milestone', startDate: today, targetDate: '2026-09-30', createdAt: today
    }
  ])

  tx.table('milestones').bulkAdd([
    { goalId: 2, title: 'Definire budget e zona', dueDate: addMonths(today, 1), done: false },
    { goalId: 2, title: 'Ottenere pre-approvazione del mutuo', dueDate: addMonths(today, 2), done: false },
    { goalId: 2, title: 'Visitare almeno 10 immobili', dueDate: addMonths(today, 4), done: false },
    { goalId: 2, title: 'Fare un\'offerta', dueDate: '2026-12-31', done: false },
    { goalId: 2, title: 'Rogito e consegna chiavi', dueDate: '2027-01-31', done: false },
    { goalId: 4, title: 'Completare automazione delle 14 compagnie', dueDate: '2026-08-15', done: false },
    { goalId: 4, title: 'Test end-to-end su tutte le compagnie', dueDate: '2026-09-10', done: false },
    { goalId: 4, title: 'Messa in produzione', dueDate: '2026-09-30', done: false }
  ])

  tx.table('recurrences').bulkAdd([
    {
      goalId: 1, profileId: 1, title: 'Palestra',
      freqType: 'timesPerWeek', timesPerWeek: 3, days: [], startDate: today
    },
    {
      goalId: 3, profileId: 1, title: '5 chiamate a nuovi clienti',
      freqType: 'daysOfWeek', timesPerWeek: 5, days: [0, 1, 2, 3, 4], startDate: today
    }
  ])

  tx.table('progressLogs').bulkAdd([
    { goalId: 1, date: today, value: 90 },
    { goalId: 3, date: today, value: 40 }
  ])
}
