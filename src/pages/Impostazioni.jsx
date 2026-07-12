import React, { useState, useRef } from 'react'
import { db, exportAll, importAll } from '../db/db.js'
import { useApp } from '../context/AppContext.jsx'
import { todayISO, fmtDate } from '../logic/dates.js'
import { Card, Field, TextInput, Btn, Segmented, Modal, PinPad, Confirm } from '../components/ui.jsx'

export default function Impostazioni() {
  const { settings, profiles, setSetting, expenseCategories, goalCategories } = useApp()
  const [rateVal, setRateVal] = useState(String(settings.exchangeRate))
  const [pinFor, setPinFor] = useState(null)
  const [pinStep, setPinStep] = useState(null)
  const [pinFirst, setPinFirst] = useState('')
  const [pinError, setPinError] = useState('')
  const [importData, setImportData] = useState(null)
  const [msg, setMsg] = useState('')
  const fileRef = useRef()

  const saveRate = async () => {
    const v = parseFloat(rateVal.replace(',', '.'))
    if (isNaN(v) || v <= 0) return
    await setSetting('exchangeRate', v)
    await setSetting('rateUpdatedAt', todayISO())
    setMsg('Tasso di cambio aggiornato ✓')
    setTimeout(() => setMsg(''), 2500)
  }

  const startPin = (p) => { setPinFor(p); setPinStep('first'); setPinFirst(''); setPinError('') }
  const onPin = async (pin) => {
    if (pinStep === 'first') { setPinFirst(pin); setPinStep('second'); setPinError('') }
    else {
      if (pin === pinFirst) {
        await db.profiles.update(pinFor.id, { pin })
        setPinFor(null); setPinStep(null)
      } else { setPinError('I PIN non coincidono, ricomincia'); setPinStep('first') }
    }
  }

  const doExport = async () => {
    const data = await exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rotta-backup-${todayISO()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const onFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (data.app !== 'rotta') throw new Error()
      setImportData(data)
    } catch {
      setMsg('⚠️ File non valido: seleziona un backup di TARGET (.json)')
      setTimeout(() => setMsg(''), 3500)
    }
    e.target.value = ''
  }

  const doImport = async () => {
    await importAll(importData)
    setImportData(null)
    setMsg('Dati ripristinati ✓')
    setTimeout(() => setMsg(''), 2500)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Impostazioni</h2>
      {msg && <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{msg}</p>}

      <Card>
        <h3 className="font-bold mb-3">👥 Profili</h3>
        {profiles.map(p => (
          <div key={p.id} className="mb-3 last:mb-0">
            <div className="flex gap-2 items-center">
              <TextInput defaultValue={p.name}
                onBlur={e => { const n = e.target.value.trim(); if (n && n !== p.name) db.profiles.update(p.id, { name: n }) }}
                className="flex-1 !py-2" />
              {p.pin
                ? <Btn variant="secondary" className="!py-2 text-sm shrink-0" onClick={() => db.profiles.update(p.id, { pin: null })}>🔓 Togli PIN</Btn>
                : <Btn variant="secondary" className="!py-2 text-sm shrink-0" onClick={() => startPin(p)}>🔒 Imposta PIN</Btn>}
            </div>
          </div>
        ))}
        <p className="text-xs text-zinc-400 mt-2">Il nome si salva quando esci dal campo. Il PIN protegge il cambio profilo.</p>
      </Card>

      <Card>
        <h3 className="font-bold mb-3">💱 Tasso di cambio EUR → LEK</h3>
        <div className="flex gap-2 items-center">
          <span className="text-sm shrink-0">1 EUR =</span>
          <TextInput inputMode="decimal" value={rateVal} onChange={e => setRateVal(e.target.value)} className="flex-1 !py-2" />
          <span className="text-sm shrink-0">LEK</span>
          <Btn className="!py-2 text-sm shrink-0" onClick={saveRate}>Salva</Btn>
        </div>
        <p className="text-xs text-zinc-400 mt-2">Ultimo aggiornamento: {fmtDate(settings.rateUpdatedAt)}</p>
      </Card>

      <Card>
        <h3 className="font-bold mb-3">🎨 Aspetto</h3>
        <Field label="Tema">
          <Segmented value={settings.theme} onChange={v => setSetting('theme', v)} options={[
            { value: 'light', label: 'Chiaro' }, { value: 'dark', label: 'Scuro' }, { value: 'system', label: 'Sistema' }
          ]} />
        </Field>
        <Field label="Valuta per totali e report">
          <Segmented value={settings.displayCurrency} onChange={v => setSetting('displayCurrency', v)} options={[
            { value: 'EUR', label: 'EUR (€)' }, { value: 'ALL', label: 'LEK' }
          ]} />
        </Field>
      </Card>

      <CategoryEditor title="🏷️ Categorie di spesa" list={expenseCategories}
        onChange={v => setSetting('expenseCategories', v)} />
      <CategoryEditor title="🎯 Categorie obiettivi" list={goalCategories}
        onChange={v => setSetting('goalCategories', v)} />

      <Card>
        <h3 className="font-bold mb-1">💾 Backup e ripristino</h3>
        <p className="text-xs text-zinc-500 mb-3">
          Esporta tutti i dati in un file JSON: serve come backup e per trasferirli su un altro telefono (esporta qui → importa là).
        </p>
        <div className="flex gap-2">
          <Btn className="flex-1" onClick={doExport}>⬇️ Esporta dati</Btn>
          <Btn variant="secondary" className="flex-1" onClick={() => fileRef.current.click()}>⬆️ Importa dati</Btn>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
      </Card>

      <p className="text-center text-xs text-zinc-400 pb-4">
        TARGET v1.0 — tutti i dati restano solo su questo dispositivo 🔒
      </p>

      {pinFor && (
        <PinPad title={pinStep === 'first' ? `Nuovo PIN per ${pinFor.name}` : 'Ripeti il PIN'}
          error={pinError} onSubmit={onPin}
          onCancel={() => { setPinFor(null); setPinStep(null) }} />
      )}

      <Confirm open={!!importData} onClose={() => setImportData(null)} onConfirm={doImport}
        title="Importare il backup?"
        message="Tutti i dati attuali su questo dispositivo saranno sostituiti con quelli del file. L'operazione non può essere annullata." />
    </div>
  )
}

function CategoryEditor({ title, list, onChange }) {
  const [val, setVal] = useState('')
  return (
    <Card>
      <h3 className="font-bold mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2 mb-3">
        {list.map(c => (
          <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-700 px-3 py-1.5 text-sm">
            {c}
            <button onClick={() => onChange(list.filter(x => x !== c))} className="text-zinc-400" aria-label={`Rimuovi ${c}`}>✕</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <TextInput value={val} onChange={e => setVal(e.target.value)} placeholder="Nuova categoria…" className="flex-1 !py-2" />
        <Btn variant="secondary" className="!py-2" disabled={!val.trim() || list.includes(val.trim())}
          onClick={() => { onChange([...list, val.trim()]); setVal('') }}>+</Btn>
      </div>
    </Card>
  )
}
