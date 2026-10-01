# Stato corrente del progetto

**Progetto:** Mappatura Reg. Lazio Salute Mentale  
**Repository:** `robgor95/mappatura-servizi-assistenza-psicologica`  
**Branch di produzione:** `main`  
**Versione corrente:** **V7.18**  
**Stato:** Produzione  
**Ultimo aggiornamento applicativo:** 28 settembre 2026  
**Hosting di produzione:** Cloudflare Pages

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
