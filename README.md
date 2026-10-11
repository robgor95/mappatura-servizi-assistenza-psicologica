# Menta Campus — prototipo indipendente per studenti Tor Vergata

Stato: **base di branding e navigazione**, non ancora prodotto destinato al pubblico.

Questa branch contiene soltanto file del mini-sito indipendente. Il codice applicativo regionale V7.18 rimane su `main`, che non va alterato né utilizzato per distribuire il pilota.

## Identità
- Nome provvisorio: **Menta Campus**
- Pubblico iniziale: studenti di Roma Tor Vergata
- Non è un sito ufficiale dell'Università e non ne utilizza il marchio o il logo.
- Branding autonomo, senza elementi o contenuti editoriali provenienti dall'identità precedente del portale regionale.

## Perché questa branch
L'integrazione GitHub disponibile consente la creazione di branch e commit ma non quella di nuovi repository. Questa è una base temporanea, con una directory principale autonoma, pronta per essere trasferita in un nuovo repository `menta-campus-pilota`. La presenza di file in questa branch **non** costituisce un nuovo progetto Cloudflare e **non** equivale a un lancio riservato.

## Protezione prima del lancio
- Tutte le pagine hanno `noindex,nofollow,noarchive`.
- Il file `robots.txt` esclude la scansione e `_headers` imposta `X-Robots-Tag`; **questo non limita la visibilità pubblica**, per test riservati occorre Cloudflare Access o analoga autenticazione.
- Nessun modulo, database sanitario, analytics, tracker o invio di risposte a servizi esterni.
- Informazioni sul soggetto responsabile e privacy **da completare prima della pubblicazione**.
- Servizi e recapiti devono essere riverificati su fonti ufficiali; il prototipo mostra un collegamento di riferimento e non promette l'operatività del servizio.

## Passi successivi
1. Creare il repository indipendente (inizialmente privato) e trasferire questi file, mantenendo invariata la produzione regionale.
2. Collegare un progetto separato Cloudflare Pages.
3. Rivedere identità legale, privacy e fonti.
4. Collegare soltanto i servizi rilevanti per gli studenti.
5. Collaudare navigazione, accessibilità e link prima del lancio.

Origine iniziale dei contenuti universitari: ricognizione del portale regionale verificata il 21 settembre 2026. Nessuna nuova verifica delle modalità di accesso in questo commit.
