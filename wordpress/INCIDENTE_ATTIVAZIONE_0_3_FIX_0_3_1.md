# Incident 0.3: «Attivazione protezione: Il plugin ha un'intestazione non valida»

**Registrazione:** 31 ottobre 2026  
**Destinazione:** mappamenta.altervista.org, WordPress gestito  
**Ambiente nel preflight dell'utente:** WordPress 7.1.4, PHP 8.0.30, MySQL 8.0.46  
**Produzione:** GitHub `main` V7.18 e Cloudflare Pages **non modificati**.

## Diagnosi

Il pacchetto `SML_MappaMenta_Installazione_Automatica_Staging_0_3.zip` conteneva già un file `sml-staging-guard/sml-staging-guard.php` con intestazione WordPress valida (`Plugin Name: SML - Protezione indicizzazione sito di prova`).

Il problema probabile è in `sml_setup_install()`: `unzip_file()` estraeva il plugin e `activate_plugin()` lo attivava subito, nella *stessa richiesta*. WordPress `get_plugins()` può avere in cache un elenco precedente all'estrazione: `validate_plugin()` restituisce `no_plugin_header` anche se il file è presente e valido.

Fonti upstream:
- https://developer.wordpress.org/reference/functions/activate_plugin/
- https://developer.wordpress.org/reference/functions/validate_plugin/
- https://developer.wordpress.org/reference/functions/wp_clean_plugins_cache/

Non abbiamo accesso autenticato ad AlterVista in questa chat, quindi non è ancora verificato che quella cache fosse effettivamente la causa sul server.

## Correzione beta 0.3.1

ZIP corretto consegnato in questa conversazione: `SML_MappaMenta_Installazione_Automatica_Staging_0_3_1_FIX.zip`. SHA256: `292b8765a905b2e51cb6df83830fcc1417526a374c993d733a09034f239b7750`.

- Aggiornata intestazione e costante versione installatore a `0.3.1-beta`.
- Prima di ogni attivazione, controlla che il file PHP principale sia leggibile e contenga l'intestazione `Plugin Name` mediante `get_file_data()`.
- Svuota la cache plugin WordPress con `wp_clean_plugins_cache(false)`, rilegge `get_plugins()`, quindi richiama `activate_plugin()`.
- Gestisce i plugin già installati **senza cancellare né sovrascrivere** directory, utenti, dati e revisioni.
- In caso di file effettivamente mancante/invalido, si ferma con una diagnosi mirata, invece di sostituire file esistenti alla cieca.
- I tre ZIP interni (guard, catalogo, tema V7.18) sono bit-a-bit identici alla 0.3 originale.
- QA locale: integrità ZIP interno/esterno OK; `php -l` PHP 8.4 OK. **Non equivale a test su PHP 8.0/WordPress AlterVista**.

## Ripresa idempotente

1. Possibile tentare direttamente dal plugin 0.3 già attivo: `Strumenti → Avvio MappaMenta → Avvia o riprendi installazione di prova`; una nuova richiesta PHP potrebbe essere sufficiente a ricaricare la cache.
2. Se persiste, da `Plugin → Aggiungi plugin → Carica plugin` caricare il pacchetto 0.3.1 corretto. Quando WordPress lo propone, **sostituire soltanto il plugin installatore MappaMenta**.
3. Aprire `Strumenti → Avvio MappaMenta` e riprendere. Non cancellare `sml-staging-guard`, `sml-catalogo` o altre cartelle manualmente.
4. Confermare `Impostazioni → Lettura → Scoraggia l'indicizzazione`, e verificare che 680 schede risultino importate prima di collaudare mappe e approvazioni.

## Gate prima della produzione

Installazione e tema non ancora collaudati su AlterVista. Prima di cutover: test sui 443 servizi clinici e 237 complementari, interfacce Menta/mappe/filtri, ruoli, approvazioni, fonti, sicurezza, backup, SEO e supporto runtime PHP/MySQL. Non cambiare `main`, redirect o indicizzazione del sito nuovo fino al superamento di tali controlli.