"""One-time preparation only. No Nominatim requests; no browser integration.
OSM regional extract is downloaded once and parsed locally. Source snapshots
are research artifacts only, not an automatic publication of unreviewed data.
"""
from pathlib import Path
import sys, json, hashlib, gzip, time, concurrent.futures, urllib.parse, threading, collections
import requests
from bs4 import BeautifulSoup
OUT=Path(sys.argv[1]);OUT.mkdir(parents=True,exist_ok=True)
BASE='937713935c693dbbe50109e6738063cc0395e192'
UA='LazioServicesDocumentaryAudit/7.9.1 (+https://github.com/robgor95/mappatura-servizi-assistenza-psicologica)'
rows=json.loads(Path(sys.argv[2]).read_text())
seeds=[
'https://gabbianotirreno.it/',
'https://gabbianotirreno.it/strutture/villa-adriana',
'https://gabbianotirreno.it/strutture/villanova',
'https://gabbianotirreno.it/strutture/villaggio-adriano',
'https://gabbianotirreno.it/strutture/castel-madama',
'https://gabbianotirreno.it/strutture/rocca-canterano',
'https://gabbianotirreno.it/strutture/villa-pia',
'https://www.nuoviorizzonti.org/contatti/',
'https://www.nuoviorizzonti.org/trasparenza/',
'https://www.nuoviorizzonti.org/wp-content/uploads/2025/01/Bilancio-sociale-ODV_2025.pdf',
'https://www.aslroma5.it/amministrazione-trasparente/strutture-sanitarie-private-accreditate/',
'https://www.kormed.it/strutture/colle-cesarano/',
'https://www.cooperate.it/servizi/bracciano.html',
'https://reverie.it/strutture/',
'https://www.comunitainsieme.com/strutture/',
'https://comunitamondonuovo.it/category/centri-accreditati/'
]
allowed=('aslroma1.it','aslroma2.it','aslroma3.it','aslroma4.it','aslroma5.it','aslroma6.it','asl.rieti.it','asl.vt.it','asl.fr.it','ausl.latina.it')
urls=list(seeds)
for r in rows:
 for u in r['sources']:
  host=urllib.parse.urlparse(u).hostname or ''
  if host.removeprefix('www.') in allowed and '.pdf' not in u.lower() and '/amministrazione' not in u and '/AlboOnLine' not in u and 'trasparenza' not in u and 'index.php/62-cittadini' not in u:
   urls.append(u)
urls=list(dict.fromkeys(urls))[:165]
locks=collections.defaultdict(threading.Lock)
def fetch(u):
 key=hashlib.sha256(u.encode()).hexdigest()[:20];prefix=OUT/'sources'/key;prefix.parent.mkdir(exist_ok=True)
 with locks[urllib.parse.urlparse(u).hostname]:
  info={'url':u,'key':key,'retrieved_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
  try:
   r=requests.get(u,headers={'User-Agent':UA},timeout=20);info.update(status=r.status_code,final_url=r.url,content_type=r.headers.get('Content-Type',''),sha256=hashlib.sha256(r.content).hexdigest(),bytes=len(r.content))
   if r.status_code==200:
    pdf=r.content.startswith(b'%PDF');path=prefix.with_suffix('.pdf' if pdf else '.html');path.write_bytes(r.content);info['file']=str(path.relative_to(OUT))
    if not pdf:
     soup=BeautifulSoup(r.content,'html.parser');info['links']=[{'text':a.get_text(' ',strip=True),'url':urllib.parse.urljoin(r.url,a['href'])} for a in soup.select('a[href]')]
     info['map_embeds']=[e.get('src','') for e in soup.select('iframe[src]')]
     for e in soup(['script','style','header','footer','nav']):e.decompose()
     prefix.with_suffix('.txt').write_text(soup.get_text('\n',strip=True),encoding='utf-8')
  except Exception as e:info['error']=str(e)
  time.sleep(.3)
 return info
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:results=list(pool.map(fetch,urls))
# Follow only explicitly named administrative unit contracts and latest mission report.
extra=[]
for r in results:
 if 'strutture-sanitarie-private-accreditate' in r['url']:
  extra += [x['url'] for x in r.get('links',[]) if x['text'].startswith('Gabbiano Tirreno') and '.pdf' in x['url']]
 if r['url'].endswith('/trasparenza/'):
  extra += [x['url'] for x in r.get('links',[]) if 'Relazione Missione ODV 2025' in x['text']]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results+=list(pool.map(fetch,list(dict.fromkeys(extra))))
(OUT/'source-index.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print('Source snapshots:',sum(x.get('status')==200 for x in results),'/',len(results),flush=True)
# One regional ODbL extract; never request map tiles or geocode end-user input.
u='https://download.openstreetmap.fr/extracts/europe/italy/lazio-latest.osm.pbf'
pbf=OUT/'lazio.osm.pbf';meta={'url':u,'license':'ODbL-1.0','attribution':'OpenStreetMap contributors','retrieved_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
if not pbf.exists():
 with requests.get(u,headers={'User-Agent':UA},timeout=180,stream=True) as r:
  r.raise_for_status();meta['last_modified']=r.headers.get('Last-Modified')
  with pbf.open('wb') as f:
   for chunk in r.iter_content(1024*1024):f.write(chunk)
meta.update(sha256=hashlib.file_digest(pbf.open('rb'),'sha256').hexdigest(),bytes=pbf.stat().st_size)
import osmium
from shapely import wkb
from shapely.geometry import mapping,Polygon,LineString
factory=osmium.geom.WKBFactory()
features=[];towns=[]
def useful(t):return 'addr:housenumber' in t or 'healthcare' in t or t.get('amenity') in ['hospital','clinic','doctors','social_facility'] or t.get('social_facility') or (t.get('highway') and t.get('name'))
class Extract(osmium.SimpleHandler):
 def node(self,n):
  t=dict(n.tags)
  if useful(t) and n.location.valid():features.append({'osm_type':'node','osm_id':n.id,'tags':t,'lat':n.location.lat,'lng':n.location.lon,'kind':'node'})
 def way(self,w):
  t=dict(w.tags)
  if not useful(t):return
  try:
   pts=[(n.lon,n.lat) for n in w.nodes];geom=Polygon(pts) if len(pts)>3 and pts[0]==pts[-1] else LineString(pts)
   if geom.is_empty:return
   p=geom.representative_point() if geom.geom_type=='Polygon' else geom.interpolate(.5,normalized=True)
   features.append({'osm_type':'way','osm_id':w.id,'tags':t,'lat':p.y,'lng':p.x,'bounds':list(geom.bounds),'kind':'building' if t.get('building') else 'road' if t.get('highway') else 'site','geometry':mapping(geom)})
  except Exception:pass
 def area(self,a):
  t=dict(a.tags)
  if t.get('boundary')=='administrative' and t.get('admin_level') in ['4','6','8']:
   try:towns.append({'osm_type':'way' if a.from_way() else 'relation','osm_id':a.orig_id(),'tags':t,'geometry':json.loads(osmium.geom.GeoJSONFactory().create_multipolygon(a))})
   except Exception:pass
  elif not a.from_way() and useful(t):
   try:
    geom=wkb.loads(factory.create_multipolygon(a),hex=True);p=geom.representative_point();features.append({'osm_type':'relation','osm_id':a.orig_id(),'tags':t,'lat':p.y,'lng':p.x,'bounds':list(geom.bounds),'kind':'site','geometry':mapping(geom)})
   except Exception:pass
Extract().apply_file(str(pbf),locations=True)
with gzip.open(OUT/'osm-features.json.gz','wt',encoding='utf-8') as f:json.dump(features,f,ensure_ascii=False)
with gzip.open(OUT/'osm-boundaries.json.gz','wt',encoding='utf-8') as f:json.dump(towns,f,ensure_ascii=False)
meta.update(features=len(features),boundaries=len(towns));(OUT/'osm-manifest.json').write_text(json.dumps(meta,indent=2))
pbf.unlink()
print('Offline OSM extract:',len(features),'features;',len(towns),'boundaries',flush=True)
