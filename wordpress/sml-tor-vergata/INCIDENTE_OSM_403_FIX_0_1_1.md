# Incidente OSM 403 — Tor Vergata, 2 novembre 2026

**Problema rilevato dall'utente:** dopo aver premuto «Carica sfondo OpenStreetMap» nel microsito /tor-vergata/, vengono mostrate tile con strisce nere/gialle, «403 Access blocked» e rinvio a osm.wiki/Blocked.

## Causa riscontrata nel codice V0.1.0

Nel branch pilot/tor-vergata-wordpress sono presenti **due violazioni tecniche della tile usage policy OSMF**:
- nell'HTML del microsito `<meta name="referrer" content="no-referrer">` e nel plugin PHP la risposta HTTP `Referrer-Policy: no-referrer`, che sopprimono l'header `Referer` identificativo richiesto dalle tile web;
- il vecchio dominio con sottodomini `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` anziché l'indirizzo esatto prescritto dal provider `https://tile.openstreetmap.org/{z}/{x}/{y}.png`.

Poiché la tile riporta un blocco generale anziché soltanto «Referer is required», non si può garantire senza un nuovo test live che questi fossero gli unici motivi del blocco. Un eventuale blocco lato provider o una protezione del browser potrebbe permanere.

## Correzione 0.1.1-beta

- Plugin `sml-tor-vergata` versione **0.1.1-beta**, stessa cartella/ID WordPress del precedente.
- Header HTTP e meta HTML del **solo microsito**: `strict-origin-when-cross-origin`. Le richieste cross-origin mostrano soltanto l'origine (per esempio `https://mappamenta.altervista.org/`) e non l'indirizzo o i termini delle ricerche locali.
- Leaflet usa `https://tile.openstreetmap.org/{z}/{x}/{y}.png` e `referrerPolicy:"strict-origin-when-cross-origin"` esplicito; attribuzione visibile e nessun download/prefetch senza l'azione dell'utente.
- Nessun header anti-cache aggiunto alle tile; il browser segue gli header di cache originari OSM.
- Informativa dello sfondo aggiornata su cosa viene condiviso dopo l'attivazione e aggiunto link diretto al sito ufficiale OpenStreetMap come ripiego. Se il browser segnala 3 errori tile, il layer viene disattivato con messaggio (attenzione: alcuni blocchi OSM sono **immagini di errore restituite come HTTP 200**, perciò il listener `tileerror` non può intercettarli tutti).
- Versionati gli URL JS/CSS interni al microsito con `?v=0.1.1` per evitare la cache dei precedenti file. **Non** viene aggiunto un parametro anti-cache alle tile OSM.
- Nessun cambiamento a database, dati geografici, 680 record, tema regionale, altre URL WordPress, GitHub main, Cloudflare Pages o protezioni `noindex`.

## Verifica e rilascio

- Workflow riuscito: https://github.com/robgor95/mappatura-servizi-assistenza-psicologica/actions/runs/41476557178
- PHP lint, JavaScript syntax, allowlist routing e archivio ZIP corretti.
- Test browser Playwright mobile 390px e desktop 1366px riusciti per risorse universitarie, filtri 5/8/12 km, mappa, ricerca e attribuzione.
- Il browser test ha verificato **su richieste tile simulate (mock)** che il `Referer` della richiesta è l'origine locale, il dominio è corretto e l'immagine Leaflet dichiara `strict-origin-when-cross-origin`. **Non** ha scaricato tile reali dal server OSM per non consumare risorse dei server volontari. Il risultato definitivo del blocco OSM sul browser dell'utente richiede verifica dopo aggiornamento su AlterVista.

**Pacchetto:** `MentaCampus_TorVergata_Plugin_WordPress_0_1_1_FIX_OSM.zip` (107350 bytes), SHA256 `b80d168883573936244ed8ad41437302566c08469b8f34db709a98b05c641f34`.

## Installazione e rollback

1. Accedere a `https://mappamenta.altervista.org/wp-admin/plugin-install.php`; caricare lo ZIP corretto da **Plugin → Aggiungi nuovo → Carica plugin**.
2. Confermare **Sostituisci il plugin installato con quello caricato** per il solo `sml-tor-vergata`. Riattivare se WordPress lo richiede.
3. Ricaricare `https://mappamenta.altervista.org/tor-vergata/` e premere «Carica sfondo OpenStreetMap». Verificare che le tile mostrino strade e cartografia, e non 403. Se restano immagini 403, controllare cache browser, header `Referer` in DevTools e/o considerare un servizio tile alternativo con termini compatibili, senza aggirare le restrizioni OSM attraverso proxy o scraping.
4. In caso di regressioni, tornare alla versione precedente del plugin via backup ZIP o disattivare soltanto `sml-tor-vergata`. Non reimportare dati e non sostituire tema generale.

## Fonti normative tecniche

- https://operations.osmfoundation.org/policies/tiles/
- https://wiki.openstreetmap.org/wiki/Blocked_tiles
- https://leafletjs.com/reference.html#tilelayer-referrerpolicy

**Stato:** pronta correzione del plugin; non installata automaticamente in WordPress perché non è disponibile una connessione amministrativa autenticata in questa chat.

## Conferma utente — 2 novembre 2026

L'utente conferma in chat che, dopo l'installazione della correzione, lo **sfondo OpenStreetMap su Menta Campus Tor Vergata funziona**. Il precedente errore 403 è pertanto **risolto nell'ambiente e nel browser testati dall'utente**. Questa conferma è una verifica funzionale riportata dal proprietario, non un nuovo collaudo indipendente di tutti i browser o delle politiche future del fornitore di tile.

**Stato incidente:** chiuso per il problema specifico dello sfondo OSM. **Stato progetto:** continua come staging WordPress con `noindex`; non implica approvazione al lancio pubblico né completamento di privacy, verifica delle fonti, backup e workflow redazionale. Conservare invariati GitHub `main` e la produzione Cloudflare.
