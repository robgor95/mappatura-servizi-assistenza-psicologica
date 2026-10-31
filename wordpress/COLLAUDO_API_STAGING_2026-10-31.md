# Collaudo MappaMenta — 31 ottobre 2026 (API editoriali)

## Stato verificato

L'utente ha comunicato dal pannello WordPress:
- \`imported-needs-testing\`
- tema \`sml-lazio\` attivato il 31 ottobre 2026 alle 05:20:42 UTC;
- plugin \`sml-catalogo\` e \`sml-staging-guard\` attivi;
- importazione conclusa 05:24:54 UTC con **680 record**, originati da V7.18 commit \`add601f82b672bc2be217f1e77dd339c6d28581f\`.

Il controllo pubblico GitHub Actions [run 41172670822](https://github.com/robgor95/mappatura-servizi-assistenza-psicologica/actions/runs/41172670822) ha verificato direttamente: homepage, ricerca, mappa, pagina Menta, asset JS, dataset JSON, REST API di WordPress, robots e sitemap. **9/11 superati; 2 endpoint legacy falliti**:
- \`GET /api/public/revisions\`: 404;
- \`GET /api/public/content\`: 404.

Il successivo [run 41172732186](https://github.com/robgor95/mappatura-servizi-assistenza-psicologica/actions/runs/41172732186) ha confermato invece:
- \`GET /wp-json/sml/v1/revisions\`: **HTTP 200, JSON valido**;
- \`GET /wp-json/sml/v1/content\`: **HTTP 200, JSON valido**.

Questo indica un problema nella compatibilità delle rotte legacy di Cloudflare su WordPress, **non** nella presenza del catalogo MySQL o nelle API REST native.

## Correzione preparata, non ancora installata

Sul ramo \`migration/altervista-wordpress\`, commit \`e9618add0c4fb5644e1f0b2d13170a37b400599a\`, l'adattatore di distribuzione \`tools/wordpress-asset-adapter.py\` modifica esclusivamente i file copiati nel **tema WordPress**:
- \`editorial-data-v7-18.js\` richiede \`/wp-json/sml/v1/revisions\`;
- \`editorial-public-v7-18.mjs\` richiede \`/wp-json/sml/v1/content\` e usa \`image_url\` pubblico restituito dal backend WP, senza chiamare il percorso \`/api/public/media/{id}\`;
- i due script ricevono la query \`?sml-wp=0.4\` nei riferimenti HTML per evitare l'uso di cache precedenti.
- Il tema passa da \`0.2.0-beta\` a \`0.4.0-beta\` nella propria intestazione, senza cambiare V7.18 dell'applicazione.

Build: [run 41172824624](https://github.com/robgor95/mappatura-servizi-assistenza-psicologica/actions/runs/41172824624), esito **success**. Nell'artifact \`sml-tema-ponte-staging-v718-api-fix\` si trova lo ZIP WordPress \`sml-lazio-tema-ponte-staging.zip\`. Il file pronto è stato anche reso disponibile in questa conversazione come \`SML_MappaMenta_Tema_API_FIX_0_4_Beta.zip\`. SHA256: \`a7a848da8ec54cd4dd06df4d8cb8ab9afc274e785e806db4f35638907d3db2df\`.

Controlli statici del nuovo archivio: ZIP integro, file PHP sintatticamente validi PHP 8.4 CLI, sostituzioni complete, 443 + 237 record inclusi come origine. Non costituiscono verifica PHP 8.0 live.

## Installazione senza cancellare MySQL

**Non reinstallare il catalogo** e non rieseguire l'importazione.

1. In WordPress \`mappamenta.altervista.org/wp-admin/\`, aprire **Aspetto → Temi → Aggiungi nuovo tema → Carica tema**.
2. Caricare solo \`SML_MappaMenta_Tema_API_FIX_0_4_Beta.zip\`, con cartella interna \`sml-lazio/\`.
3. Quando WordPress rileva che il tema esiste già, scegliere **Sostituisci il tema installato con quello caricato**. Conservare i plugin attivi e la protezione \`noindex\`.
4. Verificare 2 API \`wp-json/sml/v1/\`, ricerca e mappa. Ripetere la verifica GitHub Actions manuale o a successiva modifica; fino ad allora i due 404 restano **problema attuale dell'installazione 0.3.1**.

Rollback: se il nuovo tema ha problemi, ripristinare la versione precedente da backup ZIP; tema e dati WordPress sono elementi separati. Il plugin \`Avvio MappaMenta\` prevede anche un ritorno al tema precedente all'intera migrazione, ma non fa rollback automatico del solo tema ponte aggiornato.

## Gate rimanenti prima del cutover
- Test effettivo dei flussi di revisione specialistica e amministrativa con account di prova separati.
- Verificare che campi sensibili e collaboratori non diventino pubblici per errore.
- Collaudo browser reale (Menta, ricerca con filtri, mappe, mobile, accessibilità).
- Backup MySQL e file/media, ripristino testato, piano per aggiornamento PHP 8.0 gestito da AlterVista e privacy completata.
- SEO e redirect soltanto dopo che il sito di destinazione ha superato tutti i controlli. Non togliere \`noindex\` durante staging.
- Cloudflare Pages e GitHub \`main\` **invariati**.

## Collaudo SEO completo
[GitHub Actions run 41172910459](https://github.com/robgor95/mappatura-servizi-assistenza-psicologica/actions/runs/41172910459): **36/36 URL della sitemap** del \`main\` originale rispondono HTTP 200 su AlterVista e presentano \`noindex\`. Questo non equivale a test visivo, interazione JavaScript o a verifica dell'indicizzazione da parte di Google. Il run continua a fallire per i due endpoint legacy, attesi prima dell'installazione del tema 0.4.

Script di collaudo aggiornato sul ramo per verificare dopo la sostituzione del tema i nuovi riferimenti API negli asset JS e non pretendere che restino attive le vecchie rotte Cloudflare. Nessuna azione WordPress è stata eseguita dal collaudo pubblico.
