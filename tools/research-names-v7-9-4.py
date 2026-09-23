"""V7.9.4 second targeted geography pass: named facilities only."""
from pathlib import Path
import json,time,urllib.parse,urllib.request,urllib.error,sys
OUT=Path(sys.argv[1]);OUT.mkdir(parents=True,exist_ok=True)
UA='LazioMentalHealthMap/7.9.4 named-facility-maintenance (+https://github.com/robgor95/mappatura-servizi-assistenza-psicologica)'
targets=[
 {'id':'san-giovanni','q':'Ospedale San Giovanni Addolorata, Roma, Italia','services':['rete:NET-019']},
 {'id':'alatri-san-benedetto','q':'Ospedale San Benedetto, Alatri, Italia','services':['rete:FR-03','rete:NET-074']},
 {'id':'sora-trinita','q':'Ospedale SS. Trinità, Sora, Italia','services':['rete:NET-076']},
 {'id':'formia-dono-svizzero','q':'Ospedale Dono Svizzero, Formia, Italia','services':['rete:NET-085']},
 {'id':'rieti-salaria36','q':'Poliambulatorio ASL Rieti, Via Salaria per Roma 36, Rieti, Italia','services':['rete:RI-02','rete:RI-05','rete:RI-07']},
 {'id':'poggio-mirteto','q':'Poliambulatorio ASL, Poggio Mirteto, Italia','services':['rete:RI-03','rete:RI-06']},
 {'id':'magliano-ospedale','q':'Ospedale Marzio Marini, Magliano Sabina, Italia','services':['rete:RI-12']},
 {'id':'fiamignano-presidio','q':'Presidio Sanitario Peschieta di Fiamignano, Italia','services':['rete:RI-04','rete:NET-064']},
]
last=0;out=[]
for t in targets:
 wait=1.3-(time.monotonic()-last)
 if wait>0:time.sleep(wait)
 params={'q':t['q'],'format':'jsonv2','addressdetails':1,'limit':5,'countrycodes':'it','accept-language':'it'}
 req=urllib.request.Request('https://nominatim.openstreetmap.org/search?'+urllib.parse.urlencode(params),headers={'User-Agent':UA,'Accept':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=35) as r:matches=json.load(r)
 except urllib.error.HTTPError as e:raise SystemExit('Nominatim refused '+str(e.code)+'; stopped without retry')
 last=time.monotonic();out.append({**t,'query':params,'results':matches})
(OUT/'named-facilities.json').write_text(json.dumps({'version':'7.9.4','checked_at':'2026-09-23','requests':len(targets),'targets':out},ensure_ascii=False,indent=2))
print(json.dumps({'requests':len(targets),'with_results':sum(bool(x['results']) for x in out)},indent=2))
