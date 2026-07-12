# 📱 Rotta — Guida semplice

App per obiettivi a lungo termine e budget familiare EUR/LEK.
**Tutti i dati restano solo sul telefono di chi la usa** — nessun account, nessun server.

---

## 1. Pubblicare l'app gratis (una volta sola)

Il modo più semplice è **Netlify Drop**: non serve creare account con carta, non serve saper programmare.

### Passo per passo

1. Sul PC, apri la cartella del progetto e prepara i file dell'app:
   - Apri il menu Start → scrivi `powershell` → Invio
   - Nella finestra nera scrivi questo comando e premi Invio:
     ```
     npm --prefix C:\Users\clien\Searches\rotta run build
     ```
   - Questo crea la cartella `C:\Users\clien\Searches\rotta\dist` con l'app pronta.

2. Vai su **https://app.netlify.com/drop** con il browser.

3. Crea un account gratuito se richiesto (basta l'email, oppure accedi con Google).

4. **Trascina la cartella `dist`** (tutta la cartella, non i singoli file) dentro la pagina.

5. Dopo qualche secondo Netlify ti dà un indirizzo tipo:
   `https://nome-strano-123.netlify.app`
   Questo è l'indirizzo della tua app! Puoi cambiarlo in qualcosa di più bello da
   *Site settings → Change site name* (es. `rotta-famiglia.netlify.app`).

> ⚠️ **Importante**: anche se l'app è online, i dati (obiettivi, spese, risparmi)
> NON vengono mai inviati a Netlify. Restano nel telefono. Il sito serve solo a
> "scaricare" l'app la prima volta.

### Quando aggiorni l'app in futuro
Rifai il comando del punto 1, poi su Netlify vai su *Deploys* e trascina di nuovo la cartella `dist`.

---

## 2. Installare l'app sul telefono

Apri l'indirizzo dell'app (es. `https://rotta-famiglia.netlify.app`) con il browser del telefono, poi:

### Android (Chrome)
1. Tocca i **tre puntini** in alto a destra
2. Tocca **"Aggiungi a schermata Home"** (o "Installa app")
3. Conferma con **"Installa"**
4. L'icona blu **R** appare nella schermata Home: da lì si apre come una vera app, anche senza internet

### iPhone (Safari)
1. Tocca il pulsante **Condividi** (il quadrato con la freccia in su, in basso al centro)
2. Scorri e tocca **"Aggiungi alla schermata Home"**
3. Tocca **"Aggiungi"** in alto a destra
4. L'icona appare nella Home

Ripeti su entrambi i telefoni (il tuo e quello di Marinela). Ogni telefono avrà i **suoi** dati.

---

## 3. Backup e trasferimento dati

I dati vivono solo nel telefono, quindi il backup è importante (se cancelli l'app o i dati del browser, perdi tutto).

### Fare un backup
1. Apri l'app → ⚙️ **Impostazioni**
2. Tocca **"⬇️ Esporta dati"**
3. Viene scaricato un file tipo `rotta-backup-2026-07-12.json`
4. Conservalo dove vuoi (Google Drive, WhatsApp a te stesso, email…)

Consiglio: fallo **una volta al mese**.

### Ripristinare o trasferire su un altro telefono
1. Porta il file sul nuovo telefono (email, WhatsApp, Drive…)
2. Apri l'app → ⚙️ **Impostazioni** → **"⬆️ Importa dati"**
3. Scegli il file → conferma
4. ⚠️ Attenzione: l'importazione **sostituisce** tutti i dati presenti sul telefono

Così puoi anche allineare i due telefoni: esporti dal tuo, importi su quello di Marinela (o viceversa).

---

## 4. Come si usa (in breve)

- **Oggi** — i task del giorno con le caselle da spuntare, il riepilogo del budget del mese e i progressi rapidi (peso, polizze…). Viste Settimana e Mese in alto.
- **Obiettivi** — i tuoi obiettivi con semaforo 🟢🟡🔴 e ritmo richiesto. Il pulsante **+** apre la creazione guidata in 4 passi. Se salti dei giorni, l'app ridistribuisce da sola il lavoro sui giorni rimanenti.
- **Budget** — spese ed entrate in EUR o LEK (il **+** registra una spesa in 3 tocchi: importo → categoria → fatto). Sezioni Budget per categoria (avvisi all'80% e oltre il limite) e Risparmio (quota mensile calcolata da sola).
- **Report** — grafici del mese, confronto ultimi 6/12 mesi, storico filtrabile.
- **⚙️ Impostazioni** — nomi profili, PIN, tasso EUR→LEK, categorie, tema, backup.

### Profili
- In alto a destra tocchi il nome per passare da **Utente 1** a **Marinela**
- Gli **obiettivi sono separati** per profilo; il **budget è in comune**
- In Impostazioni puoi cambiare i nomi e mettere un **PIN a 4 cifre** su ciascun profilo

### Tasso di cambio
Il tasso EUR→LEK non si aggiorna da solo (l'app è offline): aggiornalo tu in
Impostazioni quando serve (es. 1 EUR = 98 LEK).
