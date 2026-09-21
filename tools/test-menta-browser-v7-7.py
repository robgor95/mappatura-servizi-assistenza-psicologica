"""Browser QA for the static site. Development-only: Playwright + BeautifulSoup.
Run: python tools/test-menta-browser-v7-7.py
Set AXE_PATH to axe.min.js to include WCAG automated checks. CI requires it.
Set BASE_URL only for an already deployed instance; otherwise a local HTTP server is used.
"""
from __future__ import annotations
import functools, hashlib, json, mimetypes, os, threading, time
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, unquote
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get('QA_OUTPUT', str(ROOT / '.qa-output')))
OUT.mkdir(parents=True, exist_ok=True)
checks = []
def check(name, condition, detail=None):
    checks.append({'name':name, 'passed':bool(condition), **({'detail':detail} if detail else {})})
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
    def end_headers(self):
        self.send_header('Referrer-Policy','no-referrer')
        self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'")
        super().end_headers()
server = None
BASE = os.environ.get('BASE_URL')
if not BASE:
    server = ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    BASE = 'http://127.0.0.1:'+str(server.server_port)
BASE = BASE.rstrip('/')
PAGES = sorted([p.relative_to(ROOT).as_posix() for p in ROOT.glob('*.html') if p.name!='interfaccia-precedente.html'] + [p.relative_to(ROOT).as_posix() for p in (ROOT/'guide').glob('*.html')])
axe = Path(os.environ['AXE_PATH']).read_text() if os.environ.get('AXE_PATH') else None
check('Axe supplied for automated accessibility checks', axe is not None)

def ready(page, path):
    page.goto(BASE+'/'+path, wait_until='networkidle')
    if path.startswith(('servizi.html','archivio.html')):
        page.wait_for_function("!document.getElementById('svc-controls').disabled")
    if path.startswith(('universita.html','scuole.html','privati.html','helpline.html','centri-ascolto.html','strutture-approfondite.html')):
        page.wait_for_function("document.getElementById('result-count').textContent.includes('schede mostrate')")

def axe_scan(page, label):
    if not axe: return
    page.add_script_tag(content=axe)
    result = page.evaluate("""async () => await axe.run(document, {runOnly:{type:'tag', values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})""")
    v=[{'id':v['id'],'impact':v['impact'],'nodes':[{'target':n['target'],'summary':n.get('failureSummary')} for n in v['nodes']]} for v in result['violations']]
    check('Axe '+label,not v,v or None)

try:
  with sync_playwright() as p:
    kwargs={'headless':True}
    if os.environ.get('CHROMIUM_PATH'): kwargs['executable_path']=os.environ['CHROMIUM_PATH']
    browser=p.chromium.launch(**kwargs)
    for width in [360,390,768,1440]:
      context=browser.new_context(viewport={'width':width,'height':844 if width<700 else 1000},reduced_motion='reduce')
      page=context.new_page(); errors=[]
      page.on('pageerror',lambda e:errors.append(str(e)))
      for name in PAGES:
        ready(page,name)
        check(f'No horizontal overflow {width}px {name}',page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
        check(f'One page heading {width}px {name}',page.locator('h1').count()==1)
        check(f'Image alt and valid local assets {width}px {name}',page.evaluate("Array.from(document.images).every(i=>i.hasAttribute('alt') && (!i.complete || i.naturalWidth>0))"))
        if width==390: axe_scan(page,str(width)+' '+name)
        if name in ['index.html','servizi.html','universita.html','scuole.html','helpline.html','guide/index.html','qualita-dati.html'] and width in [390,1440]:
          page.screenshot(path=str(OUT/(name.replace('/','-').replace('.html','')+'-'+str(width)+'.png')),full_page=False)
      check(f'No JavaScript page errors across {len(PAGES)} pages at {width}px',not errors,errors or None)
      ready(page,'index.html')
      inp=page.locator('#menta-query')
      check(f'Usable Menta input above fold {width}px',inp.bounding_box()['y']+inp.bounding_box()['height']<844)
      check(f'Menta input font >=16px {width}px',page.locator('#menta-query').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)>=16'))
      check(f'Input and primary buttons >=44px {width}px',all(page.locator(x).bounding_box()['height']>=44 for x in ['#menta-query','#menta-submit','.menta-independent .button']))
      check(f'Reduced motion respected {width}px',page.evaluate("getComputedStyle(document.documentElement).scrollBehavior==='auto' && getComputedStyle(document.querySelector('#menta-submit')).transitionDuration==='0s'"))
      inp.fill('psicologo per adolescente');page.locator('#menta-submit').click()
      check(f'Four ambiguous alternatives {width}px',page.locator('#menta-options a').count()==4)
      check(f'Keyboard focus on results heading {width}px',page.evaluate("document.activeElement.id==='menta-results-title'"))
      page.keyboard.press('Tab');check(f'Next Tab reaches a result {width}px',page.locator('#menta-options a').first.evaluate('e=>e===document.activeElement'))
      check(f'Visible keyboard focus {width}px',page.evaluate("getComputedStyle(document.activeElement).outlineStyle!=='none' && parseFloat(getComputedStyle(document.activeElement).outlineWidth)>=2"))
      if width==390:
        axe_scan(page,'ambiguous choices')
        page.screenshot(path=str(OUT/'choices-390.png'))
      page.locator('#menta-reset').click();check(f'Reset returns focus and clears input {width}px',inp.input_value()=='' and inp.evaluate('e=>e===document.activeElement'))
      inp.fill('XYZ_TEST_NO_MATCH');page.locator('#menta-submit').click()
      check(f'Unknown input has explicit fallback {width}px',page.locator('#menta-results').get_attribute('data-state')=='unknown' and page.locator('#menta-options a').count()==3)
      inp.fill('overdose')
      check(f'Safety shows immediately before submit {width}px',page.locator('#menta-urgent').is_visible())
      check(f'Safety distinction and call links {width}px',all(page.locator('#menta-urgent').inner_text().find(t)>=0 for t in ['112 / 118','116117','Non equivalgono al soccorso']) and page.locator('#menta-urgent a[href="tel:112"]').count()==1 and page.locator('#menta-urgent a[href="tel:118"]').count()==1)
      page.locator('#menta-submit').click()
      check(f'No forced navigation for safety {width}px','index' in page.url)
      if width==390:
        axe_scan(page,'emergency message')
        page.screenshot(path=str(OUT/'emergency-390.png'))
      inp.fill('CSM Viterbo');page.locator('#menta-submit').click()
      check(f'Canonical CSM Viterbo link {width}px','tipo=CSM&comune=Viterbo' in page.locator('#menta-options a').first.get_attribute('href'))
      page.locator('#menta-options a').first.click();page.wait_for_function("!document.getElementById('svc-controls').disabled")
      check(f'Service filters applied {width}px',page.locator('#svc-tipo').input_value()=='CSM' and page.locator('#svc-comune').input_value()=='Viterbo' and page.locator('.svc-card').count()>0)
      check(f'Updated V7.6 counts in service UI {width}px','428' in page.locator('#svc-total').inner_text() and '296 nodi' in page.locator('#svc-breakdown').inner_text())
      page.locator('.svc-card [data-open]').first.click();check(f'Service details open {width}px',page.locator('#svc-dialog').is_visible())
      page.keyboard.press('Escape');check(f'Dialog closes by keyboard {width}px',not page.locator('#svc-dialog').is_visible())
      ready(page,'servizi.html?q=ZZ_NO_SERVICE_MATCH');check(f'Empty database help {width}px',page.locator('#svc-empty').is_visible())
      page.locator('#svc-reset-empty').click();check(f'Reset database filters {width}px',page.locator('.svc-card').count()>0)
      context.close()
    # Comprehensive privacy instrumentation uses synthetic, non-personal text only.
    context=browser.new_context(viewport={'width':1440,'height':1000})
    page=context.new_page();requests=[]
    page.on('request',lambda r:requests.append({'url':r.url,'body':r.post_data}))
    ready(page,'index.html');before=len(requests);sentinel='MENTA_TEST_SENTINEL_48261'
    page.locator('#menta-query').fill(sentinel+' CSM Viterbo');page.locator('#menta-submit').click();page.wait_for_timeout(250)
    check('No free text in network URLs or bodies',all(sentinel not in json.dumps(r) for r in requests))
    check('No external request triggered by Menta',all(urlsplit(r['url']).netloc==urlsplit(BASE).netloc for r in requests[before:]))
    check('No raw query in page URL or rendered links',sentinel not in page.url and page.evaluate("Array.from(document.querySelectorAll('a[href]')).every(a=>!a.href.includes('MENTA_TEST_SENTINEL_48261'))"))
    check('No cookies or local/session storage for Menta',context.cookies()==[] and page.evaluate('localStorage.length===0 && sessionStorage.length===0'))
    check('Form has no serializable input name',page.locator('#menta-query').get_attribute('name') is None)
    page.locator('#menta-options a').first.click();page.wait_for_load_state('networkidle');page.go_back();page.wait_for_load_state('networkidle')
    check('Back navigation does not restore the need',page.locator('#menta-query').input_value()=='')
    check('Chosen route still does not transmit raw text',all(sentinel not in json.dumps(r) for r in requests))
    # Expected prefilters and legacy entry points.
    for query in ['archivio.html?view=stpit','archivio.html?view=network&tipo=CSM','servizi.html?tipo=STPIT','servizi.html?tipo=Centro%20diurno','servizi.html?percorso=dipendenze','servizi.html?ambito=Et%C3%A0%20evolutiva&origine=privati']:
      ready(page,query);check('Legacy or generated URL '+query,page.locator('.svc-card').count()>0)
    for name,n in [('universita',19),('scuole',20),('helpline',20),('centri-ascolto',33),('privati',17),('strutture-approfondite',169)]:
      ready(page,name+'.html');check('Preserved directory '+name,page.locator('#result-count').inner_text().startswith(str(n)+' di '+str(n)))
    for query in ['centri-ascolto.html?tema=consultorio','centri-ascolto.html?tema=giovani','centri-ascolto.html?tema=antiviolenza','scuole.html?provincia=VT']:
      ready(page,query);check('Directory canonical prefilter '+query,page.locator('#directory-grid .directory-card').count()>0)
      page.locator('[data-reset]').click();check('Directory reset clears URL '+query,'tema=' not in page.url and 'provincia=' not in page.url)
    # No-JS and missing script: the field stays disabled and no need can be submitted.
    nojs=browser.new_context(java_script_enabled=False);np=nojs.new_page();np.goto(BASE+'/index.html')
    check('No-JS safe fallback and independent navigation',np.locator('#menta-query').is_disabled() and np.locator('#menta-fallback').is_visible() and np.locator('.menta-independent a').get_attribute('href')=='/servizi.html');nojs.close()
    faulty=browser.new_context();fp=faulty.new_page();fp.route('**/assets/menta-config-v7-7.js',lambda r:r.abort());fp.goto(BASE+'/index.html');fp.wait_for_load_state('networkidle')
    check('Missing configuration fails closed',fp.locator('#menta-query').is_disabled() and fp.locator('#menta-fallback').is_visible());faulty.close()
    broken=browser.new_context();bp=broken.new_page();bp.route('**/data/portal_data_v7_3.json',lambda r:r.fulfill(status=503,body='not available'))
    bp.goto(BASE+'/servizi.html');bp.wait_for_selector('#menta-service-error',state='visible')
    check('Technical error offers retry and documents',bp.locator('[data-menta-retry]').is_visible() and bp.locator('#menta-service-error a[href="/documenti.html"]').is_visible());broken.close()
    context.close();browser.close()
except Exception as exc:
  check('Browser run completed',False,repr(exc))
finally:
  if server:server.shutdown()

# Validate local resources and download destinations without fetching external health sources.
missing=[];download_targets=set();broken_anchors=[]
for name in PAGES:
    soup=BeautifulSoup((ROOT/name).read_text(),'html.parser')
    for el in soup.select('[href],[src]'):
        raw=el.get('href') or el.get('src');u=urlsplit(raw)
        if u.scheme or u.netloc or raw.startswith('data:'):continue
        target=(ROOT/u.path.lstrip('/')) if u.path.startswith('/') else (ROOT/name).parent/u.path
        if not u.path:target=ROOT/name
        if target.is_dir():target=target/'index.html'
        if not target.exists():missing.append([name,raw]);continue
        if '/downloads/' in raw:download_targets.add(u.path)
        if u.fragment and target.suffix=='.html':
            doc=BeautifulSoup(target.read_text(),'html.parser')
            if not doc.find(id=unquote(u.fragment)):broken_anchors.append([name,raw])
check('All internal page, asset and download targets exist',not missing,missing or None)
check('All HTML fragment targets exist',not broken_anchors,broken_anchors or None)
audit=json.loads((ROOT/'downloads/Audit_Menta_V7_7.json').read_text())
for name,sha in audit.get('guide_text_sha256',{}).items():
    text=BeautifulSoup((ROOT/name).read_text(),'html.parser').select_one('.article-body').get_text(' ',strip=True)
    check('Clinical guide text unchanged: '+name, hashlib.sha256(text.encode()).hexdigest()==sha)
check('Every original repository file remains',all((ROOT/n).is_file() for n in audit['baseline_paths']))
report={'version':'7.7','browser':'Chromium','base':BASE,'viewports':[360,390,768,1440],'pages':PAGES,'download_targets_checked':len(download_targets),'tests':checks,'passed':sum(c['passed'] for c in checks),'total':len(checks),'accessibility_note':'Automatic WCAG checks and keyboard tests are not a certification; real assistive-technology validation remains advisable.'}
(OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'passed':report['passed'],'total':report['total'],'failed':[c for c in checks if not c['passed']]},ensure_ascii=False,indent=2))
raise SystemExit(0 if report['passed']==report['total'] else 1)
