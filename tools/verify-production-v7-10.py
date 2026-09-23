"""Read-only V7.10 production verification after Cloudflare deployment."""
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import json,hashlib,re,time,subprocess,datetime,os
R=Path(__file__).resolve().parents[1];O=Path(os.environ.get('QA_OUT','/tmp/v710-production'));O.mkdir(parents=True,exist_ok=True)
origin='https://mappatura-servizi-assistenza-psicologica.pages.dev';commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip()
def fetch(path):
 req=Request(origin+'/'+path+'?verify_v710='+commit,headers={'User-Agent':'LazioReleaseVerification/7.10','Cache-Control':'no-cache'})
 try:
  with urlopen(req,timeout=30) as r:return r.status,{k.lower():v for k,v in r.headers.items()},r.read(),r.url
 except HTTPError as e:return e.code,{k.lower():v for k,v in e.headers.items()},e.read(),e.url
def sha(b):return hashlib.sha256(b).hexdigest()
checks=[];expected=(R/'version.json').read_bytes();deployed=False
for _ in range(48):
 try:
  s,h,b,u=fetch('version.json')
  if s==200 and b==expected:deployed=True;break
 except Exception:pass
 time.sleep(10)
checks.append({'name':'exact V7.10 manifest deployed','passed':deployed})
paths=['index.html','supporto-territoriale.html','aiuto-adesso.html','ascolto.html','centri-ascolto.html','version.json','data/supporto_territoriale_v7_10.json','assets/supporto-v7-10.js','assets/supporto-v7-10.css','assets/menta-config-v7-10.js','downloads/Release_Notes_V7_10.md','downloads/Audit_Supporto_Territoriale_V7_10.json']
if deployed:
 for p in paths:
  try:
   s,h,b,u=fetch(p);same=b==(R/p).read_bytes();noindex='noindex' in h.get('x-robots-tag','').lower();meta=(not p.endswith('.html')) or b'noindex' in b.lower()
   checks.append({'path':p,'passed':s==200 and same and noindex and meta,'status':s,'exact_bytes':same,'x_robots':h.get('x-robots-tag'),'meta_noindex':meta,'sha256':sha(b)})
  except Exception as e:checks.append({'path':p,'passed':False,'error':str(e)})
 v=json.loads(expected);checks.append({'name':'clinical count and map unchanged','passed':v['counts_current']['search']==442 and v['map']['services']==442 and v['map']['localized']==309 and v['map']['unlocated']==133});checks.append({'name':'indexing remains disabled','passed':v['indexing_enabled'] is False and 'Sitemap:' not in (R/'robots.txt').read_text()})
report={'version':'7.10','checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'commit':commit,'origin':origin,'checks':checks,'passed':sum(1 for x in checks if x['passed']),'total':len(checks)}
(O/'production-http.json').write_text(json.dumps(report,indent=2,ensure_ascii=False)+'\n');print(json.dumps({'commit':commit,'passed':report['passed'],'total':report['total'],'failures':[x for x in checks if not x['passed']]},ensure_ascii=False))
if report['passed']!=report['total']:raise SystemExit(1)
