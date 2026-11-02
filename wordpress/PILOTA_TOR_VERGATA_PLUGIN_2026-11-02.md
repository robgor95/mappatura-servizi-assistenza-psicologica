# Menta Campus Tor Vergata - versione plugin isolata 0.1 beta

Data: 2 novembre 2026. Sito di destinazione: https://mappamenta.altervista.org/tor-vergata/ .
Stato: **pacchetto installabile pronto e collaudato in locale, non installato su AlterVista da questa conversazione**.
Fonte primaria del portale regionale: GitHub main, V7.18, commit add601f82b672bc2be217f1e77dd339c6d28581f.
Ramo indipendente di sviluppo: pilot/tor-vergata-wordpress; nessuna modifica a main o produzione Cloudflare.

## Scelta definitiva: opzione A
Microsito come plugin WordPress dedicato nella stessa installazione AlterVista: non si sostituisce il tema sml-lazio regionale e non si crea un secondo WordPress. Il nuovo plugin intercetta solo /tor-vergata/ e i propri asset. Disattivarlo consente di tornare alla situazione precedente.

## Versionamento e pacchetto
- Sorgente plugin: wordpress/sml-tor-vergata/sml-tor-vergata.php
- Generatore: tools/package-tor-vergata-plugin.py
- Dati/V7.18: tools/build-tor-vergata-pilot.py
- Build GitHub Actions: https://github.com/robgor95/mappatura-servizi-assistenza-psicologica/actions/runs/41473670664
- Pacchetto ZIP da caricare in WordPress: MentaCampus_TorVergata_Plugin_WordPress_0_1_Beta.zip
- Dimensione: 106797 byte; SHA256: 6d6e1e48357be064c8eb1fca9712f22c09c845fa894a2cc62eed189d0b851ff9

## Verifiche eseguite
- Build completata con successo su GitHub Actions; 2 prove Playwright/Chromium superate a 390 e 1366 px.
- Sintassi PHP, sintassi JavaScript, struttura e contenuti ZIP verificati.
- Filtro distanza: 8 servizi clinici entro 5 km, 19 entro 8 km, 52 entro 12 km dal Rettorato; tutti localizzati in linea d'aria con coordinate di qualità A/B/C.
- Quattro risorse universitarie separate dal catalogo clinico.
- Modifica approvata di un campo su schede esistenti letta via /wp-json/sml/v1/revisions; nuovi record o nuove coordinate non si sincronizzano automaticamente e richiedono un aggiornamento del pacchetto pilota.
- Nessun caricamento di tile OpenStreetMap finché l'utente non lo richiede.
- I percorsi non collegati a /tor-vergata/ rimangono gestiti dal tema regionale.

## Installazione da eseguire sul WordPress gestito
1. Accedere a https://mappamenta.altervista.org/wp-admin/plugin-install.php .
2. Aprire Plugin > Aggiungi nuovo > Carica plugin.
3. Caricare esclusivamente lo ZIP MentaCampus_TorVergata_Plugin_WordPress_0_1_Beta.zip, attivare Menta Campus - Tor Vergata (microsito).
4. Aprire https://mappamenta.altervista.org/tor-vergata/ e confermare la presenza della pagina pilota. Non disattivare noindex durante i test.
5. Controllare header noindex, risposta JSON /tor-vergata/servizi.json e flussi di navigazione reali. Se non funziona, disattivare soltanto il nuovo plugin.

## Criteri ancora aperti prima del lancio pubblico
- Verifica manuale recente delle fonti ufficiali di Ateneo, dei recapiti, delle modalità e dell'ammissibilità dei servizi.
- Verifiche di accessibilità approfondita e test su AlterVista reale (PHP 8.0 del preflight è fuori supporto upstream).
- Completamento informativa privacy, identità del titolare, responsabilità editoriale, backup WordPress/MySQL e processo di revisione.
- Il pilota resta noindex anche quando è accessibile attraverso il link: noindex non è autenticazione.

Nota: NON usare il vecchio tema Beta 0.5 come aggiornamento regionale se si sceglie questo plugin; il nuovo ZIP è la soluzione più sicura per l'opzione A.