"""Verify the UX release without changing datasets or requesting map tiles."""
from pathlib import Path
from urllib.parse import urlsplit, urljoin, unquote
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from bs4 import BeautifulSoup
import argparse, hashlib, json, os, subprocess, time, datetime
R=Path(__file__).resolve().parents[1]
BASE='9a15c39c6f1c5008cde6fbe44dd4f419f524ba97'
ORIGIN='https://mappatura-servizi-assistenza-psicologica.pages.dev'
args=argparse.ArgumentParser();args.add_argument('--production',action='store_true');opts=args.parse_args()
checks=[]
def check(name, passed, detail=None):
    item={'name':name,'passed':bool(passed)}
    if detail is not None:item['detail']=detail
    checks.append(item)
def old(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=R)
audit=json.loads((R/'downloads/Audit_UX_V7_12.json').read_text())
manifest=json.loads((R/'version.json').read_text());previous=json.loads(old('version.json'))
check('UX version is 7.12.1; clinical and geography versions unchanged',manifest['web_version']=='7.12.1' and manifest['data_extension_version']==previous['data_extension_version'] and manifest['map_version']==previous['map_version'])
for key in ['counts_current','map','menta','menta_asset','support_layer','clinical_review','indexing_enabled']:
    check('Preserved manifest block '+key,manifest[key]==previous[key])
for p,digest in audit['protected_files'].items():
    if not (R/p).exists() or hashlib.sha256((R/p).read_bytes()).hexdigest()!=digest:check('Protected file '+p,False)
check('All protected files match their pinned baseline hashes',not any(x['name'].startswith('Protected file ') and not x['passed'] for x in checks),len(audit['protected_files']))
for p in ['assets/servizi-v7-11-7.js','assets/servizi-data-v7-5-1.js','assets/map-data-v7-11-7.js','assets/map-v7-11-7.js','assets/menta-config-v7-10.js','assets/menta-core-v7-9-2.js','assets/menta-ui-v7-7.js']:
    check('Preserved functional engine '+p,(R/p).read_bytes()==old(p))
parsed={item['path']:BeautifulSoup((R/item['path']).read_text(),'html.parser') for item in audit['pages']}
new_link_errors=[]
for p,s in parsed.items():
    check('Shared navigation and design: '+p,len(s.select('.ux-header'))==1 and len(s.select('.ux-footer'))==1 and len(s.select('main'))==1 and len(s.select('main h1'))==1 and len(s.select('link[href="/assets/menta-design-v7-12.css"]'))==1 and len(s.select('script[src="/assets/ux-ui-v7-12-1.js"]'))==1)
    check('Noindex on '+p,bool(s.find('meta',attrs={'name':'robots'}) and 'noindex' in s.find('meta',attrs={'name':'robots'}).get('content','')))
    try:prior=BeautifulSoup(old(p),'html.parser');previous_links={a.get('href') for a in prior.select('a[href]')}
    except subprocess.CalledProcessError:previous_links=set()
    for a in s.select('a[href]'):
        href=a['href']
        if href in previous_links:continue
        u=urlsplit(urljoin(ORIGIN+'/'+p,href))
        if u.netloc!=urlsplit(ORIGIN).netloc or u.scheme not in ['http','https']:continue
        f=unquote(u.path.lstrip('/')) or 'index.html'
        if not (R/f).is_file():new_link_errors.append({'from':p,'href':href,'reason':'missing local file'})
        elif u.fragment and f in parsed:
            if not parsed[f].find(id=unquote(u.fragment)):new_link_errors.append({'from':p,'href':href,'reason':'missing anchor'})
check('Every new internal link and static anchor resolves',not new_link_errors,new_link_errors)
index=parsed['sezioni.html'];routes={a['href'].lstrip('/') for a in index.select('[data-ux-section]')}
check('Every substantive current section is discoverable from the index',routes=={x['path'] for x in audit['section_catalog']})
check('Homepage has exactly six essential route links',len(parsed['index.html'].select('.ux-hero .actions a'))==2 and len(parsed['index.html'].select('.ux-home-section .ux-route-card'))==4 and not parsed['index.html'].select('main form'))
previous_home=BeautifulSoup(old('index.html'),'html.parser')
old_ids={n['id'] for n in previous_home.select('main [id]')}
orientation_ids={n['id'] for n in parsed['orientati.html'].select('main [id]')}
check('All old homepage content anchors preserved in orientation page',old_ids<=orientation_ids,sorted(old_ids-orientation_ids))
check('Original Menta form and crisis contacts preserved',bool(parsed['orientati.html'].select('#menta-form #menta-query')) and bool(parsed['orientati.html'].select('#menta-urgent a[href="tel:112"]')))
check('Discovery uses no network, storage or HTML insertion',not any(x in (R/'assets/ux-ui-v7-12-1.js').read_text() for x in ['fetch(','XMLHttpRequest','localStorage','sessionStorage','innerHTML','sendBeacon']))

# The complete pinned dataset and all historical files remain unchanged.
for p in subprocess.check_output(['git','ls-tree','-r','--name-only','d57a6df5a3683a6ca4a77dc6ed47b51c15a29fcb'],cwd=R,text=True).splitlines():
    if p.startswith(('data/','offline/','downloads/')):
        expected=subprocess.check_output(['git','show','d57a6df5a3683a6ca4a77dc6ed47b51c15a29fcb:'+p],cwd=R)
        check('V7.12 data/history preserved: '+p,(R/p).read_bytes()==expected)
check('Two explained home choices',len(parsed['index.html'].select('.ux-choice-card'))==2 and all(c.select_one('h2') and c.select_one('p') and c.select_one('a[href]') for c in parsed['index.html'].select('.ux-choice-card')))
check('Three native need pathways and optional free input',len(parsed['orientati.html'].select('.ux-need-path'))==3 and not parsed['orientati.html'].select_one('#orientation-custom').has_attr('open'))
check('Every native need pathway has explanation and destination',all(d.select_one('summary') and d.select_one('.ux-need-body p') and d.select_one('.ux-need-body a[href]') for d in parsed['orientati.html'].select('.ux-need-path')))
check('Only presentation labels changed in Menta UI',(R/'assets/menta-ui-v7-12-1.js').read_text().replace('Percorsi da esplorare','Potresti cercare…').replace('Un percorso da esplorare','Un punto da cui partire').replace('Leggi la descrizione e apri il percorso. Potrai poi cercare strutture e contatti nell’elenco dei servizi.','Scegli il collegamento da aprire. Puoi sempre modificare i filtri o esplorare in autonomia.').replace('Apri l’elenco dei servizi →','Apri con i filtri →').replace('Esplora il percorso →','Apri la sezione →').strip()==(R/'assets/menta-ui-v7-7.js').read_text().strip())

if opts.production:
    commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip()
    def fetch(p):
        try:
            with urlopen(Request(ORIGIN+'/'+p+'?ux_verify='+commit,headers={'User-Agent':'LazioUXVerification/7.12','Cache-Control':'no-cache'}),timeout=25) as r:return r.status,dict(r.headers),r.read()
        except HTTPError as e:return e.code,dict(e.headers),e.read()
    expected=(R/'version.json').read_bytes();deployed=False
    for _ in range(30):
        try:
            status,headers,data=fetch('version.json')
            if status==200 and data==expected:deployed=True;break
        except Exception:pass
        time.sleep(5)
    check('Exact manifest has reached Cloudflare production',deployed)
    if deployed:
        paths=[x['path'] for x in audit['pages']]+['assets/menta-design-v7-12.css','assets/ux-ui-v7-12-1.js','assets/percorsi-v7-12-1.css','assets/menta-ui-v7-12-1.js','assets/ux-polish-v7-12.css','assets/directory-v7-12.js','assets/directory-disclosure-v7-12.js','downloads/Release_Notes_V7_12_1.md','downloads/Audit_Percorsi_V7_12_1.json','version.json','sitemap.xml','robots.txt','downloads/Release_Notes_V7_12.md','downloads/Audit_UX_V7_12.json','downloads/Verifiche_UX_V7_12.json','assets/menta/menta-base-v7-10-1.webp','data/presidi_geo_v7_11_7.json','data/portal_data_v7_3.json']
        for p in paths:
            try:
                status,h,b=fetch(p);h={k.lower():v for k,v in h.items()}
                check('Production exact bytes and noindex: '+p,status==200 and b==(R/p).read_bytes() and 'noindex' in h.get('x-robots-tag',''),{'http_status':status,'sha256':hashlib.sha256(b).hexdigest(),'noindex':h.get('x-robots-tag')})
            except Exception as e:check('Production file '+p,False,str(e))
        try:
            status,h,b=fetch('__ux-v712-not-found__');check('Unknown routes remain noindex 404',status==404 and b==(R/'404.html').read_bytes() and 'noindex' in {k.lower():v for k,v in h.items()}.get('x-robots-tag',''))
        except Exception as e:check('Unknown routes remain noindex 404',False,str(e))
report={'version':'7.12.1','checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'production':opts.production,'checks':checks,'passed':sum(c['passed'] for c in checks),'total':len(checks)}
out=Path(os.environ.get('QA_OUT','/tmp/ux-v712'));out.mkdir(parents=True,exist_ok=True);(out/('production.json' if opts.production else 'integrity.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
if report['passed']!=report['total']:raise SystemExit(1)
