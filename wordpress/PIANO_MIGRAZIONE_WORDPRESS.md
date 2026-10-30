# Migrazione AlterVista WordPress gestito — avvio 2026-10-30

**Stato:** prototipo tecnico in preparazione. Nessun deploy su AlterVista. `main` e Cloudflare Pages restano invariati.

## Sorgente di verità verificata
Repository `robgor95/mappatura-servizi-assistenza-psicologica`, branch `main`, commit `add601f82b672bc2be217f1e77dd339c6d28581f`, `VERSION.json` V7.18. Non usare ZIP V7.3 locali come release corrente.

## Decisione architetturale
Hosting: **AlterVista WordPress gestito**, non hosting FTP tradizionale, non WordPress.com. Supporta temi/plugin personalizzati ma FTP limitato a `wp-content/` e MySQL gestito. Restano da verificare account e compatibilità dei plugin.

Sviluppo su `migration/altervista-wordpress`, senza modifiche dirette a `main`. Prima di un eventuale cutover richiedere validazione SEO/privacy e test su AlterVista.

## Componenti progettati
1. **Plugin `sml-catalogo`**. Custom post types non pubblici per servizi, proposte e audit; CPT per contenuti editoriali; ruoli Redattore, Revisore dati, Revisore specialistico; importazione idempotente a blocchi del file `data/editorial-catalog-v7-18.json` (443 clinici + 237 complementari), preservando `key` e `entity`. In fase iniziale consente la revisione **di un solo campo per proposta**, con fonte HTTPS, data di controllo, incertezza e tracciabilità. Blocco dell'approvazione propria e controllo specialistico separato sui campi sensibili.
2. **API pubbliche compatibili**: `/api/public/revisions`, `/api/public/content`, `/api/public/media/{id}`, per riutilizzare gli script V7.18 dopo il collaudo. Sui contenuti WordPress continuare ad applicare controlli su stati `publish` e data di validità.
3. **Tema ponte `sml-lazio`**: serve in sola lettura le pagine HTML originali e le risorse sotto `legacy/`, sostituisce l'origine `pages.dev` nei canonical e nei markup HTML. Non espone codice PHP, Worker, configurazioni e file non pubblici. La cartella `legacy/` va assemblata esclusivamente da una checkout GitHub aggiornata del ramo di migrazione, *non* da snapshot storici.
4. **Builder Python**: assembla ZIP caricabili dalla dashboard WordPress, includendo i file pubblici V7.18 e il catalogo JSON originale, con filtri sui file ammessi e manifest.
5. **SEO e transizione**: verificare 36 URL, robots, sitemap, meta, mappe, Menta, immagini, ricerca, download, Search Console e reindirizzamenti dal vecchio `pages.dev`. Non aprire la nuova proprietà all'indicizzazione prima del collaudo.

## Vincoli reali e lavori mancanti
- Serve creare e fornire l'URL pubblico dell'istanza AlterVista WordPress gestito; l'account non è ancora disponibile in questa conversazione.
- Occorre installare e collaudare i componenti con utenti di prova reali; nessun backend WordPress è stato ancora attivato o installato.
- Da completare prima di chiamarla *migrazione totale*: gestione nuove schede e dismissioni, revisioni multiple, approvazioni a più stadi con transazioni, ricontrolli geografia, completo backup/restore MySQL+media, performance/cache, compatibilità CDN e WordPress, verifica normativa, responsabile editoriale e dati del titolare privacy.
- Le revisioni WordPress/MySQL non sono ancora fonte di verità della produzione. Solo dopo cutover concordato, definire export pubblico versionato verso GitHub e backup privato del database.
- Il precedente progetto `migration/altervista-php-mysql` costituisce un'alternativa non scelta; non mescolare i due backend in produzione.

## Riferimenti ufficiali
- https://it.altervista.org/caratteristiche-hosting-wordpress-gestito.php
- https://help.altervista.org/it/FTP
- https://tutorial.altervista.org/installa-plugin/
- https://it.wordpress.org/support/article/managing-plugins/

## Destinazione comunicata il 30 ottobre 2026

- Dominio nuovo: `https://mappamenta.altervista.org/`.
- Pannello proprietario: `https://mappamenta.altervista.org/wp-admin/`.
- Non è stato possibile confermare la risposta HTTP del dominio da questa sessione; l'indirizzo è fornito dall'utente, non un accesso amministrativo verificato.
- Prossimo gate: installare in modo controllato il plugin diagnostico di sola lettura **SML Verifica ambiente** (ZIP consegnato nel dialogo di progetto) ed esaminare il rapporto da `Strumenti → Verifica ambiente SML`.
- Nel frattempo su `Impostazioni → Lettura` spuntare «Scoraggia i motori di ricerca dall'effettuare l'indicizzazione di questo sito» per evitare duplicazioni prima del cutover. Verificare che il frontend del portale esistente rimanga indipendente.
- Prima del porting completo controllare versione PHP, limiti ZIP, REST API, permalink, scrivibilità di wp-content e prova dei plugin personalizzati. I plugin e il tema beta precedenti **non sono ancora una release di produzione**.
- Non raccogliere password, token, database dump o accessi nella conversazione.
