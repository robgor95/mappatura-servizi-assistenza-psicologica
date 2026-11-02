# Menta Campus — Tor Vergata

**Pilota indipendente in WordPress gestito AlterVista.** Stato: sviluppo; nessuna installazione pubblicata sul dominio dell'utente da questa procedura.

## URL e indipendenza
Percorso scelto per il primo test: https://mappamenta.altervista.org/tor-vergata/
La sezione avrà navigazione, filtri, orientamento e aspetto propri, ma riuserà il database MappaMenta. Non è una seconda installazione WordPress e non sfrutta WordPress Multisite. La creazione di un ramo GitHub non crea da sola un nuovo sito pubblico.

## Origine dati
- Fonte primaria codice/dati: GitHub main, V7.18, commit 12 ottobre 2026.
- Fonte di lavoro WordPress: branch migration/altervista-wordpress da cui è stato derivato questo ramo pilota.
- Dataset: data/editorial-catalog-v7-18.json (443 clinici, 237 complementari), data/presidi_geo_v7_16.json (379 localizzati) e data/universita_v7_5.json.
- Centro: Via Cracovia 50, punto documentato 41.852760 N / 12.628480 E, fonte Turismo Roma.
- Raggi configurabili: 5, 8 e 12 km in linea d'aria. Numero verificato di servizi clinici georeferenziati: 8 entro 5 km, 19 entro 8 km, 52 entro 12 km. Non includere le schede senza coordinate nel filtro geografico.
- Sportello PTV (studenti), counselling personale, First Point e Pro-Ben da fonti ufficiali. Le risorse universitarie sono separate dalle strutture cliniche regionali.
- Le modifiche cliniche approvate in WordPress vengono proiettate dalla REST API pubblica; se cambia un indirizzo, la scheda smette di essere mostrata come localizzata finché non viene verificato il nuovo punto.

## Struttura
- pilot/tor-vergata/index.html — homepage e interfaccia indipendenti.
- pilot/tor-vergata/tv.css — tema responsive.
- pilot/tor-vergata/tv.js — filtri e mappa Leaflet con sfondo OSM solo su consenso attivo.
- tools/build-tor-vergata-pilot.py — genera servizi.json dai dati V7.18 senza geocoding o richieste esterne.
- wordpress/sml-lazio/functions.php — instradamento /tor-vergata/ al documento pilot.
- .github/workflows/build-pilot-tor-vergata.yml — build ZIP WordPress del tema completo con pilota.

## Sicurezza e accesso
- Sito informativo indipendente **non ufficiale**, senza affiliazione dichiarata a Tor Vergata, Policlinico, ASL o Regione.
- Nessun modulo per dati sanitari personali o dati degli utenti.
- Ricerche e filtri solo nel browser, nessuna raccolta dei termini inseriti.
- Staging noindex attivo; per le tiles OpenStreetMap serve un click esplicito.
- Distanza in linea d'aria e posizione indicativa non implicano diritto di accesso o ingresso esatto; CSM/SerD possono avere competenze territoriali distinte.

## Come portare il pilota online
1. Scaricare l'artefatto ZIP dalla build GitHub Actions del ramo pilota.
2. Aprire l'archivio esterno ed estrarre il tema WordPress completo, con cartella sml-lazio.
3. Installare il tema sullo staging con Aspetto → Temi → Carica tema → Sostituisci, conservando plugin Catalogo SML e protezione.
4. Visitare /tor-vergata/; verificare 19 servizi entro 8 km, le risorse universitarie e i link.
5. Non disattivare la protezione SEO: il pilota resta in prova fino a validazione.

## Gate aperti prima del lancio
- Audit manuale di accessibilità, testi, privacy e fonti in particolare modalità di accesso dei servizi.
- Test visivo mobile/desktop e verifica ruolo del personale editoriale dedicato.
- Noindex sul pilota finché non è pronto per indicizzazione.
- Valutazione dei limiti PHP dell'hosting AlterVista e sistema backup WordPress completo.
- Eventuale dominio indipendente richiede un'altra installazione WordPress (non un branch GitHub).

## Fonti
https://web.uniroma2.it/contenuto/sportello-ptv-per-studenti-e-studentesse
https://orientamento.uniroma2.it/conta-su-di-noi-servizi-di-supporto-agli-studenti/
https://web.uniroma2.it/it/contenuto/dove_siamo
https://www.turismoroma.it/it/luoghi/biblioteca-dellarea-giuridica-universit%C3%A0-tor-vergata
