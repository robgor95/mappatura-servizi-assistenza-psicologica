# Changelog

## 7.7.3 — 21 settembre 2026

- Navigazione a quattro percorsi, Altro e menu mobile accessibile.
- Home lineare: Menta, tre alternative, sei situazioni e risorse secondarie.
- Download raggruppati e dichiarati copie precedenti; pagine, file e collegamenti conservati.
- Studenti conduce alle directory complete; ricerche rapide e contenuti storici restano facoltativi.
- Rimossa la precisazione meta cognitivo-interpersonale/IPT in favore di domande pratiche.
- Dataset, fonti, orientatore e filtri invariati. Report: downloads/Verifiche_Navigazione_V7_7_3.json.

## 7.7.2 — 21 settembre 2026

- Semplificata la ricerca dei servizi con terminologia orientata all’utente: servizi pubblici / SSN, strutture non ASL o convenzionate e strutture private.
- Rimossi dalla vista principale filtri, pannelli e metadati di audit non necessari all’orientamento; fonti e metodo restano accessibili nelle pagine dedicate.
- Le schede dei risultati mostrano soprattutto accesso, destinatari, attività, contatti, orari, rapporto con il SSN e ultimo controllo.
- Directory Università e Privato rese più generiche e leggibili; rimossi riferimenti tecnici di versione dalla UI pubblica.
- Guida al privato ampliata con differenze tra psicologo, psicoterapeuta e psichiatra, domande per il primo colloquio e spiegazione neutrale dei principali approcci psicoterapeutici.
- Menta riconosce ora richieste sulla scelta del professionista e sugli approcci terapeutici.
- Dataset, fonti, date di verifica e URL storici non sono stati modificati.

## 7.7.1 — 21 settembre 2026

- Menta passa da presenza statica a guida visiva con micro-animazioni contestuali: attesa, ascolto, ricerca, scelta, risultato, nessun risultato ed errore.
- Le animazioni restano leggere, senza librerie esterne, e sono disattivate con `prefers-reduced-motion`.
- Menta è integrata nella pagina 404 e negli errori di caricamento del database; gli stati senza risultati usano una posa dedicata.
- Rimossi dalla UI pubblica i riferimenti tecnici V7.x non utili all’orientamento; versionamento e tracciabilità restano in repository, changelog e file tecnici.
- Nessuna modifica a dataset, fonti, date di verifica, logica clinica o percorsi sanitari.

## 7.7 — 21 settembre 2026

- Home con Menta, testo libero elaborato localmente e alternativa “Esplora in autonomia”.
- 29 intenti dichiarativi, sinonimi, combinazioni, territorio e filtri reali; nessun redirect obbligatorio.
- Priorità alle parole di possibile emergenza con distinzione 112/118, 116117 e ascolto.
- Otto composizioni contestuali della mascotte, superfici calme, focus visibile e reduced-motion.
- Prefiltri canonici delle directory; corretta la sola visualizzazione del conteggio dei nodi già presenti nell’overlay V7.6.
- Suite dedicata di routing, integrità, privacy, tastiera, mobile e accessibilità automatica.
- Dati, date, documenti clinici, download e URL precedenti conservati. Nessun nuovo riesame sanitario.

Dettagli: `downloads/Note_Rilascio_V7_7.txt`, `downloads/Audit_Menta_V7_7.json`, `downloads/Verifiche_Menta_V7_7.json`.

## 7.5.1 — 21 settembre 2026

- “Trova un servizio” sostituisce la denominazione “Archivio” nell'interfaccia.
- Nuova pagina `servizi.html`, con `archivio.html` compatibile con i vecchi URL.
- Ricerca unica su 421 schede esistenti; dati, date e identificativi preservati.
- Filtri semplici/avanzati, scorciatoie, schede dettagliate, paginazione, URL e CSV.
- Restyling coerente con il sito; controlli mobile e tastiera.
- Corretta l'interferenza dello script condiviso con le directory V7.5.
- Conservati dataset, download, guide, storico e precedente interfaccia.

Questa è una revisione dell'interfaccia, non una nuova verifica sanitaria.
Dettagli: `downloads/Note_Rilascio_V7_5_1.txt` e `downloads/Verifiche_UI_V7_5_1.json`.
