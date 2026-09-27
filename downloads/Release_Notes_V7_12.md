# V7.12 — Home essenziale e navigazione Menta

Data: 27 settembre 2026. Baseline: V7.11.7.

## Cosa cambia
La homepage contiene due azioni principali (ricerca servizi e orientamento con Menta) e quattro accessi rapidi (mappa, ascolto, studenti, famiglie/territorio). Il motore locale di Menta e tutti i percorsi precedentemente presenti in homepage restano in `orientati.html`.

`sezioni.html` espone tutte le sezioni correnti, raggruppate per bisogno, con filtro locale per parole e argomenti. Menu, percorsi di ritorno, collegamenti alle aree vicine, schede, moduli e guide condividono lo stesso sistema grafico: verdi Menta, crema e accenti pastello. I filtri dei servizi esplicitano il significato delle sigle senza cambiare i valori di ricerca.

## Dati preservati
Nessuna modifica a dataset, localizzazioni, stati amministrativi, contatti, numeri utili, motore di Menta, immagine WebP, esportazioni storiche o portale offline. Il conteggio rimane quello della V7.11.7: 443 schede nella ricerca, 373 localizzate e 70 senza pin. Questi numeri non rappresentano sedi fisiche uniche.

## Accessibilità e privacy
Navigazione tramite tastiera, chiusura menu con Escape, focus visibile, controlli touch, stati vuoti e fallback senza JavaScript. Animazioni brevi e rispetto della preferenza di movimento ridotto. La mappa conserva il caricamento volontario dei tasselli. Nessun account, tracciamento o geolocalizzazione del dispositivo aggiunti. Indicizzazione sempre disabilitata.

I test automatici e le schermate non costituiscono una certificazione completa di accessibilità o una prova di usabilità con persone reali. Verifica clinica indipendente non effettuata.

## Ripristino
Checkpoint `checkpoint-v7-11-7-before-ux-v7-12`, commit `9a15c39c6f1c5008cde6fbe44dd4f419f524ba97`. La release si sviluppa su un ramo separato e viene pubblicata solo dopo le verifiche.

## Schede degli elenchi
Le informazioni essenziali sono mostrate per prime; tutti gli altri campi e le fonti restano disponibili in una sezione espandibile. Date, annualità e avvertenze operative non vengono nascoste dalla semplificazione. Comunità e strutture private applicano anche gli aggiornamenti già disponibili fino alla V7.11.7, senza modificare i dataset.
