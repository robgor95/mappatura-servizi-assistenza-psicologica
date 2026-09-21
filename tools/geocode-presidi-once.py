"""One-off maintenance for this fixed public-address list; never included in frontend.
OSMF policy: https://operations.osmfoundation.org/policies/nominatim/
Single process/machine, 1.2s minimum between calls, bounded input, persistent cache,
identifiable User-Agent, no user searches, no automatic retry on service refusal.
"""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlencode
from urllib.error import HTTPError
import json,re,time,unicodedata,sys,datetime

def norm(s):
    return re.sub(r'[^a-z0-9]+',' ',unicodedata.normalize('NFD',s).encode('ascii','ignore').decode().lower()).strip()
def clean(s,town):
    s=re.sub(r'\([^)]*\)','',s)
    s=re.split(r'\s[—–]\s|\s\||;|(?:,\s*)?(?:primo|secondo|terzo|quarto|piano|padiglione|palazzina|c/o)\b',s,flags=re.I)[0]
    s=re.sub(r',?\s*'+re.escape(town)+r'\s*$', '', s, flags=re.I)
    return re.sub(r'\s+',' ',s).strip(' ,.')
rows=json.loads(Path(sys.argv[1]).read_text());out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
cachefile=out/'geocoding-cache.json'
seed=Path(__file__).resolve().parents[1]/'downloads/Geocoding_Cache_V7_8.json'
cache=json.loads(cachefile.read_text()) if cachefile.exists() else (json.loads(seed.read_text()) if seed.exists() else {})
records={};pending=[];calls=0;last=0;today=datetime.datetime.now(datetime.timezone.utc).date().isoformat()
for r in rows:
    address=clean(r['address'],r['town']);town=r['town']; n=norm(address)
    if any(x in n for x in ['non document','da verificar','da confermar']) or n in ['nd',''] or 'non document' in norm(town):
        pending.append({'key':r['key'],'reason':'Indirizzo non sufficientemente documentato'});continue
    params={'street':address,'city':town,'country':'Italia','countrycodes':'it','format':'jsonv2','addressdetails':1,'limit':4,'accept-language':'it'}
    query=urlencode(params);key=norm(address)+'|'+norm(town)
    if key not in cache:
        if calls>=350: raise RuntimeError('Maintenance request limit reached; no further automatic queries')
        time.sleep(max(0,1.2-(time.monotonic()-last)));last=time.monotonic()
        req=Request('https://nominatim.openstreetmap.org/search?'+query,headers={'User-Agent':'LazioPresidiMap/7.8 (one-time public-address maintenance; https://github.com/robgor95/mappatura-servizi-assistenza-psicologica)','Accept':'application/json'})
        try:
            with urlopen(req,timeout=25) as res: matches=json.load(res)
        except HTTPError as e:
            cachefile.write_text(json.dumps(cache,ensure_ascii=False));raise RuntimeError('Geocoder refused request; stopped without retry: '+str(e.code)) from e
        cache[key]={'query':params,'results':matches,'date':today};calls+=1
        cachefile.write_text(json.dumps(cache,ensure_ascii=False))
        if calls%25==0:print('Requests',calls,flush=True)
    matches=cache[key]['results'];chosen=None
    streetwords=set(norm(address).split())-{'via','viale','piazza','della','delle','degli','dei','del','di','da','e','largo','vicolo','corso'}
    streetwords={x for x in streetwords if not x.isdigit() and len(x)>1}
    for m in matches:
        a=m.get('address',{});places=[norm(a.get(k,'')) for k in ['city','town','village','municipality']]
        if norm(town) not in places: continue
        lat,lon=float(m['lat']),float(m['lon'])
        if not(40.7<lat<42.95 and 11.3<lon<14.1):continue
        road=norm(a.get('road',''));rw=set(road.split())
        overlap=len(streetwords&rw)/max(1,len(streetwords))
        if not road or overlap<0.65:continue
        numbers=re.findall(r'\d+',address);house=re.findall(r'\d+',a.get('house_number',''))
        precision='address' if numbers and house and numbers[-1] in house else 'street'
        # Only a actual road geometry is retained as a street-level estimate.
        if precision=='street':
            if m.get('addresstype')!='road' and m.get('class')!='highway':continue
            bounds=list(map(float,m.get('boundingbox',[0,0,0,0])))
            if max(bounds[1]-bounds[0],bounds[3]-bounds[2])>0.04:continue
        candidate={'lat':lat,'lng':lon,'precision':precision,'source_address':r['address'],'source_town':town,
                   'matched_address':m.get('display_name',''),'source_url':'https://www.openstreetmap.org/'+m['osm_type']+'/'+str(m['osm_id']),
                   'checked_at':cache[key]['date'],'method':'Nominatim: confronto automatico via/comune/civico; ingresso non verificato'}
        if chosen and chosen['precision']==precision and (abs(chosen['lat']-lat)+abs(chosen['lng']-lon))>0.003:
            chosen=None;break
        if chosen is None or precision=='address':chosen=candidate
    if chosen:records[r['key']]=chosen
    else:pending.append({'key':r['key'],'reason':'Nessuna corrispondenza geografica abbastanza univoca'})
geo={'version':'7.8','baseline':'bcda3c90cc241a848f67cb825bc8a10a742d6a65','provider':'OpenStreetMap / Nominatim','license':'ODbL-1.0','attribution':'© OpenStreetMap contributors','source':'https://www.openstreetmap.org/copyright','records':records,'unlocated':pending,'stats':{'services':len(rows),'address':sum(x['precision']=='address' for x in records.values()),'street':sum(x['precision']=='street' for x in records.values()),'unlocated':len(pending),'queries_cached':len(cache),'requests_this_run':calls}}
(out/'presidi_geo_v7_8.json').write_text(json.dumps(geo,ensure_ascii=False,indent=2));print(json.dumps(geo['stats']),flush=True)
