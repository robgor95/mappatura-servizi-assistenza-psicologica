# Menta Campus - Tor Vergata: plugin WordPress indipendente

Decisione: opzione A. Un microsito su MappaMenta WordPress gestito AlterVista, senza WordPress Multisite, secondo hosting o sostituzione del tema regionale.

## Stato
Versione 0.1.0-beta. Non installato nel WordPress AlterVista da questa procedura. Il sito Cloudflare e GitHub main sono invariati. Il pilot eredita la base V7.18 con 443 record clinici e 237 complementari.

### Percorso previsto
https://mappamenta.altervista.org/tor-vergata/ dopo l'installazione del plugin.

### Come si differenzia dal tema ponte beta 0.5
Il plugin serve solo i percorsi /tor-vergata/ e gli asset collegati. Non sostituisce il tema sml-lazio 0.4, non sovrascrive i file del portale regionale, non reimporta il catalogo MySQL, non crea nuovi utenti, non modifica altri URL. Disattivarlo elimina il microsito senza cancellare schede regionali.

### Dati e sincronizzazione
La selezione per distanza parte dalle stesse fonti verificate del catalogo GitHub main V7.18: 8 servizi clinici entro 5 km, 19 entro 8 km e 52 entro 12 km in linea d'aria dal Rettorato. Le quattro risorse universitarie sono distinte dalle schede cliniche. Le modifiche approvate alle schede già presenti vengono lette dalla REST API WordPress /wp-json/sml/v1/revisions. Nuove sedi, nuove schede o variazioni geografiche richiedono il rilascio di un nuovo dataset pilota e non vengono create automaticamente dal plugin.

### Installazione
Aprire WordPress AlterVista -> Plugin -> Aggiungi nuovo -> Carica plugin. Caricare SOLO MentaCampus_TorVergata_Plugin_WordPress_0_1_Beta.zip. Attivare Menta Campus - Tor Vergata (microsito). Non toccare il tema attuale, il plugin Catalogo SML e la protezione SEO. Aprire /tor-vergata/ e verificare la pagina.

### Sicurezza e rollback
Le rotte appartengono a una lista chiusa. Il plugin risponde con noindex, nofollow, noarchive. I file interni sono negati tramite .htaccess per evitare accesso diretto non protetto da noindex. Nessun modulo dati sanitari, nessuna telemetria delle ricerche. Sfondo OpenStreetMap opzionale su click. Rollback: disattivare il plugin senza toccare il database.

### Prerequisiti e limiti del test
Il plugin è stato preparato per PHP 8.0, il runtime nel preflight AlterVista, ma la prova effettiva sul server richiede installazione e verifica. Browser QA Chromium a 390 e 1366 pixel sulla copia locale del microsito. Il sito non è pronto per il lancio agli studenti finché mancano verifica di fonti e accesso, backup, privacy e supervisione editoriale. Il microsito non è ufficialmente affiliato all'Università.

### Build
python3 tools/package-tor-vergata-plugin.py . wordpress-plugin-dist
Workflow GitHub Actions: .github/workflows/build-tor-vergata-plugin.yml sul branch pilot/tor-vergata-wordpress.