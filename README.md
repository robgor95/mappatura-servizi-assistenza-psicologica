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
