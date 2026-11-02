# Collaudo pilota Tor Vergata — 2 novembre 2026

**Stato:** pacchetto tema WordPress **beta 0.5** costruito e testato localmente, **non installato** nell'account AlterVista.

## Provenienza
- GitHub main V7.18, commit add601f82b672bc2be217f1e77dd339c6d28581f.
- Branch isolato pilot/tor-vergata-wordpress derivato dal ramo migration/altervista-wordpress.
- Centro geografico Rettorato Tor Vergata (Via Cracovia 50), coordinate da Turismo Roma (41.852760 N, 12.628480 E).
- Generatore tools/build-tor-vergata-pilot.py, fonti V7.18 e geografia V7.16.

## Prove automatiche
GitHub Actions, build https://github.com/robgor95/mappatura-servizi-assistenza-psicologica/actions/runs/41407040147 — **SUCCESS**.

- Tema installabile: sml-lazio-menta-campus-tor-vergata-beta.zip, cartella WordPress sml-lazio/.
- Validazione PHP del file functions.php, sintassi JS, ZIP e struttura delle cartelle.
- 397 file pubblici nel tema (portale regionale V7.18 e microsito pilota).
- 443 schede cliniche e 237 complementari preservate nel catalogo base.
- 52 schede cliniche con coordinate validabili entro 12 km, 19 entro 8 km, 8 entro 5 km; nessuna modifica ai dati originali.
- 4 riferimenti all'Ateneo (Sportello PTV, counselling personale, First Point, Pro-Ben) **separati** dai 443 record clinici.
- Browser Playwright/Chromium su viewport 390 px e 1366 px: **2/2 suite superate**, elenco con ricerca, filtro CSM, raggio 5/8/12 km, 4 card universitarie, mappa Leaflet caricata, nessuna richiesta esterna prima del click opzionale sullo sfondo OpenStreetMap e nessun errore JS non gestito.
- Screenshot e report tra gli artifacts della build sopra.

## Indirizzo previsto (non ancora attivo)
https://mappamenta.altervista.org/tor-vergata/

L'URL si attiverà **soltanto dopo** avere installato su AlterVista il tema beta dal ramo pilot. L'installazione sostituisce solo il tema sml-lazio, non il plugin Catalogo SML e non richiede di reimportare i 680 record.

## Limitazioni e sicurezza
- Questo NON è WordPress Multisite e non è un secondo sito/dominio indipendente. Il ramo GitHub è autonomo come sorgente, l'hosting resterà unico.
- Il microsito è indipendente in grafica, navigazione e contenuti; i dati clinici sono filtrati dal catalogo comune. Il PTV e gli sportelli universitari seguono fonti separate e devono essere ricontrollati prima del lancio.
- Tutte le distanze sono in linea d'aria dal Rettorato, non dalle singole facoltà; alcune coordinate sono indicative e nessun ingresso è dichiarato verificato.
- Il diritto di accesso a CSM, SerD e consultori dipende dalle regole del servizio e dal territorio, NON dalla distanza.
- La pagina mantiene noindex e il sito WordPress staging mantiene il blocco generale; il microsito non è protetto da password.
- Nessun dato di pazienti, nessun modulo di richiesta sanitaria, nessun tracking sulle ricerche; caricamento tile OSM solo su click.
- Ruoli e gestione editoriale **dedicati al solo microsito** non sono ancora implementati: per ora restano condivisi con il catalogo WordPress e i contenuti universitari sono compilati in fase di build.
- Prima del rilascio pubblico: test su AlterVista effettivo, revisione delle fonti e dei recapiti, privacy, accessibilità approfondita, backup di WordPress/MySQL, valutazione dell'hosting PHP e responsabilità editoriale.
- GitHub main e la produzione Cloudflare Pages rimangono invariati.
