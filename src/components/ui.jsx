import React, { useState } from 'react'

export function Card({ children, className = '', onClick }) {
  return (
    <div onClick={onClick}
      className={`bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-700 p-4 ${onClick ? 'active:scale-[0.99] cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  )
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-zinc-50 dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl p-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
          <button onClick={onClose} aria-label="Chiudi"
            className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-lg leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ProgressBar({ pct, status = 'green', className = '' }) {
  const colors = {
    green: 'bg-emerald-500', yellow: 'bg-amber-500', red: 'bg-red-500', done: 'bg-emerald-500',
    over: 'bg-red-500', warn: 'bg-amber-500', ok: 'bg-blue-500'
  }
  return (
    <div className={`h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden ${className}`}>
      <div className={`h-full rounded-full transition-all ${colors[status] || 'bg-blue-500'}`}
        style={{ width: `${Math.min(100, Math.round(pct * 100))}%` }} />
    </div>
  )
}

export function Fab({ onClick, label = '+' }) {
  return (
    <button onClick={onClick} aria-label="Aggiungi"
      className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-blue-600 text-white text-3xl leading-none shadow-lg active:scale-95">
      {label}
    </button>
  )
}

export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={`flex rounded-xl bg-zinc-200 dark:bg-zinc-700 p-1 ${className}`}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${value === o.value
            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
            : 'text-zinc-600 dark:text-zinc-300'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">{label}</span>
      {children}
    </label>
  )
}

export const inputCls = 'w-full rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 px-3 py-2.5 text-base outline-none focus:border-blue-500'

export function TextInput(props) {
  return <input {...props} className={`${inputCls} ${props.className || ''}`} />
}

export function Select(props) {
  return <select {...props} className={`${inputCls} ${props.className || ''}`}>{props.children}</select>
}

export function Btn({ children, variant = 'primary', className = '', ...rest }) {
  const styles = {
    primary: 'bg-blue-600 text-white active:bg-blue-700',
    secondary: 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100',
    danger: 'bg-red-600 text-white',
    ghost: 'text-blue-600 dark:text-blue-400'
  }
  return (
    <button {...rest} className={`rounded-xl px-4 py-2.5 font-semibold text-base disabled:opacity-40 ${styles[variant]} ${className}`}>
      {children}
    </button>
  )
}

export function PinPad({ title = 'Inserisci PIN', onSubmit, onCancel, error }) {
  const [pin, setPin] = useState('')
  const press = (d) => {
    const next = (pin + d).slice(0, 4)
    setPin(next)
    if (next.length === 4) {
      setTimeout(() => { onSubmit(next); setPin('') }, 150)
    }
  }
  return (
    <div className="fixed inset-0 z-[60] bg-zinc-50 dark:bg-zinc-900 flex flex-col items-center justify-center p-6">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">{title}</h2>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <div className="flex gap-3 my-5">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`w-4 h-4 rounded-full ${i < pin.length ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((k, i) => (
          k === '' ? <div key={i} /> : (
            <button key={i}
              onClick={() => k === '⌫' ? setPin(p => p.slice(0, -1)) : press(String(k))}
              className="w-18 h-18 min-w-16 min-h-16 rounded-full bg-zinc-200 dark:bg-zinc-700 text-2xl font-semibold text-zinc-900 dark:text-zinc-50 active:bg-zinc-300">
              {k}
            </button>
          )
        ))}
      </div>
      {onCancel && <Btn variant="ghost" className="mt-6" onClick={onCancel}>Annulla</Btn>}
    </div>
  )
}

export function EmptyState({ icon, text }) {
  return (
    <div className="text-center py-10 text-zinc-400 dark:text-zinc-500">
      <div className="text-4xl mb-2">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  )
}

export function Confirm({ open, onClose, onConfirm, title, message }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-zinc-600 dark:text-zinc-300 mb-5">{message}</p>
      <div className="flex gap-3">
        <Btn variant="secondary" className="flex-1" onClick={onClose}>Annulla</Btn>
        <Btn variant="danger" className="flex-1" onClick={() => { onConfirm(); onClose() }}>Conferma</Btn>
      </div>
    </Modal>
  )
}
