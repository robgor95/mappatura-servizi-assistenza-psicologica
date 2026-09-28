# V7.14 — Mappa principale multilivello

28 settembre 2026. Baseline: V7.13, commit f04771c1bc9f3cd2c81f3ef1ff6f58b18a229476.

## Navigazione
La mappa principale diventa un esploratore progressivo. La vista territoriale segue Lazio → provincia/città metropolitana → comune → servizi. La vista sanitaria segue provincia → ASL indicata nei dati → comune → servizi. Il breadcrumb permette di tornare a ogni livello senza perdere gli altri filtri.

## Confini
I confini provinciali V7.13 e i nuovi confini comunali derivano dallo stesso archivio generalizzato ISTAT al 1° gennaio 2026, CC BY 4.0. I cinque file comunali sono separati per territorio e caricati soltanto quando la provincia viene aperta. Sono confini a fini statistici, non catastali.

## ASL
La vista sanitaria non costruisce nuovi confini sanitari. Usa esclusivamente il campo ASL già presente nelle schede: nella rete pubblica può descrivere la rete di appartenenza; nelle strutture non ASL può essere un riferimento territoriale. L'ASL non viene usata per dedurre gestione, accreditamento, contratto SSN, gratuità o diritto di accesso. Roma Capitale resta un unico poligono comunale: la selezione ASL filtra i servizi ma non inventa suddivisioni intra-comunali.

## Servizi
Dati clinici e coordinate V7.11.7 invariati: 443 schede, 373 localizzate, 70 senza pin e 69 casi geografici azionabili. I servizi senza coordinate restano nei conteggi e nell'elenco del territorio documentato, senza pin artificiali.

## Privacy e rete
Province, comuni, conteggi e punti provengono dai file del sito. Nessuna geolocalizzazione del dispositivo e nessuna geocodifica live. Solo il comando “Attiva sfondo stradale” contatta tile.openstreetmap.org; disattivando o nascondendo la mappa si interrompono le richieste successive.

## Ripristino
Checkpoint consigliato: main alla V7.13, commit f04771c1bc9f3cd2c81f3ef1ff6f58b18a229476. I file storici restano preservati.
