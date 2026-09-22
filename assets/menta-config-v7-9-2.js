/* Menta V7.9.2: configurazione locale e deterministica; nessun testo viene trasmesso. */
(function(root){
"use strict";
const config = {
  "version": "7.9.2",
  "routes": {
    "university": {
      "label": "Università",
      "page": "/universita.html",
      "description": "Supporto psicologico, counselling e ascolto collegati agli atenei del Lazio."
    },
    "school": {
      "label": "Sportelli scolastici",
      "page": "/scuole.html",
      "description": "Servizi nelle scuole: controlla anno scolastico, destinatari e stato della scheda."
    },
    "listening": {
      "label": "Centri e sportelli di ascolto",
      "page": "/centri-ascolto.html",
      "description": "Consultori e servizi territoriali: finalità, contatti e accesso documentato."
    },
    "consultori": {
      "label": "Consultori e spazi per le famiglie",
      "page": "/centri-ascolto.html",
      "description": "Consulta le schede dei consultori; verifica destinatari e accesso.",
      "filters": {
        "tema": "consultorio"
      }
    },
    "young-listening": {
      "label": "Consultori e spazi giovani",
      "page": "/centri-ascolto.html",
      "description": "Servizi che riportano attività per giovani. Età e disponibilità da verificare.",
      "filters": {
        "tema": "giovani"
      }
    },
    "helpline": {
      "label": "Helpline e ascolto telefonico",
      "page": "/helpline.html",
      "description": "Orari, destinatari e funzioni delle linee. Non sostituiscono il soccorso."
    },
    "csm": {
      "label": "Centri di salute mentale · CSM",
      "page": "/servizi.html",
      "description": "Ricerca dei CSM con i filtri del database.",
      "filters": {
        "tipo": "CSM"
      }
    },
    "serd": {
      "label": "Servizi per le dipendenze · SerD",
      "page": "/servizi.html",
      "description": "Schede dei SerD. Accesso e competenza territoriale da verificare.",
      "filters": {
        "tipo": "SerD"
      }
    },
    "addictions": {
      "label": "Dipendenze e doppia diagnosi",
      "page": "/servizi.html",
      "description": "Esplora le tipologie già indicizzate in questo ambito.",
      "filters": {
        "percorso": "dipendenze"
      }
    },
    "spdc": {
      "label": "Reparti ospedalieri · SPDC",
      "page": "/servizi.html",
      "description": "Schede informative: non è una prenotazione di ricovero né un accesso al soccorso.",
      "filters": {
        "tipo": "SPDC"
      }
    },
    "stpit": {
      "label": "Trattamenti intensivi territoriali · STPIT",
      "page": "/servizi.html",
      "description": "Consulta le schede STPIT e i relativi stati documentali.",
      "filters": {
        "tipo": "STPIT"
      }
    },
    "day": {
      "label": "Centri diurni",
      "page": "/servizi.html",
      "description": "Ricerca dei centri diurni e delle modalità di accesso registrate.",
      "filters": {
        "tipo": "Centro diurno"
      }
    },
    "srtr": {
      "label": "Strutture terapeutico-riabilitative · SRTR",
      "page": "/servizi.html",
      "description": "Moduli SRTR; leggi separatamente autorizzazione, accreditamento e rapporto SSN.",
      "filters": {
        "tipo": "SRTR"
      }
    },
    "srsr": {
      "label": "Strutture socio-riabilitative · SRSR",
      "page": "/servizi.html",
      "description": "Moduli SRSR; disponibilità e condizioni non sono verificate in tempo reale.",
      "filters": {
        "tipo": "SRSR"
      }
    },
    "residential": {
      "label": "Comunità e riabilitazione",
      "page": "/servizi.html",
      "description": "Esplora residenzialità e semiresidenzialità, senza presumere un diritto di accesso.",
      "filters": {
        "percorso": "riabilitazione"
      }
    },
    "residential-addictions": {
      "label": "Comunità e riabilitazione · dipendenze",
      "page": "/servizi.html",
      "description": "Intersezione dei filtri riabilitazione e dipendenze già presenti nel database.",
      "filters": {
        "percorso": "riabilitazione",
        "ambito": "Dipendenze"
      }
    },
    "day-addictions": {
      "label": "Centri diurni · dipendenze",
      "page": "/servizi.html",
      "description": "La combinazione può non avere schede censite: puoi rimuovere un filtro.",
      "filters": {
        "tipo": "Centro diurno",
        "percorso": "dipendenze"
      }
    },
    "double": {
      "label": "Servizi con ambito doppia diagnosi",
      "page": "/servizi.html",
      "description": "Solo l’ambito riportato nei dati; nessuna deduzione diagnostica dalla tua frase.",
      "filters": {
        "ambito": "Doppia diagnosi"
      }
    },
    "food": {
      "label": "Servizi DCA / DNA",
      "page": "/servizi.html",
      "description": "Servizi dedicati ai disturbi della nutrizione e dell’alimentazione.",
      "filters": {
        "tipo": "DCA/DNA"
      }
    },
    "children": {
      "label": "Età evolutiva · TSMREE / NPIA",
      "page": "/servizi.html",
      "description": "Schede dei servizi per l’età evolutiva. Verifica limiti di età e accesso.",
      "filters": {
        "tipo": "TSMREE/NPIA"
      }
    },
    "private": {
      "label": "Strutture private",
      "page": "/privati.html",
      "description": "Centri e servizi privati censiti, senza classifiche o raccomandazioni."
    },
    "private-db": {
      "label": "Strutture private nella ricerca",
      "page": "/servizi.html",
      "description": "Cerca strutture e servizi privati per territorio e attività.",
      "filters": {
        "origine": "privati"
      }
    },
    "private-child": {
      "label": "Privato per età evolutiva",
      "page": "/servizi.html",
      "description": "Schede con questo ambito indicizzato; verifica sempre destinatari e prestazioni.",
      "filters": {
        "origine": "privati",
        "ambito": "Età evolutiva"
      }
    },
    "first": {
      "label": "Da dove iniziare",
      "page": "/guide/primo-percorso.html",
      "description": "Una guida alle figure professionali e al primo contatto, senza scegliere un trattamento."
    },
    "public": {
      "label": "Pubblico, accesso e costi",
      "page": "/guide/pubblico.html",
      "description": "Costi, esenzioni e gratuità dipendono dal servizio e dalle condizioni di accesso."
    },
    "private-guide": {
      "label": "Scegliere psicologo o psicoterapeuta",
      "page": "/guide/privato.html",
      "description": "Qualifiche, primo colloquio, costi, approcci e domande utili per orientarsi nel privato."
    },
    "hospital-guide": {
      "label": "Capire il ricovero",
      "page": "/guide/ricovero.html",
      "description": "Differenze tra emergenza, SPDC e STPIT. Informazioni generali, non un’indicazione al ricovero."
    },
    "rehab-guide": {
      "label": "Capire comunità e riabilitazione",
      "page": "/guide/riabilitazione.html",
      "description": "Progetti, contesti e domande da fare prima di un eventuale inserimento."
    },
    "structures": {
      "label": "Schede approfondite delle strutture",
      "page": "/strutture-approfondite.html",
      "description": "Moduli, équipe e accesso documentato, con evidenze e limiti distinti."
    },
    "nonurgent": {
      "label": "Sanità non urgente · 116117",
      "page": "/ascolto.html#116117",
      "description": "Informazioni sul numero per cure e consigli non urgenti. Per emergenze: 112 / 118."
    },
    "safety": {
      "label": "Numeri utili: emergenza e ascolto",
      "page": "/ascolto.html",
      "description": "Confronta le funzioni dei numeri: soccorso, sanità non urgente e ascolto."
    },
    "violence": {
      "label": "Centri antiviolenza",
      "page": "/centri-ascolto.html",
      "description": "Schede territoriali e condizioni di accesso; in pericolo immediato chiama il 112.",
      "filters": {
        "tema": "antiviolenza"
      }
    },
    "guides": {
      "label": "Tutte le guide",
      "page": "/guide/index.html",
      "description": "Cinque guide, disponibili anche in versione PDF."
    },
    "glossary": {
      "label": "Glossario dei servizi",
      "page": "/glossario.html",
      "description": "Il significato delle sigle e delle parole usate nelle schede."
    },
    "quality": {
      "label": "Qualità dei dati e fonti",
      "page": "/qualita-dati.html",
      "description": "Stati del riesame documentale, variazioni per campo e limiti di copertura."
    },
    "downloads": {
      "label": "Documenti e download",
      "page": "/documenti.html",
      "description": "Guide e dataset delle versioni conservate."
    },
    "database": {
      "label": "Trova un servizio",
      "page": "/servizi.html",
      "description": "Ricerca libera, tipologie, territorio e filtri documentali."
    },
    "professional-choice": {
      "label": "Come scegliere un professionista",
      "page": "/guide/privato.html#qualifiche",
      "description": "Differenze tra psicologo, psicoterapeuta e psichiatra e controlli da fare prima del primo colloquio."
    },
    "therapy-guide": {
      "label": "Capire gli approcci psicoterapeutici",
      "page": "/guide/privato.html#approcci",
      "description": "Una spiegazione semplice dei principali orientamenti e delle domande da fare al professionista."
    },
    "gabbiano-current": {
      "label": "Gabbiano Tirreno",
      "page": "/servizi.html",
      "description": "Ricerca delle schede censite con questa denominazione o gestore; verifica sede, stato e rapporto SSN.",
      "filters": {
        "q": "Gabbiano Tirreno"
      }
    },
    "reverie-current": {
      "label": "Reverie",
      "page": "/servizi.html",
      "description": "Ricerca delle schede censite con questa denominazione o gestore; verifica sede, stato e rapporto SSN.",
      "filters": {
        "q": "Reverie"
      }
    },
    "nuovi-orizzonti-current": {
      "label": "Nuovi Orizzonti",
      "page": "/servizi.html",
      "description": "Ricerca delle schede censite con questa denominazione o gestore; verifica sede, stato e rapporto SSN.",
      "filters": {
        "q": "Nuovi Orizzonti"
      }
    },
    "ponte-current": {
      "label": "Il Ponte / Le Ali del Ponte",
      "page": "/servizi.html",
      "description": "Ricerca delle schede censite con questa denominazione o gestore; verifica sede, stato e rapporto SSN.",
      "filters": {
        "q": "Le Ali del Ponte"
      }
    },
    "villa-pia-current": {
      "label": "Villa Pia",
      "page": "/servizi.html",
      "description": "Ricerca delle schede censite con questa denominazione o gestore; verifica sede, stato e rapporto SSN.",
      "filters": {
        "q": "Villa Pia"
      }
    }
  },
  "intents": [
    {
      "id": "gabbiano-current",
      "priority": 99,
      "keywords": [
        "gabbiano tirreno",
        "gabbiano",
        "italian hospital group"
      ],
      "routes": [
        "gabbiano-current"
      ]
    },
    {
      "id": "reverie-current",
      "priority": 99,
      "keywords": [
        "reverie",
        "reverie fondatori"
      ],
      "routes": [
        "reverie-current"
      ]
    },
    {
      "id": "nuovi-orizzonti-current",
      "priority": 99,
      "keywords": [
        "nuovi orizzonti",
        "casa gioia"
      ],
      "routes": [
        "nuovi-orizzonti-current"
      ]
    },
    {
      "id": "ponte-current",
      "priority": 99,
      "keywords": [
        "il ponte civitavecchia",
        "le ali del ponte",
        "centro solidarieta il ponte"
      ],
      "routes": [
        "ponte-current"
      ]
    },
    {
      "id": "villa-pia-current",
      "priority": 99,
      "keywords": [
        "villa pia",
        "centro villa pia"
      ],
      "routes": [
        "villa-pia-current"
      ]
    },
    {
      "id": "university",
      "priority": 85,
      "keywords": [
        "università",
        "universita",
        "universitario",
        "universitaria",
        "universitari",
        "universitarie",
        "ateneo",
        "atenei",
        "counselling universitario",
        "counseling universitario",
        "studente universitario",
        "studentessa universitaria",
        "sapienza",
        "tor vergata",
        "roma tre",
        "luiss",
        "lumsa",
        "iusm",
        "uniroma",
        "uniroma4",
        "università della tuscia"
      ],
      "routes": [
        "university"
      ]
    },
    {
      "id": "school",
      "priority": 85,
      "keywords": [
        "scuola",
        "scuole",
        "scolastico",
        "scolastica",
        "scolastici",
        "scolastiche",
        "liceo",
        "licei",
        "istituto",
        "sportello scolastico",
        "sportello psicologico scolastico",
        "scuola media",
        "scuole medie",
        "scuola elementare",
        "istituto comprensivo"
      ],
      "routes": [
        "school"
      ]
    },
    {
      "id": "students",
      "priority": 40,
      "keywords": [
        "studente",
        "studentessa",
        "studenti",
        "studentesse",
        "studio",
        "studentə"
      ],
      "routes": [
        "university",
        "school"
      ]
    },
    {
      "id": "consultori",
      "priority": 80,
      "keywords": [
        "consultorio",
        "consultori",
        "consultoriale",
        "spazio giovani",
        "spazi giovani"
      ],
      "routes": [
        "consultori",
        "young-listening"
      ]
    },
    {
      "id": "listening",
      "priority": 55,
      "keywords": [
        "ascolto",
        "centro di ascolto",
        "centri di ascolto",
        "sportello di ascolto",
        "sportello ascolto",
        "ascolto territoriale",
        "supporto territoriale"
      ],
      "routes": [
        "listening",
        "helpline"
      ]
    },
    {
      "id": "helpline",
      "priority": 80,
      "keywords": [
        "helpline",
        "help line",
        "numero",
        "numeri utili",
        "telefono",
        "telefonico",
        "telefonica",
        "parlare con qualcuno",
        "parlare a qualcuno",
        "ho bisogno di parlare",
        "ascolto telefonico",
        "telefono amico"
      ],
      "routes": [
        "helpline",
        "safety"
      ]
    },
    {
      "id": "csm",
      "priority": 95,
      "keywords": [
        "csm",
        "c s m",
        "centro salute mentale",
        "centro di salute mentale",
        "centri di salute mentale"
      ],
      "routes": [
        "csm"
      ]
    },
    {
      "id": "serd",
      "priority": 95,
      "keywords": [
        "serd",
        "sert",
        "ser d",
        "ser t",
        "s e r d",
        "s e r t",
        "servizio dipendenze",
        "servizio per le dipendenze",
        "servizi per le dipendenze"
      ],
      "routes": [
        "serd",
        "addictions"
      ]
    },
    {
      "id": "addictions",
      "priority": 70,
      "keywords": [
        "dipendenza",
        "dipendenze",
        "droga",
        "droghe",
        "alcol",
        "alcool",
        "alcolismo",
        "gioco",
        "gioco d azzardo",
        "azzardo",
        "ludopatia",
        "sostanze",
        "tossicodipendenza",
        "tossicodipendenze"
      ],
      "routes": [
        "addictions",
        "serd",
        "helpline"
      ]
    },
    {
      "id": "spdc",
      "priority": 95,
      "keywords": [
        "spdc",
        "s p d c",
        "ricovero",
        "ricoveri",
        "ricovero psichiatrico",
        "reparto psichiatrico",
        "reparto di psichiatria",
        "tso"
      ],
      "routes": [
        "spdc",
        "hospital-guide"
      ]
    },
    {
      "id": "stpit",
      "priority": 95,
      "keywords": [
        "stpit",
        "s t p i t",
        "trattamenti psichiatrici intensivi territoriali",
        "trattamento psichiatrico intensivo territoriale"
      ],
      "routes": [
        "stpit",
        "hospital-guide"
      ]
    },
    {
      "id": "day",
      "priority": 90,
      "keywords": [
        "centro diurno",
        "centri diurni",
        "centro di giorno",
        "centri di giorno",
        "diurno",
        "diurni"
      ],
      "routes": [
        "day",
        "rehab-guide"
      ]
    },
    {
      "id": "srtr",
      "priority": 95,
      "keywords": [
        "srtr",
        "s r t r",
        "struttura residenziale terapeutico riabilitativa",
        "strutture residenziali terapeutico riabilitative"
      ],
      "routes": [
        "srtr",
        "rehab-guide"
      ]
    },
    {
      "id": "srsr",
      "priority": 95,
      "keywords": [
        "srsr",
        "s r s r",
        "struttura residenziale socio riabilitativa",
        "strutture residenziali socio riabilitative"
      ],
      "routes": [
        "srsr",
        "rehab-guide"
      ]
    },
    {
      "id": "residential",
      "priority": 75,
      "keywords": [
        "comunità",
        "comunita",
        "residenziale",
        "residenziali",
        "semiresidenziale",
        "semiresidenziali",
        "semi residenziale",
        "semi residenziali",
        "riabilitazione",
        "comunità terapeutica"
      ],
      "routes": [
        "residential",
        "structures",
        "rehab-guide"
      ]
    },
    {
      "id": "double",
      "priority": 92,
      "keywords": [
        "doppia diagnosi",
        "dual diagnosis"
      ],
      "routes": [
        "double",
        "rehab-guide"
      ]
    },
    {
      "id": "food",
      "priority": 92,
      "keywords": [
        "dca",
        "dna",
        "d c a",
        "d n a",
        "disturbi alimentari",
        "disturbo alimentare",
        "disturbi della nutrizione",
        "alimentazione",
        "anoressia",
        "bulimia",
        "binge eating"
      ],
      "routes": [
        "food"
      ]
    },
    {
      "id": "tsmree",
      "priority": 95,
      "keywords": [
        "tsmree",
        "npia",
        "npi",
        "neuropsichiatria infantile",
        "neuropsichiatra infantile",
        "neuropsichiatria dell infanzia",
        "neuropsichiatria dell adolescenza"
      ],
      "routes": [
        "children"
      ]
    },
    {
      "id": "children",
      "priority": 65,
      "keywords": [
        "bambino",
        "bambina",
        "bambini",
        "bambine",
        "adolescente",
        "adolescenti",
        "infanzia",
        "adolescenza",
        "minore",
        "minori",
        "età evolutiva",
        "eta evolutiva"
      ],
      "routes": [
        "children",
        "young-listening",
        "school",
        "private-child"
      ]
    },
    {
      "id": "family",
      "priority": 45,
      "keywords": [
        "figlio",
        "figlia",
        "figli",
        "figlie",
        "famiglia",
        "famiglie",
        "genitore",
        "genitori",
        "mio figlio",
        "mia figlia"
      ],
      "routes": [
        "consultori",
        "children",
        "csm",
        "university"
      ]
    },
    {
      "id": "professional-choice",
      "priority": 88,
      "keywords": [
        "come scegliere psicologo",
        "scegliere psicologo",
        "come scegliere psicoterapeuta",
        "scegliere psicoterapeuta",
        "quale psicologo scegliere",
        "quale psicoterapeuta scegliere",
        "cercare psicologo privato",
        "trovare psicoterapeuta",
        "scegliere terapeuta",
        "primo terapeuta"
      ],
      "routes": [
        "professional-choice",
        "private-guide",
        "private"
      ]
    },
    {
      "id": "therapy-approaches",
      "priority": 87,
      "keywords": [
        "approccio terapeutico",
        "approcci terapeutici",
        "approccio psicoterapeutico",
        "approcci psicoterapeutici",
        "cognitivo comportamentale",
        "cognitivo-comportamentale",
        "cbt",
        "psicodinamico",
        "psicodinamica",
        "psicoanalitico",
        "psicoanalitica",
        "sistemico relazionale",
        "sistemico-relazionale",
        "terapia familiare",
        "terapia di coppia",
        "terapia di gruppo",
        "umanistico",
        "umanistica",
        "gestalt",
        "emdr",
        "quale terapia",
        "quale psicoterapia"
      ],
      "routes": [
        "therapy-guide",
        "private-guide"
      ]
    },
    {
      "id": "private",
      "priority": 75,
      "keywords": [
        "privato",
        "privata",
        "privati",
        "private",
        "psicoterapia privata",
        "centro privato",
        "studio privato",
        "libero professionista"
      ],
      "routes": [
        "private",
        "private-guide",
        "private-db"
      ]
    },
    {
      "id": "public",
      "priority": 50,
      "keywords": [
        "gratuito",
        "gratuita",
        "gratuiti",
        "gratuite",
        "gratis",
        "psicologo gratuito",
        "senza pagare",
        "pubblico",
        "pubblica",
        "ssn",
        "ticket",
        "esenzione",
        "costo",
        "costi",
        "economico"
      ],
      "routes": [
        "public",
        "csm",
        "listening"
      ]
    },
    {
      "id": "first",
      "priority": 25,
      "keywords": [
        "psicologo",
        "psicologa",
        "psicologi",
        "psicologhe",
        "psicoterapia",
        "psicoterapeuta",
        "psichiatra",
        "supporto psicologico",
        "sostegno psicologico",
        "aiuto psicologico",
        "counselling",
        "counseling",
        "primo colloquio",
        "da dove iniziare",
        "come iniziare",
        "ansia",
        "depressione",
        "panico",
        "stress",
        "insonnia"
      ],
      "routes": [
        "first",
        "public",
        "private-guide",
        "listening"
      ]
    },
    {
      "id": "nonurgent",
      "priority": 95,
      "keywords": [
        "116117",
        "116 117",
        "non urgente",
        "non urgenti",
        "sanità non urgente",
        "guardia medica",
        "continuità assistenziale"
      ],
      "routes": [
        "nonurgent",
        "safety"
      ]
    },
    {
      "id": "guides",
      "priority": 35,
      "keywords": [
        "guida",
        "guide",
        "leggere le guide",
        "informazioni sui servizi"
      ],
      "routes": [
        "guides",
        "first"
      ]
    },
    {
      "id": "glossary",
      "priority": 75,
      "keywords": [
        "glossario",
        "sigla",
        "sigle",
        "significato delle sigle"
      ],
      "routes": [
        "glossary"
      ]
    },
    {
      "id": "quality",
      "priority": 75,
      "keywords": [
        "fonti",
        "fonte",
        "qualità dati",
        "qualita dati",
        "verifica dati",
        "riesame",
        "metodo",
        "aggiornamento dati"
      ],
      "routes": [
        "quality"
      ]
    },
    {
      "id": "downloads",
      "priority": 80,
      "keywords": [
        "download",
        "scarica",
        "scaricare",
        "pdf",
        "csv",
        "documenti",
        "dataset"
      ],
      "routes": [
        "downloads"
      ]
    },
    {
      "id": "database",
      "priority": 35,
      "keywords": [
        "tutti i servizi",
        "database",
        "mappatura",
        "trova un servizio",
        "elenco servizi"
      ],
      "routes": [
        "database"
      ]
    }
  ],
  "emergency": [
    "emergenza",
    "emergenze",
    "urgenza",
    "urgente",
    "pericolo",
    "suicidio",
    "suicida",
    "suicidarmi",
    "suicidarsi",
    "suicidario",
    "suicidaria",
    "farsi del male",
    "farmi del male",
    "farmi male",
    "mi faccio male",
    "si fa del male",
    "farti del male",
    "autolesionismo",
    "autolesionista",
    "overdose",
    "violenza",
    "aggressione",
    "aggredito",
    "aggredita",
    "mi picchia",
    "voglio morire",
    "uccidermi",
    "uccidersi",
    "togliermi la vita",
    "togliersi la vita",
    "farla finita",
    "non voglio vivere",
    "non voglio più vivere",
    "non voglio piu vivere",
    "non respira",
    "avvelenamento",
    "112",
    "118"
  ],
  "nonurgentPhrases": [
    "non urgente",
    "non urgenti",
    "non è urgente",
    "non e urgente",
    "nessuna urgenza",
    "non urgenza"
  ],
  "geography": [
    {
      "aliases": [
        "Poggio Moiano / Osteria Nuova",
        "Poggio Moiano",
        "Osteria Nuova"
      ],
      "filters": {
        "comune": "Poggio Moiano / Osteria Nuova"
      },
      "label": "Comune: Poggio Moiano / Osteria Nuova"
    },
    {
      "aliases": [
        "provincia di Frosinone",
        "provincia Frosinone",
        "provincia FR",
        "territorio di Frosinone"
      ],
      "filters": {
        "provincia": "FR"
      },
      "label": "Territorio: Frosinone"
    },
    {
      "aliases": [
        "Santi Cosma e Damiano"
      ],
      "filters": {
        "comune": "Santi Cosma e Damiano"
      },
      "label": "Comune: Santi Cosma e Damiano"
    },
    {
      "aliases": [
        "Sant’Elia Fiumerapido"
      ],
      "filters": {
        "comune": "Sant’Elia Fiumerapido"
      },
      "label": "Comune: Sant’Elia Fiumerapido"
    },
    {
      "aliases": [
        "provincia di Viterbo",
        "provincia Viterbo",
        "provincia VT",
        "territorio di Viterbo"
      ],
      "filters": {
        "provincia": "VT"
      },
      "label": "Territorio: Viterbo"
    },
    {
      "aliases": [
        "Torricella in Sabina"
      ],
      "filters": {
        "comune": "Torricella in Sabina"
      },
      "label": "Comune: Torricella in Sabina"
    },
    {
      "aliases": [
        "provincia di Latina",
        "provincia Latina",
        "provincia LT",
        "territorio di Latina"
      ],
      "filters": {
        "provincia": "LT"
      },
      "label": "Territorio: Latina"
    },
    {
      "aliases": [
        "Guidonia Montecelio",
        "Guidonia"
      ],
      "filters": {
        "comune": "Guidonia Montecelio"
      },
      "label": "Comune: Guidonia Montecelio"
    },
    {
      "aliases": [
        "provincia di Rieti",
        "provincia Rieti",
        "provincia RI",
        "territorio di Rieti"
      ],
      "filters": {
        "provincia": "RI"
      },
      "label": "Territorio: Rieti"
    },
    {
      "aliases": [
        "Montalto di Castro"
      ],
      "filters": {
        "comune": "Montalto di Castro"
      },
      "label": "Comune: Montalto di Castro"
    },
    {
      "aliases": [
        "Soriano nel Cimino"
      ],
      "filters": {
        "comune": "Soriano nel Cimino"
      },
      "label": "Comune: Soriano nel Cimino"
    },
    {
      "aliases": [
        "Cisterna di Latina"
      ],
      "filters": {
        "comune": "Cisterna di Latina"
      },
      "label": "Comune: Cisterna di Latina"
    },
    {
      "aliases": [
        "Campagnano di Roma"
      ],
      "filters": {
        "comune": "Campagnano di Roma"
      },
      "label": "Comune: Campagnano di Roma"
    },
    {
      "aliases": [
        "Anguillara Sabazia"
      ],
      "filters": {
        "comune": "Anguillara Sabazia"
      },
      "label": "Comune: Anguillara Sabazia"
    },
    {
      "aliases": [
        "provincia di Roma",
        "provincia Roma",
        "provincia RM",
        "territorio di Roma"
      ],
      "filters": {
        "provincia": "RM"
      },
      "label": "Territorio: Roma"
    },
    {
      "aliases": [
        "Civita Castellana"
      ],
      "filters": {
        "comune": "Civita Castellana"
      },
      "label": "Comune: Civita Castellana"
    },
    {
      "aliases": [
        "Belmonte Castello"
      ],
      "filters": {
        "comune": "Belmonte Castello"
      },
      "label": "Comune: Belmonte Castello"
    },
    {
      "aliases": [
        "Palombara Sabina"
      ],
      "filters": {
        "comune": "Palombara Sabina"
      },
      "label": "Comune: Palombara Sabina"
    },
    {
      "aliases": [
        "ASL Frosinone",
        "ASL di Frosinone"
      ],
      "filters": {
        "asl": "ASL Frosinone"
      },
      "label": "ASL Frosinone"
    },
    {
      "aliases": [
        "Genzano di Roma"
      ],
      "filters": {
        "comune": "Genzano di Roma"
      },
      "label": "Comune: Genzano di Roma"
    },
    {
      "aliases": [
        "Magliano Sabina"
      ],
      "filters": {
        "comune": "Magliano Sabina"
      },
      "label": "Comune: Magliano Sabina"
    },
    {
      "aliases": [
        "Fabrica di Roma"
      ],
      "filters": {
        "comune": "Fabrica di Roma"
      },
      "label": "Comune: Fabrica di Roma"
    },
    {
      "aliases": [
        "Santa Marinella"
      ],
      "filters": {
        "comune": "Santa Marinella"
      },
      "label": "Comune: Santa Marinella"
    },
    {
      "aliases": [
        "Spigno Saturnia"
      ],
      "filters": {
        "comune": "Spigno Saturnia"
      },
      "label": "Comune: Spigno Saturnia"
    },
    {
      "aliases": [
        "Albano Laziale"
      ],
      "filters": {
        "comune": "Albano Laziale"
      },
      "label": "Comune: Albano Laziale"
    },
    {
      "aliases": [
        "Poggio Mirteto"
      ],
      "filters": {
        "comune": "Poggio Mirteto"
      },
      "label": "Comune: Poggio Mirteto"
    },
    {
      "aliases": [
        "Fara in Sabina"
      ],
      "filters": {
        "comune": "Fara in Sabina"
      },
      "label": "Comune: Fara in Sabina"
    },
    {
      "aliases": [
        "Olevano Romano"
      ],
      "filters": {
        "comune": "Olevano Romano"
      },
      "label": "Comune: Olevano Romano"
    },
    {
      "aliases": [
        "Isola del Liri"
      ],
      "filters": {
        "comune": "Isola del Liri"
      },
      "label": "Comune: Isola del Liri"
    },
    {
      "aliases": [
        "ASL Viterbo",
        "ASL di Viterbo"
      ],
      "filters": {
        "asl": "ASL Viterbo"
      },
      "label": "ASL Viterbo"
    },
    {
      "aliases": [
        "Civitavecchia"
      ],
      "filters": {
        "comune": "Civitavecchia"
      },
      "label": "Comune: Civitavecchia"
    },
    {
      "aliases": [
        "Acquapendente"
      ],
      "filters": {
        "comune": "Acquapendente"
      },
      "label": "Comune: Acquapendente"
    },
    {
      "aliases": [
        "Montefiascone"
      ],
      "filters": {
        "comune": "Montefiascone"
      },
      "label": "Comune: Montefiascone"
    },
    {
      "aliases": [
        "Castel Madama"
      ],
      "filters": {
        "comune": "Castel Madama"
      },
      "label": "Comune: Castel Madama"
    },
    {
      "aliases": [
        "ASL Roma 1",
        "ASL di Roma 1"
      ],
      "filters": {
        "asl": "ASL Roma 1"
      },
      "label": "ASL Roma 1"
    },
    {
      "aliases": [
        "ASL Roma 2",
        "ASL di Roma 2"
      ],
      "filters": {
        "asl": "ASL Roma 2"
      },
      "label": "ASL Roma 2"
    },
    {
      "aliases": [
        "ASL Roma 3",
        "ASL di Roma 3"
      ],
      "filters": {
        "asl": "ASL Roma 3"
      },
      "label": "ASL Roma 3"
    },
    {
      "aliases": [
        "ASL Roma 4",
        "ASL di Roma 4"
      ],
      "filters": {
        "asl": "ASL Roma 4"
      },
      "label": "ASL Roma 4"
    },
    {
      "aliases": [
        "ASL Roma 5",
        "ASL di Roma 5"
      ],
      "filters": {
        "asl": "ASL Roma 5"
      },
      "label": "ASL Roma 5"
    },
    {
      "aliases": [
        "ASL Roma 6",
        "ASL di Roma 6"
      ],
      "filters": {
        "asl": "ASL Roma 6"
      },
      "label": "ASL Roma 6"
    },
    {
      "aliases": [
        "ASL Latina",
        "ASL di Latina"
      ],
      "filters": {
        "asl": "ASL Latina"
      },
      "label": "ASL Latina"
    },
    {
      "aliases": [
        "Monterotondo"
      ],
      "filters": {
        "comune": "Monterotondo"
      },
      "label": "Comune: Monterotondo"
    },
    {
      "aliases": [
        "Fiano Romano"
      ],
      "filters": {
        "comune": "Fiano Romano"
      },
      "label": "Comune: Fiano Romano"
    },
    {
      "aliases": [
        "Rocca Priora"
      ],
      "filters": {
        "comune": "Rocca Priora"
      },
      "label": "Comune: Rocca Priora"
    },
    {
      "aliases": [
        "Monte Romano"
      ],
      "filters": {
        "comune": "Monte Romano"
      },
      "label": "Comune: Monte Romano"
    },
    {
      "aliases": [
        "ASL Rieti",
        "ASL di Rieti"
      ],
      "filters": {
        "asl": "ASL Rieti"
      },
      "label": "ASL Rieti"
    },
    {
      "aliases": [
        "Ronciglione"
      ],
      "filters": {
        "comune": "Ronciglione"
      },
      "label": "Comune: Ronciglione"
    },
    {
      "aliases": [
        "Castelforte"
      ],
      "filters": {
        "comune": "Castelforte"
      },
      "label": "Comune: Castelforte"
    },
    {
      "aliases": [
        "Trivigliano"
      ],
      "filters": {
        "comune": "Trivigliano"
      },
      "label": "Comune: Trivigliano"
    },
    {
      "aliases": [
        "Castrocielo"
      ],
      "filters": {
        "comune": "Castrocielo"
      },
      "label": "Comune: Castrocielo"
    },
    {
      "aliases": [
        "Colleferro"
      ],
      "filters": {
        "comune": "Colleferro"
      },
      "label": "Comune: Colleferro"
    },
    {
      "aliases": [
        "Palestrina"
      ],
      "filters": {
        "comune": "Palestrina"
      },
      "label": "Comune: Palestrina"
    },
    {
      "aliases": [
        "Fiamignano"
      ],
      "filters": {
        "comune": "Fiamignano"
      },
      "label": "Comune: Fiamignano"
    },
    {
      "aliases": [
        "Bagnoregio"
      ],
      "filters": {
        "comune": "Bagnoregio"
      },
      "label": "Comune: Bagnoregio"
    },
    {
      "aliases": [
        "Vignanello"
      ],
      "filters": {
        "comune": "Vignanello"
      },
      "label": "Comune: Vignanello"
    },
    {
      "aliases": [
        "Pontecorvo"
      ],
      "filters": {
        "comune": "Pontecorvo"
      },
      "label": "Comune: Pontecorvo"
    },
    {
      "aliases": [
        "Roccasecca"
      ],
      "filters": {
        "comune": "Roccasecca"
      },
      "label": "Comune: Roccasecca"
    },
    {
      "aliases": [
        "Fiumicino"
      ],
      "filters": {
        "comune": "Fiumicino"
      },
      "label": "Comune: Fiumicino"
    },
    {
      "aliases": [
        "Bracciano"
      ],
      "filters": {
        "comune": "Bracciano"
      },
      "label": "Comune: Bracciano"
    },
    {
      "aliases": [
        "Ladispoli"
      ],
      "filters": {
        "comune": "Ladispoli"
      },
      "label": "Comune: Ladispoli"
    },
    {
      "aliases": [
        "Antrodoco"
      ],
      "filters": {
        "comune": "Antrodoco"
      },
      "label": "Comune: Antrodoco"
    },
    {
      "aliases": [
        "Tarquinia"
      ],
      "filters": {
        "comune": "Tarquinia"
      },
      "label": "Comune: Tarquinia"
    },
    {
      "aliases": [
        "Valentano"
      ],
      "filters": {
        "comune": "Valentano"
      },
      "label": "Comune: Valentano"
    },
    {
      "aliases": [
        "Capranica"
      ],
      "filters": {
        "comune": "Capranica"
      },
      "label": "Comune: Capranica"
    },
    {
      "aliases": [
        "Frosinone"
      ],
      "filters": {
        "comune": "Frosinone"
      },
      "label": "Comune: Frosinone"
    },
    {
      "aliases": [
        "Ferentino"
      ],
      "filters": {
        "comune": "Ferentino"
      },
      "label": "Comune: Ferentino"
    },
    {
      "aliases": [
        "Terracina"
      ],
      "filters": {
        "comune": "Terracina"
      },
      "label": "Comune: Terracina"
    },
    {
      "aliases": [
        "Canterano"
      ],
      "filters": {
        "comune": "Canterano"
      },
      "label": "Comune: Canterano"
    },
    {
      "aliases": [
        "Velletri"
      ],
      "filters": {
        "comune": "Velletri"
      },
      "label": "Comune: Velletri"
    },
    {
      "aliases": [
        "Ciampino"
      ],
      "filters": {
        "comune": "Ciampino"
      },
      "label": "Comune: Ciampino"
    },
    {
      "aliases": [
        "Frascati"
      ],
      "filters": {
        "comune": "Frascati"
      },
      "label": "Comune: Frascati"
    },
    {
      "aliases": [
        "Leonessa"
      ],
      "filters": {
        "comune": "Leonessa"
      },
      "label": "Comune: Leonessa"
    },
    {
      "aliases": [
        "Amatrice"
      ],
      "filters": {
        "comune": "Amatrice"
      },
      "label": "Comune: Amatrice"
    },
    {
      "aliases": [
        "Tuscania"
      ],
      "filters": {
        "comune": "Tuscania"
      },
      "label": "Comune: Tuscania"
    },
    {
      "aliases": [
        "Vetralla"
      ],
      "filters": {
        "comune": "Vetralla"
      },
      "label": "Comune: Vetralla"
    },
    {
      "aliases": [
        "Sabaudia"
      ],
      "filters": {
        "comune": "Sabaudia"
      },
      "label": "Comune: Sabaudia"
    },
    {
      "aliases": [
        "Priverno"
      ],
      "filters": {
        "comune": "Priverno"
      },
      "label": "Comune: Priverno"
    },
    {
      "aliases": [
        "Minturno"
      ],
      "filters": {
        "comune": "Minturno"
      },
      "label": "Comune: Minturno"
    },
    {
      "aliases": [
        "Morlupo"
      ],
      "filters": {
        "comune": "Morlupo"
      },
      "label": "Comune: Morlupo"
    },
    {
      "aliases": [
        "Subiaco"
      ],
      "filters": {
        "comune": "Subiaco"
      },
      "label": "Comune: Subiaco"
    },
    {
      "aliases": [
        "Pomezia"
      ],
      "filters": {
        "comune": "Pomezia"
      },
      "label": "Comune: Pomezia"
    },
    {
      "aliases": [
        "Ariccia"
      ],
      "filters": {
        "comune": "Ariccia"
      },
      "label": "Comune: Ariccia"
    },
    {
      "aliases": [
        "Viterbo"
      ],
      "filters": {
        "comune": "Viterbo"
      },
      "label": "Comune: Viterbo"
    },
    {
      "aliases": [
        "Ceccano"
      ],
      "filters": {
        "comune": "Ceccano"
      },
      "label": "Comune: Ceccano"
    },
    {
      "aliases": [
        "Cassino"
      ],
      "filters": {
        "comune": "Cassino"
      },
      "label": "Comune: Cassino"
    },
    {
      "aliases": [
        "Ceprano"
      ],
      "filters": {
        "comune": "Ceprano"
      },
      "label": "Comune: Ceprano"
    },
    {
      "aliases": [
        "Aprilia"
      ],
      "filters": {
        "comune": "Aprilia"
      },
      "label": "Comune: Aprilia"
    },
    {
      "aliases": [
        "Ausonia"
      ],
      "filters": {
        "comune": "Ausonia"
      },
      "label": "Comune: Ausonia"
    },
    {
      "aliases": [
        "Capena"
      ],
      "filters": {
        "comune": "Capena"
      },
      "label": "Comune: Capena"
    },
    {
      "aliases": [
        "Tivoli"
      ],
      "filters": {
        "comune": "Tivoli"
      },
      "label": "Comune: Tivoli"
    },
    {
      "aliases": [
        "Canino"
      ],
      "filters": {
        "comune": "Canino"
      },
      "label": "Comune: Canino"
    },
    {
      "aliases": [
        "Alatri"
      ],
      "filters": {
        "comune": "Alatri"
      },
      "label": "Comune: Alatri"
    },
    {
      "aliases": [
        "Anagni"
      ],
      "filters": {
        "comune": "Anagni"
      },
      "label": "Comune: Anagni"
    },
    {
      "aliases": [
        "Veroli"
      ],
      "filters": {
        "comune": "Veroli"
      },
      "label": "Comune: Veroli"
    },
    {
      "aliases": [
        "Latina"
      ],
      "filters": {
        "comune": "Latina"
      },
      "label": "Comune: Latina"
    },
    {
      "aliases": [
        "Formia"
      ],
      "filters": {
        "comune": "Formia"
      },
      "label": "Comune: Formia"
    },
    {
      "aliases": [
        "Piglio"
      ],
      "filters": {
        "comune": "Piglio"
      },
      "label": "Comune: Piglio"
    },
    {
      "aliases": [
        "Marino"
      ],
      "filters": {
        "comune": "Marino"
      },
      "label": "Comune: Marino"
    },
    {
      "aliases": [
        "Anzio"
      ],
      "filters": {
        "comune": "Anzio"
      },
      "label": "Comune: Anzio"
    },
    {
      "aliases": [
        "Rieti"
      ],
      "filters": {
        "comune": "Rieti"
      },
      "label": "Comune: Rieti"
    },
    {
      "aliases": [
        "Atina"
      ],
      "filters": {
        "comune": "Atina"
      },
      "label": "Comune: Atina"
    },
    {
      "aliases": [
        "Sezze"
      ],
      "filters": {
        "comune": "Sezze"
      },
      "label": "Comune: Sezze"
    },
    {
      "aliases": [
        "Fondi"
      ],
      "filters": {
        "comune": "Fondi"
      },
      "label": "Comune: Fondi"
    },
    {
      "aliases": [
        "Gaeta"
      ],
      "filters": {
        "comune": "Gaeta"
      },
      "label": "Comune: Gaeta"
    },
    {
      "aliases": [
        "Roma"
      ],
      "filters": {
        "comune": "Roma"
      },
      "label": "Comune: Roma"
    },
    {
      "aliases": [
        "Orte"
      ],
      "filters": {
        "comune": "Orte"
      },
      "label": "Comune: Orte"
    },
    {
      "aliases": [
        "Nepi"
      ],
      "filters": {
        "comune": "Nepi"
      },
      "label": "Comune: Nepi"
    },
    {
      "aliases": [
        "Sora"
      ],
      "filters": {
        "comune": "Sora"
      },
      "label": "Comune: Sora"
    },
    {
      "aliases": [
        "Gallicano nel Lazio",
        "Gallicano"
      ],
      "filters": {
        "comune": "Gallicano nel Lazio"
      },
      "label": "Comune: Gallicano nel Lazio"
    },
    {
      "aliases": [
        "Itri"
      ],
      "filters": {
        "comune": "Itri"
      },
      "label": "Comune: Itri"
    },
    {
      "aliases": [
        "Labico"
      ],
      "filters": {
        "comune": "Labico"
      },
      "label": "Comune: Labico"
    },
    {
      "aliases": [
        "Rocca Canterano"
      ],
      "filters": {
        "comune": "Rocca Canterano"
      },
      "label": "Comune: Rocca Canterano"
    },
    {
      "aliases": [
        "San Cesareo"
      ],
      "filters": {
        "comune": "San Cesareo"
      },
      "label": "Comune: San Cesareo"
    },
    {
      "aliases": [
        "Valmontone"
      ],
      "filters": {
        "comune": "Valmontone"
      },
      "label": "Comune: Valmontone"
    },
    {
      "aliases": [
        "Zagarolo"
      ],
      "filters": {
        "comune": "Zagarolo"
      },
      "label": "Comune: Zagarolo"
    }
  ],
  "combinations": [
    {
      "all": [
        "private",
        "children"
      ],
      "routes": [
        "private-child",
        "children",
        "young-listening"
      ]
    },
    {
      "all": [
        "private",
        "tsmree"
      ],
      "routes": [
        "private-child",
        "children"
      ]
    },
    {
      "all": [
        "day",
        "addictions"
      ],
      "routes": [
        "day-addictions",
        "addictions",
        "rehab-guide"
      ]
    },
    {
      "all": [
        "residential",
        "addictions"
      ],
      "routes": [
        "residential-addictions",
        "serd",
        "rehab-guide"
      ]
    }
  ],
  "notes": {
    "children": "L’età e i destinatari vanno verificati nelle schede. Queste sono alternative di navigazione, non indicazioni cliniche.",
    "family": "Non hai specificato l’età della persona. Puoi scegliere tra servizi per famiglie, età evolutiva, adulti e studenti.",
    "public": "La gratuità non è garantita dal nome del servizio: verifica costi, requisiti ed eventuali esenzioni.",
    "first": "Da una frase generica non è possibile scegliere un servizio clinico: queste guide spiegano da dove iniziare."
  }
};
if(typeof module === "object" && module.exports) module.exports = config;
else root.MentaConfig = config;
})(typeof window === "object" ? window : globalThis);
