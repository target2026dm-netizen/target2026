// Doppia valuta EUR / LEK (codice ISO: ALL). rate = quanti LEK vale 1 EUR.

export const CURRENCIES = ['EUR', 'ALL']
export const CURRENCY_LABEL = { EUR: 'EUR', ALL: 'LEK' }

export function convert(amount, from, to, rate) {
  if (from === to) return amount
  if (from === 'EUR' && to === 'ALL') return amount * rate
  return amount / rate
}

const fmtEUR = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })
const fmtALL = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0 })

export function fmtMoney(amount, currency) {
  if (currency === 'EUR') return fmtEUR.format(amount)
  return `${fmtALL.format(amount)} LEK`
}

export function fmtNum(n, decimals = 2) {
  return new Intl.NumberFormat('it-IT', { maximumFractionDigits: decimals }).format(n)
}
