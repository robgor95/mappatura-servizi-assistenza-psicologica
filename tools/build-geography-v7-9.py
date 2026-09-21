"""Offline geographic review. No network. No municipal centroids or entrance claims."""
from pathlib import Path
import json,re,math,unicodedata,collections,sys,hashlib
from shapely.geometry import shape,Point
R=Path(__file__).resolve().parents[1];C=Path(sys.argv[1]);rows=json.loads(Path(sys.argv[2]).read_text());old=json.loads((R/'data/presidi_geo_v7_8.json').read_text());audit=json.loads((R/'data/audit_operativo_v7_9.json').read_text());cache=json.loads((C/'candidate-cache.json').read_text());boundary_json=json.loads((C/'lazio-boundary-response.json').read_text());boundary=shape(boundary_json[0]['geojson'])
assert boundary_json[0]['address']['state']=='Lazio' or boundary_json[0]['name']=='Lazio'
def norm(s):return re.sub(r'[^a-z0-9]+',' ',unicodedata.normalize('NFD',str(s or '')).encode('ascii','ignore').decode().lower()).strip()
def dist(a,b):return math.hypot((float(a['lat'])-float(b['lat']))*111320,(float(a.get('lon',a.get('lng')))-float(b.get('lon',b.get('lng'))))*82800)
def boxdiag(c):
 try:b=list(map(float,c['boundingbox']));return math.hypot((b[1]-b[0])*111320,(b[3]-b[2])*82800)
 except (KeyError,ValueError):return float('inf')
stop=set('via viale piazza piazzale largo strada localita contrada corso vicolo dei degli di della delle dell de da del a al alle allo l la il lo san santa santo sant don fra padre fratelli'.split())
def parts(address,town=''):
 s=re.sub(r'\([^)]*\)','',address).replace('’',"'")
 s=re.sub(r'[, ]+'+re.escape(town)+r'\b.*$','',s,flags=re.I) if town else s
 s=re.split(r'\s[—–]\s|\s\||;|\b(?:primo|secondo|terzo|quarto|piano|padiglione|palazzina|scala|interno|zona|c/o)\b',s,flags=re.I)[0].strip(' ,')
 km=bool(re.search(r'\bkm\b',s,re.I));snc=bool(re.search(r'\bs\.?n\.?c\.?\b',s,re.I));civic=None
 if not km and not snc:
  m=re.search(r'[, ]+(?:n\.?\s*)?(\d{1,4}(?:\s*[/\-]\s*(?:[a-z]|\d{1,4}))*[a-z]?)(?:\s*$|\s*[,–—])',s,re.I)
  if m:civic=re.sub(r'\s','',m[1]).lower();s=s[:m.start()]
 s=re.split(r'\bkm\b|\bs\.?n\.?c\.?\b|\s[-–—]\s',s,flags=re.I)[0]
 return norm(s),civic,km
aliases={'guidonia':'guidonia montecelio','ss cosma e damiano':'santi cosma e damiano','peschieta di fiamignano':'fiamignano'}
def townnorm(s):return aliases.get(norm(s),norm(s))
def matches_road(raw,candidate):
 a={t for t in norm(raw).split() if t not in stop and len(t)>1};b={t for t in norm(candidate).split() if t not in stop and len(t)>1}
 return bool(a and b and a<=b)
pool={}
for namespace in ['legacy','queries']:
 for k,v in cache[namespace].items():
  for c in v['results']:
   ident=(c.get('osm_type'),c.get('osm_id'));data=dict(c);data['_cache_namespace']=namespace;data['_cache_key']=k;data['_checked_at']=v.get('checked_at','2026-09-21')
   if ident not in pool or namespace=='queries':pool[ident]=data
pool=list(pool.values())
def address_proof(r):
 e=next((x for x in audit['revisions']+audit['additions'] if x['service_key']==r['key'] and x.get('address_evidence')=='official'),None)
 if e:return {'url':e['sources'][0],'checked_at':e['checked_at'],'kind':'fonte ufficiale ASL/gestore riesaminata V7.9'}
 v=(r.get('v76')or{}).get('campi',{}).get('indirizzo')
 if v and v.get('fonti') and norm(v['valore'])==norm(r['address']):return {'url':v['fonti'][0]['url'],'checked_at':v['verificato_il'],'kind':'verifica documentale per campo conservata dalla V7.6; non ridatata'}
 if r['key']=='rete:R1-02':return {'url':'https://www.aslroma1.it/presidi-territoriali/centro-di-salute-mentale-plinio','checked_at':'2026-09-22','kind':'pagina ASL acquisita nel riesame V7.9'}
 return None
results={};rejected=[];transitions=[];decisions=[]
for r in rows:
 key=r['key'];road,civic,km=parts(r['address'],r['town']);proof=address_proof(r);prev=old['records'].get(key);hits=[];reasons=collections.Counter();candidates_considered=[]
 placeholder=bool(re.search(r'non document|da verificar|da conferm|non consolid|^nd\b|sedi varie',norm(r['address'])))
 conflict=key=='moduli:MOD-038'
 for c in pool:
  ad=c.get('address',{});cr=ad.get('road')or ad.get('pedestrian')or ad.get('square')or''
  if not cr or not matches_road(road,cr):continue
  if townnorm(r['town']) not in {townnorm(ad.get(k)) for k in ['city','town','village','municipality','hamlet']}:continue
  candidates_considered.append(c)
  if placeholder:reasons['indirizzo sorgente non consolidato']+=1;continue
  if not boundary.covers(Point(float(c['lon']),float(c['lat']))) or norm(ad.get('state'))!='lazio':reasons['fuori dal confine Lazio o regione non coerente']+=1;continue
  house=re.sub(r'\s','',str(ad.get('house_number',''))).lower();exact=bool(civic and house==civic)
  if house and not exact:
   if not civic or house not in re.split(r'[/\-]',civic) or any(t.isalpha() for t in re.split(r'[/\-]',civic)):
    reasons['civico diverso o non confrontabile']+=1;continue
   precision='approximate'
  elif exact:precision='address'
  else:
   if c.get('addresstype') not in ['road','pedestrian','square'] and c.get('category') not in ['highway','place']:
    reasons['POI privo di civico, non prova la sede']+=1;continue
   if boxdiag(c)>2000:reasons['via troppo estesa per un pin univoco']+=1;continue
   precision='street'
  if conflict and precision!='street':reasons['conflitto documentale sul civico']+=1;continue
  hits.append((precision,c))
 priorities={'address':0,'street':1,'approximate':2};hits.sort(key=lambda h:(priorities[h[0]],str(h[1].get('osm_type')),h[1].get('osm_id',0)))
 chosen=None
 if hits:
  top=[x for x in hits if x[0]==hits[0][0]];spread=max([dist(a[1],b[1]) for a in top for b in top]or[0])
  if spread>(150 if top[0][0]=='address' else 1500):reasons['candidati omonimi o segmenti troppo distanti']+=1
  else:chosen=top[0]
 if prev and chosen:
  same=[h for h in hits if abs(float(h[1]['lat'])-prev['lat'])<1e-7 and abs(float(h[1]['lon'])-prev['lng'])<1e-7]
  if same and priorities[same[0][0]]==priorities[chosen[0]]:chosen=same[0]
 info={'service_key':key,'source_address':r['address'],'source_town':r['town'],'comune':r['town'],'checked_at':'2026-09-22','address_source_url':proof['url'] if proof else (r['sources'][0] if r['sources'] else None),'address_checked_at':proof['checked_at'] if proof else None,'address_evidence':proof['kind'] if proof else 'Indirizzo del dataset precedente, non ricontrollato nella fonte in questo ciclo','entrance_verified':False}
 if chosen:
  precision,c=chosen;quality='A' if precision=='address' and proof else 'C'
  pin_kind='edificio/complesso' if precision=='address' and c.get('category') in ['amenity','building','healthcare'] else 'civico' if precision=='address' else 'via' if precision=='street' else 'altra approssimazione'
  note='Coordinate OSM confrontate con comune, strada e, quando disponibile, civico. Non verificano l’ingresso fisico né l’operatività del servizio.'
  if quality=='C' and precision=='address':note+=' Corrispondenza automatica al civico: documentazione dell’indirizzo del servizio non ancora riesaminata.'
  if km:note+=' Chilometrica non verificata: il pin indica soltanto un tratto della via.'
  if conflict:note+=' Il civico 2/36 resta in conflitto; nessuna posizione precisa.'
  if key=='rete:NET-002':note+=' Punto del complesso San Filippo Neri; il padiglione A dello SPDC non è localizzato separatamente.'
  info.update(lat=float(c['lat']),lng=float(c['lon']),quality=quality,precision=precision,pin_kind=pin_kind,method='Geocodifica offline cached + confronto conservativo indirizzo/comune/civico + confine Lazio OSM',source_url=f"https://www.openstreetmap.org/{c['osm_type']}/{c['osm_id']}",matched_address=c['display_name'],cache_ref=c['_cache_namespace']+':'+c['_cache_key'],coordinate_source_checked_at=c['_checked_at'],note=note)
  if prev is None:action='new_location'
  elif dist({'lat':prev['lat'],'lng':prev['lng']},c)>3:action='corrected_coordinate'
  elif prev['precision']=='street' and precision=='address':action='precision_improved'
  else:action='retained_or_reclassified'
  if key=='rete:NET-002':info['manual_review']='Corrispondenza ufficiale Via Martinotti 20 / Ospedale San Filippo Neri verificata; precedente punto dipartimentale scartato.'
  decisions.append({'service_key':key,'action':action,'precision':precision,'quality':quality,'source_url':info['source_url']})
 else:
  quality='E' if re.search(r'non document|^nd\b|da verificar',norm(r['town'])) else 'D'
  info.update(lat=None,lng=None,quality=quality,precision='none',pin_kind='nessuno',source_url=info['address_source_url'],method='Nessun candidato univoco accettato',note='Nessun pin: '+('; '.join(reasons) if reasons else 'indirizzo non sufficiente o nessun riscontro cartografico coerente'))
  if candidates_considered or prev:rejected.append({'service_key':key,'source_address':r['address'],'reason':info['note'],'had_previous_pin':bool(prev),'candidate_osm_ids':[str(c['osm_type'])+':'+str(c['osm_id']) for c in candidates_considered]})
  action='removed_uncertain_previous' if prev else 'unlocated'
 if prev and (not chosen or dist({'lat':prev['lat'],'lng':prev['lng']},{'lat':info['lat'],'lng':info['lng']})>3):
  info['previous_v7_8']={'lat':prev['lat'],'lng':prev['lng'],'source_address':prev['source_address'],'precision':prev['precision']};transitions.append({'service_key':key,'action':action,'previous':info['previous_v7_8'],'current':{'lat':info['lat'],'lng':info['lng'],'precision':info['precision']},'reason':info['note']})
 results[key]=info
counts=collections.Counter(p['precision'] for p in results.values());grades=collections.Counter(p['quality'] for p in results.values());located=[p for p in results.values() if p['lat'] is not None];oldids=set(old['records']);newids={a['service_key'] for a in audit['additions']}
summary={'services_before':432,'services_after':len(rows),'located_before':195,'address_before':55,'street_before':140,'unlocated_before':237,'located_after':len(located),'address_after':counts['address'],'street_after':counts['street'],'other_approximation_after':counts['approximate'],'unlocated_after':len(rows)-len(located),'quality_counts':dict(grades),'newly_located_original_237':sum(p['service_key'] not in oldids and p['service_key'] not in newids for p in located),'new_services_located':sum(p['service_key'] in newids for p in located),'previous_points_removed_as_uncertain':sum(k in oldids and v['lat'] is None for k,v in results.items()),'previous_street_upgraded_to_address':sum(k in oldids and old['records'][k]['precision']=='street' and v['precision']=='address' for k,v in results.items()),'manually_reviewed_pin_corrections':sum('manual_review' in p for p in located),'uncertain_cases_rejected':len(rejected),'coordinate_changes':len([x for x in transitions if x['current']['lat'] is not None]),'provider_new_cached_queries':len(cache['queries']),'provider_legacy_cached_queries':len(cache['legacy'])}
output={'version':'7.9','baseline_commit':audit['baseline_commit'],'generated_at':'2026-09-22','summary':summary,'quality_levels':{'A':'Indirizzo/civico documentato da fonte ufficiale, posizione cartografica coerente; ingresso non verificato','B':'Indirizzo/civico coerente da più fonti affidabili','C':'Posizione indicativa: via o corrispondenza al civico non validata documentalmente','D':'Comune/località nota; nessun pin univoco','E':'Non localizzato; comune non documentato'},'boundary_source':{'url':'https://www.openstreetmap.org/relation/'+str(boundary_json[0]['osm_id']),'sha256':hashlib.sha256((C/'lazio-boundary-response.json').read_bytes()).hexdigest(),'checked_at':'2026-09-22','method':'Contenimento nel poligono amministrativo Lazio da OSM; non sostituisce confini amministrativi legali'},'records':results,'transitions':transitions,'rejected_cases':rejected,'decisions':decisions,'attribution':'© OpenStreetMap contributors, ODbL 1.0. Nessuna geocodifica nel browser.'}
(R/'data/presidi_geo_v7_9.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
(R/'downloads/Geocoding_Cache_V7_9.json').write_text(json.dumps(cache,ensure_ascii=False,separators=(',',':'))+'\n')
(R/'downloads/Lazio_Boundary_OSM_V7_9.geojson').write_text(json.dumps(boundary_json[0]['geojson'],separators=(',',':'))+'\n')
print(json.dumps(summary,indent=2))
