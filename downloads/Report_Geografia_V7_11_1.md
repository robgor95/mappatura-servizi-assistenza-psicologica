# V7.11.1 — secondo ciclo geografico e chiarimento dei conflitti

Baseline: `791f21cf12724ff3441492d39b6d77b4bcb36589` (V7.11). Consultazione: 2026-09-26.

## Risultati e precisione

443 servizi clinici invariati; **344 localizzati e 99 senza pin**, prima 330/113.
**14 servizi** ricevono una nuova localizzazione indicativa di qualità C: **8 edifici/presidi e 6 brevi vie**, corrispondenti a **10 coordinate distinte**. Non sono 14 nuove strutture. Nessun nuovo civico certificato e **zero ingressi fisici verificati**.
Conservati integralmente i 330 punti precedenti. Le vie sono tratti nominativi selezionati manualmente nel comune corretto, tutti inferiori a 600 m. La loro posizione non identifica un civico.

## Decisioni documentali

**23 schede** con note o campi riesaminati in modo mirato; 31 campi/note confrontati e 31 aggiornati. La maggioranza sono precisazioni geografiche: non rappresentano 23 verifiche integrali di contatti, orari o operatività.

- CSM Boccea: reso esplicito il contrasto sull'orario del sabato fra pagina del presidio (12/08/2026) e rubrica DSM (19/06/2026).
- CSM Innocenzo IV: civici 16/B e 16/d e orari discordanti conservati come conflitto, non risolti scegliendo arbitrariamente una fonte.
- DNA Frosinone: la medesima pagina (07/08/2026) indica Fabi/Palazzina L e, nei contatti, Viale Mazzini/ex ospedale. Nessun trasferimento dedotto; resta senza pin.
- Maieusis: distinti residenza Capena, centro diurno Fiano e sede in calce. Nessuna attribuzione automatica della sede legale.
- Samadi: orari generici dei contatti non usati per sovrascrivere quelli specifici dell'accettazione o per definire l'assistenza residenziale.
- Villa Licia: scartato il collegamento del gestore che porta a Roccasecca invece di Itri. Il punto precedente a Itri è conservato, non nuovamente certificato.
- Monteverde: ignorato il collegamento non coerente verso Catacombe di Generosa; localizzata solo la breve via documentata nel testo.

## Punti condivisi e fonti ereditate

Exodus Cassino e Borgo San Tommaso mantengono distinti i rispettivi moduli. L'oggetto OSM nominativo Exodus sostiene solo il presidio indicativo, non il civico 23. Per Poggio Mirteto la relazione CSM/SerD con il poliambulatorio deriva dall'audit precedente: le nuove richieste al sito ASL non sono riuscite e non vengono presentate come una riconferma corrente.
I due servizi Viterbo di Via Romiti hanno civici diversi (86 e 54): il pin stradale condiviso non implica lo stesso edificio. I raggruppamenti della mappa ora esplicitano questo limite.

## Lavoro residuo e integrità

Restano **99 servizi senza pin**. La coda originaria di 113 è tracciata, ma non si dichiara un nuovo controllo manuale completo di tutte le sedi né di tutti i precedenti punti C.
Menta, studenti, università, consultori/PUA/PIS, indicizzazione e classificazioni sanitarie restano invariati. Nessuna telefonata, disponibilità, ingresso fisico o revisione clinica verificati.
Tutti i vecchi dati, download e asset sono conservati byte per byte. Checkpoint: `checkpoint-v7-11-before-v7111-2026-09-26`.
Le verifiche del candidato e della produzione sono distinte: esiti nel workflow del commit effettivo, non ereditati da release precedenti.

Cartografia derivata OpenStreetMap: © OpenStreetMap contributors, ODbL-1.0. Evidenze puntuali in `Fonti_V7_11_1.json`.
