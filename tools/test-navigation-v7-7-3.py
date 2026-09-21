"""Static, browser and optional production QA. No real personal data used."""
from pathlib import Path
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from urllib.parse import urlsplit, unquote
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from collections import deque
import functools, hashlib, json, os, threading, sys

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('QA_OUTPUT',str(ROOT/'.qa-navigation')));OUT.mkdir(exist_ok=True,parents=True)
AUDIT=json.loads((ROOT/'downloads/Audit_Navigazione_V7_7_3.json').read_text())
PAGES=AUDIT['pages'];tests=[]
def check(name,passed,detail=None):
    tests.append({'name':name,'passed':bool(passed),**({'detail':detail} if detail else {})})
def soup(path):return BeautifulSoup((ROOT/path).read_text(),'html.parser')
def internal(value):
    u=urlsplit(value)
    if u.scheme or u.netloc:return None
    p=unquote(u.path).lstrip('/')
    if not p:return 'index.html'
    if p.endswith('/'):p+='index.html'
    elif not Path(p).suffix:p+='.html'
    return p
for name,digest in AUDIT['preserved_sha256'].items():check('Original bytes preserved: '+name,hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==digest)
check('Correct passage found in first guide',any(x['page']=='guide/primo-percorso.html' for x in AUDIT['removed_passages']))
check('Removed only meta passage',not any('Non attribuiamo a etichette diverse' in soup(p).get_text() for p in PAGES))
check('Four primary routes on every page',all(len(soup(p).select('.nav-primary>li>a'))==4 for p in PAGES))
check('Legacy service entrypoint identical',(ROOT/'servizi.html').read_bytes()==(ROOT/'archivio.html').read_bytes())
check('No clinical/router data changed',all(hashlib.sha256((ROOT/n).read_bytes()).hexdigest()==h for n,h in AUDIT['preserved_sha256'].items() if n.startswith('assets/')))
for name in PAGES:
    s=soup(name);ids=[e['id'] for e in s.select('[id]')]
    check('Unique IDs: '+name,len(ids)==len(set(ids)))
    check('One page heading: '+name,len(s.select('h1'))==1)
    local=[]
    for a in s.select('a[href],script[src],link[rel="stylesheet"],img[src]'):
        value=a.get('href',a.get('src',''))
        if value.startswith('/') and not value.startswith('//'):
            f=internal(value)
            if f and not (ROOT/f).exists():local.append(value)
    check('Local destinations and assets: '+name,not local,local)
graph={p:{internal(a['href']) for a in soup(p).select('a[href]') if a['href'].startswith('/')} for p in PAGES}
seen={'index.html':0};queue=deque(['index.html'])
while queue:
    p=queue.popleft()
    for target in graph.get(p,set()):
        if target in graph and target not in seen:seen[target]=seen[p]+1;queue.append(target)
check('All current content reachable within 3 links',all(seen.get(p,99)<=3 for p in PAGES if p not in ['404.html','archivio.html']),seen)
check('Downloads secondary on home',bool(soup('index.html').select_one('details#download-home')))
check('No counter wall on home',not soup('index.html').select('.trust-band'))
check('No automatic duplicate links on new layout',"!document.body.hasAttribute('data-navigation-version')" in (ROOT/'assets/site-v7-4.js').read_text())

class Handler(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
    def end_headers(self):
        self.send_header('Referrer-Policy','no-referrer')
        self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'")
        super().end_headers()
    def send_error(self,code,message=None,explain=None):
        if code!=404:return super().send_error(code,message,explain)
        content=(ROOT/'404.html').read_bytes();self.send_response(404);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(content)));self.end_headers()
        if self.command!='HEAD':self.wfile.write(content)
server=None
BASE=os.environ.get('BASE_URL')
if not BASE:
    server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start();BASE='http://127.0.0.1:'+str(server.server_port)
BASE=BASE.rstrip('/')
AXE=Path(os.environ['AXE_PATH']).read_text() if os.environ.get('AXE_PATH') else None

def go(page,path):
    response=page.goto(BASE+'/'+path,wait_until='networkidle')
    if path.split('?')[0] in ['servizi.html','archivio.html']:page.wait_for_function("!document.getElementById('svc-controls').disabled")
    if path.split('?')[0] in ['universita.html','scuole.html','helpline.html','centri-ascolto.html','strutture-approfondite.html','privati.html']:page.wait_for_function("document.querySelectorAll('#directory-grid article').length>0")
    return response

def axe(page,name):
    if not AXE:return
    page.add_script_tag(content=AXE)
    result=page.evaluate("async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}))}")
    check('Axe: '+name,not result,result)
try:
    with sync_playwright() as p:
        opts={'headless':True}
        if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
        browser=p.chromium.launch(**opts)
        for width in [360,390,768,1440]:
            ctx=browser.new_context(viewport={'width':width,'height':844 if width<800 else 1000},reduced_motion='reduce');page=ctx.new_page();errors=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            for name in PAGES:
                go(page,name)
                check(f'No horizontal overflow {width}: {name}',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
                check(f'Navigation loaded {width}: {name}',page.locator('.nav-primary>li>a').count()==4)
                check(f'Images and alt {width}: {name}',page.evaluate("Array.from(document.images).every(i=>i.hasAttribute('alt')&&(!i.complete||i.naturalWidth>0))"))
                if width==390:axe(page,name)
                if name in ['index.html','servizi.html','studenti.html','documenti.html','guide/primo-percorso.html','404.html'] and width in [390,1440]:page.screenshot(path=str(OUT/(name.replace('/','-')+f'-{width}.png')),full_page=name=='index.html')
            check(f'JavaScript errors {width}',not errors,errors)
            go(page,'index.html');mobile=width<=820
            check(f'Correct mobile button {width}',page.locator('#nav-toggle').is_visible()==mobile)
            if mobile:
                check(f'Closed mobile menu {width}',not page.locator('#site-navigation').is_visible())
                page.locator('#nav-toggle').focus();page.keyboard.press('Enter')
                check(f'Keyboard opens menu {width}',page.locator('#site-navigation').is_visible() and page.locator('#nav-toggle').get_attribute('aria-expanded')=='true')
                page.keyboard.press('Tab');check(f'Tab reaches first main link {width}',page.locator('.nav-primary>li>a').first.evaluate('e=>e===document.activeElement'))
            page.locator('#nav-more summary').focus();page.keyboard.press('Enter')
            check(f'Altro keyboard open {width}',page.locator('#nav-more').get_attribute('open') is not None)
            check(f'Altro no overflow {width}',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
            page.keyboard.press('Tab');check(f'Tab reaches dedicated pages {width}',page.locator('#nav-more a').first.evaluate('e=>e===document.activeElement'))
            check(f'Visible focus {width}',page.evaluate("getComputedStyle(document.activeElement).outlineStyle!=='none'"))
            if width in [390,1440]:page.screenshot(path=str(OUT/f'menu-{width}.png'));axe(page,f'menu-{width}')
            page.keyboard.press('Escape');check(f'Escape closes Altro {width}',page.locator('#nav-more').get_attribute('open') is None)
            if mobile:
                page.keyboard.press('Escape');check(f'Escape closes menu and restores focus {width}',not page.locator('#site-navigation').is_visible() and page.locator('#nav-toggle').evaluate('e=>e===document.activeElement'))
            check(f'Menta input above fold {width}',page.locator('#menta-query').bounding_box()['y']+page.locator('#menta-query').bounding_box()['height']<844)
            check(f'Primary controls usable {width}',all(page.locator(sel).bounding_box()['height']>=44 for sel in ['#menta-query','#menta-submit','.menta-independent a']))
            page.locator('#menta-query').fill('psicologo per adolescente');page.locator('#menta-submit').click();check(f'Ambiguous choices {width}',page.locator('#menta-options a').count()==4)
            check(f'Focus on result heading {width}',page.locator('#menta-results-title').evaluate('e=>e===document.activeElement'))
            page.locator('#menta-query').fill('NAV_TEST_UNKNOWN');page.locator('#menta-submit').click();check(f'Unknown request help {width}',page.locator('#menta-results').get_attribute('data-state')=='unknown')
            page.locator('#menta-query').fill('overdose');check(f'Immediate safety panel {width}',page.locator('#menta-urgent').is_visible())
            check(f'Safety numbers retained {width}',all(t in page.locator('#menta-urgent').inner_text() for t in ['112 / 118','116117','Non equivalgono al soccorso']))
            page.locator('#menta-query').fill('Viterbo CSM');page.locator('#menta-submit').click();page.locator('#menta-options a').first.click();page.wait_for_function("!document.getElementById('svc-controls').disabled")
            check(f'Filters applied {width}',page.locator('#svc-tipo').input_value()=='CSM' and page.locator('#svc-comune').input_value()=='Viterbo' and page.locator('.svc-card').count()>0)
            page.locator('.svc-card [data-open]').first.click();check(f'Service detail opens {width}',page.locator('#svc-dialog').is_visible());page.keyboard.press('Escape');check(f'Service closes {width}',not page.locator('#svc-dialog').is_visible())
            go(page,'servizi.html?q=ZZ_NO_SERVICE_TEST');check(f'Empty-result state {width}',page.locator('#svc-empty').is_visible());page.locator('#svc-reset-empty').click();check(f'Reset service filters {width}',page.locator('.svc-card').count()>0)
            go(page,'servizi.html');page.locator('.nav-filter-shortcuts>summary').click();page.locator('.nav-filter-shortcuts a[data-preset="tipo=CSM"]').click();check(f'Optional shortcuts still work {width}',page.locator('#svc-tipo').input_value()=='CSM')
            go(page,'archivio.html?view=stpit');check(f'Old URL works {width}',page.locator('#svc-tipo').input_value()=='STPIT' and page.locator('.svc-card').count()>0)
            go(page,'index.html');page.locator('.home-quick>summary').click();page.select_option('#tipo','CSM');page.locator('#comune').fill('Viterbo');page.locator('.quick-search button[type=submit]').click();page.wait_for_function("!document.getElementById('svc-controls').disabled");check(f'Original quick search preserved {width}',page.locator('#svc-tipo').input_value()=='CSM' and page.locator('#svc-q').input_value()=='Viterbo')
            go(page,'documenti.html#download-v76');check(f'Historical download fragment opens group {width}',page.locator('#documentazione-tecnica').get_attribute('open') is not None and page.locator('#download-v76').is_visible())
            go(page,'studenti.html#scuole');check(f'Historical student fragment works {width}',page.locator('#prima-raccolta-studenti').get_attribute('open') is not None)
            go(page,'guide/primo-percorso.html#approcci');check(f'Natural approach guidance {width}','Il nome dell’approccio è solo un punto di partenza.' in page.locator('#approcci').inner_text())
            check(f'Reduced motion respected {width}',page.evaluate("Array.from(document.querySelectorAll('.menta-figure')).every(e=>getComputedStyle(e).animationName==='none')"))
            ctx.close()
        ctx=browser.new_context(viewport={'width':390,'height':844},java_script_enabled=False);page=ctx.new_page();page.goto(BASE+'/index.html')
        check('No-JS navigation available',page.locator('#site-navigation').is_visible() and not page.locator('#nav-toggle').is_visible());page.locator('#nav-more summary').click();check('No-JS Altro works',page.locator('#nav-more a').first.is_visible());check('No-JS independent search',page.locator('.menta-independent a').get_attribute('href')=='/servizi.html');ctx.close()
        ctx=browser.new_context(viewport={'width':390,'height':844});page=ctx.new_page();page.route('**/assets/navigation-v7-7-3.js',lambda r:r.abort());page.goto(BASE+'/index.html',wait_until='networkidle');check('Missing navigation script has static fallback',page.locator('#site-navigation').is_visible() and not page.locator('#nav-toggle').is_visible());ctx.close()
        ctx=browser.new_context(viewport={'width':1440,'height':1000});page=ctx.new_page();requests=[];page.on('request',lambda r:requests.append({'url':r.url,'data':r.post_data}))
        go(page,'index.html');before=len(requests);sentinel='NAV_PRIVACY_TEST_45861';page.locator('#menta-query').fill(sentinel+' CSM Viterbo');page.locator('#menta-submit').click();page.wait_for_timeout(200)
        check('Typing/submitting Menta causes no network requests',len(requests)==before)
        check('No free text in URLs, bodies or link hrefs',all(sentinel not in json.dumps(r) for r in requests) and sentinel not in page.url and page.evaluate("Array.from(document.querySelectorAll('a')).every(a=>!a.href.includes('NAV_PRIVACY_TEST_45861'))"))
        check('No persistence of needs',ctx.cookies()==[] and page.evaluate('localStorage.length===0&&sessionStorage.length===0'))
        go(page,'index.html');page.locator('#nav-more summary').click();page.locator('#menta-query').click();check('Click outside closes Altro',page.locator('#nav-more').get_attribute('open') is None)
        r=go(page,'qa-not-a-page-773');check('Real missing path serves custom 404',r.status==404 and page.locator('#site-navigation').count()==1 and page.locator('.page-404').count()==1)
        for route in ['documenti.html','downloads/guide/Guida_01_primo-percorso.pdf','downloads/guide/Guida_03_privato.pdf','downloads/Guide_Percorsi_Cura_Lazio_V7_4.pdf','data/portal_data_v7_3.json']:
            response=ctx.request.get(BASE+'/'+route);check('Download/content response: '+route,response.ok and len(response.body())>100)
        ctx.close();browser.close()
except Exception as exc:
    check('Browser suite execution',False,str(exc))
finally:
    if server:server.shutdown()
report={'version':'7.7.3','scope':'static and Chromium navigation QA','baseline':AUDIT['baseline_commit'],'axe_used':bool(AXE),'tests':tests,'passed':sum(t['passed'] for t in tests),'total':len(tests),'limits':['Automated checks are not a complete screen-reader audit.','No clinical data verification was performed.']}
(OUT/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'passed':report['passed'],'total':report['total'],'failures':[t for t in tests if not t['passed']]},ensure_ascii=False,indent=2))
sys.exit(0 if report['passed']==report['total'] else 1)
