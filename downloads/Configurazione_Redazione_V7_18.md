# Attivazione area redazione — V7.18

## Stato della release
Il sito pubblico funziona senza database editoriale. Il codice di notizie, banner, revisione schede e area riservata è incluso, ma per impostazione predefinita gli accessi e le scritture restano disabilitati. Non sono stati creati account, inviate email o attivati abbonamenti Cloudflare. Il link del questionario non è ancora stato fornito.

## Prima dell'attivazione
Usare l'account Cloudflare proprietario del progetto Pages `mappatura-servizi-assistenza-psicologica`. Non condividere password, token o codici OTP in chat o nel repository. Verificare piani, quote e requisiti di fatturazione prima di attivare servizi; questa release non autorizza acquisti automatici.

Completare con i responsabili il nome del titolare del trattamento, il recapito privacy e i tempi di conservazione di account, log, bozze e immagini. Il pannello è per contenuti del progetto e informazioni pubbliche sui servizi, non per referti, dati di pazienti o richieste personali di assistenza.

## 1. D1: database editoriale separato
Creare un database D1 dedicato, ad esempio `network-giovani-editorial`, senza importare dati clinici di pazienti. Eseguire una sola volta lo schema `migrations/0001_editorial.sql` dalla console D1 o tramite Wrangler con il proprio accesso locale. Il catalogo di base delle schede è già generato dai file pubblici e non va copiato nelle tabelle utenti.

Nel progetto Pages, Settings / Bindings, ambiente Production, aggiungere un binding D1 con nome esatto `EDITORIAL_DB`. Non collegare il database di produzione alle anteprime di sviluppo.

## 2. R2: immagini private
Creare un bucket dedicato, ad esempio `network-giovani-media`, e collegarlo a Pages con il binding `EDITORIAL_MEDIA`. NON abilitare r2.dev o un dominio pubblico del bucket. Le immagini di bozze sono servite solo tramite API autenticata; una copia è visibile pubblicamente solo quando utilizzata da un contenuto pubblicato e non scaduto. Il pannello converte JPEG/PNG/WebP in WebP ridimensionato; il server controlla formato, dimensioni e metadati.

## 3. Cloudflare Access: proteggere solo i percorsi amministrativi
Configurare una applicazione Access per il dominio di produzione con destinazioni `/admin` e `/admin/*` e `/api/admin/*`, usando la stessa applicazione/audience. Il resto del portale e `/api/public/*` devono restare consultabili senza login.

Per il dominio pages.dev partire dalla funzione Pages Settings / Enable access policy, secondo la guida ufficiale sui domini pages.dev. La regola predefinita protegge le anteprime: NON confonderla con la produzione. Prima di attivare la redazione, controllare le destinazioni nell'applicazione Access e limitarle ai percorsi amministrativi indicati. Non lasciare accidentalmente tutto il sito dietro login. Se il pannello non consente tale configurazione sul dominio fornito, fermarsi e predisporre un dominio/subdominio controllato: non indebolire i controlli JWT per aggirare il problema.

Abilitare One-time PIN via email o un identity provider approvato. Inserire soltanto le email autorizzate nella policy Access. Le autorizzazioni nel pannello e la policy Access sono due controlli distinti: aggiungere un collaboratore nel CMS NON modifica automaticamente la policy Cloudflare.

Annotare il Team domain `https://NOME-TEAM.cloudflareaccess.com` e l'Application Audience (AUD). Nessun token di servizio o bypass pubblico.

## 4. Variabili server di produzione
Impostare in Pages Settings / Variables and Secrets:

| Nome | Valore |
|---|---|
| `ACCESS_TEAM_DOMAIN` | Team domain completo HTTPS |
| `ACCESS_AUD` | AUD della applicazione Access |
| `ADMIN_ORIGIN` | `https://mappatura-servizi-assistenza-psicologica.pages.dev` oppure il dominio amministrativo effettivamente protetto, senza slash finale |
| `BOOTSTRAP_ADMIN_EMAIL` | Email del primo Admin concordata privatamente |
| `EDITORIAL_ENABLED` | Inizialmente `false`; impostare `true` solo dopo D1, R2, Access e privacy |

La mail del primo Admin deve essere inserita soltanto nell'ambiente server, non nei file pubblici. Al primo accesso con identità Access verificata, quell'account viene autorizzato una sola volta come Admin. Dopo il bootstrap rimuovere `BOOTSTRAP_ADMIN_EMAIL`. Gli altri collaboratori saranno autorizzati dal pannello e nella policy Access.

Dopo binding e variabili eseguire un nuovo deploy del commit approvato. Il Worker è già incluso come `_worker.js`: non serve cambiare hosting o affidare GitHub agli editor.

## 5. Collaudo obbligatorio con account reali
1. In finestra anonima: home, ricerca, mappa e Network leggibili; `/api/admin/me` non restituisce identità o dati senza login.
2. Primo Admin: accesso OTP, dashboard e libreria; nessun uso di password condivise.
3. Editor di prova: bozza notizia, caricamento immagine con testo alternativo, invio; non può pubblicare o aprire la gestione dati.
4. Admin: approvazione notizia; la bozza non pubblicata non deve comparire nelle API pubbliche.
5. Revisore dati: proposta di correzione con fonte per campo. Secondo Admin: approva. L'autore non può approvare la propria proposta dati. Nuove schede e campi sensibili richiedono anche verifica specialistica di un altro collaboratore.
6. Verificare che pubblicamente appaiano solo valori approvati, fonti e data del controllo parziale, mai email, autori delle revisioni, approvatori o motivazioni interne.
7. Provare scadenza e chiusura banner, revoca di un utente e ripristino da storico.

Non usare il database pubblico reale per creare servizi fittizi durante il collaudo. Predisporre risorse di test separate.

## Uso quotidiano
Editor: Contenuti / Nuovo / Salva bozza / Invia per approvazione. Admin: Apri / Anteprima / Pubblica. Le modifiche a un contenuto già pubblicato restano in bozza finché non vengono ripubblicate. L'Admin può anche preparare e pubblicare direttamente notizie e link.

Dati: Schede dei servizi / Proponi correzione oppure Conferma senza modifiche / Fonti per campo / Invia. Il controllo di un telefono non certifica tutta la scheda. Lo storico con nomi resta riservato.

Il pannello non invia inviti email automaticamente: dopo l'autorizzazione condividere l'indirizzo `/admin/`. Il codice di accesso viene inviato dal sistema Access quando il collaboratore accede.

## Disattivazione, backup e rollback
Impostare `EDITORIAL_ENABLED=false` e fare redeploy disattiva le scritture e le proiezioni editoriali: il sito torna a mostrare la base versionata. Non cancella D1/R2. Conservare backup D1 ed esportazioni e immagini secondo le scelte dei responsabili. Un rollback Git non annulla i dati salvati su D1: per questi usare lo storico del pannello o un ripristino D1 controllato. Non eliminare la cronologia per nascondere un errore.

## Documentazione primaria verificata
- Pages Advanced mode: https://developers.cloudflare.com/pages/functions/advanced-mode/
- Binding D1/R2: https://developers.cloudflare.com/pages/functions/bindings/
- Access pages.dev e anteprime: https://developers.cloudflare.com/pages/platform/known-issues/
- One-time PIN: https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/
- D1 batch e transazioni: https://developers.cloudflare.com/d1/worker-api/d1-database/
