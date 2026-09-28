## 7.14 — 2026-09-28\n\n- Mappa principale multilivello: Lazio → provincia → comune → servizio.\n- Vista sanitaria alternativa: provincia → ASL indicata nei dati → comune → servizio.\n- Confini comunali ISTAT 2026 caricati in cinque file separati per ridurre il peso iniziale.\n- Province e comuni funzionano senza richieste cartografiche esterne; OpenStreetMap resta uno sfondo facoltativo.\n- Nessun nuovo confine ASL viene inventato: Roma Capitale resta un unico poligono comunale.\n- 443 schede, 373 localizzate, 70 senza pin e dati V7.11.7 invariati.\n\n## 7.13 — 2026-09-27

Mappa locale delle province nella ricerca, con contatori e risultati sincronizzati. Dati e coordinate V7.11.7, Menta e homepage preservati. Sfondo OpenStreetMap facoltativo. Vedi `downloads/Release_Notes_V7_13.md`.

## 7.12.1 — 2026-09-27

Orientamento per bisogni e ricerca diretta distinti in homepage e nelle pagine di arrivo. Tre percorsi nativi in Menta, scrittura facoltativa, etichette coerenti e compatibilità dei frammenti della vecchia homepage. Dati e motori di ricerca/analisi invariati. Vedi `downloads/Release_Notes_V7_12_1.md`.

## 7.12 — 2026-09-27

Homepage con sei percorsi essenziali; Menta e tutti i percorsi estesi in `orientati.html`; indice ricercabile `sezioni.html`; menu e design condivisi sulle pagine correnti. Dataset/geografia V7.11.7 e contenuti storici preservati. Nessun tracciamento o geolocalizzazione aggiunti.

Vedi `downloads/Release_Notes_V7_12.md` e `.github/workflows/verify-ux-v7-12.yml`.

## 7.11.7 — 2026-09-27

- Ottavo ciclo geografico e pulizia della coda residua.
- 443 servizi clinici preservati; 373 localizzati e 70 senza pin.
- La coda geografica azionabile scende a 69: il SerD Distretto 4 Roma 2 è temporaneamente chiuso e in attesa di nuova sede, quindi non viene trattato come un pin mancante.
- DNA Frosinone, Villa Maddalena e il record legacy Il Colle diventano localizzabili con provenienza e limiti espliciti.
- DSM Rieti e DNA Rieti ricevono indirizzi aggiornati senza coordinate forzate; tre conflitti di sede ASL Rieti restano espliciti.
- Corretto il riepilogo qualità: 29 A, 344 C, 70 D, 0 E; zero ingressi fisici verificati.

## 7.11.6 — 2026-09-27

- Settimo ciclo geografico sulla baseline V7.11.5.
- Aggiunte 5 localizzazioni indicative C.
- Copertura: 370 localizzati e 73 senza pin; 443 servizi clinici invariati.
- CSM Rieti, SerD Rieti e Alcologia Rieti trattati come servizi distinti nello stesso presidio di Via Salaria per Roma 36.
- SRSR Venere e Marte localizzate solo a livello di area/via in località Cerri Aprano.
- Zero ingressi fisici verificati; Menta, studenti, supporto territoriale e noindex invariati.

## 7.11.5 — 2026-09-26

- Sesto ciclo geografico sulla baseline V7.11.4.
- Aggiunti 6 punti indicativi C riusando localizzazioni stradali già validate per la stessa via e comune.
- Copertura: 365 localizzati e 78 senza pin; 443 servizi clinici invariati.
- Cinque servizi di Frosinone sono localizzati solo a livello di Via Armando Fabi.
- TSMREE Frascati è localizzato solo a livello di Via Enrico Fermi.
- UOSD Disturbi Nutrizione e Alimentazione Frosinone resta senza pin per conflitto di sede.
- Zero ingressi fisici verificati; Menta, studenti, supporto territoriale e noindex invariati.

## 7.11.4 — 2026-09-26

- Quinto ciclo geografico sulla baseline V7.11.3.
- Aggiunte 6 localizzazioni indicative C da mappe incorporate nelle pagine ufficiali ASL Viterbo.
- Copertura: 359 localizzati e 84 senza pin; 443 servizi clinici invariati.
- Acquisito Via Enrico Fermi 15 per DSM Viterbo e Ambulatorio DNA Viterbo.
- Nuovi punti per Canino, Tuscania, Capranica e Fabrica di Roma.
- Zero ingressi fisici verificati; Menta, studenti, supporto territoriale e noindex invariati.

## 7.11.3 — 2026-09-26

- Quarto ciclo geografico sulla baseline V7.11.2.
- Aggiunte 3 localizzazioni indicative C: SerD Ceccano, Ambulatorio CSM Osteria Nuova e CSM/ambulatorio Vetralla.
- Copertura: 353 localizzati e 90 senza pin; 443 servizi clinici invariati.
- Acquisito l'indirizzo regionale del SerD interno Casa Circondariale Rieti (Viale Maestri del Lavoro 2) senza assegnare un pin.
- Coordinate secondarie usate solo quando l'indirizzo istituzionale coincide e mantenute come indicative.
- Zero ingressi fisici verificati; Menta, studenti, supporto territoriale e noindex invariati.

## 7.11.2 — 2026-09-26

- Terzo ciclo geografico sulla baseline V7.11.1.
- Aggiunte 6 localizzazioni indicative C: CSM Boccea; Polo Integrato e TSMREE Cassia; CSM Ceccano e SRTRe Maxwell Jones; Comunità Santa Maria/Capannelle.
- Copertura: 350 servizi localizzati, 93 senza pin; 443 servizi clinici invariati.
- Coordinate pubblicate da ASL Roma 1, ARPA Lazio e Roma Capitale per lo stesso indirizzo/presidio; nessun ingresso del singolo servizio dichiarato verificato.
- Nessuna modifica a Menta, percorso studenti, supporto territoriale, classificazioni SSN/accreditamento o capacità.
- Indicizzazione ancora disattivata.

## 7.11.1 — 2026-09-26

- Secondo ciclo mirato: 443 servizi invariati, 344 localizzati, 99 senza pin. Quattordici nuove localizzazioni C: 8 edifici/presidi e 6 brevi vie. Zero ingressi verificati.
- Note o campi riesaminati su 23 schede: conflitti di orario, civici e collegamenti incongruenti esplicitati.
- Raggruppamenti sulla mappa distinti dalla coincidenza fisica di sede.
- Conservati dati/asset precedenti, Menta, studenti, supporto territoriale, noindex e classificazioni amministrative.

## 7.11 — 2026-09-26

- Primo ciclo geografia: 443 servizi invariati, 330 localizzati e 113 senza pin; 15 nuovi punti, zero ingressi fisici verificati.
- 30 riesami operativi per campi selezionati; ricognizione degli URL distinta dalla validazione di sede.
- Contatti e indirizzi privati sincronizzati fra ricerca e directory; classificazioni amministrative invariate.
- Scartate destinazioni cartografiche incoerenti; incertezze conservate.
- Menta, studenti, supporto territoriale e noindex invariati.

## 7.10.3 — 2026-09-26

- Aggiunto in home un ingresso ben visibile “Sei uno studente?” senza ampliare la navigazione primaria.
- Trasformata `studenti.html` in un hub con quattro percorsi: università, scuola, servizi fuori dal contesto di studio e numeri/ascolto.
- Mantenute separate le directory `universita.html` e `scuole.html`.
- Menta invia le richieste generiche “studente/studentessa/studenti” all’hub; le richieste esplicite universitarie o scolastiche mantengono il percorso diretto.
- Aggiunti stili responsive dedicati e test mobile/accessibilità.
- Nessuna modifica ai 443 servizi clinici, alla geografia 315/128 o allo strato territoriale V7.10.

## 7.10.2 — 2026-09-26

- Recuperato selettivamente il lavoro V7.9.4 sulla baseline V7.10.1, senza unire la vecchia PR incompatibile.
- Servizi clinici: 443; moduli: 128; directory strutture: 184.
- Geografia: 315 servizi localizzati e 128 senza pin; nessun ingresso fisico dichiarato verificato.
- Aggiunto Il Colle / Nucleo 1 SRSR H24 a Colle Cesarano e riconciliato il totale H24 documentato a 70 posti per i moduli interessati.
- Integrate cinque localizzazioni a livello di complesso ospedaliero e mantenuti espliciti i limiti di precisione.
- Recuperato l'audit multisede mirato senza dedurre nuove sedi sanitarie non documentate.
- V7.10 supporto territoriale e Menta V7.10.1 restano invariati; indicizzazione ancora disattivata.

## 7.10.1 — 2026-09-26

- Aggiornata la mascotte Menta con un asset WebP trasparente e versionato, ottimizzato per la resa responsive.
- Conservati asset precedente e checkpoint Git per rollback immediato.
- Migliorata la resa visiva della mascotte su desktop e mobile senza modificare routing, parole chiave, sicurezza o contenuti clinici.
- Mantenuti gli stati dinamici CSS/JavaScript e il rispetto di `prefers-reduced-motion`.
- Aggiunta cache immutabile solo al nuovo asset versionato; nessun tracking o dipendenza esterna.

## 7.10 — 2026-09-23

- Creato uno strato separato di supporto territoriale senza modificare i 442 servizi clinici.
- Importato il master regionale corrente di 135 Consultori Familiari.
- Trascritti 47 PUA/punti di accesso da fonti istituzionali acquisite, con copertura dichiarata non esaustiva dove manca la rubrica corrente.
- Integrati PIS/emergenza sociale documentati: RM 4.3, RM 5.1, RM 6.4, LT2, FR B e Sala Operativa Sociale di Roma, mantenendo le diverse modalità di accesso.
- Aggiunta la pagina “Ho bisogno di aiuto adesso” con 112/118, 116117, 1522, 114 e rinvio ai PIS territoriali.
- TSMREE/NPIA e DCA/DNA restano nel database clinico specialistico per evitare duplicazioni.
- CAV collegati alla mappa pubblica regionale; zero indirizzi di Case Rifugio pubblicati.
- Menta aggiornata con intenti PUA, PIS, fragilità sociale e Case della Comunità.
- Ricerca territoriale solo client-side/same-origin; nessun tracking, geolocalizzazione o geocoder live.
- Indicizzazione ancora disattivata.

## 7.9.3 — 2026-09-22

Riesame operativo additivo: quattro presidi ASL Roma 1 aggiornati per accesso/orari/trasporto, tre sedi ASL Rieti con evidenza edilizia sull’accessibilità, un conflitto di sede Rieti reso esplicito e contesto del finanziamento psichiatrico 2026 chiarito senza attribuire budget unitari non acquisiti. Geografia invariata: 442 servizi, 309 localizzati, 133 senza pin. Indicizzazione ancora disattivata.

## 7.9.2 — 2026-09-22

V7.9.2: cinque contratti individuali Roma 5 acquisiti, FEBO ricontrollato senza promozione, ricognizione Nuovi Orizzonti consolidata, Menta sincronizzata e geografia conservativa ulteriormente ampliata.

## 7.9.1 — 2026-09-22

442 servizi, 307 localizzati, 135 senza pin. 51 revisioni per campo, due servizi Villa Pia, contratti per singola unità IHG/Gabbiano e ASL Roma 5. Nessuna riscrittura degli overlay precedenti.

Report: `downloads/Release_Notes_V7_9_1.md`; test: `tools/test-ui-v7-9-1.mjs`; integrità e dati: `tools/prepare-release-v7-9-1.py`. Il sito resta statico e noindex. Le sezioni seguenti documentano versioni precedenti.

## V7.9 — geografia e audit operativo

440 servizi (+8); 236 localizzati, 204 senza pin. 47 schede precedenti riesaminate solo per i campi documentati. 11 casi di gestore con riscontri, IHG pendente. Cinque nuovi indirizzi fisici documentati; Venere/Marte sono due servizi ulteriori ma il loro edificio esatto non è consolidato.

Reverie mantiene quattro servizi; Il Ponte mantiene traccia del record precedente e separa accoglienza, comunità e Coccinella. FEBO e Villa Licia non sono classificati come convenzionati. Corretto lo SPDC San Filippo Neri: non è prova di trasferimento.

Storici, vecchi overlay e download conservati byte per byte. Noindex invariato; Leaflet locale; nessun geocoder, posizione dispositivo o tracking; tasselli su consenso.

Questa release non conclude l’audit di tutti i servizi o la geografia. Gli esiti tecnici effettivi sono in `Verifiche_V7_9.json`; la verifica di produzione è un controllo successivo al merge, registrato separatamente in GitHub Actions. VoiceOver reale non eseguito in ambiente Linux.

Report: `downloads/Audit_Operativo_V7_9.json`, `downloads/Report_Geografia_V7_9.md`, `downloads/Verifiche_V7_9.json`.

---

# Changelog

## 7.8 — 21 settembre 2026

- Otto correzioni UX: età evolutiva con scelta, ricerca mobile anticipata, H1 coerente, provenienza tecnica separata dall’incertezza di gestione, menu snello, landmark emergenze, filtro Provincia, reset senza tecnicismi.
- Mappa dei presidi, filtri condivisi, gruppi di servizi vicini/co-localizzati, collegamenti da risultati e dettagli.
- Geografia additiva con precisione, fonti e copertura dichiarate: 55 indirizzi, 140 vie indicative, 237 non localizzati.
- Leaflet locale, cartografia OSM su azione esplicita, nessuna localizzazione del dispositivo né geocodifica nel browser.
- Noindex mantenuto; dati sanitari, multisede, download e vecchi URL preservati.

## 7.7.5 — 21 settembre 2026

- Audit multisede/multiservizio avviato sui gestori delle strutture residenziali e semiresidenziali.
- Confermato che la ricerca supporta più strutture dello stesso gestore: la lacuna era nei dati, non nel rendering.
- Aggiunte come overlay corrente tre unità Reverie a Capena (CTC 1, CTC 2, Centro Diurno) e Casa Gioia di Nuovi Orizzonti a Marino.
- CTC 2 e Centro Diurno condividono Via Morlupo 94 ma restano risultati separati perché sono servizi distinti.
- Il Ponte è segnalato come multisede da consolidare; FEBO/Cooperate è escluso dall’overlay accreditato perché indicato dal gestore come in attesa di accreditamento.
- Dataset storici V7.3/V7.5/V7.6 invariati; le nuove unità sono in `data/multisede_v7_7_5.json`.
- Ricerca corrente: 432 risultati; directory strutture: 173 risultati.

## 7.7.4 — 21 settembre 2026

- Predisposizione SEO completa senza attivare l’indicizzazione.
- Canonical, title, description, Open Graph e Twitter metadata uniformati sulle pagine utente.
- Sitemap XML pronta ma non annunciata ai crawler finché il sito resta fuori dai risultati di ricerca.
- Noindex mantenuto in HTML e rafforzato con X-Robots-Tag; robots.txt consente il crawl necessario a leggere noindex.
- Dati strutturati WebSite/SearchAction predisposti in home.
- Archivio legacy, 404, documenti tecnici, dataset, download e pagina qualità restano esclusi dall’indicizzazione anche per il futuro.
- Aggiunto uno script controllato per abilitare/disabilitare l’indicizzazione in una futura release.
- Nessuna modifica ai dataset sanitari o alla logica di Menta.

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
