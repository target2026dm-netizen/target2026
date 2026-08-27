export const DEFAULT_EXPENSE_CATEGORIES = [
  'Casa/Affitto', 'Alimentari', 'Trasporti', 'Bollette', 'Salute',
  'Svago', 'Ristoranti', 'Abbigliamento', 'Altro'
]

export const DEFAULT_GOAL_CATEGORIES = ['Salute', 'Casa', 'Lavoro', 'Finanze', 'Progetti', 'Famiglia']

const ROUTINE = {
  daily: [
    { id: 1,  time: '05:00', endTime: '05:15', label: 'Sveglia, meditazione',                                    goal: 'Famiglia', color: 'purple', phase: [1, 2] },
    { id: 2,  time: '05:15', endTime: '07:15', label: 'Blocco concentrato — Reddito / Michele',                  goal: 'Reddito',  color: 'blue',   phase: [1]    },
    { id: 3,  time: '05:15', endTime: '06:15', label: 'AI — lezioni + pratica',                                  goal: 'AI',       color: 'violet', phase: [2]    },
    { id: 4,  time: '06:15', endTime: '07:15', label: 'Blocco concentrato — Reddito / Michele',                  goal: 'Reddito',  color: 'blue',   phase: [2]    },
    { id: 5,  time: '07:15', endTime: '07:45', label: 'Colazione in famiglia',                                   goal: 'Famiglia', color: 'purple', phase: [1, 2] },
    { id: 6,  time: '07:45', endTime: '08:15', label: 'Bambini pronti / margine libero',                         goal: null,       color: 'gray',   phase: [1, 2] },
    { id: 7,  time: '08:15', endTime: '08:45', label: "Accompagno i bimbi all'asilo",                            goal: null,       color: 'gray',   phase: [1, 2] },
    { id: 8,  time: '08:45', endTime: '09:15', label: 'Lancio preventivi',                                       goal: 'Reddito',  color: 'blue',   phase: [1, 2] },
    { id: 9,  time: '09:15', endTime: '13:00', label: 'Operativo GD Brokers',                                    goal: 'Reddito',  color: 'blue',   phase: [1, 2] },
    { id: 10, time: '13:00', endTime: '14:15', label: 'Palestra',                                                goal: 'Corpo',    color: 'green',  phase: [1, 2] },
    { id: 11, time: '14:15', endTime: '14:45', label: 'Pranzo',                                                  goal: 'Corpo',    color: 'green',  phase: [1, 2] },
    { id: 12, time: '14:45', endTime: '15:15', label: 'Telefonate / preventivi pomeriggio',                      goal: 'Reddito',  color: 'blue',   phase: [1, 2] },
    { id: 13, time: '15:15', endTime: '15:45', label: "Ritiro bimbi all'asilo",                                  goal: null,       color: 'gray',   phase: [1, 2] },
    { id: 14, time: '15:45', endTime: '19:30', label: 'Operativo + Piattaforma Michele + blocchi settimanali',   goal: 'Michele',  color: 'orange', phase: [1, 2] },
    { id: 15, time: '19:30', endTime: '20:15', label: 'Tempo con i bambini (30-45 min)',                         goal: 'Famiglia', color: 'purple', phase: [1, 2] },
    { id: 16, time: '20:15', endTime: '21:00', label: 'Cena in famiglia',                                        goal: 'Famiglia', color: 'purple', phase: [1, 2] },
    { id: 17, time: '21:00', endTime: '22:00', label: 'Mi addormento con i bimbi',                               goal: 'Famiglia', color: 'purple', phase: [1, 2] },
  ],
  weekly: [
    { day: 'Lunedì',         label: '2 ore — controllo e comunicazione 40 rinnovi',        goal: 'Reddito',  color: 'blue'   },
    { day: 'Mercoledì',      label: '2 ore — contatto lead',                                goal: 'Reddito',  color: 'blue'   },
    { day: 'Venerdì sera',   label: 'Uscita da solo con Marinela',                          goal: 'Famiglia', color: 'purple' },
    { day: 'Sabato mattina', label: 'Attività sportiva (bici, padel, hiking)',              goal: 'Corpo',    color: 'green'  },
    { day: 'Domenica sera',  label: 'Pianificazione settimana (+ AI da novembre)',          goal: null,       color: 'gray'   },
  ]
}

export function seed(tx) {
  tx.table('profiles').bulkAdd([
    { id: 1, name: 'Damiano', pin: null },
    { id: 2, name: 'Marinela', pin: null }
  ])

  tx.table('settings').bulkAdd([
    { key: 'activeProfileId',   value: 1 },
    { key: 'exchangeRate',       value: 98 },
    { key: 'rateUpdatedAt',      value: '2026-08-27' },
    { key: 'displayCurrency',    value: 'EUR' },
    { key: 'theme',              value: 'system' },
    { key: 'expenseCategories',  value: DEFAULT_EXPENSE_CATEGORIES },
    { key: 'goalCategories',     value: DEFAULT_GOAL_CATEGORIES },
    { key: 'routine',            value: ROUTINE },
  ])

  // Obiettivi di risparmio
  tx.table('savingsGoals').bulkAdd([
    { id: 1, name: 'Casa Tirana',                 targetAmount: 33000, currency: 'EUR', deadline: '2027-12-31', linkedGoalId: 5, createdAt: '2026-08-24' },
    { id: 2, name: 'Casa Italia (notaio + spese)', targetAmount: 15000, currency: 'EUR', deadline: '2027-09-01', linkedGoalId: 6, createdAt: '2026-08-24' },
  ])

  // 8 obiettivi reali
  tx.table('goals').bulkAdd([
    {
      id: 1, profileId: 1, title: 'Corpo allenato', category: 'Salute', status: 'active',
      description: 'Palestra Lun-Ven + attività sportiva nel weekend. Dieta: pollo e contorno a pranzo nei feriali, insalate a cena, weekend liberi.',
      type: 'numeric', startValue: 90, targetValue: 82, unit: 'kg',
      startDate: '2026-08-22', targetDate: '2027-04-30', createdAt: '2026-08-22'
    },
    {
      id: 2, profileId: 1, title: 'Contatti a Tirana', category: 'Lavoro', status: 'paused', activeFrom: '2026-11-01',
      description: '2 nuovi contatti/mese in un blocco dedicato. Profili target: avvocati, economisti, banchieri, dirigenti, medici, sportivi, imprenditori. Club/palestra + 2 eventi di networking + 2 pranzi/cene al mese.',
      type: 'numeric', metricPeriod: 'month', startValue: 0, targetValue: 2, unit: 'contatti',
      startDate: '2026-08-17', targetDate: '2027-10-31', createdAt: '2026-08-17'
    },
    {
      id: 3, profileId: 1, title: 'Rapporto con la famiglia', category: 'Famiglia', status: 'active',
      description: 'Non innescare discussioni superflue. Sostenere Marinela. Psicologo per autocontrollo. Meditazione 15 min al mattino. 1 uscita/settimana con Marinela. 30-45 min al giorno al 100% con i bambini.',
      type: 'milestone',
      startDate: '2026-08-17', targetDate: '2027-12-31', createdAt: '2026-08-17'
    },
    {
      id: 4, profileId: 1, title: 'Padronanza AI', category: 'Progetti', status: 'paused', activeFrom: '2026-11-01',
      description: 'Diventare "master AI": conoscenza teorica + pratica per trasformare idee in realtà. 2 ore/giorno: 30 min lezioni, 30 min aggiornamento, 30 min pratica, 30 min progetto.',
      type: 'milestone',
      startDate: '2026-08-24', targetDate: '2027-03-01', createdAt: '2026-08-24'
    },
    {
      id: 5, profileId: 1, title: 'Prima casa a Tirana', category: 'Casa', status: 'active',
      description: 'Appartamento 1+1, 60-100 m² netti a Tirana o Durazzo. Minimo 25.000€ liquidità. Target risparmio: 33.000€ entro fine 2027 (6.600€/mese).',
      type: 'milestone', savingsGoalId: 1,
      startDate: '2026-08-24', targetDate: '2027-02-10', createdAt: '2026-08-24'
    },
    {
      id: 6, profileId: 1, title: 'Casa in Italia', category: 'Casa', status: 'active',
      description: 'Appartamento 2+1 fino a 150.000€, 70-85 m² netti. Aprire conto bancario in Italia, 3 giorni in settembre per visite. Risparmiare 15.000€ per notaio e spese.',
      type: 'milestone', savingsGoalId: 2,
      startDate: '2026-09-01', targetDate: '2027-08-31', createdAt: '2026-08-24'
    },
    {
      id: 7, profileId: 1, title: 'Piattaforma di Michele', category: 'Lavoro', status: 'active',
      description: 'Automazione preventivi, automazione Axicura, funzionalità al 100%, inserimento di tutte le liste degli intermediari. 1-2 ore/giorno costanti + extra.',
      type: 'milestone',
      startDate: '2026-08-19', targetDate: '2026-10-31', createdAt: '2026-08-19'
    },
    {
      id: 8, profileId: 1, title: 'Reddito 10.000€ netti/mese', category: 'Finanze', status: 'active',
      description: '100 polizze/mese con margine ~100€/polizza. Ripartizione: 40 rinnovi propri, 20 lead, 20 telefonate, 20 collaboratori/CRM. Sistema di referral e follow-up strutturato.',
      type: 'numeric', metricPeriod: 'month', startValue: 40, targetValue: 100, unit: 'polizze',
      startDate: '2026-08-24', targetDate: '2026-12-31', createdAt: '2026-08-24'
    },
  ])

  tx.table('milestones').bulkAdd([
    // Famiglia (goalId: 3)
    { goalId: 3, title: 'Trovare uno psicologo per l\'autocontrollo',           dueDate: '2026-09-30', done: false },
    { goalId: 3, title: 'Meditazione 15 min al mattino — abitudine stabile',    dueDate: '2026-10-15', done: false },
    { goalId: 3, title: 'Uscita settimanale con Marinela — primo mese pieno',   dueDate: '2026-09-30', done: false },
    { goalId: 3, title: '30-45 min/giorno con i bambini — abitudine stabile',   dueDate: '2026-10-31', done: false },

    // Padronanza AI (goalId: 4)
    { goalId: 4, title: 'Completare corso base di AI',                          dueDate: '2026-12-31', done: false },
    { goalId: 4, title: 'Primo progetto pratico completato',                    dueDate: '2027-01-31', done: false },
    { goalId: 4, title: 'Secondo progetto pratico completato',                  dueDate: '2027-02-28', done: false },

    // Casa Tirana (goalId: 5)
    { goalId: 5, title: 'Aprire conto bancario in Albania',                     dueDate: '2026-09-30', done: false },
    { goalId: 5, title: 'Definire zona e tipologia immobile',                   dueDate: '2026-10-31', done: false },
    { goalId: 5, title: 'Trovare immobile e fare offerta',                      dueDate: '2027-01-15', done: false },
    { goalId: 5, title: 'Rogito',                                               dueDate: '2027-02-10', done: false },

    // Casa Italia (goalId: 6)
    { goalId: 6, title: 'Aprire conto bancario in Italia',                      dueDate: '2026-09-30', done: false },
    { goalId: 6, title: '3 giorni in Italia — visita immobili',                 dueDate: '2026-09-30', done: false },
    { goalId: 6, title: 'Risparmiare 15.000€ per notaio e spese',               dueDate: '2027-07-31', done: false },
    { goalId: 6, title: 'Firma contratto / rogito',                             dueDate: '2027-08-31', done: false },

    // Piattaforma Michele (goalId: 7)
    { goalId: 7, title: 'Automazione preventivi al 100%',                       dueDate: '2026-09-15', done: false },
    { goalId: 7, title: 'Automazione Axicura al 100%',                          dueDate: '2026-09-30', done: false },
    { goalId: 7, title: 'Inserimento liste intermediari',                        dueDate: '2026-10-15', done: false },
    { goalId: 7, title: 'Funzionalità al 100% — test finale',                   dueDate: '2026-10-31', done: false },
  ])

  tx.table('recurrences').bulkAdd([
    { goalId: 1, profileId: 1, title: 'Palestra',                  freqType: 'daysOfWeek', timesPerWeek: 5, days: [0,1,2,3,4], startDate: '2026-08-22' },
    { goalId: 1, profileId: 1, title: 'Attività sportiva weekend', freqType: 'daysOfWeek', timesPerWeek: 1, days: [5],         startDate: '2026-08-22' },
    { goalId: 3, profileId: 1, title: 'Meditazione 15 min',        freqType: 'daysOfWeek', timesPerWeek: 7, days: [0,1,2,3,4,5,6], startDate: '2026-08-22' },
    { goalId: 3, profileId: 1, title: 'Uscita con Marinela',       freqType: 'daysOfWeek', timesPerWeek: 1, days: [4],         startDate: '2026-08-22' },
    { goalId: 8, profileId: 1, title: 'Controllo 40 rinnovi',      freqType: 'daysOfWeek', timesPerWeek: 1, days: [0],         startDate: '2026-08-24' },
    { goalId: 8, profileId: 1, title: 'Contatto lead',             freqType: 'daysOfWeek', timesPerWeek: 1, days: [2],         startDate: '2026-08-24' },
    { goalId: 8, profileId: 1, title: 'Pianificazione settimana',  freqType: 'daysOfWeek', timesPerWeek: 1, days: [6],         startDate: '2026-08-24' },
  ])

  tx.table('progressLogs').bulkAdd([
    { goalId: 1, date: '2026-08-22', value: 90 },
    { goalId: 8, date: '2026-08-24', value: 40 },
  ])
}
