# Geografia V7.9 — 2026-09-22

Baseline `498195783ca07dff14dd4f3640e7e2fae3598e06`. Tutti i servizi restano ricercabili, anche senza pin.

| Misura | Prima | Dopo |
|---|---:|---:|
| Servizi | 432 | 440 |
| Localizzati | 195 | 236 |
| Corrispondenza cartografica al civico | 55 | 58 |
| Posizione sulla via | 140 | 178 |
| Non localizzati | 237 | 204 |

## Qualità e limiti

{
  "services_before": 432,
  "services_after": 440,
  "located_before": 195,
  "address_before": 55,
  "street_before": 140,
  "unlocated_before": 237,
  "located_after": 236,
  "address_after": 58,
  "street_after": 178,
  "other_approximation_after": 0,
  "unlocated_after": 204,
  "quality_counts": {
    "D": 204,
    "A": 13,
    "C": 223
  },
  "newly_located_original_237": 46,
  "new_services_located": 6,
  "previous_points_removed_as_uncertain": 11,
  "previous_street_upgraded_to_address": 0,
  "manually_reviewed_pin_corrections": 1,
  "uncertain_cases_rejected": 39,
  "coordinate_changes": 1,
  "provider_new_cached_queries": 385,
  "provider_legacy_cached_queries": 301
}

Le 58 corrispondenze cartografiche al civico NON sono 58 ingressi verificati. Solo i record A hanno anche prova documentale per campo dell’indirizzo del servizio; C conserva esplicitamente l’incertezza. Nessun ingresso è stato verificato. B non assegnato senza riscontri sufficienti. D/E non producono pin.

46 dei 237 record originali non localizzati hanno ora un pin, e 6 degli 8 nuovi servizi sono localizzati. 11 pin precedenti sono ritirati per ambiguità; rimangono nel confronto storico. Nessuna delle 140 posizioni precedentemente sulla via è stata promossa al civico in questo ciclo.

Metodo: cache OSM, comune e strada coerenti, civico completo quando presente, controllo poligonale del Lazio, rigetto di vie troppo estese e candidati distanti. Nessun centroide comunale. La cache è riusata, non esistono richieste geocodifica nel browser. I tasselli sono caricati solo su attivazione volontaria.

## Pin precedenti corretti o ritirati

- `rete:R3-08`: removed_uncertain_previous. Nessun pin: candidati omonimi o segmenti troppo distanti
- `rete:LT-09`: corrected_coordinate. Coordinate OSM confrontate con comune, strada e, quando disponibile, civico. Non verificano l’ingresso fisico né l’operatività del servizio.
- `rete:NET-038`: removed_uncertain_previous. Nessun pin: via troppo estesa per un pin univoco
- `moduli:MOD-046`: removed_uncertain_previous. Nessun pin: indirizzo non sufficiente o nessun riscontro cartografico coerente
- `moduli:MOD-058`: removed_uncertain_previous. Nessun pin: candidati omonimi o segmenti troppo distanti
- `moduli:MOD-107`: removed_uncertain_previous. Nessun pin: via troppo estesa per un pin univoco
- `moduli:MOD-115`: removed_uncertain_previous. Nessun pin: via troppo estesa per un pin univoco
- `moduli:MOD-101`: removed_uncertain_previous. Nessun pin: via troppo estesa per un pin univoco
- `moduli:MOD-102`: removed_uncertain_previous. Nessun pin: via troppo estesa per un pin univoco
- `privati:PRI-010`: removed_uncertain_previous. Nessun pin: indirizzo non sufficiente o nessun riscontro cartografico coerente
- `privati:PRI76-004`: removed_uncertain_previous. Nessun pin: indirizzo sorgente non consolidato
- `privati:PRI76-005`: removed_uncertain_previous. Nessun pin: indirizzo sorgente non consolidato

Le directory università, scuole, ascolto e helpline restano separate. La loro geografia non è stata ampliata: prima occorre distinguere sedi effettive, appuntamenti e destinatari.
