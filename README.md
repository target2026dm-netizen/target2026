# Rotta

PWA mobile-first in italiano per gestione obiettivi a lungo termine (con calendario
operativo auto-ricalcolante) e budget familiare in doppia valuta EUR/LEK.

- **Stack**: React 18 + Vite 6, Tailwind CSS 4, Dexie (IndexedDB), vite-plugin-pwa
- **Dati**: 100% locali sul dispositivo (IndexedDB); backup/ripristino via file JSON
- **Profili**: 2 profili locali (obiettivi separati, budget comune), PIN opzionale

## Comandi

```bash
npm install        # prima volta
npm run dev        # sviluppo (http://localhost:5173)
npm run build      # produzione → cartella dist/
npm run preview    # prova la build di produzione (porta 4173)
```

## Struttura

```
src/
├── db/          # schema Dexie + dati di esempio (seed)
├── logic/       # ricalcolo obiettivi, ricorrenze, valute, date, materializzazione
├── pages/       # Oggi, Obiettivi, Budget, Report, Impostazioni
├── components/  # UI condivisa (modali, PIN pad) e grafici SVG
└── context/     # impostazioni globali e profilo attivo
```

Vedi **GUIDA.md** per pubblicazione (Netlify Drop), installazione su telefono e backup.
