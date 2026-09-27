# V7.12.1 — Orientarsi oppure cercare

27 settembre 2026. Baseline: V7.12, commit d57a6df5a3683a6ca4a77dc6ed47b51c15a29fcb.

## Homepage
Due riquadri brevi distinguono prima del clic l’orientamento dalla ricerca:
- Non sai da dove iniziare? → Aiutami a orientarmi.
- Vuoi cercare un servizio? → Cerca servizi e strutture.
Ogni percorso ha una descrizione e un simbolo diverso. Restano i quattro accessi rapidi: mappa, ascolto, studenti e territorio. Nessun modulo o nuovo elenco denso in homepage.

## Menta
La pagina si apre con “Da dove posso iniziare?” e tre argomenti espandibili: parlare con qualcuno, supporto per studenti, capire quali servizi esistono. Ogni argomento spiega il percorso prima di proporre una sezione. La scrittura per parole chiave è facoltativa e separata; non è una chat, una diagnosi o una valutazione clinica. Le scelte native funzionano anche senza JavaScript. Tutti i percorsi precedenti rimangono disponibili.

## Ricerca diretta
La pagina “Cerca servizi e strutture nel Lazio” mantiene ricerca, filtri, risultati e schede. Un collegamento discreto permette di passare all’orientamento. Etichette coerenti anche nell’ingresso legacy archivio.html e nei menu comuni.

## Compatibilità
I vecchi frammenti della homepage sono gestiti sia al caricamento sia quando cambiano sulla pagina già aperta. Il collaudo riconosce la destinazione corretta con o senza estensione .html, senza confondere la normalizzazione URL dell’hosting con un malfunzionamento. Nessuna query o informazione inserita viene inoltrata nel reindirizzamento.

## Dati e limiti
Dati V7.11.7 invariati: 443 schede, 373 localizzate, 70 senza pin, 69 casi geografici nella coda di lavoro. Non sono sedi fisiche uniche. Nessuna variazione di classificazioni, contatti, numeri, coordinate o analisi per parole chiave di Menta. Nessuna nuova raccolta dati, localizzazione del dispositivo o caricamento automatico della mappa.
I test automatici non sostituiscono prove con utenti reali o una certificazione completa di accessibilità. Gli esiti di produzione vanno letti nel workflow del commit pubblicato.

## Ripristino
Checkpoint: checkpoint-v7-12-before-pathways-v7-12-1. La V7.12 e tutti i file storici restano conservati.
