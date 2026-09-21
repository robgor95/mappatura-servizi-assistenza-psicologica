# Mappatura servizi di assistenza psicologica — Lazio

Repository del portale pubblico **Mappatura servizi di assistenza psicologica nel Lazio**.

Sito di produzione: https://mappatura-servizi-assistenza-psicologica.pages.dev/

## Deploy

Il progetto Cloudflare Pages è collegato direttamente a questo repository GitHub.

- Repository: `robgor95/mappatura-servizi-assistenza-psicologica`
- Branch di produzione: `main`
- Deploy automatici: abilitati
- Framework: nessuno; sito statico HTML/CSS/JavaScript

Ogni push su `main` avvia automaticamente un nuovo deployment di produzione su Cloudflare Pages.

Non sono necessari GitHub Actions, Wrangler o secret Cloudflare nel repository per il deploy ordinario.

## Struttura

Il repository contiene il portale statico, i dataset, le guide ai percorsi di cura e i file scaricabili.

## Versione corrente V7.7 — Menta

La produzione usa **V7.7** per l’interfaccia, **V7.6** per l’estensione documentale corrente, con dataset **V7.3**, integrazioni **V7.5** e cinque guide **V7.4** conservati. Base di questo intervento: `b52e4eb`.

Menta è una guida locale, non un chatbot: **29 intenti**, **246 parole/frasi normalizzate distinte**, **37 espressioni di sicurezza distinte**, **17 pagine di destinazione**. Il testo libero non è trasmesso o memorizzato dal codice del sito. I link contengono solo categorie e luoghi riconosciuti.

- `assets/menta-config-v7-7.js`: vocabolario, priorità, percorsi, combinazioni e luoghi del database.
- `assets/menta-core-v7-7.js`: funzioni pure di riconoscimento e composizione dei link, senza rete o storage.
- `assets/menta-ui-v7-7.js`: interfaccia progressiva, scelte, sicurezza e pulizia del campo.
- `assets/menta-v7-7.css`, `assets/menta-site-v7-7.js`, `assets/menta/`: stile e supporti contestuali.

Non sono effettuate diagnosi, valutazioni del rischio o verifiche di disponibilità. Nessuna promessa automatica di gratuità o convenzione SSN.

### Verifica della versione corrente

```sh
node tools/test-menta-v7-7.cjs
# Solo per test di sviluppo, non per il deploy:
python tools/test-menta-browser-v7-7.py
```

Il browser test richiede Playwright e BeautifulSoup; `AXE_PATH` indica il file locale `axe.min.js` per i controlli automatici. Il workflow di verifica li installa solo sul runner di test. Non si aggiungono dipendenze al sito pubblicato.

Il test V7.5.1 citato nelle sezioni storiche sotto conserva le vecchie assunzioni e non è il test dell’overlay V7.6: usare i comandi V7.7 qui sopra.

Report: `downloads/Verifiche_Menta_V7_7.json`; audit e hash dei file preservati: `downloads/Audit_Menta_V7_7.json`; note: `downloads/Note_Rilascio_V7_7.txt`.

Il database operativo resta di **428 schede**, non strutture uniche: **296 rete ASL, 115 moduli non ASL, 17 attività private**. I servizi universitari e le altre directory dedicate restano separati. Il contatore UI della rete è stato allineato ai 296 record già presenti: nessun dato sanitario è aggiunto o eliminato dalla V7.7.

Le sezioni che seguono documentano le evoluzioni precedenti.

## Versione V7.5

La V7.5 aggiunge dataset e pagine statiche separate per servizi universitari, sportelli scolastici, helpline, centri/sportelli pubblici di ascolto, centri privati e approfondimento di comunità/STPIT/centri diurni. I dataset V7.3 e le guide V7.4 sono preservati.

- Web: V7.5
- Guide: V7.4 (preservate)
- Archivio storico: V7.3 (preservato)
- Verifica nuovi dataset: 2026-09-21

## Interfaccia V7.5.1 — Trova un servizio

Il database operativo è ora in `servizi.html`. `archivio.html` resta un ingresso compatibile: i vecchi parametri di ricerca e gli ID sono convertiti senza perdere la selezione.

L'indice unifica 295 nodi rete ASL, 115 moduli non ASL e 11 schede di attività privata. Sono 421 schede, non strutture uniche. Università, scuole, helpline e centri di ascolto restano mappature dedicate. Nessuna verifica sanitaria aggiuntiva è attribuita al restyling.

- `assets/servizi-data-v7-5-1.js`: adattatore di sola lettura, filtri, compatibilità URL e CSV.
- `assets/servizi-v7-5-1.js`: interfaccia, dettagli, storia URL e strumenti documentali.
- `assets/servizi-v7-5-1.css`: stile coerente con il sito e layout mobile.
- `interfaccia-precedente.html`: copia della precedente interfaccia per compatibilità e confronto.

I dataset e i download precedenti non sono modificati. Le guide cliniche V7.4 rimangono invariate.

### Controlli

Eseguire con Node, senza installare pacchetti:

```sh
node tools/test-servizi-v7-5-1.cjs
```

Note di rilascio: `downloads/Note_Rilascio_V7_5_1.txt`.
Report e limiti del banco di prova Chromium: `downloads/Verifiche_UI_V7_5_1.json`.
