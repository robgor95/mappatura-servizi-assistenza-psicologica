# V7.10 — supporto territoriale, accesso sociosanitario e numeri utili

Baseline stabile: `2ad2126b5c972ce49956607e368fc45b3fc4f7e6`. Data del riesame: 23 settembre 2026.

## Cosa cambia

V7.10 aggiunge un livello distinto dal database clinico:

- **135 Consultori Familiari** nel master corrente pubblicato da Salute Lazio;
- **47 sedi/punti PUA** trascritti da fonti ASL/comunali correnti acquisite;
- **6 servizi/linee di emergenza sociale** documentati, compresi PIS territoriali e la Sala Operativa Sociale di Roma;
- una pagina **“Ho bisogno di aiuto adesso”** che distingue 112/118, 116117, emergenza sociale, 1522 e 114;
- nuovi percorsi Menta per PUA, PIS, fragilità sociale e Case della Comunità.

I **442 servizi clinici** non vengono aumentati, rimossi o riclassificati. TSMREE/NPIA e DCA/DNA continuano a essere ricercati nel database specialistico.

## Privacy e sicurezza

Le ricerche nel nuovo elenco sono elaborate nel browser e il dataset viene caricato dallo stesso dominio. Nessuna geolocalizzazione del dispositivo, geocodifica live, tracking o invio del testo a servizi esterni.

Le **Case Rifugio** non vengono mappate né pubblicate. Per l'antiviolenza il portale rimanda esclusivamente alle sedi CAV che la Regione pubblica come punti di accesso e al 1522.

## Copertura

Il master dei Consultori è completo rispetto alla fonte regionale consultata. La trascrizione puntuale dei PUA e dei PIS **non è dichiarata esaustiva**: in assenza di una rubrica regionale unica corrente vengono pubblicati solo i recapiti acquisiti e verificabili.

## Rollback

Branch checkpoint: `v7.9.3-stable-before-social-services` → `2ad2126b5c972ce49956607e368fc45b3fc4f7e6`.

## Indicizzazione

Resta disattivata: meta robots e intestazioni HTTP noindex, sitemap non annunciata in robots.txt.
