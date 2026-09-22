"""Read-only post-deploy checks; never contacts map/geocoding providers."""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import json,hashlib,re,time,subprocess,datetime,os
R=Path(__file__).resolve().parents[1]
O=Path(os.environ.get('QA_OUT','/tmp/v792-production'));O.mkdir(parents=True,exist_ok=True)
origin='https://mappatura-servizi-assistenza-psicologica.pages.dev'
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip()
checks=[]
def sha(b):return hashlib.sha256(b).hexdigest()
def fetch(path):
 req=Request(origin+'/'+path+'?verify_v792='+commit,headers={'User-Agent':'LazioReleaseVerification/7.9.2 (own site; no personal queries)','Cache-Control':'no-cache'})
 try:
  with urlopen(req,timeout=30) as r:return r.status,dict(r.headers),r.read(),r.url
 except HTTPError as e:return e.code,dict(e.headers),e.read(),e.url
expected=(R/'version.json').read_bytes();deployed=False;last=None
for attempt in range(40):
 try:
  status,headers,body,final=fetch('version.json');last={'status':status,'sha256':sha(body),'url':final}
  if status==200 and body==expected:deployed=True;break
 except Exception as e:last={'error':str(e)}
 time.sleep(10)
checks.append({'name':'Production serves the exact committed V7.9.2 manifest','passed':deployed,'observed':last})
if deployed:
 pages=json.loads((R/'downloads/Audit_UX_Mappa_V7_8.json').read_text())['pages']
 paths=list(dict.fromkeys(pages+['index.html','version.json','robots.txt','sitemap.xml','data/audit_operativo_v7_9_2.json','data/presidi_geo_v7_9_2.json','data/portal_data_v7_3.json','data/privati_v7_5.json','data/multisede_v7_7_5.json','assets/audit-data-v7-9-2.js','assets/servizi-v7-9-2.js','assets/map-data-v7-9-2.js','assets/map-v7-9-1.js','assets/directory-v7-9-2.js','downloads/Verifiche_V7_9_2.json','downloads/Audit_Operativo_V7_9_2.json','downloads/Report_Geografia_V7_9_2.md']))
 for path in paths:
  try:
   status,headers,body,final=fetch(path);headers={k.lower():v for k,v in headers.items()}
   same=body==(R/path).read_bytes();noindex='noindex' in headers.get('x-robots-tag','').lower()
   html_meta=not path.endswith('.html') or bool(re.search(br'<meta\b(?=[^>]*\bname=[\"\']robots[\"\'])(?=[^>]*\bcontent=[\"\'][^\"\']*noindex)[^>]*>',body,re.I))
   checks.append({'path':path,'passed':(status==200 or path=='404.html' and status==404) and same and noindex and html_meta,'http_status':status,'exact_bytes':same,'sha256':sha(body),'x_robots_tag':headers.get('x-robots-tag'),'html_noindex':html_meta,'final_url':final})
  except Exception as e:checks.append({'path':path,'passed':False,'error':str(e)})
 try:
  status,headers,body,final=fetch('__audit-v792-not-found__');headers={k.lower():v for k,v in headers.items()}
  checks.append({'name':'Real unknown URL returns custom noindex 404','passed':status==404 and body==(R/'404.html').read_bytes() and 'noindex' in headers.get('x-robots-tag',''),'http_status':status})
 except Exception as e:checks.append({'name':'Real 404 route','passed':False,'error':str(e)})
 # Repository preservation is independently rechecked on the actual merged commit.
 base='9d2efa56e454ce6b9285bc8e767f6e94f4eb8f01';allowed={'README.md','CHANGELOG.md','version.json','index.html','servizi.html','archivio.html','mappa.html','strutture-approfondite.html'}
 changed=subprocess.check_output(['git','diff','--name-only',base,commit],cwd=R,text=True).splitlines();mismatches=[]
 for path in changed:
  existed=subprocess.run(['git','cat-file','-e',base+':'+path],cwd=R,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0
  if existed and path not in allowed:mismatches.append(path)
 checks.append({'name':'Historical existing files unchanged outside current entrypoints/docs','passed':not mismatches,'baseline_commit':base,'mismatches':mismatches})
 cfg=json.loads(expected);checks.append({'name':'Indexing disabled and sitemap unannounced','passed':cfg['indexing_enabled'] is False and not re.search(r'^Sitemap:',(R/'robots.txt').read_text(),re.M)})
report={'version':'7.9.2','checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'commit':commit,'production_origin':origin,'checks':checks,'passed':sum(c['passed'] for c in checks),'total':len(checks),'entrances_verified':False,'external_map_requests':0}
(O/'production-http.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'commit':commit,'passed':report['passed'],'total':report['total'],'failures':[c for c in checks if not c['passed']]},ensure_ascii=False))
if report['passed']!=report['total']:raise SystemExit(1)
