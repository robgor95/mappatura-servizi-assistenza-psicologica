#!/usr/bin/env python3
"""V7.14 integration checks and optional exact Cloudflare production verification."""
from pathlib import Path
import json,os,subprocess,hashlib,time,urllib.request,sys,re
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1];os.chdir(ROOT)
BASE='f04771c1bc9f3cd2c81f3ef1ff6f58b18a229476';ORIGIN='https://mappatura-servizi-assistenza-psicologica.pages.dev'
OUT=Path(os.environ.get('QA_OUT','/tmp/map-v714'));OUT.mkdir(parents=True,exist_ok=True);checks=[]
def check(name,ok,detail=None):checks.append({'name':name,'passed':bool(ok),**({'detail':detail} if detail is not None else {})})
v=json.loads(Path('version.json').read_text())
check('Manifest V7.14 preserves clinical and coordinate versions',v.get('web_version')=='7.14' and v.get('map_version')=='7.14' and v.get('data_extension_version')=='7.11.7' and v.get('counts_current',{}).get('search')==443 and v.get('map',{}).get('localized')==373 and not v.get('indexing_enabled'))
soup=BeautifulSoup(Path('mappa.html').read_text(),'html.parser')
check('Main map has one hierarchy and two explicit modes',len(soup.select('#map-hierarchy'))==1 and len(soup.select('#map-mode-territorio'))==1 and len(soup.select('#map-mode-sanitaria'))==1)
check('Main map exposes province ASL municipality controls',all(soup.select_one(x) for x in ['#map-provincia','#map-asl','#map-comune','#map-breadcrumb','#map-canvas']))
check('Local map is visible without old external-map consent gate',not soup.select_one('#map-consent') and soup.select_one('#map-tiles') is not None)
ids=[x['id'] for x in soup.select('[id]')];check('Main map has no duplicate IDs',len(ids)==len(set(ids)))
missing=[]
for tag in soup.select('script[src],link[rel=stylesheet]'):
 target=(tag.get('src') or tag.get('href')).split('?')[0].lstrip('/')
 if target and not target.startswith('http') and not Path(target).is_file():missing.append(target)
check('All main-map local assets exist',not missing,missing)
check('Main map remains noindex','noindex' in soup.select_one('meta[name=robots]')['content'])
for p in ['index.html','orientati.html','servizi.html','archivio.html']:
 check(p+' unchanged from V7.13',Path(p).read_bytes()==subprocess.check_output(['git','show',BASE+':'+p]))
src='b011a590656c3a3ebc297fba80726a376aa843b6f164641cf6a4a990021a81d6'
total=0
for code,n in {'vt':60,'ri':73,'rm':121,'lt':33,'fr':91}.items():
 d=json.loads(Path(f'data/comuni_{code}_istat2026_v7_14.geojson').read_text());total+=len(d['features'])
 check('Municipality geometry '+code.upper(),d.get('version')=='7.14' and len(d.get('features',[]))==n and d.get('source',{}).get('source_sha256')==src)
check('Municipality geometry total is 378',total==378)
js=Path('assets/map-hierarchy-v7-14.js').read_text()
check('External map tiles require explicit button action','tile.openstreetmap.org' in js and "map-tiles" in Path('mappa.html').read_text())
check('No device geolocation/storage/analytics added',not re.search(r'navigator\.geolocation|localStorage|sessionStorage|sendBeacon|gtag\s*\(|google-analytics|plausible',js,re.I))
check('Privacy and method document V7.14 behavior','mappa-v714-privacy' in Path('privacy.html').read_text() and 'id="mappa-v714"' in Path('metodo.html').read_text())
commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
if '--production' in sys.argv:
 def get(path):
  req=urllib.request.Request(ORIGIN+'/'+path+'?verify_release='+commit,headers={'User-Agent':'LazioMapVerification/7.14','Cache-Control':'no-cache'})
  with urllib.request.urlopen(req,timeout=30) as r:return r.read(),r.headers.get('X-Robots-Tag',''),r.status
 ready=False
 for _ in range(24):
  try: data,_,_=get('version.json');ready=data==Path('version.json').read_bytes()
  except Exception: pass
  if ready: break
  time.sleep(5)
 check('Exact V7.14 manifest reached production',ready)
 files=['mappa.html','privacy.html','metodo.html','documenti.html','version.json','assets/map-hierarchy-core-v7-14.js','assets/map-hierarchy-v7-14.js','assets/map-hierarchy-v7-14.css','downloads/Release_Notes_V7_14.md','data/comuni_vt_istat2026_v7_14.geojson','data/comuni_ri_istat2026_v7_14.geojson','data/comuni_rm_istat2026_v7_14.geojson','data/comuni_lt_istat2026_v7_14.geojson','data/comuni_fr_istat2026_v7_14.geojson','data/presidi_geo_v7_11_7.json','data/portal_data_v7_3.json']
 for path in files:
  try:
   data,robots,status=get(path);check('Production bytes and noindex: '+path,status==200 and data==Path(path).read_bytes() and 'noindex' in robots.lower(),hashlib.sha256(data).hexdigest())
  except Exception as e:check('Production bytes: '+path,False,str(e))
report={'version':'7.14','commit':commit,'production':'--production' in sys.argv,'checks':checks,'passed':sum(x['passed'] for x in checks),'total':len(checks)}
(OUT/('production.json' if '--production' in sys.argv else 'integration.json')).write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2));sys.exit(0 if all(x['passed'] for x in checks) else 1)
