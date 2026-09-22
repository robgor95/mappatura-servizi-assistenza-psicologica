"""Offline point matching from one cached OSM Lazio extract. No network.
Street candidates require a matching municipality polygon and a bounded street
extent. Civic candidates require the exact number/suffix; no interpolation.
Named-campus decisions are explicitly selected and retain service uncertainty.
"""
import json,gzip,re,unicodedata,math,collections,sys,copy,hashlib
from pathlib import Path
from shapely.geometry import shape,Point
ROOT=Path(__file__).resolve().parents[1];R=Path(sys.argv[1]); rows=json.loads(Path(sys.argv[2]).read_text());DATE='2026-09-22'
features=json.load(gzip.open(R/'osm-features.json.gz','rt')); bounds=json.load(gzip.open(R/'osm-boundaries.json.gz','rt'))
old=json.loads((ROOT/'data/presidi_geo_v7_9.json').read_text()); ops=json.loads((ROOT/'data/audit_operativo_v7_9_1.json').read_text()); rev={e['service_key']:e for e in ops['revisions']};adds={e['service_key']:e for e in ops['additions']}
manifest=json.loads((R/'osm-manifest.json').read_text())
def norm(s):return re.sub('[^a-z0-9]+',' ',unicodedata.normalize('NFKD',str(s).replace('’',"'")).encode('ascii','ignore').decode().lower()).strip()
def street(s):
 s=norm(s);s=re.sub(r'\b(km|snc)\b.*$','',s);return re.split(r'\b\d',s)[0].strip()
def key(s):return ' '.join(re.sub(r'\b(via|viale|piazza|piazzale|corso|largo|vicolo|strada|localita|dei|degli|delle|della|dell|del|di|d|de|da|la|il|lo)\b',' ',s).split())
def civic(s):
 if re.search(r'\bkm\b',s,re.I):return ''
 m=re.search(r'(?:,\s*|\s+)(\d+)\s*(?:/\s*([a-zA-Z])|\b([a-zA-Z])\b)?',s)
 return (m[1]+(m[2] or m[3] or '')).lower() if m else ''
polys={norm(f['tags'].get('name','')):shape(f['geometry']) for f in bounds if f['tags'].get('admin_level')=='8'}
lazio=shape(json.loads((ROOT/'downloads/Lazio_Boundary_OSM_V7_9.geojson').read_text())['features'][0]['geometry']) if 'features' in json.loads((ROOT/'downloads/Lazio_Boundary_OSM_V7_9.geojson').read_text()) else shape(json.loads((ROOT/'downloads/Lazio_Boundary_OSM_V7_9.geojson').read_text()))
idx=collections.defaultdict(list);byid={}
for i,f in enumerate(features):
 byid[f['osm_type']+':'+str(f['osm_id'])]=i
 for n in set([key(norm(f['tags'].get('addr:street',''))),key(norm(f['tags'].get('name',''))) ]):
  if n:idx[n].append(i)
alias={'cialdini':'emilio cialdini','cardinale pietro parente':'cardinal pietro parente','a gasperi':'alcide gasperi'}
def span(ids):
 xs=[];ys=[]
 for i in ids:
  f=features[i]; b=f.get('bounds',[f['lng'],f['lat'],f['lng'],f['lat']]);xs+=b[::2];ys+=b[1::2]
 return math.hypot((max(xs)-min(xs))*83,(max(ys)-min(ys))*111) if xs else 0
# Curated hospital/site correspondence. These are campus approximations, never entrances.
campuses={'rete:NET-017':'way:23036615','rete:NET-018':'way:299911839','rete:NET-033':'relation:12948721','rete:NET-054':'way:655734059','rete:NET-061':'way:655734059','rete:NET-062':'way:24981934','rete:NET-066':'way:442731711','rete:NET-084':'way:232973552','rete:NET-091':'way:58401584','rete:NET-092':'way:1423072811'}
# Do not choose between two different San Sebastiano campus polygons without documentary reconciliation.
records={};decisions=[];selected={};retired=[]
def savefeature(f):
 u=f"https://www.openstreetmap.org/{f['osm_type']}/{f['osm_id']}";selected[u]={k:v for k,v in f.items() if k!='geometry'};return u
for row in rows:
 sk=row['key'];p=copy.deepcopy(old['records'].get(sk,{}));poly=polys.get(norm(row['town']));proof=None
 e=rev.get(sk)
 if e and 'indirizzo' in e['fields']:proof=e['evidence']['indirizzo']['sources'][0]
 if sk in adds:proof=adds[sk]['sources'][0]
 previous=copy.deepcopy(p);candidate=None;rejections=[]
 if p.get('lat') and (p.get('source_address')!=row['address'] or p.get('source_town')!=row['town']):
  # A spelling normalization on the same street may retain a STREET point only.
  same=norm(p.get('source_town'))==norm(row['town']) and key(street(p.get('source_address','')))==key(street(row['address']))
  if not(same and p.get('precision')=='street'):p={};rejections.append('Previous point invalidated by changed address/municipality')
  else:p.update(source_address=row['address'],source_town=row['town'])
 if p.get('lat') and (not lazio.covers(Point(p['lng'],p['lat'])) or (poly is not None and not poly.buffer(.00015).covers(Point(p['lng'],p['lat'])))):
  retired.append({'service_key':sk,'previous':p,'reason':'Outside current municipality/region polygon'});p={}
 if poly is not None:
  name=key(street(row['address']));ns={name,alias.get(name,name)}
  ids=[i for i in set(i for n in ns for i in idx.get(n,[])) if poly.covers(Point(features[i]['lng'],features[i]['lat']))]
  n=civic(row['address']);exact=[i for i in ids if n and norm(features[i]['tags'].get('addr:housenumber','')).replace(' ','')==n]
  roads=[i for i in ids if features[i]['kind']=='road']
  # Multiple OSM entries for the same civic accepted only if spatially coherent (<80m).
  if exact and span(exact)<=.08:
   chosen=sorted(exact,key=lambda i:(features[i]['kind']!='building',features[i]['osm_type'],features[i]['osm_id']))[0]
   candidate={'f':features[chosen],'precision':'address','quality':'A' if proof else 'C','method':'Corrispondenza offline OSM: via, comune e civico/suffisso esatti; nessuna interpolazione','note':'Coordinate del civico/edificio cartografico, non dell’ingresso sanitario.','ids':exact}
  elif exact:rejections.append('Ambiguous same-number candidates beyond 80 metres')
  if not p.get('lat') and not candidate and roads:
   extent=span(roads)
   if extent<=2.5:
    f=features[max(roads,key=lambda i:shape(features[i]['geometry']).length)]
    candidate={'f':f,'precision':'street','quality':'C','method':'Corrispondenza offline del nome della via nel poligono comunale; punto su tratto cartografico','note':f'Posizione soltanto indicativa sulla via (estensione cartografica circa {round(extent*1000)} m); civico e ingresso non localizzati.','ids':roads,'street_extent_m':round(extent*1000)}
   else:rejections.append('Street too long for a new unambiguous pin (>2.5 km)')
 if sk in campuses:
  f=features[byid[campuses[sk]]]
  if poly is not None and poly.covers(Point(f['lng'],f['lat'])):
   candidate={'f':f,'precision':'building','quality':'C','method':'Riesame manuale del nome del complesso ospedaliero nel dataset e del comune; geometria OSM offline','note':'Punto rappresentativo del complesso ospedaliero. Reparto, ingresso e operatività corrente non verificati da questa localizzazione.','ids':[byid[campuses[sk]]]}
 # Seven distinct Colle Cesarano services share the manager-published campus coordinate.
 if sk in {f'moduli:MOD-{n:03d}' for n in range(22,29)}:
  u='https://www.kormed.it/strutture/colle-cesarano/';x=next(x for x in json.loads((R/'source-index.json').read_text()) if x['url']==u)
  from bs4 import BeautifulSoup
  soup=BeautifulSoup((R/x['file']).read_text(),'html.parser');ob=[json.loads(s.string or s.text) for s in soup.select('script[type="application/ld+json"]')]
  def findgeo(o):
   if isinstance(o,dict):
    if o.get('@type')=='GeoCoordinates':return o
    for v in o.values():
     z=findgeo(v)
     if z:return z
   elif isinstance(o,list):
    for v in o:
     z=findgeo(v)
     if z:return z
  g=findgeo(ob);lat=float(g['latitude']);lng=float(g['longitude']);assert poly.covers(Point(lng,lat)) and lazio.covers(Point(lng,lat))
  candidate={'direct':True,'lat':lat,'lng':lng,'source_url':u,'precision':'building','quality':'A','method':'Coordinate del complesso pubblicate dal gestore in JSON-LD; indirizzo confrontato con elenco ASL','note':'Posizione del complesso Colle Cesarano, condivisa da più servizi. Non localizza i singoli moduli né gli ingressi.','ids':[]}
 if candidate and (not p.get('lat') or (candidate['precision']=='address' and p.get('precision')=='street') or candidate.get('direct')):
  c=candidate;f=c.get('f');u=c.get('source_url') or savefeature(f)
  p={'lat':c.get('lat',f['lat'] if f else None),'lng':c.get('lng',f['lng'] if f else None),'precision':c['precision'],'quality':c['quality'],'method':c['method'],'note':c['note'],'source_url':u,'checked_at':DATE,'coordinate_source_checked_at':DATE,'source_address':row['address'],'source_town':row['town'],'represents':'complesso/edificio' if c['precision']=='building' else 'civico cartografico' if c['precision']=='address' else 'via','entrance_verified':False}
  if 'street_extent_m' in c:p['street_extent_m']=c['street_extent_m']
  for i in c['ids']:savefeature(features[i])
  decisions.append({'service_key':sk,'action':'upgraded' if previous.get('lat') else 'newly_located','previous_precision':previous.get('precision'),'precision':p['precision'],'source_url':u,'method':p['method'],'note':p['note']})
 elif p.get('lat') and p.get('precision')=='address' and proof and p.get('source_address')==row['address'] and p.get('quality')!='A':
  p.update(quality='A',address_checked_at=DATE,address_source_url=proof)
  decisions.append({'service_key':sk,'action':'documentary_upgrade_only','precision':p['precision'],'source_url':proof,'note':'Coordinate precedenti invariate; ora indirizzo documentato nella fonte specifica.'})
 if not p.get('lat'):
  p={'lat':None,'lng':None,'precision':'none','quality':'E' if norm(row['town']) not in polys else 'D','checked_at':DATE,'method':'Nessuna corrispondenza cartografica sufficientemente univoca','note':'; '.join(rejections) or 'Indirizzo/civico da localizzare; nessun centroide comunale usato.','source_url':proof or (row['sources'][0] if row['sources'] else None)}
  if previous.get('lat'):retired.append({'service_key':sk,'previous':previous,'reason':'Current address no longer matches old point'})
 if proof:p['address_source_url']=proof;p['address_checked_at']=DATE
 p.update(service_key=sk,source_address=row['address'],source_town=row['town'],comune=row['town'],entrance_verified=False)
 # Every update must be inside region; geo coverage never silently drops an ID.
 if p.get('lat'):assert lazio.covers(Point(p['lng'],p['lat'])) and poly is not None and poly.buffer(.00015).covers(Point(p['lng'],p['lat'])),sk
 records[sk]=p
 if rejections:decisions.append({'service_key':sk,'action':'rejected_candidate','reasons':rejections})
summary={'services_before':440,'services_after':len(rows),'located_before':236,'located_after':sum(p.get('lat') is not None for p in records.values()),'address_after':sum(p['precision']=='address' for p in records.values()),'street_after':sum(p['precision']=='street' for p in records.values()),'building_after':sum(p['precision']=='building' for p in records.values()),'quality_counts':dict(collections.Counter(p['quality'] for p in records.values())),'unlocated_after':sum(p.get('lat') is None for p in records.values()),'newly_located_previous_204':sum(not old['records'].get(k,{}).get('lat') and p.get('lat') is not None for k,p in records.items() if k in old['records']),'new_services_located':sum(k not in old['records'] and p.get('lat') is not None for k,p in records.items()),'street_to_address':sum(old['records'].get(k,{}).get('precision')=='street' and p['precision']=='address' for k,p in records.items()),'retired_old_points':len(retired),'entrances_verified':0,'new_geocoding_api_requests':0}
out={'version':'7.9.1','baseline_commit':'937713935c693dbbe50109e6738063cc0395e192','generated_at':DATE,'summary':summary,'license':'ODbL-1.0 for OSM derived positions; manager-sourced coordinates individually attributed','attribution':'OpenStreetMap contributors','method_note':'Preparazione offline, nessuna geocodifica nel browser. Livello documentale distinto dal tipo di punto.','records':records}
(ROOT/'data/presidi_geo_v7_9_1.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
(ROOT/'downloads/Decisioni_Geografia_V7_9_1.json').write_text(json.dumps({'summary':summary,'decisions':decisions,'retired':retired},ensure_ascii=False,indent=2)+'\n')
(ROOT/'downloads/Cache_OSM_Offline_V7_9_1.json').write_text(json.dumps({'manifest':manifest,'queries_to_nominatim':0,'selected_features':selected,'municipalities_checked':sorted(set(r['town'] for r in rows))},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(summary,indent=2))
