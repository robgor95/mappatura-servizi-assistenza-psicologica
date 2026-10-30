# MappaMenta — installazione unificata di staging (30 ottobre 2026)

**Destinazione:** https://mappamenta.altervista.org  
**Origine applicativa verificata:** GitHub `main`, V7.18, commit `add601f82b672bc2be217f1e77dd339c6d28581f`.  
**Ramo WordPress:** `migration/altervista-wordpress`.  
**Build tema finale:** `9cb54d90279d5c8089db3021bae91878088878bf`, GitHub Actions run `41108579176` riuscito.  
**Stato:** installatore **beta 0.3** predisposto localmente; **non installato** su AlterVista, non testato dentro un'istanza WP reale e non idoneo a essere dichiarato produzione.

## Perché un pacchetto unico
Non esiste in questa sessione un collegamento autenticato all'area amministrativa di AlterVista. Il collegamento `/wp-admin/` fornito dall'utente non concede permessi in questa chat e non è possibile impostare FTP, tema o plugin da remoto senza un'autorizzazione esplicita. Non richiedere password o token in chiaro.

È stato quindi creato localmente il pacchetto `SML_MappaMenta_Installazione_Automatica_Staging_0_3.zip` (**SHA256**: `c8179d3c4d039c7dec0ced0948f381bdfe1969c3462b4cdee4e210fd32d1ed08`; circa 3,84 MB). È disponibile come allegato di questo scambio, non come file committato nel repository. Contiene **un plugin installatore WordPress** e tre ZIP incorporati: tema V7.18, catalogo V7.18 con 680 schede, protezione anti-indicizzazione.

Il pacchetto è specificamente destinato a `mappamenta.altervista.org` e, una volta installato/attivato dall'admin, tenta di:
1. Impostare `blog_public=0` e applicare `noindex`.
2. Installare/attivare il plugin di protezione staging e il plugin catalogo; non sovrascrive directory già esistenti.
3. Installare/attivare il tema ponte con i dati pubblici dell'attuale `main`.
4. Importare automaticamente 443 schede cliniche e 237 complementari in blocchi di 20 tramite la bacheca (richiede scheda browser aperta).
5. Offrire ripristino non distruttivo del tema precedente da **Strumenti → Avvio MappaMenta**, mantenendo i dati e la protezione noindex.\n6. Concludere in stato `imported-needs-testing`, senza pubblicazione/indicizzazione definitiva.

## Operazione richiesta sul sito di prova
Da amministratore WordPress: **Plugin → Aggiungi plugin → Carica plugin**, scegliere il solo ZIP unificato e selezionare **Installa → Attiva**. L'attivazione reindirizza all'installazione guidata; in caso contrario accedere a **Strumenti → Avvio MappaMenta**. Non usare i vecchi plugin beta separati contemporaneamente. È necessario lasciare aperta la scheda fino al messaggio di fine importazione.

**Non caricare questo ZIP come tema:** è un plugin che installa tre componenti sotto `wp-content`. Le vecchie versioni in ZIP separati sono superate.

## Controlli tecnici effettuati localmente
- JSON schema 1, 443 cliniche, 237 complementari, 680 identificatori unici.
- Sitemap V7.18 con 36 URL.
- 397 file pubblici nel tema aggiornato, 403 entry tema compresi i sorgenti e `.htaccess`; nessun PHP in `legacy/`.
- 2732 collegamenti HTML interni verificati; unico percorso non fisico `admin/index.html` viene sostituito dal tema con la destinazione WordPress.
- Archivio ZIP senza duplicati, validità CRC, sintassi PHP dei tre componenti verificata con PHP CLI locale 8.4. 
- Non è stato eseguito un test funzionale reale sul PHP 8.0.30/WordPress 7.1.4 dell'hosting.

## Limiti e prossimi requisiti
- **PHP 8.0.30** dell'hosting segnalato nel preflight è fuori supporto ufficiale upstream. Per pubblicare definitivamente vanno verificati supporto, mitigazioni e piano di aggiornamento con AlterVista; WordPress raccomanda PHP 8.3+.
- Il plugin catalogo 0.2 è una beta di **revisione per singolo campo** e non sostituisce ancora il sistema editoriale V7.18 completo; mancano una verifica multiutente reale, backup e restore del database, supporto completo di versioni/richieste editoriali, hardening e conformità privacy.
- L'indicizzazione di prova **era consentita** nel preflight. L'installatore è progettato per disabilitarla, ma il risultato dev'essere verificato su `robots.txt`, header HTTP, sitemap e WordPress.
- Mantenere Cloudflare Pages su `main` invariato. Nessun cambio DNS o redirect finché le funzioni e le tutele non sono collaudate.
- L'installazione autonoma sul sito può essere svolta da un operatore con sessione WordPress autorizzata; non inviare credenziali nella chat.

## Build del tema (verificabile)
https://github.com/robgor95/mappatura-servizi-assistenza-psicologica/actions/runs/41108579176
