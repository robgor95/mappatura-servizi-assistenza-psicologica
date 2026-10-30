# Preflight reale MappaMenta — 30 ottobre 2026

**Destinazione:** https://mappamenta.altervista.org/ (WordPress gestito AlterVista).
**Origine:** GitHub `main` V7.18, commit `add601f82b672bc2be217f1e77dd339c6d28581f`. Cloudflare Pages resta in produzione.

## Esito comunicato dal proprietario
| Voce | Esito |
| --- | --- |
| WordPress | 7.1.4 — OK |
| PHP | 8.0.30 — utilizzabile per test, versione upstream EOL |
| Database | MySQL/MariaDB 8.0.46 — utilizzabile per test, MySQL 8.0 upstream EOL |
| HTTPS, REST API, permalink | OK |
| Upload ZIP, capacità plugin, scrittura wp-content | OK |
| Lettura catalogo JSON, GD, Imagick | OK |
| Upload / POST / timeout | 128 MB / 256 MB / 60 s |
| Indicizzazione iniziale | Consentita — da disabilitare prima di esporre pagine duplicate |

**Hosting managed:** secondo lo staff AlterVista la versione di PHP viene aggiornata e corretta dal provider, non dall'utente come nell'hosting con File Manager. Chiedere piano di migrazione e patch prima di attivare l'area amministrativa con utenti effettivi. WordPress raccomanda PHP >=8.3.

## Fase 1 — protezione staging
Sorgente del plugin `wordpress/sml-staging-guard/sml-staging-guard.php` (0.1.0), ZIP installabile fornito nella conversazione di progetto. L'attivazione imposta l'opzione `blog_public=0`, aggiunge header `X-Robots-Tag: noindex,nofollow,noarchive` e disattiva sitemap. Riaprire **Impostazioni → Lettura** e rieseguire il plugin diagnostico: l'indicizzazione deve risultare **Scoraggiata**. Ricordare che noindex non impedisce a persone esterne di aprire URL pubblici.

## Fase 2 — pacchetti e test
- **Tema**: codice `wordpress/sml-lazio/`; GitHub Actions `build-wordpress-altervista.yml` assembla gli asset correnti da GitHub. Build riuscita: https://github.com/robgor95/mappatura-servizi-assistenza-psicologica/actions/runs/41105136592 . Nell'artefatto `sml-tema-ponte-staging-v718` si trova un altro ZIP: `sml-lazio-tema-ponte-staging.zip`, installabile da Aspetto → Temi. Non caricare il wrapper esterno come tema.
- **Catalogo**: ZIP beta 0.2 consegnato in chat, da installare per test solo dopo protezione staging. Il codice beta non è ancora integralmente versionato nel repository: va consolidato prima della produzione.
- **Dati**: scaricare il JSON da https://raw.githubusercontent.com/robgor95/mappatura-servizi-assistenza-psicologica/main/data/editorial-catalog-v7-18.json . Importare 20 record per volta nel menu Catalogo SML; attesi **443 clinici + 237 complementari = 680 record**. Non usare versioni storiche caricate nel progetto ChatGPT.
- **Verifiche**: home, Menta, filtri, mappe, 36 pagine SEO, endpoint pubblici, contributori, doppia approvazione, fonte per campo e storico; provare con utenti di test distinti. Verificare la distribuzione reale dopo l'installazione, non dedurre il successo da build e sintassi.
- **Produzione**: non attivare indicizzazione o reindirizzamenti né cambiare `main` prima di privacy, responsabile, backup SQL/media testato, aggiornamento PHP/database, collaudi, esportazioni e rollback.

## Stato attuale
La build tema è confermata, ma **nessun plugin o tema della migrazione è stato installato attraverso questa chat**. Cloudflare resta invariato. L'URL WordPress amministrativo comunicato non trasferisce autorizzazione all'assistente.
