## Versione corrente V7.10

Nuovo strato complementare per accesso e supporto territoriale: 135 consultori nel master regionale, 47 sedi/punti PUA documentati e 6 servizi/linee di emergenza sociale. Aggiunte le pagine `supporto-territoriale.html` e `aiuto-adesso.html`, con Menta aggiornata. I 442 servizi clinici e la geografia V7.9.2 restano invariati. Le Case Rifugio non sono geolocalizzate e l'indicizzazione resta disattivata.

Checkpoint pre-estensione: branch `v7.9.3-stable-before-social-services` → `2ad2126b5c972ce49956607e368fc45b3fc4f7e6`.

## Versione corrente V7.9.3

Riesame operativo additivo: quattro presidi ASL Roma 1 aggiornati per accesso/orari/trasporto, tre sedi ASL Rieti con evidenza edilizia sull’accessibilità, un conflitto di sede Rieti reso esplicito e contesto del finanziamento psichiatrico 2026 chiarito senza attribuire budget unitari non acquisiti. Geografia invariata: 442 servizi, 309 localizzati, 133 senza pin. Indicizzazione ancora disattivata.

## Versione corrente V7.9.2

V7.9.2: cinque contratti individuali Roma 5 acquisiti, FEBO ricontrollato senza promozione, ricognizione Nuovi Orizzonti consolidata, Menta sincronizzata e geografia conservativa ulteriormente ampliata.

## Versione corrente V7.9.1

442 servizi, 307 localizzati, 135 senza pin. 51 revisioni per campo, due servizi Villa Pia, contratti per singola unità IHG/Gabbiano e ASL Roma 5. Nessuna riscrittura degli overlay precedenti.

Report: `downloads/Release_Notes_V7_9_1.md`; test: `tools/test-ui-v7-9-1.mjs`; integrità e dati: `tools/prepare-release-v7-9-1.py`. Il sito resta statico e noindex. Le sezioni seguenti documentano versioni precedenti.

## V7.9 — geografia e audit operativo

440 servizi (+8); 236 localizzati, 204 senza pin. 47 schede precedenti riesaminate solo per i campi documentati. 11 casi di gestore con riscontri, IHG pendente. Cinque nuovi indirizzi fisici documentati; Venere/Marte sono due servizi ulteriori ma il loro edificio esatto non è consolidato.

Reverie mantiene quattro servizi; Il Ponte mantiene traccia del record precedente e separa accoglienza, comunità e Coccinella. FEBO e Villa Licia non sono classificati come convenzionati. Corretto lo SPDC San Filippo Neri: non è prova di trasferimento.

Storici, vecchi overlay e download conservati byte per byte. Noindex invariato; Leaflet locale; nessun geocoder, posizione dispositivo o tracking; tasselli su consenso.

Questa release non conclude l’audit di tutti i servizi o la geografia. Gli esiti tecnici effettivi sono in `Verifiche_V7_9.json`; la verifica di produzione è un controllo successivo al merge, registrato separatamente in GitHub Actions. VoiceOver reale non eseguito in ambiente Linux.

Report: `downloads/Audit_Operativo_V7_9.json`, `downloads/Report_Geografia_V7_9.md`, `downloads/Verifiche_V7_9.json`.

---

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

## Versione corrente V7.8 — UX e mappa dei presidi

La produzione usa **V7.8** per l’interfaccia, **V7.7.5** per l’overlay multisede, **V7.6** per il riesame documentale precedente, con dataset **V7.3**, integrazioni **V7.5** e cinque guide **V7.4** conservati. Il numero di versione resta documentazione tecnica e non viene mostrato come informazione primaria all’utente finale.

Menta è una guida locale, non un chatbot: **31 intenti**, **276 parole/frasi normalizzate distinte**, **37 espressioni di sicurezza distinte**, **17 pagine di destinazione**. La V7.7.1 aggiunge micro-animazioni contestuali accessibili e stati visivi per errore e assenza risultati. La V7.7.2 semplifica il linguaggio del frontend, sposta i dettagli di audit fuori dal percorso principale e amplia la guida al privato con scelta del professionista e approcci psicoterapeutici. Il testo libero non è trasmesso o memorizzato dal codice del sito. I link contengono solo categorie e luoghi riconosciuti.

- `assets/menta-config-v7-7.js`: vocabolario, priorità, percorsi, combinazioni e luoghi del database.
- `assets/menta-core-v7-7.js`: funzioni pure di riconoscimento e composizione dei link, senza rete o storage.
- `assets/menta-ui-v7-7.js`: interfaccia progressiva, scelte, sicurezza e pulizia del campo.
- `assets/menta-v7-7.css`, `assets/menta-site-v7-7.js`, `assets/menta/`: stile e supporti contestuali.

Non sono effettuate diagnosi, valutazioni del rischio o verifiche di disponibilità. Nessuna promessa automatica di gratuità o convenzione SSN.



### Integrazione multisede 7.7.5

La gerarchia usata per i nuovi controlli è **ente/gestore → struttura/sede → servizio/modulo**. Più servizi nello stesso indirizzo non vengono accorpati automaticamente.

- Reverie: la ricerca passa da 1 a 4 unità visibili (Comunità romana già presente, CTC 1, CTC 2 e Centro Diurno).
- Nuovi Orizzonti: aggiunta Casa Gioia di Marino accanto alla Comunità di Piglio già presente.
- Il Ponte: due sedi operative correnti sono documentate, ma lo split in due record resta pendente finché non viene consolidato il dettaglio amministrativo/accreditamento per singola sede.
- Cooperate FEBO: rilevato ma non inserito nell’overlay accreditato perché il gestore lo descrive come autorizzato e in attesa di accreditamento.

Audit: `downloads/Audit_Multisede_V7_7_5.json`.

### Indicizzazione e SEO

La struttura SEO è predisposta, ma **l’indicizzazione pubblica è disattivata**. Le pagine principali hanno title, description, canonical, metadata social e sitemap già pronti; noindex è applicato sia nell’HTML sia negli header HTTP. robots.txt consente il crawl per permettere ai motori di leggere il noindex, ma non pubblicizza la sitemap.

Quando si deciderà di aprire il sito ai motori di ricerca, usare python tools/set-indexing.py --enable su un branch dedicato, verificare la preview e solo dopo portare la modifica su main. Dataset, download, pagine legacy e documentazione tecnica rimangono esclusi dall’indicizzazione.

### Verifica della versione corrente

```sh
node tools/test-menta-v7-7.cjs
# Solo per test di sviluppo, non per il deploy:
python tools/test-menta-browser-v7-7.py
```

Il browser test richiede Playwright e BeautifulSoup; `AXE_PATH` indica il file locale `axe.min.js` per i controlli automatici. Il workflow di verifica li installa solo sul runner di test. Non si aggiungono dipendenze al sito pubblicato.

Il test V7.5.1 citato nelle sezioni storiche sotto conserva le vecchie assunzioni e non è il test dell’overlay V7.6: usare i comandi V7.7 qui sopra.

Report: `downloads/Verifiche_Menta_V7_7.json`; audit e hash dei file preservati: `downloads/Audit_Menta_V7_7.json`; note: `downloads/Note_Rilascio_V7_7.txt`.

La ricerca operativa mostra **432 risultati**: 296 servizi della rete ASL, 119 strutture/servizi non ASL (115 storici + 4 integrazioni multisede) e 17 attività private. I quattro nuovi risultati sono in `data/multisede_v7_7_5.json`: i dataset storici V7.3/V7.5/V7.6 non vengono riscritti.

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

## Navigazione 7.7.3

Header e footer sono HTML statico: nessun caricamento remoto del menu. I file navigation-v7-7-3.css/js migliorano la navigazione senza leggere o salvare bisogni. Quattro percorsi primari, Altro per directory e risorse, download secondari. I file PDF precedenti restano immutati e sono etichettati come tali.

Controlli: `node tools/test-menta-v7-7.cjs` e `python tools/test-navigation-v7-7-3.py`. Gli strumenti Python richiedono BeautifulSoup e Playwright solo in sviluppo. Nessuna dipendenza serve al sito statico.

## Mappa interattiva e correzioni UX — 7.8

La mappa `/mappa.html` usa lo stesso adattatore e gli stessi 432 servizi della ricerca, inclusa l’integrazione multisede. La pagina `/giovani.html` offre quattro punti di accesso senza scegliere automaticamente TSMREE/NPIA. Ricerca mobile, titoli, etichette, menu e landmark sono stati corretti dopo l’audit UX.

### Copertura geografica
- **55** servizi localizzati a livello di indirizzo con OpenStreetMap/Nominatim: non è una verifica dell’ingresso.
- **140** servizi con posizione indicativa sulla via, graficamente distinta.
- **237** senza corrispondenza abbastanza univoca: rimangono nell’elenco e l’indirizzo pubblico può essere aperto su una mappa esterna.
- Nessun punto è inventato al centro del comune. Enti, servizi e unità allo stesso indirizzo non vengono fusi: il raggruppamento è solo visivo.

`data/presidi_geo_v7_8.json` conserva metodo, precisione, data e fonte per posizione, separate dai dati sanitari. La licenza dei dati derivati OSM è ODbL 1.0; l’attribuzione è visibile sulla mappa. La cache delle 301 richieste una tantum è conservata in `downloads/Geocoding_Cache_V7_8.json`; lo script di manutenzione la riusa e non va schedulato o integrato nel browser.

### Privacy e limiti della cartografia
Leaflet 1.9.4 è distribuito localmente con la propria licenza. Le immagini da `tile.openstreetmap.org` sono richieste soltanto dopo “Apri mappa OpenStreetMap”. Nessun tracciamento, geocodifica live, cookie, salvataggio delle ricerche o accesso alla posizione del dispositivo. Le richieste dei tasselli includono solo l’origine del sito come Referer, mai query o percorso. Il fornitore vede IP e area geografica richiesta. La mappa è opzionale; l’elenco è sempre disponibile. La disponibilità delle immagini OSM non è garantita e le policy del fornitore vanno rispettate.

Policy: https://operations.osmfoundation.org/policies/tiles/ e https://operations.osmfoundation.org/policies/nominatim/ . Libreria: https://leafletjs.com/download.html . I test automatici intercettano i tasselli, senza scaricarli o eseguire scansioni sul servizio pubblico.

**Indicizzazione ancora disattivata**: noindex HTML e HTTP invariati; le due nuove pagine sono solo predisposte nella sitemap e nello script futuro, non viene attivato Google. Nessun file storico in data/, download precedenti o versione offline è riscritto.
