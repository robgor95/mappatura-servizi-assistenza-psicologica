"""Second bounded V7.9.2 research pass: named public facilities only.
Uses the first pass cache/artifact; no user queries. >=1.25 s between new
Nominatim calls and no retry after refusal.
"""
from pathlib import Path
import json,time,re,unicodedata,urllib.parse,urllib.request,urllib.error,sys
OUT=Path(sys.argv[1]);FIRST=Path(sys.argv[2]);ROWS=json.loads(Path(sys.argv[3]).read_text())
geo=json.loads((FIRST/'geocode-results.json').read_text());cache=json.loads((FIRST/'nominatim-v7-9-2.json').read_text())
old=json.loads((Path(__file__).resolve().parents[1]/'data/presidi_geo_v7_9_1.json').read_text())
UA='LazioMentalHealthMap/7.9.2 named-facility-maintenance (+https://github.com/robgor95/mappatura-servizi-assistenza-psicologica)'
def norm(s):return re.sub(r'[^a-z0-9]+',' ',unicodedata.normalize('NFKD',str(s)).encode('ascii','ignore').decode().lower()).strip()
def generic(name):
 n=norm(name)
 return n.startswith('dsm ') or 'riferimento organizzativo' in n or n in {'il colle','insieme onlus'}
candidates=[]
for r in ROWS:
 if old['records'].get(r['key'],{}).get('lat') is not None:continue
 if generic(r['name']):continue
 first=geo['records'].get(r['key'],{}).get('results',[])
 # prioritize zero-result address searches and named hospitals/communities
 score=(0 if first else 10)+(5 if any(x in norm(r['name']) for x in ['ospedale','spdc','villa','comunita','centro diurno','csm','serd']) else 0)
 candidates.append((score,r))
candidates.sort(key=lambda x:(-x[0],x[1]['key']))
calls=0;last=0;out={}
for _,r in candidates[:45]:
 q=', '.join([r['name'],r['address'],r['town'],'Lazio','Italia'])
 key='v792name|'+norm(q)
 if key not in cache:
  wait=1.25-(time.monotonic()-last)
  if wait>0:time.sleep(wait)
  params={'q':q,'format':'jsonv2','addressdetails':1,'limit':5,'countrycodes':'it','accept-language':'it'}
  url='https://nominatim.openstreetmap.org/search?'+urllib.parse.urlencode(params)
  req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/json'})
  try:
   with urllib.request.urlopen(req,timeout=35) as z:matches=json.load(z)
  except urllib.error.HTTPError as e:
   raise SystemExit('Nominatim refused '+str(e.code)+'; stopped without retry')
  cache[key]={'query':params,'results':matches,'checked_at':'2026-09-22'};calls+=1;last=time.monotonic()
 out[r['key']]=cache[key]
OUT.mkdir(parents=True,exist_ok=True)
(OUT/'name-results.json').write_text(json.dumps({'version':'7.9.2','requests_this_run':calls,'records':out},ensure_ascii=False,indent=2))
(OUT/'nominatim-v7-9-2.json').write_text(json.dumps(cache,ensure_ascii=False,indent=2))
print(json.dumps({'queries':len(out),'requests':calls,'with_results':sum(bool(x['results']) for x in out.values())},indent=2))
