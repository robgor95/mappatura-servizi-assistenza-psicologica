"""Verify this exact committed release after Cloudflare publishes it.
Only own-origin GET requests; no geocoders or external map tiles.
"""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import json,hashlib,re,time,subprocess,datetime,os
R=Path(__file__).resolve().parents[1];O=Path(os.environ.get('QA_OUT','/tmp/v711-production'));O.mkdir(parents=True,exist_ok=True)
origin='https://mappatura-servizi-assistenza-psicologica.pages.dev'
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip()
def fetch(path):
 req=Request(origin+'/'+path+'?verify_v711='+commit,headers={'User-Agent':'LazioReleaseVerification/7.11','Cache-Control':'no-cache'})
 try:
  with urlopen(req,timeout=30) as r:return r.status,{k.lower():v for k,v in r.headers.items()},r.read()
 except HTTPError as e:return e.code,{k.lower():v for k,v in e.headers.items()},e.read()
checks=[];expected=(R/'version.json').read_bytes();deployed=False
for _ in range(48):
 try:
  status,headers,body=fetch('version.json')
  if status==200 and body==expected:deployed=True;break
 except Exception:pass
 time.sleep(10)
checks.append({'name':'Exact V7.11 manifest published','passed':deployed})
paths=['index.html','studenti.html','universita.html','scuole.html','servizi.html','archivio.html','mappa.html','strutture-approfondite.html','privati.html','documenti.html','supporto-territoriale.html','aiuto-adesso.html','version.json','robots.txt','sitemap.xml','data/audit_operativo_v7_11.json','data/presidi_geo_v7_11.json','data/supporto_territoriale_v7_10.json','assets/audit-data-v7-11.js','assets/servizi-v7-11.js','assets/map-data-v7-11.js','assets/directory-v7-11.js','assets/menta-config-v7-10.js','assets/menta/menta-base-v7-10-1.webp','downloads/Report_Geografia_V7_11.md','downloads/Audit_Geografia_Operativo_V7_11.json','downloads/Fonti_V7_11.json','downloads/Coda_Geografia_V7_11.csv','downloads/Integrita_Baseline_V7_11.json']
if deployed:
 for p in paths:
  try:
   s,h,b=fetch(p);same=b==(R/p).read_bytes();noindex='noindex' in h.get('x-robots-tag','').lower()
   meta=not p.endswith('.html') or bool(re.search(br'<meta\b(?=[^>]*\bname=[\"\']robots[\"\'])(?=[^>]*\bcontent=[\"\'][^\"\']*noindex)[^>]*>',b,re.I))
   checks.append({'path':p,'passed':s==200 and same and noindex and meta,'status':s,'exact_bytes':same,'x_robots_tag':h.get('x-robots-tag'),'html_noindex':meta,'sha256':hashlib.sha256(b).hexdigest()})
  except Exception as e:checks.append({'path':p,'passed':False,'error':str(e)})
 try:
  s,h,b=fetch('__v711-not-found__');checks.append({'name':'Unknown route remains custom noindex 404','passed':s==404 and b==(R/'404.html').read_bytes() and 'noindex' in h.get('x-robots-tag','')})
 except Exception as e:checks.append({'name':'Unknown route remains custom noindex 404','passed':False,'error':str(e)})
 v=json.loads(expected);checks.append({'name':'Manifest clinical count, coverage and privacy are coherent','passed':v['web_version']=='7.11' and v['counts_current']['search']==443 and v['map']['localized']==330 and v['map']['unlocated']==113 and v['map']['entrances_verified']==0 and v['indexing_enabled'] is False and v['clinical_review'] is False})
report={'version':'7.11','checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'commit':commit,'production_origin':origin,'checks':checks,'passed':sum(x['passed'] for x in checks),'total':len(checks),'scope':'Exact bytes and HTTP safeguards, not physical access or clinical verification.'}
(O/'production-http.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))
if report['passed']!=report['total']:raise SystemExit(1)
