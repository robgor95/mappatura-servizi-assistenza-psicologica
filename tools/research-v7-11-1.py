"""One-off research only. Candidates require manual association; no production writes.
Public sources plus one regional ODbL extract. No live geocoder or map tiles.
Run on the research branch; dependencies: requests, beautifulsoup4, osmium, shapely.
"""
from pathlib import Path
import json,gzip,hashlib,time,re,urllib.parse,os
import requests
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[1]; O=Path(os.environ.get('RESEARCH_OUT','/tmp/v7111-research'));O.mkdir(parents=True,exist_ok=True)
S=requests.Session();S.headers['User-Agent']='LazioServiceAudit/7.11.1 (public service directory; documentary research)'
urls=[
'https://www.aslroma1.it/presidi-territoriali/centro-salute-mentale-boccea',
'https://www.aslroma1.it/presidi-territoriali/centro-salute-mentale-innocenzo-iv',
'https://www.aslroma1.it/salute-mentale',
'https://www.aslroma1.it/presidi-territoriali/serd-nomentana-2b',
'https://www.aslroma1.it/presidi-territoriali/polo-integrato-salute-mentale-cassia',
'https://www.asl.rieti.it/organizzazione-aziendale/dipartimenti/dipartimento-promozione-e-tutela-della-salute-mentale/uosd-csm/csm-distretto-1',
'https://www.asl.rieti.it/organizzazione-aziendale/dipartimenti/dipartimento-promozione-e-tutela-della-salute-mentale/csm-distretto-2',
'https://www.aslroma4.it/strutture-sanitarie/strutture-di-salute-mentale',
'https://www.asl.fr.it/strutture/dipartimenti/dipartimento-di-salute-mentale-e-delle-patologie-da-dipendenza/uoc-salute-mentale-frosinone-alatri-anagni-sora/',
'https://www.asl.fr.it/strutture/dipartimenti/dipartimento-di-salute-mentale-e-delle-patologie-da-dipendenza/uoc-patologie-da-dipendenza-frosinone-alatri-anagni-sora/',
'https://www.asl.fr.it/strutture/dipartimenti/dipartimento-di-salute-mentale-e-delle-patologie-da-dipendenza/uosd-disturbi-del-comportamento-alimentare/',
'https://www.asl.fr.it/strutture/dipartimenti/dipartimento-di-salute-mentale-e-delle-patologie-da-dipendenza/uoc-residenzialita-e-semiresidenzialita/',
'https://www.ausl.latina.it/dipartimenti/31-azienda/449-dsm',
'https://gestivar.it/contatti/',
'https://www.ghcspa.com/samadi/contatti',
'https://www.maieusis.org/contatti/',
'https://comunitamondonuovo.it/category/centri-accreditati/',
'https://www.comunitainsieme.com/strutture/',
'https://www.exodus.it/sedi-exodus/cassino.html',
'https://reverie.it/strutture/la-comunita-terapeutica-riabilitativa-residenziale-di-capena-ctc-1/',
'https://www.aslroma3.it/dipartimenti/dipartimento-di-salute-mentale/uoc-salute-mentale-distretto-sanitario-municipio-xii/'
]
records=[]
for u in urls:
 d={'url':u,'retrieved_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())};time.sleep(1.2)
 try:
  r=S.get(u,timeout=(6,15));d.update(status=r.status_code,final_url=r.url,sha256=hashlib.sha256(r.content).hexdigest())
  soup=BeautifulSoup(r.content,'html.parser'); d['title']=soup.title.get_text(' ',strip=True) if soup.title else ''
  # Text stored in short-lived research artifact, not in production data.
  for el in soup.select('script,style,nav,header,footer'):el.decompose()
  d['text']=soup.get_text(' ',strip=True)[:65000];d['maps']=[]
  for el in soup.select('iframe[src],iframe[data-src],a[href]'):
   target=el.get('src') or el.get('data-src') or el.get('href') or ''
   if not re.search(r'maps|goo\.gl',target,re.I):continue
   # Strip public embedded API-key parameters; never use them.
   parsed=urllib.parse.urlsplit(urllib.parse.urljoin(r.url,target));q=urllib.parse.parse_qsl(parsed.query,keep_blank_values=True)
   target=urllib.parse.urlunsplit(parsed._replace(query=urllib.parse.urlencode([(k,v) for k,v in q if k.lower()!='key'])))
   m={'url':target,'label':el.get_text(' ',strip=True),'near':el.parent.get_text(' ',strip=True)[:500]}
   if re.match(r'https://(?:maps\.app\.goo\.gl|goo\.gl/maps)/',target):
    rr=S.get(target,allow_redirects=False,timeout=(5,10));m['redirect']=rr.headers.get('Location');m['redirect_status']=rr.status_code
   d['maps'].append(m)
 except Exception as e:d['error']=str(e)[:250]
 records.append(d);print('SOURCE',u,d.get('status'),flush=True)
(O/'sources.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
url='https://download.openstreetmap.fr/extracts/europe/italy/lazio-latest.osm.pbf';pbf=O/'lazio.osm.pbf'
meta={'url':url,'license':'ODbL-1.0','attribution':'OpenStreetMap contributors','retrieved_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
with S.get(url,timeout=(15,180),stream=True) as r:
 r.raise_for_status();meta['last_modified']=r.headers.get('Last-Modified')
 with pbf.open('wb') as f:
  for chunk in r.iter_content(1024*1024):f.write(chunk)
meta.update(bytes=pbf.stat().st_size,sha256=hashlib.file_digest(pbf.open('rb'),'sha256').hexdigest())
import osmium
from shapely import wkb
from shapely.geometry import Polygon,LineString,mapping
features=[];boundaries=[];factory=osmium.geom.WKBFactory()
def useful(t):return bool(t.get('name') or t.get('addr:housenumber') or t.get('healthcare') or t.get('amenity') in ['hospital','clinic','doctors','social_facility'])
class Extract(osmium.SimpleHandler):
 def node(self,n):
  t=dict(n.tags)
  if useful(t) and n.location.valid():features.append({'osm_type':'node','osm_id':n.id,'version':n.version,'tags':t,'lat':n.location.lat,'lng':n.location.lon,'kind':'node'})
 def way(self,w):
  t=dict(w.tags)
  if not useful(t):return
  try:
   pts=[(n.lon,n.lat) for n in w.nodes];g=Polygon(pts) if len(pts)>3 and pts[0]==pts[-1] else LineString(pts)
   if g.is_empty:return
   p=g.representative_point() if g.geom_type=='Polygon' else g.interpolate(.5,normalized=True)
   features.append({'osm_type':'way','osm_id':w.id,'version':w.version,'tags':t,'lat':p.y,'lng':p.x,'kind':'building' if t.get('building') else 'road' if t.get('highway') else 'site','bounds':list(g.bounds),'geometry':mapping(g)})
  except Exception:pass
 def area(self,a):
  t=dict(a.tags)
  if t.get('boundary')=='administrative' and t.get('admin_level') in ['4','6','8']:
   try:boundaries.append({'osm_type':'way' if a.from_way() else 'relation','osm_id':a.orig_id(),'tags':t,'geometry':json.loads(osmium.geom.GeoJSONFactory().create_multipolygon(a))})
   except Exception:pass
  elif not a.from_way() and useful(t):
   try:
    g=wkb.loads(factory.create_multipolygon(a),hex=True);p=g.representative_point();features.append({'osm_type':'relation','osm_id':a.orig_id(),'tags':t,'lat':p.y,'lng':p.x,'kind':'site','bounds':list(g.bounds),'geometry':mapping(g)})
   except Exception:pass
Extract().apply_file(str(pbf),locations=True)
with gzip.open(O/'features.json.gz','wt',encoding='utf-8') as f:json.dump(features,f,ensure_ascii=False)
with gzip.open(O/'boundaries.json.gz','wt',encoding='utf-8') as f:json.dump(boundaries,f,ensure_ascii=False)
meta.update(features=len(features),boundaries=len(boundaries));(O/'osm-manifest.json').write_text(json.dumps(meta,indent=2)+'\n');pbf.unlink()
print(json.dumps(meta),flush=True)
