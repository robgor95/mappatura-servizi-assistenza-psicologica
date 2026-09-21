"""One-time preparation ONLY, never used by the public site.
OSMF Nominatim policy: one process/machine, >1 second/request, cached fixed
public addresses, identifying User-Agent, no retry on refusal, no grid queries.
Outputs are CANDIDATES, not verified coordinates and not published automatically.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode
from urllib.error import HTTPError
import json, re, time, unicodedata, datetime, sys, hashlib
R=Path(__file__).resolve().parents[1]
O=Path(sys.argv[1]); O.mkdir(parents=True,exist_ok=True)
rows=json.loads((O/'map-rows.json').read_text())
old=json.loads((R/'data/presidi_geo_v7_8.json').read_text())['records']
seed=json.loads((R/'downloads/Geocoding_Cache_V7_8.json').read_text())
cache={'legacy':seed,'queries':{}}
cp=O/'candidate-cache.json'
if cp.exists(): cache=json.loads(cp.read_text())
def norm(s): return re.sub(r'[^a-z0-9]+',' ',unicodedata.normalize('NFD',str(s)).encode('ascii','ignore').decode().lower()).strip()
def clean(a,t):
 a=re.sub(r'\([^)]*\)','',a)
 a=re.split(r'\s[—–]\s|\s\||;|(?:,\s*)?(?:primo|secondo|terzo|quarto|piano|padiglione|palazzina|c/o)\b',a,flags=re.I)[0]
 a=re.sub(r',?\s*'+re.escape(t)+r'\s*$','',a,flags=re.I)
 a=re.sub(r'\bS\.\s*Maria\b','Santa Maria',a,flags=re.I)
 a=re.sub(r'\bS\.\s*Lucia\b','Santa Lucia',a,flags=re.I)
 return re.sub(r'\s+',' ',a).strip(' ,.').replace('s.n.c.','snc')
queue=[]
for r in rows:
 p=old.get(r['key']); a=clean(r['address'],r['town']); t=r['town']
 if p and p['precision']=='address': continue
 if not a or re.search('non document|da verific|da conferm|da consolid|^nd$',norm(a+' '+t)): continue
 if p:
  queries=[a+', '+t+', Lazio, Italia']
 else:
  queries=[a+', '+t+', Lazio, Italia']
  road=re.sub(r'[, ]+(?:n\.?\s*)?\d.*$','',a,flags=re.I).strip()
  if road!=a: queries.append(road+', '+t+', Lazio, Italia')
 for q in queries:
  queue.append({'service_key':r['key'],'source_address':r['address'],'source_town':t,'query':q,'name':r['name']})
calls=0; last=0; candidates=[];stop=None
for item in queue:
 q=item['query']; key=norm(q)
 if key not in cache['queries']:
  if calls>=240: stop='fixed request budget reached';break
  time.sleep(max(0,1.3-(time.monotonic()-last)));last=time.monotonic()
  params={'q':q,'countrycodes':'it','format':'jsonv2','addressdetails':1,'limit':5,'accept-language':'it'}
  req=Request('https://nominatim.openstreetmap.org/search?'+urlencode(params),headers={'User-Agent':'LazioPresidiAudit/7.9 (one-time fixed public-address audit; https://github.com/robgor95/mappatura-servizi-assistenza-psicologica)','Accept':'application/json'})
  try:
   with urlopen(req,timeout=20) as resp: result=json.load(resp)
  except HTTPError as e:
   stop='Provider HTTP '+str(e.code)+'; stopped, no retry';break
  except Exception as e:
   stop='Network error; stopped, no retry: '+str(e);break
  cache['queries'][key]={'query':params,'results':result,'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat()};calls+=1
  cp.write_text(json.dumps(cache,ensure_ascii=False))
  if calls%20==0: print('Cached new queries',calls,flush=True)
 candidates.append(dict(item,cache_key=key))
(O/'candidate-requests.json').write_text(json.dumps({'candidates':candidates,'queued':len(queue),'calls':calls,'stop':stop},ensure_ascii=False,indent=2))
print(json.dumps({'calls':calls,'candidates':len(candidates),'stop':stop}),flush=True)
# Download a bounded selection of already identified official pages for local review.
# Page bodies are evidence snapshots, never executable and never used as instructions.
urls=['https://www.nuoviorizzonti.org/wp-content/uploads/2025/01/CartaDeiServizi.pdf','https://www.ilpontecivitavecchia.it/wp-content/uploads/2020/01/IL_PONTE_CV_CARTA_SERVIZI.pdf','https://www.ilpontecivitavecchia.it/','https://www.cooperate.it/home.html','https://www.cooperate.it/servizi/bracciano.html','https://reverie.it/strutture/','https://www.aslroma1.it/presidi-territoriali/centro-di-salute-mentale-plinio']
S=O/'official-snapshots';S.mkdir(exist_ok=True);index=[]
for u in urls:
 key=hashlib.sha256(u.encode()).hexdigest()[:16]
 try:
  with urlopen(Request(u,headers={'User-Agent':'LazioServiceAudit/7.9 (documentary verification)'}),timeout=25) as resp: body=resp.read(15000000);ct=resp.headers.get('Content-Type','');final=resp.url
  ext='.pdf' if 'pdf' in ct else '.html';(S/(key+ext)).write_bytes(body)
  index.append({'url':u,'file':key+ext,'final_url':final,'sha256':hashlib.sha256(body).hexdigest(),'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat()})
 except Exception as e: index.append({'url':u,'error':str(e)})
 time.sleep(1)
(S/'index.json').write_text(json.dumps(index,indent=2))
