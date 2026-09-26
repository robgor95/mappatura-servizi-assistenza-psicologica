"""One-off, read-only acquisition for the 128 unresolved V7.10.3 records.
Run only on the research branch. Outputs are candidates, NOT production pins.
Only public source URLs already attached to the records are retrieved.
No municipal centroids, Google scraping, tracking or live browser geocoding.
"""
from pathlib import Path
import csv, json, re, time, hashlib, subprocess, html, urllib.parse
from collections import Counter
import requests
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[1]
O=R/'research/v7_11';O.mkdir(parents=True,exist_ok=True)
subprocess.run(['node','tools/export-current-v7-9-4.cjs','/tmp/v711-baseline.json'],cwd=R,check=True)
rows=json.loads(Path('/tmp/v711-baseline.json').read_text());by={r['key']:r for r in rows}
queue=list(csv.DictReader((R/'downloads/Coda_Geografia_V7_9_4.csv').open(encoding='utf-8-sig'),delimiter=';'))
assert len(queue)==128
cache_path=O/'sources.json';cache=json.loads(cache_path.read_text()) if cache_path.exists() else {}
session=requests.Session();session.headers['User-Agent']='LazioServiceAudit/7.11 (public service directory; https://github.com/robgor95/mappatura-servizi-assistenza-psicologica)'
last={}
def acquire(url):
 if url in cache:return cache[url]
 host=urllib.parse.urlsplit(url).netloc
 delay=1.1-(time.monotonic()-last.get(host,0))
 if delay>0:time.sleep(delay)
 out={'url':url,'checked_at':'2026-09-26','coordinates':[],'links':[]}
 try:
  resp=session.get(url,timeout=(8,18));last[host]=time.monotonic()
  out.update(status=resp.status_code,final_url=resp.url,sha256=hashlib.sha256(resp.content).hexdigest(),content_type=resp.headers.get('Content-Type',''))
  if resp.status_code==200 and 'html' in out['content_type'].lower():
   soup=BeautifulSoup(resp.content,'html.parser');out['title']=soup.title.get_text(' ',strip=True) if soup.title else ''
   text=soup.get_text(' ',strip=True);out['emails']=sorted(set(re.findall(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}',text)))[:15]
   # Preserve only address-sized evidence windows, not copies of source articles.
   out['address_fragments']=list(dict.fromkeys(re.findall(r'(?i)\b(?:via|viale|piazza|piazzale|largo|strada|contrada|localit[aà])\s+[^.;\n]{4,90}',text)))[:30]
   out['links']=list(dict.fromkeys(urllib.parse.urljoin(resp.url,x.get('src') or x.get('href') or '') for x in soup.select('iframe[src],a[href]') if re.search(r'maps|goo\.gl',x.get('src') or x.get('href') or '',re.I)))[:20]
   raw=html.unescape(resp.text)
   patterns=[(r'!2d(-?\d{1,3}\.\d+)!3d(-?\d{1,2}\.\d+)',True),(r'!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)',False),(r'[?&](?:q|ll|center)=(-?\d{1,2}\.\d+)[,% ]+(-?\d{1,3}\.\d+)',False),(r'"latitude"\s*:\s*"?(-?\d{1,2}\.\d+)"?\s*,\s*"longitude"\s*:\s*"?(-?\d{1,3}\.\d+)',False),(r'lat\s*:\s*(-?\d{1,2}\.\d+)\s*,\s*lng\s*:\s*(-?\d{1,3}\.\d+)',False)]
   seen=set()
   for pattern,reverse in patterns:
    for m in re.finditer(pattern,raw):
     a,b=map(float,m.groups());lat,lng=(b,a) if reverse else (a,b)
     if 40.7<lat<42.95 and 11.3<lng<14.1 and (lat,lng) not in seen:
      seen.add((lat,lng));out['coordinates'].append({'lat':lat,'lng':lng,'context':raw[max(0,m.start()-100):m.end()+100]})
   # Only source evidence; automatic address match is intentionally not inferred.
  elif resp.status_code==200:out['note']='Not HTML: manual review required.'
 except Exception as e:out['error']=type(e).__name__+': '+str(e)[:160]
 cache[url]=out;cache_path.write_text(json.dumps(cache,ensure_ascii=False,indent=2)+'\n');return out
results=[]
for i,q in enumerate(queue):
 row=by[q['service_key']];urls=[u.strip() for u in q['fonti'].split('|') if u.strip().startswith('https://')]
 urls=[u for u in urls if '.pdf' not in u.lower() and not re.search(r'AlboOnLine|albo-pretorio|patisweb|trasparenza\.asl1abruzzo|maggioli',u,re.I)]
 # Prefer specific facility pages over general administrative indexes.
 urls=sorted(dict.fromkeys(urls),key=lambda u:(bool(re.search(r'accreditat|amministrazione-trasparente|info-trasparenza',u)),len(urllib.parse.urlsplit(u).path)<3))[:3]
 found=[acquire(u) for u in urls]
 candidates=[{'url':s['url'],**p} for s in found for p in s['coordinates']]
 results.append({'key':row['key'],'name':row['name'],'town':row['town'],'address':row['address'],'sources':[s['url'] for s in found],'successful_sources':sum(s.get('status')==200 for s in found),'candidate_coordinates':candidates,'review':'manual_required' if candidates else 'no_coordinate_evidence_from_selected_html','baseline_quality':q['livello']})
 print(f"{i+1:03d} {row['key']} | {row['name']} | pages={sum(s.get('status')==200 for s in found)} coordinates={len(candidates)}",flush=True)
(O/'queue-review.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
lines=['# V7.11 source reconnaissance — candidates only','No automatic pin or operational-data update.','']
for r in results:
 c='; '.join(str(p['lat'])+','+str(p['lng'])+' '+p['url'] for p in r['candidate_coordinates'])
 lines.append(f"{r['key']} | {r['name']} | {r['town']} | {r['address']} | HTTP_OK {r['successful_sources']} | {c or 'MANUAL_RESEARCH_REQUIRED'}")
(O/'summary.txt').write_text('\n'.join(lines)+'\n')
print(json.dumps({'records':len(results),'unique_sources':len(cache),'sources_http_200':sum(s.get('status')==200 for s in cache.values()),'records_with_coordinate_candidates':sum(bool(r['candidate_coordinates']) for r in results),'no_automatic_promotions':True}),flush=True)
