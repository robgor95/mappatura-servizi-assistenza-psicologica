# Pre-lancio Menta Campus Tor Vergata — 2 novembre 2026

Stato: sito pilota per test, non ancora autorizzato alla pubblicazione indicizzabile.
Repository principale verificato: main V7.18, commit add601f82b672bc2be217f1e77dd339c6d28581f.
Branch pilota: pilot/tor-vergata-wordpress. Cloudflare e main non modificati.

## Già verificato
- [x] Microsito su stesso WordPress, plugin indipendente.
- [x] 4 risorse universitarie distinte da catalogo clinico.
- [x] 8 servizi geolocalizzati entro 5 km, 19 entro 8 km, 52 entro 12 km dal Rettorato, in linea d'aria.
- [x] Test tecnici browser mobile e desktop per ricerca e mappa.
- [x] Correzione OSM 403 confermata funzionante dall'utente.
- [x] Sportello PTV e riferimenti First Point e Pro-Ben rintracciati sui siti ufficiali.

## Prima del test con un piccolo gruppo
- [ ] Verificare in WordPress Strumenti > Backup la presenza di uno snapshot di file e database. Prevedere anche una copia esterna ripristinabile; il backup AlterVista non è necessariamente scaricabile.
- [ ] Verificare le informazioni operative delle 4 risorse universitarie: destinatari, appuntamenti, attività, contatti.
- [ ] Verificare le strutture sanitarie più rilevanti e gli eventuali vincoli di competenza territoriale: la distanza non equivale al diritto di accesso.
- [ ] Identificare titolare del trattamento, recapito privacy, responsabilità editoriale e trattamento degli eventuali log.
- [ ] Verificare la versione PHP gestita da AlterVista, la sicurezza degli accessi editoriali e il piano di manutenzione.

## Test limitato
- [ ] Condividere il collegamento con 5-10 studenti di facoltà diverse per 7-14 giorni, lasciando noindex.
- [ ] Raccogliere soltanto feedback di navigazione e contenuti; non richiedere dati sanitari personali.
- [ ] Testare accessibilità, ricerca e link su smartphone e desktop, annotando correzioni richieste.

## Lancio pubblico — NON ancora autorizzato
- [ ] Preparare indicizzazione selettiva: il blocco è applicato nel meta robots HTML, negli header del plugin e nel plugin globale sml-staging-guard, mentre robots.txt blocca l'intero dominio e WordPress ha blog_public disabilitato.
- [ ] Aggiornare insieme i livelli SEO interessati; non rimuovere soltanto il noindex di Tor Vergata.
- [ ] Verificare privacy e approvazione editoriale, Search Console, sitemap dedicata e canonical.
- [ ] Soltanto dopo il collaudo pubblico: QR code, volantini e distribuzione estesa.

## Fonti consultate
- https://web.uniroma2.it/contenuto/sportello-ptv-per-studenti-e-studentesse
- https://orientamento.uniroma2.it/conta-su-di-noi-servizi-di-supporto-agli-studenti/
- https://web.uniroma2.it/it/contenuto/ampliamento-dei-servizi-di-ascolto-attivo-lo-sportello-di-mediazione-culturale
- https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/8981258
- https://tutorial.altervista.org/perche-e-importante-avere-il-servizio-backup-di-altervista-attivo/
