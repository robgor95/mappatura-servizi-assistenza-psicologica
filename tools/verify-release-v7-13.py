#!/usr/bin/env python3
"""Check release integration and optionally compare live deployment bytes to HEAD."""
from pathlib import Path
import json,os,subprocess,hashlib,time,urllib.request,sys
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1];os.chdir(ROOT)
BASE='110b564a777f94c93f972594c67bb0a4b1f41d8c'
ORIGIN='https://mappatura-servizi-assistenza-psicologica.pages.dev'
OUT=Path(os.environ.get('QA_OUT','/tmp/province-v713'));OUT.mkdir(parents=True,exist_ok=True)
checks=[]
def check(name,ok,detail=None):checks.append({'name':name,'passed':bool(ok),**({'detail':detail} if detail is not None else {})})
v=json.loads(Path('version.json').read_text());check('Manifest 7.13 with unchanged clinical/geography data',v['web_version']=='7.13' and v['data_extension_version']=='7.11.7' and v['counts_current']['search']==443 and not v['indexing_enabled'])
for file in ['servizi.html','archivio.html']:
 soup=BeautifulSoup(Path(file).read_text(),'html.parser')
 check(file+' one integrated map and preserved directory controls',len(soup.select('#province-explorer'))==1 and len(soup.select('#svc-form'))==1)
 check(file+' map above results',str(soup).index('id="province-explorer"')<str(soup).index('id="risultati"'))
 check(file+' explicit noindex','noindex' in soup.select_one('meta[name=robots]')['content'])
 missing=[]
 for tag in soup.select('script[src],link[rel=stylesheet]'):
  target=tag.get('src') or tag.get('href');target=target.split('?')[0].lstrip('/')
  if not Path(target).is_file():missing.append(target)
 check(file+' all local runtime assets exist',not missing,missing)
 ids=[t['id'] for t in soup.select('[id]')];check(file+' no duplicate identifiers',len(ids)==len(set(ids)))
 for a in soup.select('a[href^="#"]'):
  if a['href']!='#':check(file+' anchor '+a['href'],a['href'][1:] in ids)
check('Home and Menta remain unchanged',all(Path(p).read_bytes()==subprocess.check_output(['git','show',BASE+':'+p]) for p in ['index.html','orientati.html']))
check('Source boundary provenance present',json.loads(Path('data/province_lazio_istat2026_v7_13.geojson').read_text())['source']['source_sha256']=='b011a590656c3a3ebc297fba80726a376aa843b6f164641cf6a4a990021a81d6')
commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
if '--production' in sys.argv:
 def get(path):
  req=urllib.request.Request(ORIGIN+'/'+path+'?verify_release='+commit,headers={'User-Agent':'LazioProvinceVerification/7.13','Cache-Control':'no-cache'})
  with urllib.request.urlopen(req,timeout=30) as r:return r.read(),r.headers.get('X-Robots-Tag',''),r.status
 ready=False
 for attempt in range(24):
  try:
   data,_,_=get('version.json');ready=data==Path('version.json').read_bytes()
  except Exception:pass
  if ready:break
  time.sleep(5)
 check('Exact manifest reached production',ready)
 files=['index.html','orientati.html','servizi.html','archivio.html','mappa.html','metodo.html','documenti.html','version.json','data/portal_data_v7_3.json','data/presidi_geo_v7_11_7.json','data/province_lazio_istat2026_v7_13.geojson','data/comuni_province_istat2026_v7_13.json','assets/province-core-v7-13.js','assets/province-map-v7-13.js','assets/province-map-v7-13.css','assets/servizi-v7-13.js','downloads/Release_Notes_V7_13.md','downloads/Audit_Province_V7_13.json']
 for path in files:
  try:
   data,robots,status=get(path);check('Production bytes and noindex: '+path,status==200 and data==Path(path).read_bytes() and 'noindex' in robots.lower(),hashlib.sha256(data).hexdigest())
  except Exception as e:check('Production bytes: '+path,False,str(e))
report={'version':'7.13','commit':commit,'production':'--production' in sys.argv,'checks':checks,'passed':sum(x['passed'] for x in checks),'total':len(checks)}
(OUT/('production.json' if '--production' in sys.argv else 'integration.json')).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));sys.exit(0 if all(x['passed'] for x in checks) else 1)
