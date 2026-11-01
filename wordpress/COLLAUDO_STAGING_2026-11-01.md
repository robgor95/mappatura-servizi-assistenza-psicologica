# MappaMenta staging — collaudo del tema 0.4 (1 novembre 2026)

**Stato:** staging tecnicamente funzionante, **non autorizzato alla messa in produzione**.  
**Origine:** GitHub \`main\`, V7.18, commit \`add601f82b672bc2be217f1e77dd339c6d28581f\`.  
**Destinazione:** https://mappamenta.altervista.org/ con tema ponte \`sml-lazio\` 0.4 beta, WordPress gestito AlterVista.  
**Produzione Cloudflare:** invariata.

## Evidenza amministrativa fornita
Il pannello Avvio MappaMenta ha riportato \`imported-needs-testing\` e:
- 443 servizi clinici + 237 complementari = 680 record importati (31 ottobre 2026, 05:24:54 UTC);
- plugin \`sml-staging-guard\` attivo;
- tema ponte e plugin \`sml-catalogo\` attivi.
Non è stato eseguito un accesso amministrativo diretto da questa conversazione.

## Verifica HTTP live dopo installazione 0.4
[GitHub Actions run 41172998373, tentativo 2 del 1 novembre 2026](https://github.com/robgor95/mappatura-servizi-assistenza-psicologica/actions/runs/41172998373):
- **13/13 controlli PASS, 0 FAIL, 0 UNKNOWN.**
- Home, \`servizi.html\`, \`mappa.html\`, \`orientati.html\`, JS servizi, catalogo JSON, adattatori JS editoriali 0.4, API \`/wp-json/sml/v1/revisions\`, \`/wp-json/sml/v1/content\`, REST WordPress e robots.
- Tutte le **36/36 URL** in sitemap sorgente rispondono e hanno \`noindex\`.
- La sitemap staging risponde HTTP 404 come previsto. \`robots.txt\` scoraggia la scansione.
- Le API editoriali native rispondono HTTP 200 e i riferimenti nel JS 0.4 sono corretti.

## Test in browser mobile/desktop
[GitHub Actions run 41315964498, 1 novembre 2026](https://github.com/robgor95/mappatura-servizi-assistenza-psicologica/actions/runs/41315964498):
- **16/16 test PASS, 0 FAIL**, browser Chromium, viewport 390px e 1366px.
- Home, ricerca, mappa e orientamento Menta aprono correttamente e non presentano overflow orizzontale.
- Ricerca: 443 schede, filtro CSM con risultati e azzeramento.
- Menta: sezione espandibile funzionante, query \`università\` e collegamento alla sezione universitaria.
- Mappa: 443 schede e 379 localizzate nella vista riepilogativa.
- Nessun errore JavaScript non gestito nel percorso testato.
- Sono disponibili screenshot e report JSON tra gli Artifacts dell'azione (conservazione 7 giorni).
- La prima esecuzione \`41315603978\` era fallita per selettori del test errati (es. input Menta dentro details non aperto). Il test è stato corretto secondo il markup reale del V7.18; non è stata applicata una modifica a WordPress in conseguenza di quei falsi positivi.

## Gate ancora aperti

1. **Approvazioni su account reali di test**: redattore -> revisore dati -> specialista quando richiesto -> amministratore indipendente; rifiuto dell'autoapprovazione; verifiche sulla visibilità pubblica dei dati.
2. **Sicurezza applicativa**: autorizzazioni lato server, CSRF, abuso di form, controllo revisione concorrente, audit completo, nessuna perdita di bozze o dati personali dall'API pubblica.
3. **Backup/restore**: esportazione privata e ripristino provato di WordPress, database e media. Il backup del solo codice GitHub non copre le modifiche WordPress.
4. **Privacy/editoria**: definire titolare, recapito e responsabilità editoriale; vietare dati sanitari individuali.
5. **Compatibilità hosting**: PHP 8.0.30 del preflight ha terminato il supporto upstream; verificare policy patch/update con AlterVista e compatibilità futura.
6. **SEO cutover**: URL di origine \`pages.dev\`, canonical, eventuali 301 e Search Console. Non togliere \`noindex\` fino al via libera.
7. **Versionare e verificare integralmente il codice del plugin beta**, attualmente in ZIP di progetto, prima di dichiarare pronta la migrazione totale.

La prossima fase non richiede reimportare il catalogo. **Non modificare \`main\` o Cloudflare finché i gate non sono superati.**
