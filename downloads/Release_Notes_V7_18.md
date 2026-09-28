# V7.18 — Network Giovani, redazione e revisione dei dati

Base: V7.17, commit `712ba70a5cce0b65243c500451fa25536544c1ae`.

## Interfaccia pubblica
Logo fornito dal Network, palette blu/turchese, dicitura “Un progetto del Network Giovani”, menu Home / Trova un servizio / Mappa / Network Giovani / Altro. Menta e tutti i percorsi esistenti restano disponibili. Nuove pagine Network Giovani, singola notizia, Fondazione Don Luigi Di Liegro (informativa, nessuna partnership) e accesso redazione. Banner compatto in Home e Network, chiudibile e con scadenza; nessun questionario fittizio pubblicato.

## Redazione inclusa, attivazione separata
Codice del Worker, schema D1 e interfaccia riservata inclusi. L’area rimane chiusa senza configurazione valida. Accesso via identità Cloudflare Access verificata crittograficamente e autorizzazione applicativa. Ruoli Admin, Editor, Revisore dati, Specialista. Bozze separate dalla versione pubblicata, approvazione, media R2 privati, storico e ripristino. Nessuna email personale o password nel repository.

## Revisione schede
Fonti e date per campo, conferme senza modifiche, nuove schede con identificativo distinto, controlli specialistici sui campi sensibili. Un Admin non approva le proprie proposte dati. Le API pubbliche escludono nomi dei revisori, approvatori e note interne. Una correzione della sede rende inutilizzabili coordinate precedenti non più coerenti; nessuna posizione nuova è dedotta.

## Dati invariati
443 servizi clinici, 379 localizzati / 64 senza pin; 237 schede territoriali (135 consultori, 96 PUA, 6 PIS/emergenze). Versioni originali, geografia, fonti e date storiche preservate. Il cambio grafico non costituisce una nuova revisione sanitaria.

## Limiti di attivazione
Prima dell’uso reale: D1 + migrazione, R2 privato, protezione Access produzione, variabili d’ambiente, prima identità Admin, controllo autorizzazioni e aggiornamento dei dati privacy. Nessuna registrazione aperta; nessun invito email inviato dalla preparazione del codice. Il link del questionario deve ancora essere fornito.
