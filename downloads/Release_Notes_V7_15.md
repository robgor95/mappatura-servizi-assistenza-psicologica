# V7.15 — armonizzazione delle mappe

Data: 28 settembre 2026

La mappa incorporata in **Trova un servizio** usa ora la stessa gerarchia e grammatica visiva della mappa a pagina intera.

- Territorio: Lazio → provincia/città metropolitana → comune → servizio.
- Rete sanitaria: provincia/città metropolitana → ASL indicata nei dati → comune → servizio.
- Stesso core gerarchico e stessi stili della mappa principale V7.14.
- I filtri cartografici e l’elenco dei servizi sono sincronizzati.
- I confini comunali vengono caricati solo per la provincia selezionata.
- OpenStreetMap è ancora facoltativo e richiede un clic esplicito.
- Nessuna geolocalizzazione del dispositivo, analytics o geocoding live.

Dati invariati: 443 schede, 373 localizzate, 70 senza pin e 69 casi geografici azionabili. Coordinate/audit V7.11.7 invariati.

Rollback: il commit precedente è `00ba45e18a90181c9185b089fefa0bb9bc98b8e6`.
