# V7.9.1 — ulteriore geografia e aggiornamento operativo

Baseline: `937713935c693dbbe50109e6738063cc0395e192`. Riesame documentale: 2026-09-22. I file precedenti non sono riscritti.

## Risultati geografici
440 → 442 servizi; 236 → **307 localizzati**; 204 → **135 senza pin**.
63 corrispondenze cartografiche al civico, 227 posizioni sulla via, 17 complessi/edifici.
I complessi sono distinti dalle localizzazioni al civico e dagli ingressi: **zero ingressi verificati**.
Livelli: A=25, B=0, C=282, D=133, E=2.
69 dei precedenti 204 casi localizzati; due nuovi servizi localizzati. Nessuna promozione da via a civico in questo ciclo.
1 coordinate precedenti corrette, 50 servizi con candidati respinti (23 rimangono senza pin). Nessun servizio eliminato.
La classificazione A richiede indirizzo documentato, ma non sopralluogo: i sette servizi Colle Cesarano hanno il punto del complesso dichiarato dal gestore.
Dieci servizi ospedalieri hanno un punto C di complesso coerente con la denominazione storica; reparto/ingresso e operatività non verificati.

## Geocodifica e privacy
Un estratto regionale OSM riutilizzabile elaborato offline; zero nuove richieste Nominatim. Poligoni comunali, nomi delle vie e civici confrontati senza interpolare civici.
I centri dei comuni non diventano pin. Le vie ambigue o troppo estese non generano nuovi punti.
Cache di decisioni e feature selezionate, manifesto con SHA256 dell’estratto e fonti individuali sono allegati.
Nessuna geocodifica, geolocalizzazione, tracking o invio delle ricerche dal browser. Tasselli solo dopo consenso esplicito.

## Operatività
51 record esistenti riesaminati parzialmente, due servizi Villa Pia distinti su una nuova sede fisica.
16 contratti per singola unità esistente acquisiti (12 IHG/Gabbiano e quattro ulteriori strutture ASL Roma 5).
Contratto vigente nel periodo dichiarato non implica budget 2026 acquisito o posto libero.
Nuovi Orizzonti: documento esercizio 2025, non carta 2021 ridatata; accoglienza centrale 3929040842 lun–ven 09–13/14–17, non numero diretto della sede.
San Camillo: avviso datato 10/04/2026 di sospensione ricoveri dal 15/04, riapertura non documentata; DH distinto.
Nuove Dipendenze: Frentani 6 nella pagina aggiornata maggio 2026; precedente indirizzo temporaneo Palestro 39 mantenuto nella traccia, data effettiva del cambio non inventata.
Villa Pia: residenziale 20; diurno 40 accreditati nella tabella ASL contro 20 dichiarati dal gestore. Nessuna risoluzione presunta della discrepanza.
Al Colle/Insieme, Reverie e Il Ponte: servizi co-localizzati ancora separati.

## Test, integrità e limiti
176 file precedenti protetti con verifica dei byte, nessuna differenza. File attivi modificati: otto entrypoint/documenti, nuovi overlay e asset versionati.
Le prove effettive sono in Verifiche_V7_9_1.json. Il deploy non è anticipato dal test locale; HTTP e browser su Cloudflare sono verificati dopo merge.
Indicizzazione disattivata: HTML/HTTP noindex, sitemap non annunciata, indexing_enabled=false.
Nessuna chiamata, sopralluogo o verifica di disponibilità. VoiceOver reale non eseguito.
Università, scuole, helpline e centri di ascolto restano separati: geografia non ampliata in questo ciclo.
Ancora aperti: 135 localizzazioni, budget 2026, cinque contratti non acquisiti, discordanze di capienza, ingressi/accessibilità e ricognizione non esaustiva degli altri gestori.

Fonti e date per campo: `data/audit_operativo_v7_9_1.json`; hash/fonti: `downloads/Fonti_Verificate_V7_9_1.json`; dettagli quantitativi: `downloads/Audit_Operativo_V7_9_1.json`.
