# Feedback sul collegamento counselling — 11 novembre 2026

## Segnalazione
Un tester riferisce di aver apprezzato il microsito Tor Vergata ma di aver ricevuto un errore aprendo il link del Counselling. Il servizio esatto (PTV, personale, CARIS) e il messaggio del browser non sono stati specificati. Il minisito è e rimane in fase di sviluppo e collaudo.

## Verifiche concrete
- Il sito di prova risponde HTTP 200 con catalogo universitario di quattro risorse, proveniente da un rilascio precedente: nella scheda UNI-005 il campo source punta al generico elenco /it/percorso/ricerca/sezione/sportelli anziché alla pagina specifica del counselling per il personale.
- Un controllo automatico GitHub Actions del 11 novembre 2026: https://github.com/robgor95/mappatura-servizi-assistenza-psicologica/actions/runs/43031134425 ha verificato con GET le pagine ufficiali PTV studenti, counselling per il personale, CARIS studenti, First Point e Pro-Ben: tutte HTTP 200 dal runner testato.
- Il link segnalato può aver dato errore per un problema intermittente, una navigazione non chiara o un'apertura email priva di client configurato: la causa esatta non è provata. Non dichiarare falsamente di aver riprodotto il 404.
- La pagina specifica del counselling per personale è https://web.uniroma2.it/contenuto/counselling-psicologico-per-il-personale-dellateneo, con email livigni@med.uniroma2.it.
- È disponibile anche una pagina distinta CARIS per il counselling agli studenti: https://caris.uniroma2.it/counselling-psicologico/ con email segreteria@caris.uniroma2.it. CARIS descrive incontri di ascolto psicologico per studenti, indicativamente otto colloqui, con accesso tramite richiesta email.

## Correzione proposta — plugin 0.1.3-beta
- Il collegamento personale punta direttamente alla scheda ufficiale; il vecchio indice generico non viene più utilizzato come destinazione della card.
- Aggiunta la quinta risorsa Counselling psicologico CARIS per studenti, distinta da PTV e dal servizio per dipendenti.
- Evidenziate le categorie di destinatari (studenti, comunità universitaria, personale).
- I recapiti email sono visibili come testo anche senza app di posta installata; mantenuti i link mailto cliccabili.
- Gli URL del microsito hanno versionamento JS/CSS 0.1.3 per ridurre problemi di cache. Nessuna modifica al portale regionale, alle 443 schede cliniche, alle 237 complementari o a Cloudflare.
- Confermati test unitari sul contenuto del pacchetto e browser su smartphone 390px e desktop 1366px: build https://github.com/robgor95/mappatura-servizi-assistenza-psicologica/actions/runs/43031750076, risultato SUCCESS.

## Stato
**Correzione pronta e testata in CI, non ancora installata su WordPress AlterVista**. Il minisito resta noindex e non è autorizzato al lancio. Da verificare dopo l'aggiornamento effettivo che le cinque schede universitarie siano visibili, che entrambe le pagine di counselling aprano correttamente e che il feedback possa essere chiuso. Se il tester segnala nuovamente un errore chiedere l'URL esatto o il messaggio HTTP/browser senza informazioni personali.

## Dipendenze
Privacy e responsabile editoriale, backup completo ripristinabile, validazione ufficiale dei recapiti, criteri di accesso e piano per PHP gestito AlterVista restano aperti.
