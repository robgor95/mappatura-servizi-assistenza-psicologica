# Piano tecnico — Migrazione AlterVista senza WordPress

**Stato:** specifica proposta, non implementata né pubblicata.  
**Progetto sorgente:** `robgor95/mappatura-servizi-assistenza-psicologica`, branch `main`, V7.18.  
**Base verificata:** `add601f82b672bc2be217f1e77dd339c6d28581f` (12 ottobre 2026).  
**Ramo di lavoro:** `migration/altervista-php-mysql`.  
**Produzione invariata:** Cloudflare Pages. Il cambio hosting non avviene con questo documento.

## 1. Obiettivo e limiti di ambito
Trasferire il sito pubblico **Salute mentale Lazio** su **AlterVista Hosting con File Manager**, senza WordPress; preservare Menta, ricerca, mappe, cataloghi, schede, SEO e le pagine pubbliche attuali. Realizzare un pannello riservato personalizzato per utenti, contenuti, proposte di correzione, approvazioni, audit e ripristini.

Il portale cataloga **servizi e strutture**, non utenti/pazienti. Non raccogliere anamnesi, referti, richieste di aiuto personali o altri dati di salute dei visitatori.

## 2. Evidenza sull'implementazione attuale
In `main` esistono già `admin/index.html`, `assets/admin-v7-18.mjs`, `assets/editorial-core-v7-18.mjs`, `assets/editorial-public-v7-18.mjs`, `_worker.js`, `migrations/0001_editorial.sql` e `data/editorial-catalog-v7-18.json`. Il pannello frontend supporta i ruoli `admin`, `editor`, `data_reviewer`, `specialist`, le notizie, i banner, le immagini, le proposte e lo storico. L'area amministrativa **non è attivata**: il backend presente è basato su Cloudflare Pages Functions/Workers, D1, R2 e Access. La migrazione richiede di reimplementare autenticazione, API, archiviazione e query sul nuovo hosting; non basta caricare `_worker.js` su AlterVista.

Il catalogo editoriale è una base di 443 voci cliniche e 237 voci complementari; preservare anche gli altri dataset e gli identificatori stabili. Non interpretare l'elenco `support` come parte delle 443 schede cliniche.

## 3. Architettura target

### Sito pubblico
- HTML/CSS/JS già esistenti, adattati solo dove necessario.
- Menta, mappe multilivello, ricerca, filtri e dati geografici restano nel client.
- Le pagine pubbliche leggono **snapshot JSON pubblicati**, prodotti solo al termine dell'approvazione. Non interrogano MySQL per ogni visita.
- Compatibilità, quando utile, con gli endpoint esistenti `/api/public/content`, `/api/public/media/{id}` e un nuovo `/api/public/services`, implementati in PHP oppure via rewrite, eventualmente serviti da file JSON.
- Garantire integrità e coerenza fra schede e mappe: dopo approvazione un solo processo serializza gli snapshot, valida record, produce file temporanei, e pubblica mediante rinomina atomica. In caso di errore i precedenti restano attivi.

### Area riservata
- Riutilizzare l'interfaccia `admin/index.html` e `assets/admin-v7-18.mjs` ove possibile; sostituire il link logout Cloudflare.
- PHP 8.x (preferibilmente 8.4 se disponibile e testato), PDO/MySQL con query parametrizzate e transazioni.
- MySQL ospita solo utenti editor, bozze, proposte, approvazioni, metadati, versioni e copia strutturata dei servizi.
- Media in area non pubblica, con accesso autenticato alle bozze; pubblicare solo media approvati mediante URL limitati a file sicuri.
- PHP/MySQL come solo backend: **nessun WordPress, D1, R2 o Cloudflare Access** sul nuovo hosting.

### Versionamento
- Prima del cutover `main` GitHub resta fonte primaria di versione, codice e dati.
- Dopo il cutover: `main` resta fonte di verità per **codice e release**; MySQL è la fonte operativa delle **revisioni approvate**. Pianificare esportazioni versionate e verificabili di soli dati pubblici verso GitHub e backup privati separati per gli account/storico.
- Aggiornare esplicitamente la policy sulla fonte di verità al momento del cutover, non prima: evitare due database master che possano divergere.

## 4. Schema MySQL proposto
La migrazione D1/SQLite `migrations/0001_editorial.sql` **non è direttamente eseguibile** su MySQL: convertire tipi, vincoli, indici, chiavi e trigger; preservare immutabilità dello storico e transazioni.

Tabelle/famiglie da creare:
1. `cms_users`, `cms_user_scopes`, `cms_auth_factors`, `cms_auth_recovery`, `cms_sessions` (se la sessione non è gestita da PHP).
2. `services` con identificatore storico stabile `origin_key`, tipo `clinical/support`, ASL, provincia, comune, categoria, denominazione, indirizzo, contatti, accesso, attributi SSN, stato e date.
3. `service_locations` con coordinate, affidabilità, fonte e riferimento alla sede. Più servizi possono condividere un edificio; servizi distinti **non devono essere fusi**.
4. `service_field_sources` con fonte, campo, data di verifica, incertezza, autore/revisore **solo in ambito riservato**.
5. `cms_proposals`, `cms_proposal_approvals`, `cms_data_history` con snapshot precedenti/successivi.
6. `cms_content`, `cms_content_history`, `cms_media` per notizie, link, banner e immagini.
7. `cms_audit`, `cms_published_exports`, `cms_settings` per log append-only e manifest delle pubblicazioni.

Per ridurre complessità nella prima fase, si possono importare gli originari record in JSON canonicalizzato, mantenendo indici separati per provincia, comune, ASL, tipologia e identificatore. Non sacrificare però l'integrità delle fonti per campo.

## 5. Modello permessi e workflow
**Ruoli**: Admin, Editor, Revisore dati, Revisore specialistico. Possibili scope ulteriori per provincia, ASL e tipo di servizio. Controllare **sempre lato server** sia ruolo sia scope; l'interfaccia può nascondere azioni ma non autorizzarle.

### Contenuti
`bozza -> inviata -> approvata/pubblicata`; respingimento o richiesta integrazioni riporta alla redazione. Editor non può pubblicare. Admin può pubblicare contenuti editoriali, con versione precedente sempre ripristinabile. Banner con data inizio/fine e link validato.

### Schede dei servizi
`bozza -> inviata -> verifica specialistica se necessaria -> approvazione admin -> pubblicazione snapshot`.
- Chi propone non approva **la propria proposta**.
- Campi sensibili (tipologia clinica, accreditamento, rapporto SSN, autorizzazione, posti, destinatari) e nuove schede richiedono il controllo di una persona con ruolo specialistico **distinta dal proponente** e l'approvazione di un Admin distinto dal proponente; prevedere persone indipendenti anche per controllo specialistico e approvazione finale quando necessario.
- Ogni modifica porta campo precedente/nuovo, URL fonte, data controllo, incertezza, nota riservata.
- La scheda pubblica mostra esclusivamente dato approvato, fonti pubblicabili e dicitura «Dati verificati/aggiornati il ... — controllo parziale», senza email dei collaboratori né nomi di autori/approvatori.
- Ripristino di una versione precedente come **nuova revisione tracciata**, senza cancellare la storia.

## 6. API PHP minime di compatibilità
- `GET /api/admin/me` — identità e permessi.
- `GET/POST/PUT /api/admin/content`, `POST /api/admin/content/{id}/submit|publish|unpublish|restore`.
- `GET/POST /api/admin/media`, `GET /api/admin/media/{id}`.
- `GET /api/admin/catalog`, `GET/POST/PUT /api/admin/proposals`, `POST /api/admin/proposals/{id}/submit|review|approve|reject`.
- `GET/POST /api/admin/users`, `GET /api/admin/audit`.
- `GET /api/public/content`, `GET /api/public/media/{id}`, `GET /api/public/services`.
Questa è una mappa funzionale, non una specifica definitiva dei singoli path: mantenere le chiamate effettive del frontend dopo aver completato il censimento di `assets/admin-v7-18.mjs` e `_worker.js`.

## 7. Sicurezza/privacy (bloccanti per la pubblicazione)
- Account creati esclusivamente dall'Admin, senza registrazione pubblica. Password con `password_hash` (Argon2id se supportato, altrimenti bcrypt adeguato), TOTP per amministratori e revisori, codici di recupero protetti.
- Sessioni con cookie `Secure`, `HttpOnly`, `SameSite`, rotazione ID, scadenza breve; token CSRF per scritture, rate limiting su login e API, controlli anti-IDOR.
- Prepared statements PDO; validazione server-side di tutte le modifiche; escaping output; URL HTTPS ammesse e immagini ricodificate e controllate.
- Storage privato fuori dalla document root, se supportato; altrimenti directory negata da Apache `.htaccess` e verifica reale HTTP. Vietare esecuzione di PHP negli upload. Impostare CSP e `noindex` sull'area riservata (senza confondere noindex con autenticazione).
- Backups frequenti, versionati, cifrati **fuori** dal webroot; includere MySQL, media e configurazione, non solo codice GitHub. Prova di restore prima del cutover.
- Definire titolare del trattamento, recapito privacy, incaricati, tempi di conservazione e policy log. Mai importare dati sanitari relativi a pazienti.
- Prima di pubblicare rispettare anche il regolamento AlterVista: sito pubblico accessibile; non usare account come deposito/proxy; obblighi di evidenza per contenuti generati/rielaborati da IA.

## 8. Vincoli AlterVista da collaudare subito
- Hosting esatto **con File Manager**, non WordPress gestito. Limite indicato dal provider: 3 GB SSD, 30 GB/mese, risorse espandibili a pagamento.
- Versione PHP, PDO MySQL, GD, `password_hash`, TOTP compatibile, `.htaccess` rewrite, HTTPS, Cron e permessi filesystem.
- Banco prova delle query/ora del database gratuito: **non assumere query illimitate**. Test del carico realistico usando JSON statici per le letture pubbliche.
- Connessioni PHP verso servizi esterni hanno whitelist e limiti di porta (80/443); per GitHub API, mail e servizi terzi verificare prima la connettività.
- SMTP esterno non va assunto funzionante; in prima release notifiche nella dashboard. Email opzionali soltanto dopo collaudo di un servizio HTTP autorizzato.
- Pubblicazione iniziale via FTP su TLS. Eventuale GitHub Actions per deploy FTPS **solo dopo test**, con credenziali in GitHub Secrets; verificare il filtro geografico FTP (predefinito Italia).
- Verificare possibilità e sicurezza dei backup esterni automatizzati: mai considerare il backup del provider l'unica copia.

## 9. Fasi ed esiti accettabili
**Fase A — fattibilità e backup:** copia dati/versioni; hosting AlterVista reale; script diagnostico PHP/MySQL/HTTPS/FTP; test query e scritture, senza PII reali. Se falliscono requisiti di sicurezza o quota, fermare l'adozione del nuovo hosting.

**Fase B — portale pubblico:** distribuzione su URL temporaneo, import 443 record clinici e 237 complementari, test conteggi e mappe, Menta, filtri, link, SEO e guide. Nessun record perso/fuso; coordinate con incertezze preservate.

**Fase C — amministrazione:** API PHP e MySQL; login MFA; ruoli/scopes; editor; proposte; approvazioni indipendenti; audit; media; generazione snapshot; backup e test di ripristino. Collaudo contro accessi anonimi, autore autoapprovante e doppio click.

**Fase D — passaggio pubblico:** collaudo mobile/desktop, scansione accessibilità/SEO, informative definitive, Google Search Console su nuova proprietà, sitemap e redirect 301 degli URL vecchi. Il dominio `*.pages.dev` non si trasferisce su AlterVista: per preservare QR e link esistenti occorre mantenerlo come redirect dalla vecchia origine oppure scegliere una strategia di migrazione URL con un dominio proprio.

**Cutover solo dopo esito positivo.** Cloudflare resta online fino al passaggio; `main` e i dati originali non vengono cancellati.

## 10. Criteri di accettazione
- Tutti i servizi di base e cataloghi complementari presenti e accessibili.
- Menta, mappe e filtri funzionano senza cambio semantico dei dati.
- Login anonimo negato, 2FA e autorizzazioni applicate su ogni API.
- Nessun proponente può approvare la propria proposta.
- Modifica approvata appare nel sito pubblico con fonte e controllo parziale; proposta respinta non appare.
- Storico non modificabile, rollback dei dati provato, backup esterno recuperabile.
- Performance e quote hosting rispettate nei test; sitemap/redirect/canonical con URL corretti.
- Ambiente Cloudflare conservato finché il nuovo non soddisfa tutti i criteri.

## Fonti operative
- AlterVista piani: https://it.altervista.org/crea-sito-gratis.php
- Hosting FTP: https://help.altervista.org/it/FTP
- Database: https://help.altervista.org/it/Classi_di_potenza_database_Mysql
- Configurazione Apache: https://help.altervista.org/it/Configurazione_personalizzata_%28.htaccess%29
- Connessioni esterne: https://help.altervista.org/it/Supporto_Server_to_Server
- Termini: https://it.altervista.org/regolamento.php
