import React, { useEffect, useState } from 'react'
import { AppProvider, useApp } from './context/AppContext.jsx'
import { materialize } from './logic/materialize.js'
import { PinPad, Modal } from './components/ui.jsx'
import Oggi from './pages/Oggi.jsx'
import Obiettivi from './pages/Obiettivi.jsx'
import Budget from './pages/Budget.jsx'
import Report from './pages/Report.jsx'
import Impostazioni from './pages/Impostazioni.jsx'

const TABS = [
  { id: 'oggi', label: 'Oggi', icon: '☀️' },
  { id: 'obiettivi', label: 'Obiettivi', icon: '🎯' },
  { id: 'budget', label: 'Budget', icon: '💰' },
  { id: 'report', label: 'Report', icon: '📊' }
]

function Shell() {
  const { activeProfile, profiles, setSetting } = useApp()
  const [tab, setTab] = useState('oggi')
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [pinTarget, setPinTarget] = useState(null)
  const [pinError, setPinError] = useState('')

  useEffect(() => {
    materialize()
    const onVisible = () => { if (!document.hidden) materialize() }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const selectProfile = (p) => {
    if (p.id === activeProfile.id) { setSwitcherOpen(false); return }
    if (p.pin) { setPinTarget(p); setSwitcherOpen(false) }
    else { setSetting('activeProfileId', p.id); setSwitcherOpen(false) }
  }

  const checkPin = (pin) => {
    if (pin === pinTarget.pin) {
      setSetting('activeProfileId', pinTarget.id)
      setPinTarget(null); setPinError('')
    } else setPinError('PIN errato, riprova')
  }

  return (
    <div className="min-h-dvh bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <header className="sticky top-0 z-30 bg-zinc-100/90 dark:bg-zinc-950/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-md mx-auto flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-extrabold text-blue-600 dark:text-blue-400">TARGET</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setSwitcherOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-3 py-1.5 text-sm font-semibold">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                {activeProfile.name[0]?.toUpperCase()}
              </span>
              {activeProfile.name}
            </button>
            <button onClick={() => setTab('impostazioni')} aria-label="Impostazioni"
              className={`w-9 h-9 rounded-full text-lg ${tab === 'impostazioni' ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
              ⚙️
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 pb-28">
        {tab === 'oggi' && <Oggi goToBudget={() => setTab('budget')} />}
        {tab === 'obiettivi' && <Obiettivi />}
        {tab === 'budget' && <Budget />}
        {tab === 'report' && <Report />}
        {tab === 'impostazioni' && <Impostazioni />}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto grid grid-cols-4">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${tab === t.id ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
              <span className="text-xl leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <Modal open={switcherOpen} onClose={() => setSwitcherOpen(false)} title="Cambia profilo">
        <div className="space-y-2">
          {profiles.map(p => (
            <button key={p.id} onClick={() => selectProfile(p)}
              className={`w-full flex items-center gap-3 rounded-xl p-3 text-left ${p.id === activeProfile.id ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-white dark:bg-zinc-800'}`}>
              <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                {p.name[0]?.toUpperCase()}
              </span>
              <span className="font-semibold">{p.name}</span>
              {p.pin && <span className="ml-auto text-zinc-400">🔒</span>}
              {p.id === activeProfile.id && <span className="ml-auto text-blue-600">✓</span>}
            </button>
          ))}
        </div>
      </Modal>

      {pinTarget && (
        <PinPad title={`PIN di ${pinTarget.name}`} error={pinError}
          onSubmit={checkPin} onCancel={() => { setPinTarget(null); setPinError('') }} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
