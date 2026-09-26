"""One-off inspection of publisher-supplied map targets, never automatic promotion."""
from pathlib import Path
import json,re,base64,urllib.parse,time,hashlib
import requests
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[1];O=R/'research/v7_11'
S=requests.Session();S.headers['User-Agent']='LazioServiceAudit/7.11 (public source review; https://github.com/robgor95/mappatura-servizi-assistenza-psicologica)'
urls=[
'https://asl.vt.it/csm-centro-di-salute-mentale','https://asl.vt.it/droga-alcol-fumo-e-gioco-d-azzardo','https://asl.vt.it/centro-diurno-dsm','https://asl.vt.it/srsr-strutture-residenziali-socio-riabilitative',
'https://www.aslroma1.it/presidi-territoriali/centro-salute-mentale-boccea','https://www.aslroma1.it/presidi-territoriali/centro-salute-mentale-innocenzo-iv','https://www.aslroma1.it/presidi-territoriali/serd-nomentana-2b','https://www.aslroma1.it/presidi-territoriali/polo-integrato-salute-mentale-cassia',
'https://www.aslroma4.it/strutture-sanitarie/strutture-di-salute-mentale',
'https://www.aslroma5.it/dsmdp-dipartimento-di-salute-mentale-e-delle-dipendenze-patologiche/cosa-sono-i-serd/servizio-per-le-dipendenze-patologiche-colleferro/',
'https://www.aslroma5.it/dsmdp-dipartimento-di-salute-mentale-e-delle-dipendenze-patologiche/cosa-sono-i-serd/servizio-per-le-dipendenze-patologiche-subiaco/',
'https://www.aslroma5.it/dsmdp-dipartimento-di-salute-mentale-e-delle-dipendenze-patologiche/cosa-sono-le-npia/npia-di-subiaco-e-olevano-romano/',
'https://www.ghcspa.com/samadi/contatti','https://www.maieusis.org/contatti/','https://gabbianotirreno.it/strutture/rocca-canterano','https://gabbianotirreno.it/strutture/castel-madama',
'https://www.qrare.it/contatti/','https://www.qrare.it/','https://www.exodus.it/sedi-exodus/cassino.html','https://www.santagostino.it/it/sedi/rm-via-goito',
'https://www.airrimedical.it/it/ambulatori-viterbo/','https://www.adhdroma.com/',
'https://reverie.it/strutture/la-comunita-terapeutica-riabilitativa-residenziale-di-capena-ctc-1/'
]
cachepath=O/'map-targets.json';cache=json.loads(cachepath.read_text()) if cachepath.exists() else {}
lines=['# Publisher map targets — manually assess the association and uncertainty','!2d / !3d viewport centres are NOT accepted as marker coordinates.','']
for url in urls:
 if url not in cache:
  result={'url':url,'maps':[]};time.sleep(1.2)
  try:
   r=S.get(url,timeout=(8,18));result.update(status=r.status_code,final_url=r.url,sha256=hashlib.sha256(r.content).hexdigest())
   soup=BeautifulSoup(r.content,'html.parser');result['title']=soup.title.get_text(' ',strip=True) if soup.title else ''
   alltext=soup.get_text(' ',strip=True)
   result['address_fragments']=list(dict.fromkeys(re.findall(r'(?i)\b(?:via|viale|piazza|piazzale|largo|strada|contrada|localit[aà])\s+[^.;\n]{4,100}',alltext)))[:16]
   seen=set()
   for el in soup.select('iframe[src],iframe[data-src],a[href]'):
    raw=el.get('src') or el.get('data-src') or el.get('href') or ''
    if not re.search(r'maps|goo\.gl',raw,re.I) or raw in seen:continue
    seen.add(raw);u=urllib.parse.urljoin(r.url,raw);dec=urllib.parse.unquote(u)
    entry={'url':u,'label':el.get_text(' ',strip=True),'preceding':el.find_previous(['h2','h3','h4','strong']).get_text(' ',strip=True)[:120] if el.find_previous(['h2','h3','h4','strong']) else '', 'targets':[]}
    # Coordinate place URLs and explicit q=lat,lng targets only. @lat,lng and ll/center are just viewport.
    for m in re.finditer(r'!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)',dec):entry['targets'].append({'type':'place_target','lat':float(m[1]),'lng':float(m[2])})
    for m in re.finditer(r'[?&]q=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)',dec):entry['targets'].append({'type':'coordinate_query','lat':float(m[1]),'lng':float(m[2])})
    entry['encoded_labels']=[]
    for m in re.finditer(r'!2z([^!&]+)',dec):
     try:entry['encoded_labels'].append(base64.urlsafe_b64decode(m[1]+'='*((4-len(m[1])%4)%4)).decode())
     except Exception:pass
    entry['plain_labels']=re.findall(r'!2s([^!&]+)',dec)
    # Resolve only official short map-link redirects; never request or scrape Google Maps page content.
    if re.search(r'https://(?:maps\.app\.goo\.gl|goo\.gl/maps)/',u):
     try:
      rr=S.get(u,timeout=(5,10),allow_redirects=False);entry['redirect_status']=rr.status_code;entry['redirect_url']=rr.headers.get('Location')
     except Exception as e:entry['redirect_error']=str(e)[:80]
    result['maps'].append(entry)
   result['coordinate_snippets']=list(dict.fromkeys(re.findall(r'.{0,60}(?:latitude|longitude|LatLng|google-map|data-lat|map-latitude|location_lat).{0,120}',r.text,re.I)))[:16]
  except Exception as e:result['error']=str(e)[:150]
  cache[url]=result;cachepath.write_text(json.dumps(cache,ensure_ascii=False,indent=2)+'\n')
 d=cache[url];lines.append('\nPAGE '+url+' HTTP '+str(d.get('status')))
 for m in d['maps']:
  lines.append('LABEL '+m['label']+' PRECEDING '+m['preceding'])
  lines.append('TARGETS '+json.dumps(m['targets'],ensure_ascii=False)+' DMS '+json.dumps(m['encoded_labels'],ensure_ascii=False)+' NAME '+json.dumps(m['plain_labels'],ensure_ascii=False))
  lines.append('MAP '+(m.get('redirect_url') or m['url']))
 print(url, len(d['maps']),flush=True)
(O/'map-targets.txt').write_text('\n'.join(lines)+'\n')
