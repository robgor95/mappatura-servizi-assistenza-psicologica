# Menta — risorse locali V7.10.1

`menta-base-v7-10-1.webp` è la base visuale corrente della mascotte: WebP trasparente, 480×494 px, ottimizzato per la resa responsive e per le animazioni CSS già presenti. Il file è versionato per evitare cache stale durante il deploy Cloudflare Pages.

`menta-base.webp` resta nel repository come asset precedente e riferimento di rollback.

`accessori.svg` contiene sei simboli vettoriali: lente, libro, tocco universitario, zaino, cuffia/telefono e checklist. Sono sovrapposti alla base nei soli contesti di orientamento utili. L’ascolto usa una variazione di orientamento della base; accoglienza e ricerca restano riconoscibili.

Gli stati dinamici (`idle`, `listening`, `searching`, `found`, `choice`, `empty`, `urgent`, `error`) restano gestiti da CSS/JavaScript locale. Nessun dato clinico è affidato all’espressione della mascotte e `prefers-reduced-motion` continua a disattivare il movimento.

Tutte le figure sono decorative: `alt=""`, `aria-hidden="true"` e testo adiacente esplicito.
