# Stato corrente del progetto

**Progetto:** Mappatura Reg. Lazio Salute Mentale  
**Repository:** `robgor95/mappatura-servizi-assistenza-psicologica`  
**Branch di produzione:** `main`  
**Versione corrente:** **V7.18**  
**Stato:** Produzione  
**Ultimo aggiornamento applicativo:** 28 settembre 2026  
**Hosting di produzione:** Cloudflare Pages

## SEO territoriale e di servizio — 10 ottobre 2026

Pubblicate 12 pagine informative statiche: indice `esplora-servizi.html`, cinque guide provinciali `territori/` e sei guide `tipi-servizi/`. Le pagine delle province riportano quattro schede reali dal catalogo editoriale V7.18 e collegamenti alla ricerca filtrata, non duplicano la base dati. I consultori restano nel catalogo complementare, non tra le 443 schede cliniche. Sitemap e `tools/set-indexing.py` includono ora 36 URL pubblici.

Dati strutturati: WebSite e Organization identificata come Network Giovani nella home, CollectionPage nella ricerca, AboutPage in metodo, WebPage/CollectionPage e BreadcrumbList sulle nuove guide. Nessuna rivendicazione di appartenenza alla Regione Lazio, revisione clinica, attuale accreditamento o disponibilità; le date editoriali sono separate dalla verifica delle singole schede. Nessuna modifica a dataset, codice della ricerca, mappe, API o versione applicativa (V7.18).

Restano verifiche esterne: completamento del deploy Cloudflare, indicizzazione reale su Google/Bing, eventuale Search Console e dati anagrafici del titolare privacy non forniti.

### Invio delle nuove pagine ai motori — IndexNow (10 ottobre 2026)
Configurato su GitHub `main` il protocollo IndexNow con file chiave verificabile nella radice del sito e workflow `.github/workflows/seo-indexnow.yml`. Dopo la pubblicazione Cloudflare, lo script `tools/seo-indexnow-submit.mjs` verifica sitemap, URL, meta robots e corrispondenza esatta del codice servito, poi invia a IndexNow soltanto pagine pubbliche nuove/modificate. Alla prima attivazione vengono segnalate le 12 guide e quattro pagine correlate. L'esito è registrato nel job GitHub Actions: la configurazione non dimostra che il motore abbia ricevuto le URL. Google scopre la sitemap tramite robots.txt; per il rapporto sullo stato di Google è comunque richiesta una proprietà verificata in Search Console. Non vengono inviati dati di visitatori o ricerche.

## Cloudflare Web Analytics — abilitato dal proprietario il 9 ottobre 2026

Il proprietario del progetto ha confermato l'attivazione di **Enable Web Analytics** nel pannello Cloudflare Pages. Il beacon viene inserito automaticamente da Cloudflare al successivo deployment: non è incluso manualmente nei file HTML, per evitare duplicazioni. La Content Security Policy autorizza precisamente `https://static.cloudflareinsights.com/beacon.min.js` e l'endpoint `connect-src 'self'`.

L'informativa pubblica in `privacy.html` descrive visite e statistiche aggregate, percorsi consultati, tecnologia Cloudflare e limiti sulla riservatezza; non sono introdotti eventi personalizzati, tracking delle ricerche o Google Analytics. La verifica automatizzata di produzione deve constatare la presenza di **un solo beacon** nei documenti pubblici e l'assenza di regressioni nelle funzionalità.

**Adempimento ancora aperto:** il titolare del trattamento e un recapito privacy non sono stati comunicati; la valutazione giuridica e il completamento dell'informativa spettano al responsabile del progetto. Nessun identificativo del titolare è stato inventato.

## Aggiornamento SEO — 9 ottobre 2026

Al 9 ottobre il branch `main` era configurato per l'indicizzazione selettiva di **24 pagine pubbliche**; dal 10 ottobre sono **36**: metadata robots, header HTTP, sitemap e robots.txt allineati. Le pagine tecniche, i dataset, i download, l'area riservata, le pagine legacy e gli URL di anteprima rimangono esclusi; il database dei servizi non è stato modificato. La conferma del deploy effettivo su Cloudflare e l'invio della sitemap a Google Search Console sono verifiche operative distinte.

La verifica Cloudflare del 09/10/2026 ha mostrato che alcuni header `X-Robots-Tag` per singolo percorso non erano presenti nelle risposte. Per questo le pagine escluse conservano `noindex` nell'HTML e le cartelle tecniche sono anche escluse dalla scansione in `robots.txt`. Un nuovo collaudo della produzione controlla entrambe le protezioni.

## Fonte di verità

Per il codice, i dati, le funzionalità e lo stato corrente del progetto, la fonte primaria e autorevole è sempre il branch `main` di questo repository.

Ordine di priorità:

1. GitHub `main`
2. File di stato e documentazione presenti su `main`
3. Sito di produzione pubblicato da Cloudflare Pages
4. Conversazioni e note di progetto come cronologia decisionale
5. ZIP, HTML e altri pacchetti locali come snapshot storici

I file locali o caricati in ChatGPT non devono essere considerati automaticamente la versione corrente, anche quando il nome contiene un numero di versione.

## Regola operativa

Prima di:

- dichiarare la versione corrente;
- descrivere una funzionalità esistente;
- modificare o eliminare una funzionalità;
- aggiornare dati o interfaccia;
- preparare un nuovo pacchetto di rilascio;

verificare sempre lo stato effettivo di `main`.

## Versionamento

Il file `VERSION.json` contiene la versione corrente in formato leggibile automaticamente. Ogni futura modifica che incrementa la versione del progetto deve aggiornare nello stesso rilascio:

- `VERSION.json`;
- questo file `PROJECT_STATUS.md`;
- `CHANGELOG.md`.

## Nota sugli snapshot storici

Pacchetti come V7.3, V7.4 e altre versioni precedenti restano utili per confronto, audit o rollback, ma non prevalgono mai sullo stato corrente di `main`.
