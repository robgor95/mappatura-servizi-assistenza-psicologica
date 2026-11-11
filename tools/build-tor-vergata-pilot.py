#!/usr/bin/env python3
"""Build Tor Vergata data using the V7.18 base, preserving stable IDs and provenance.
Distances are straight-line only. Never infer entrances, coverage or eligibility.
"""
import json, math, sys
from pathlib import Path
CAMPUS_LAT,CAMPUS_LON = 41.852760,12.628480
MAX_KM=12.0
def haversine(lat1,lon1,lat2,lon2):
    r=math.pi/180.0
    x=math.sin((lat2-lat1)*r/2)**2+math.cos(lat1*r)*math.cos(lat2*r)*math.sin((lon2-lon1)*r/2)**2
    return 12742.0*math.asin(min(1.0,math.sqrt(x)))
def km(lat,lon):
    return haversine(CAMPUS_LAT,CAMPUS_LON,lat,lon)
# Indicative public places at verified Tor Vergata campus addresses; they are
# not department entrances or medical facility pins.
CAMPUSES=[
 {'id':'rettorato','name':'Rettorato / Giurisprudenza','name_en':'Rectorate / Law',
  'address':'Via Cracovia 50, Roma','lat':CAMPUS_LAT,'lon':CAMPUS_LON,
  'source':'https://web.uniroma2.it/it/contenuto/dove_siamo'},
 {'id':'economia','name':'Economia','name_en':'Economics','address':'Via Columbia 2, Roma',
  'lat':41.853635,'lon':12.623771,
  'source':'https://turismoroma.it/it/luoghi/biblioteca-dellarea-economica-vilfredo-pareto-universit%C3%A0-tor-vergata'},
 {'id':'ingegneria','name':'Ingegneria','name_en':'Engineering','address':'Via del Politecnico 1, Roma',
  'lat':41.85508,'lon':12.62219,'source':'https://mapcarta.com/W79133126'},
 {'id':'lettere','name':'Lettere e Filosofia','name_en':'Humanities','address':'Via Columbia 1, Roma',
  'lat':41.85184,'lon':12.62135,'source':'https://turismoroma.it/en/places/biblioteca-dellarea-letteraria-storica-filosofica-universit%C3%A0-tor-vergata'},
 {'id':'medicina','name':'Medicina e Chirurgia','name_en':'Medicine',
  'address':'Via Montpellier 1, Roma','lat':41.85657,'lon':12.63392,
  'source':'https://turismoroma.it/en/places/biblioteca-dellarea-biomedica-paolo-m-fasella-universit%C3%A0-tor-vergata'},
 {'id':'scienze','name':'Scienze MM.FF.NN.','name_en':'Sciences',
  'address':'Via della Ricerca Scientifica 1, Roma','lat':41.85319,'lon':12.605375,
  'source':'https://turismoroma.it/it/luoghi/biblioteca-dellarea-scientifico-tecnologica-universit%C3%A0-tor-vergata'},
]
def links(items):
    return list(dict.fromkeys(x for x in items if isinstance(x,str) and x.startswith("https://")))[:6]
def clean(s):
    v=str(s or "").strip()
    return "" if v.lower().startswith(("nd —","non documentat","non indicat")) else v
def build(root,output):
    root,output=Path(root),Path(output)
    catalog=json.loads((root/"data/editorial-catalog-v7-18.json").read_text(encoding="utf-8"))
    geo=json.loads((root/"data/presidi_geo_v7_16.json").read_text(encoding="utf-8"))
    universities=json.loads((root/"data/universita_v7_5.json").read_text(encoding="utf-8"))
    assert len(catalog["records"])==680 and catalog["clinical"]==443 and catalog["support"]==237
    assert geo["summary"]["located_after"]==379
    nearby=[]
    for r in catalog["records"]:
        if r.get("entity")!="clinical": continue
        p=geo["records"].get(r["key"])
        f=r.get("fields") or {}
        if not p or not isinstance(p.get("lat"),(int,float)) or not isinstance(p.get("lng"),(int,float)):continue
        if p.get("source_address")!=f.get("address") or p.get("source_town")!=f.get("town"):continue
        if p.get("quality") not in ("A","B","C") or p.get("precision") not in ("address","street","building","approximate"):continue
        if not str(p.get("source_url","")).startswith("https://"):continue
        d=km(p["lat"],p["lng"])
        if min(haversine(c['lat'],c['lon'],p['lat'],p['lng']) for c in CAMPUSES)>MAX_KM:continue
        nearby.append({
            "key":r["key"],"name":clean(f.get("name")),"type":clean(f.get("type")),
            "subtype":clean(f.get("subtype")),"asl":clean(r.get("asl")),
            "town":clean(f.get("town")),"address":clean(f.get("address")),
            "phone":clean(f.get("phone")),"email":clean(f.get("email")),"website":clean(f.get("website")),
            "hours":clean(f.get("hours")),"access":clean(f.get("access")),"latitude":p["lat"],
            "longitude":p["lng"],"distance_km":round(d,2),"quality":p["quality"],
            "precision":p["precision"],"entrance_verified":False,
            "sources":links((r.get("sources") or [])+[p["source_url"]])
        })
    nearby.sort(key=lambda x:(x["distance_km"],x["name"]))
    assert sum(x["distance_km"]<=12 for x in nearby)==52, "Rettorato 12km baseline changed"
    assert sum(x["distance_km"]<=8 for x in nearby)==19
    assert len({x["key"] for x in nearby})==len(nearby)
    university=[]
    for r in universities["records"]:
        if r.get("id") not in ("UNI-004","UNI-005"):continue
        university.append({
            "id":r["id"],"title":r["servizio"],"audience":r["destinatari"],
            "summary":r["tipologia"],"price":clean(r.get("gratuita_costo")),
            "place":clean(r.get("sede")),"email":clean(r.get("email")),
            "phone":clean(r.get("telefono")),"access":clean(r.get("prenotazione")),
            "source":r["fonte_ufficiale"],"checked_at":r.get("ultima_verifica")
        })
    assert len(university)==2
    # Source reconciliation on 2026-11-02. Regional V7.18 data remain unchanged.
    # Current, dedicated university pages take precedence over older generic summaries.
    by_id={r["id"]:r for r in university}
    by_id["UNI-004"].update({
        "place":"Sede da confermare al momento dell'appuntamento",
        "access":"Invia una email con il tuo recapito telefonico e la richiesta di un appuntamento.",
        "source":"https://web.uniroma2.it/contenuto/sportello-ptv-per-studenti-e-studentesse",
        "checked_at":"2026-11-11",
    })
    by_id["UNI-005"].update({
        "price":"Gratuito", "email":"livigni@med.uniroma2.it",
        "place":"Sede da concordare con il servizio",
        "access":"Invia una email con il tuo recapito telefonico e la richiesta di un appuntamento.",
        "source":"https://web.uniroma2.it/contenuto/counselling-psicologico-per-il-personale-dellateneo",
        "checked_at":"2026-11-11",
    })
    official="https://orientamento.uniroma2.it/conta-su-di-noi-servizi-di-supporto-agli-studenti/"
    university += [
        {"id":"TV-CARIS-COUNSELLING","title":"Counselling psicologico CARIS — studenti",
         "audience":"Studenti e studentesse dell'Ateneo Tor Vergata",
         "summary":"Servizio di ascolto psicologico per gli studenti; la pagina ufficiale descrive un percorso di circa otto incontri. Le condizioni attuali vanno confermate.",
         "price":"","place":"Edificio Didattica Macroarea di Ingegneria, aula Progetti CARIS (primo piano). La pagina indica giovedì 09:00–14:00: verificare prima di recarsi in sede.",
         "email":"segreteria@caris.uniroma2.it","phone":"",
         "access":"Prenotazione tramite email alla segreteria CARIS; nell'oggetto: Richiesta counselling psicologico. Verificare disponibilità e orari.",
         "source":"https://caris.uniroma2.it/counselling-psicologico/","checked_at":"2026-11-11"},
        {"id":"TV-FIRSTPOINT","title":"First Point — Spazio Tutela e Ascolto",
         "audience":"Studentesse, studenti e comunità universitaria",
         "summary":"Ascolto riservato, orientamento e percorsi di tutela in caso di disagio, discriminazioni o violenza. Non è un pronto soccorso.",
         "price":"","place":"Sportelli in più facoltà e presso il Rettorato, con sedi e orari differenziati",
         "email":"","phone":"","access":"Consulta le sedi per ciascun giorno. Mediazione culturale: lunedì 10:00–17:00, Facoltà di Medicina, edificio B, 2° piano, stanza 2B2; italiano, inglese e farsi. Confermare orari e accesso.",
         "source":"https://sostenibile.uniroma2.it/sportelli-dedicati-dedicated-help-desks/","checked_at":"2026-11-02"},
        {"id":"TV-PROBEN","title":"Pro-Ben — Benessere degli studenti",
         "audience":"Studentesse e studenti",
         "summary":"Workshop, gruppi di confronto e possibili percorsi individuali per il benessere psicofisico degli studenti.",
         "price":"","place":"Università di Roma Tor Vergata",
         "email":"sportellostudenti@uniroma2.it","phone":"","access":"Per informazioni su iniziative e disponibilità, consulta la pagina ufficiale oppure contatta lo sportello indicato dall'Ateneo.",
         "source":official,"checked_at":"2026-11-02"}
    ]
    assert len(university)==5, f"University resources: {len(university)}"
    order={"UNI-004":0,"TV-CARIS-COUNSELLING":1,"TV-PROBEN":2,"TV-FIRSTPOINT":3,"UNI-005":4}
    university.sort(key=lambda r:order.get(r["id"],999))
    data={
       "schema_version":2,"campuses":CAMPUSES,"pilot":"tor-vergata","source_branch":"main",
       "source_version":"7.18",
       "source_baselines":["data/editorial-catalog-v7-18.json","data/presidi_geo_v7_16.json","data/universita_v7_5.json"],
       "center":{"name":"Rettorato Tor Vergata — Via Cracovia 50","lat":CAMPUS_LAT,"lon":CAMPUS_LON,
                 "source":"https://www.turismoroma.it/it/luoghi/biblioteca-dellarea-giuridica-universit%C3%A0-tor-vergata"},
       "max_radius_km":MAX_KM,"default_radius_km":8,"count_8km":19,"count_12km":52,
       "limits":"Distanza in linea d'aria dal Rettorato, non dal singolo dipartimento. Localizzazioni indicative e ingressi non verificati. Servizi senza coordinate esclusi dal filtro geografico.",
       "clinical":nearby,"university":university
    }
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Tor Vergata: ",len(nearby),"records near any of 6 campuses; 19 within 8km of Rectorate;",len(university),"university resources")
if __name__=="__main__":
    if len(sys.argv)!=3:raise SystemExit("usage: build-tor-vergata-pilot.py REPOSITORY OUTPUT_JSON")
    build(sys.argv[1],sys.argv[2])
