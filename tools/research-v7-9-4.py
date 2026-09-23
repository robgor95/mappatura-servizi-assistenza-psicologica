"""V7.9.4 targeted research: exact named health facilities + multisite inventory.
One-time maintenance only. No browser/user queries. Nominatim requests are
bounded, sequential (>=1.3s), cached in the artifact, and never shipped live.
"""
from pathlib import Path
import json,time,urllib.parse,urllib.request,urllib.error,hashlib,sys,re
OUT=Path(sys.argv[1]); OUT.mkdir(parents=True,exist_ok=True)
ROWS=json.loads(Path(sys.argv[2]).read_text())
UA='LazioMentalHealthMap/7.9.4 targeted-maintenance (+https://github.com/robgor95/mappatura-servizi-assistenza-psicologica)'
DATE='2026-09-23'
targets=[
 {'id':'rieti-salaria36','q':'Via Salaria per Roma 36, Rieti, Lazio, Italia','services':['rete:RI-02','rete:RI-05','rete:RI-07']},
 {'id':'poggio-finocchieto1','q':'Via Finocchieto 1, Poggio Mirteto, Rieti, Lazio, Italia','services':['rete:RI-03','rete:RI-06']},
 {'id':'fiamignano-gismondi2','q':'Via Don Agostino Gismondi 2, Peschieta di Fiamignano, Rieti, Lazio, Italia','services':['rete:RI-04','rete:NET-064']},
 {'id':'magliano-filoni1','q':'Vocabolo Filoni 1, Magliano Sabina, Rieti, Lazio, Italia','services':['rete:RI-12']},
 {'id':'san-giovanni-spdc','q':'Azienda Ospedaliera San Giovanni Addolorata, Via Santo Stefano Rotondo 5, Roma, Italia','services':['rete:NET-019']},
 {'id':'alatri-san-benedetto','q':'Ospedale San Benedetto, Localita Chiappitto, Alatri, Frosinone, Italia','services':['rete:FR-03','rete:NET-074']},
 {'id':'cassino-santa-scolastica','q':'Ospedale Santa Scolastica, Via San Pasquale, Cassino, Frosinone, Italia','services':['rete:NET-075']},
 {'id':'sora-ss-trinita','q':'Ospedale SS Trinita, Localita San Marciano, Sora, Frosinone, Italia','services':['rete:NET-076']},
 {'id':'formia-dono-svizzero','q':'Ospedale Dono Svizzero, Via Appia lato Napoli, Formia, Latina, Italia','services':['rete:NET-085']},
 {'id':'monterotondo-csm','q':"Viale dell'Aeronautica 53, Monterotondo, Roma, Italia",'services':['rete:NET-044']},
]
by={r['key']:r for r in ROWS}
calls=0; last=0.0; results=[]
for t in targets:
    missing=[k for k in t['services'] if k not in by]
    if missing:
        results.append({**t,'error':'missing service keys','missing':missing}); continue
    wait=1.3-(time.monotonic()-last)
    if wait>0: time.sleep(wait)
    params={'q':t['q'],'format':'jsonv2','addressdetails':1,'limit':5,'countrycodes':'it','accept-language':'it'}
    url='https://nominatim.openstreetmap.org/search?'+urllib.parse.urlencode(params)
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=35) as r: matches=json.load(r)
    except urllib.error.HTTPError as e:
        raise SystemExit('Nominatim refused '+str(e.code)+'; stopped without retry')
    calls+=1; last=time.monotonic()
    results.append({**t,'query':params,'results':matches})
(OUT/'target-geocode.json').write_text(json.dumps({'version':'7.9.4','checked_at':DATE,'requests':calls,'targets':results},ensure_ascii=False,indent=2))

# Current database inventory for multi-site managers and open administrative cases.
terms=['insieme','ali del ponte','il ponte','colle cesarano','villa pia','gabbiano tirreno','reverie','febo','abaton']
inv=[]
for r in ROWS:
    blob=json.dumps(r,ensure_ascii=False).lower()
    hit=[x for x in terms if x in blob]
    if hit:
        inv.append({'key':r['key'],'name':r['name'],'town':r['town'],'address':r['address'],'type':r['type'],'subtype':r['subtype'],'origin':r['origin'],'hits':hit,'raw':r['raw']})
(OUT/'current-multisite-inventory.json').write_text(json.dumps({'version':'7.9.4','count':len(inv),'records':inv},ensure_ascii=False,indent=2))

# Manager-declared Lazio health-site inventory captured as research assertions;
# downstream builder must still compare each item against current database.
manager_inventory={
 'comunita_insieme':[
  ['S.R.T.R. Progetto Insieme Castelforte','Via de Gasperi 2, Castelforte (LT)'],
  ['S.R.S.R. Venere e Marte','Via Ausente, Cerri Aprano (LT)'],
  ['S.R.T.R. Insieme 1','Via Penitro a Monte snc, Formia (LT)'],
  ['S.R.T.R. Insieme 2','Via Ausente Km 2,750, Santi Cosma e Damiano (LT)'],
  ['S.R.T.R. Insieme','Via Ausente angolo Cerri Aprano, Santi Cosma e Damiano (LT)'],
  ['S.R.T.R. Insieme Ausonia','Contrada Orfanotrofio snc, Ausonia (FR)'],
  ['S.R.S.R. Alberto Pezzi','Via Ausente Km 2,750, Santi Cosma e Damiano (LT)'],
  ['S.R.S.R. Insieme Spigno','Via S. Pellico 7/9, Spigno Saturnia (LT)'],
  ['S.R.S.R. Redzep Sestovic','Via Cerri Aprano, Santi Cosma e Damiano (LT)'],
 ],
 'le_ali_del_ponte':[
  ['Programma terapeutico minori/adolescenti','Via dell’Amba Aradam 25 + Via Veneto 30/C, Civitavecchia (RM)'],
  ['Programma Coccinella','Via Veneto 30/C, Civitavecchia (RM)'],
  ['Centro studi','Via dell’Amba Aradam 25 + Via Isonzo 34, Civitavecchia (RM)'],
  ['La Formica','Via Isonzo 34, Civitavecchia (RM)'],
 ]
}
(OUT/'manager-declared-inventory.json').write_text(json.dumps(manager_inventory,ensure_ascii=False,indent=2))
print(json.dumps({'requests':calls,'targets':len(targets),'multisite_records_current':len(inv)},indent=2))
