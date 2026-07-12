// Utilità date — tutte le date sono stringhe ISO locali 'YYYY-MM-DD'

export const WEEKDAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']
export const WEEKDAYS_FULL_IT = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']
export const MONTHS_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

export function toISO(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO() {
  return toISO(new Date())
}

// GG/MM/AAAA
export function fmtDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function fmtDateLong(iso) {
  const d = fromISO(iso)
  return `${WEEKDAYS_FULL_IT[itDow(iso)]} ${d.getDate()} ${MONTHS_IT[d.getMonth()].toLowerCase()} ${d.getFullYear()}`
}

export function fmtMonth(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  return `${MONTHS_IT[m - 1]} ${y}`
}

export function addDays(iso, n) {
  const d = fromISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export function addMonths(iso, n) {
  const d = fromISO(iso)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + n)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, lastDay))
  return toISO(d)
}

// giorni da a → b (positivo se b è dopo a)
export function daysBetween(a, b) {
  return Math.round((fromISO(b) - fromISO(a)) / 86400000)
}

// mesi (frazionari) tra due date, minimo 0
export function monthsBetween(a, b) {
  return Math.max(0, daysBetween(a, b) / 30.44)
}

// giorno della settimana italiano: 0=Lun ... 6=Dom
export function itDow(iso) {
  return (fromISO(iso).getDay() + 6) % 7
}

// lunedì della settimana che contiene iso
export function weekStart(iso) {
  return addDays(iso, -itDow(iso))
}

// array dei 7 giorni ISO della settimana (Lun→Dom)
export function weekDates(iso) {
  const start = weekStart(iso)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function monthKey(iso) {
  return iso.slice(0, 7)
}

export function monthDates(mKey) {
  const [y, m] = mKey.split('-').map(Number)
  const n = new Date(y, m, 0).getDate()
  return Array.from({ length: n }, (_, i) => `${mKey}-${String(i + 1).padStart(2, '0')}`)
}

export function addMonthsToKey(mKey, n) {
  const [y, m] = mKey.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}
