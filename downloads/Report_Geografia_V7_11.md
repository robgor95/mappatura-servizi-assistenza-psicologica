# V7.11 — primo ciclo geografia e informazioni operative

Baseline: `85808c6fad9dec32098558e466a3997a18b95d22` (V7.10.3). Consultazione: 2026-09-26.

## Risultati

443 servizi clinici invariati. **330 localizzati, 113 senza pin**, rispetto a 315/128.
15 nuovi punti: 13 edifici/presidi indicativi, un civico corroborato e una breve via. **Zero ingressi fisici verificati**.
I 315 punti precedenti sono conservati; questa fase non riesamina integralmente i 288 precedenti record C.

30 schede riesaminate per campi selezionati: 21 con almeno una modifica e 9 con riscontro senza variazione dei valori. 67 campi confrontati, 42 valori o note aggiornati. Le date originarie, il regime SSN, l’accreditamento e i posti non sono stati riscritti.

## Copertura e limiti

Ricognizione degli URL per tutte le 128 schede inizialmente senza pin: 93 URL, 68 risposte HTTP 200. È un controllo tecnico/documentale preliminare, **non una verifica manuale completa di 128 sedi**. I 24 casi con coordinate candidate non sono stati promossi automaticamente.
Le nuove posizioni derivano da destinazioni pubblicate nelle pagine dei servizi oppure da oggetti OSM nominativi/indirizzi coerenti nell’estratto regionale del 25/09/2026. Incertezze e precisione sono registrate per punto.
Un riferimento a edificio/complesso non certifica stanza, accesso o operatività. La data di consultazione non rende corrente un documento datato e non certifica orari effettivi, posti disponibili o risposta telefonica.

## Casi mantenuti aperti

Scartati collegamenti cartografici del gestore diretti a una tabaccheria a Castel Madama e a una falesia a Rocca Canterano. Le relative strutture rimangono senza pin, non sono dichiarate chiuse.
Non estesa la sede centrale di Mondo Nuovo a tutte le comunità. Conservata l’incertezza del record San Carlo/Villa Santa Francesca Romana; la fonte della sola San Carlo non risolve l’identità dell’intera scheda.
Per il centro DNA Rieti rimane un conflitto fra la sede precedente e un avviso datato per un Open Day: nessun trasferimento definitivo viene dedotto.

## Integrità

Supporto territoriale V7.10, Menta e percorso studenti V7.10.3 invariati. Nessun tracking, geolocalizzazione dispositivo, geocoder live o download automatico di tasselli. Noindex conservato.
Gli esiti dei nuovi test e del deploy sono registrati separatamente in GitHub Actions, non dedotti da verifiche delle versioni precedenti.

Dati geografici OSM: © OpenStreetMap contributors, ODbL-1.0. Fonti puntuali e metodi in `Fonti_V7_11.json`.
