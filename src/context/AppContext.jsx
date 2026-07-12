import React, { createContext, useContext, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db.js'

const AppContext = createContext(null)

export function useApp() {
  return useContext(AppContext)
}

export function AppProvider({ children }) {
  const settingsRows = useLiveQuery(() => db.settings.toArray(), [])
  const profiles = useLiveQuery(() => db.profiles.toArray(), [])

  const settings = {}
  if (settingsRows) for (const r of settingsRows) settings[r.key] = r.value

  const ready = settingsRows !== undefined && profiles !== undefined && profiles.length > 0
  const activeProfile = ready ? (profiles.find(p => p.id === settings.activeProfileId) || profiles[0]) : null

  // Tema chiaro/scuro
  useEffect(() => {
    if (!ready) return
    const apply = () => {
      const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && sysDark)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [ready, settings.theme])

  const setSetting = (key, value) => db.settings.put({ key, value })

  if (!ready) {
    return <div className="min-h-dvh flex items-center justify-center text-zinc-400">Caricamento…</div>
  }

  const value = {
    settings, profiles, activeProfile, setSetting,
    rate: settings.exchangeRate || 100,
    displayCurrency: settings.displayCurrency || 'EUR',
    expenseCategories: settings.expenseCategories || [],
    goalCategories: settings.goalCategories || []
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
