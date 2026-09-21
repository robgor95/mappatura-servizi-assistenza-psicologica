# Mappatura servizi di assistenza psicologica — Lazio

Repository del portale pubblico **Mappatura servizi di assistenza psicologica nel Lazio**.

Sito di produzione: https://mappatura-servizi-assistenza-psicologica.pages.dev/

## Struttura

Il repository contiene il portale statico, i dataset, le guide ai percorsi di cura e i file scaricabili.

## Deploy

Il progetto Cloudflare Pages esistente è un progetto **Direct Upload**. Il deploy continuo viene quindi eseguito da GitHub Actions tramite Wrangler sul progetto:

`mappatura-servizi-assistenza-psicologica`

Sono richiesti due repository secret:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

Il token Cloudflare deve avere il permesso **Account / Cloudflare Pages / Edit**.

Il workflow non tenta il deploy se `index.html` non è presente.
