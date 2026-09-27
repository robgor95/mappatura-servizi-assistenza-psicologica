# V7.13 — Ricerca con mappa delle province

27 settembre 2026. Baseline V7.12.1, commit 110b564a777f94c93f972594c67bb0a4b1f41d8c.

La ricerca servizi e l’ingresso legacy integrano una mappa locale delle cinque province/città metropolitana, prima dei risultati. Le aree e i contatori sono selezionabili; il clic aggiorna il filtro provincia e l’elenco nella stessa pagina, preservando gli altri filtri. Ingrandendo compaiono gruppi e servizi, con nome, tipo, gestione, rapporto SSN e precisione geografica. I dettagli si aprono nella scheda esistente e conservano i filtri.

Confini generalizzati ISTAT al 1° gennaio 2026 (CC BY 4.0), riproiettati in EPSG:4326 e arrotondati. L’attribuzione provinciale usa i comuni, non la competenza ASL. Nessuna coordinata di servizio viene generata, corretta o spostata. Homepage, orientamento con Menta, dataset clinici e file storici invariati.

443 schede di servizio, 373 localizzate, 70 senza pin: non sedi uniche. I non localizzati restano nell’elenco e nei conteggi del territorio noto. I contatori delle altre province applicano gli altri filtri; il riepilogo della provincia selezionata coincide con l’elenco. Spostare la mappa non cambia i filtri. 69 casi rimangono nella coda geografica azionabile.

Gestione e rapporto SSN restano separati; “indicato nelle fonti” può riferirsi a documenti precedenti. Nessuna convenzione attuale, gratuità, ingresso o posto libero viene dedotto. Le categorie non sono sinonimi di qualità clinica.

Nessuna richiesta cartografica esterna prima dell’attivazione dello sfondo stradale. Disattivarlo o nascondere la mappa interrompe le richieste successive. Nessun tracking, account, geolocalizzazione del dispositivo o geocodifica live. Mappa compattabile ed espandibile, scelta alternativa tramite pulsanti e filtri, tastiera e movimento ridotto. Errori di confini/indice/coordinate hanno messaggi distinti; la ricerca non viene bloccata. I test automatici non sono certificazione completa di accessibilità o studio con utenti reali.

Ripristino: checkpoint-v7-12-1-before-province-v7-13. Verifiche e schermate vanno lette nel run relativo al commit pubblicato.
