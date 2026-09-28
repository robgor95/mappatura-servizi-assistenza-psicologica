#!/usr/bin/env python3
"""Deterministic V7.18 integration from the immutable V7.17 baseline.
Never changes source datasets or the historical offline/download editions.
"""
from pathlib import Path
from bs4 import BeautifulSoup
import subprocess,json,re,base64,hashlib
ROOT=Path(__file__).resolve().parents[1]
BASE='712ba70a5cce0b65243c500451fa25536544c1ae'
def old(p):return subprocess.check_output(['git','show',BASE+':'+p],cwd=ROOT).decode()
def put(p,s):
 f=ROOT/p;f.parent.mkdir(parents=True,exist_ok=True);f.write_text(s,encoding='utf-8')
def fragment(s):return BeautifulSoup(s,'html.parser')
def append_html(parent,s):
 for node in list(fragment(s).contents):parent.append(node)
def replace_html(parent,s):parent.clear();append_html(parent,s)
def patch_file(p,pairs):
 f=ROOT/p;s=f.read_text()
 for before,after in pairs:s=s.replace(before,after)
 f.write_text(s)

# Fix promise propagation and validate the exact same fields in browser and server.
patch_file('lib/editorial-api.mjs',[
 ('return contentAPI(db,u,request,parts);','return await contentAPI(db,u,request,parts);'),
 ('return usersAPI(db,u,request);','return await usersAPI(db,u,request);'),
 ('return mediaAPI(db,u,request,env,parts[0]);','return await mediaAPI(db,u,request,env,parts[0]);'),
 ('return proposalsAPI(db,u,request,parts,records);','return await proposalsAPI(db,u,request,parts,records);'),
 ('return historyAPI(db,u,request,records);','return await historyAPI(db,u,request,records);'),
 ("category:base?.category||fields.category||'',fields}","category:base?.category||fields.category||'',sources:base?.sources||[],fields}"),
 ("if(!Object.hasOwn(FIELDS,k))fail(400,'Campo non modificabile: '+k);", "if(!Object.hasOwn(FIELDS,k))fail(400,'Campo non modificabile: '+k);if(record.entity==='support'&&FIELDS[k].sensitive)fail(400,'Il campo sanitario non è applicabile a questa scheda territoriale.');"),
 ("if('ssn' in values&&!['indicata'", "if(mode==='add'&&/casa\\s+rifugio|sede\\s+protetta/i.test(values.name||''))fail(400,'Le sedi protette non sono ammesse nel catalogo pubblico.');\n for(const k of ['auth','accreditation'])if(k in values&&!['indicata','dichiarazione','da-verificare','rete-asl'].includes(values[k]))fail(400,'Stato amministrativo non valido.');\n if('ssn' in values&&!['indicata'"),
 ("p=validateProposal(b,curr.record,r.mode);\n await transaction", "p=validateProposal(b,curr.record,r.mode);\n if(b.base_hash&&b.base_hash!==curr.hash)fail(409,'La scheda è cambiata. Riapri la proposta sui dati correnti.');\n await transaction")
])
patch_file('assets/editorial-core-v7-18.mjs',[("s>new Date().toISOString().slice(0,10)","s>new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Rome'})")])
patch_file('assets/editorial-data-v7-18.js',[
 ("if(k==='name'){r.raw.nome=val;r.raw.denominazione=val;}","if(k==='name'){r.raw.nome=val;r.raw.denominazione=val;}if(k==='website')r.raw.sito_ufficiale=val;\n if(k==='address'||k==='town'){r.raw.nota_geografia_editorial='Sede aggiornata dalla redazione. La localizzazione cartografica precedente non è riconfermata da questa modifica.';}\n if(['ssn','auth','accreditation'].includes(k)){const labels={'indicata':'Documentato nelle fonti allegate alla revisione','dichiarazione':'Dichiarato dal gestore','da-verificare':'Da verificare','rete-asl':'Rete pubblica / ASL'};r.raw[core.FIELDS[k].raw]=labels[val]||val;if(k==='ssn'){r.raw.rapporto_ssn=labels[val]||val;r.raw.convenzione_ssn=labels[val]||val;}}"),
 ("origin:v.origin||p.key.split(':')[0],raw:{}", "origin:v.origin||p.key.split(':')[0],raw:{id:id}")
])
patch_file('assets/admin-v7-18.mjs',[
 ("const grid=el('div',null,{class:'ng-form-grid'});box.append(grid);\n let entity,origin,category,asl;", "if(rec.sources?.length){const sources=el('details');sources.append(el('summary','Fonti già associate alla scheda'));for(const url of rec.sources)sources.append(el('p',null),el('a',url,{href:url,target:'_blank',rel:'noopener noreferrer'}));box.append(sources);}const grid=el('div',null,{class:'ng-form-grid'});box.append(grid);\n let entity,origin,category,asl;"),
 ("Object.entries(FIELDS).map(([k,v])=>[k,v.label])", "Object.entries(FIELDS).filter(([k,v])=>rec.entity!=='support'||!v.sensitive).map(([k,v])=>[k,v.label])")
])

# Brand asset: exact supplied artwork, only resized/re-encoded. No invented transparent logo.
logo=base64.b64decode((ROOT/'tools/network-logo-v7-18.b64').read_text().strip(),validate=True)
assert logo[:4]==b'RIFF' and len(logo)==5544
(ROOT/'assets/network-logo-v7-18.webp').write_bytes(logo)

# Public clinical renderer. All administrative identities stay in the private API.
svc=old('assets/servizi-v7-16.js')
svc=svc.replace('async function start(){','async function start(){\n  await window.LazioEditorial?.ready;')
needle="+'<p class=\"svc-record-meta\">'"
# Isolate the exact legacy footer, rather than changing the data values.
legacy="+'<p class=\"svc-record-meta\">'+(r.auditDate?'Riesame parziale: '+esc(r.auditDate):'Data documentale precedente: '+esc(r.date||'non documentata'))+'</p></article>'"
if legacy in svc:
 svc=svc.replace(legacy,"+(window.LazioEditorial?.freshnessHTML(r)||'')+'</article>'")
else:
 before="</div><p class=\"svc-record-meta\">'+(r.auditDate?'Riesame parziale: '+esc(r.auditDate):'Data documentale precedente: '+esc(r.date||'non documentata'))+'</p></article>'"
 assert before in svc,'clinical card footer changed'
 svc=svc.replace(before,"</div>'+(window.LazioEditorial?.freshnessHTML(r)||'')+'</article>'")
# Remove the version-by-version audit blocks from patient-facing detail, retaining source/uncertainty.
lines=[]
for line in svc.splitlines():
 if re.match(r'\s*if\(r\.v(?:76|79|791|792|793|794|711|7111|7112|7113|7114|7115|7116|7117)',line):continue
 lines.append(line)
svc='\n'.join(lines)+'\n'
# Existing fields are rendered sparsely; an unknown value is not presented as a recent confirmation.
svc=svc.replace("function field(label,value,wide){return", "function field(label,value,wide){if(!value||/^(?:Non documentat[oa]|ND)(?:\\s|$)/i.test(String(value)))return '';return")
svc=svc.replace("const section=(name,content,id)=>'<section", "const section=(name,content,id)=>!content?'':'<section")
# Attach date only once, and keep sources accessible instead of revision authors.
source_line="body+=sourceLinks(r.sources);"
if source_line in svc:
 svc=svc.replace(source_line,"const geoNote=v.nota_geografia_editorial||v.nota_geografia_v716||v.nota_geografia_v7117||v.nota_geografia_v7116||v.nota_geografia_v7115||v.nota_geografia_v7114||v.nota_geografia_v7113||v.nota_geografia_v7112||'';\n  if(geoNote)body+=section('Precisazioni sulla posizione',field('Limiti documentali',geoNote,true));\n  body+=(window.LazioEditorial?.freshnessHTML(r)||'')+'<details class=\"ng-public-sources\"><summary>Fonti delle informazioni</summary>'+sourceLinks(r.sources)+'</details>';")
else:
 # The generator must not silently omit a critical integration point.
 marker="return intro+buttons+body;"
 assert marker in svc,'detail return changed'
 svc=svc.replace(marker,"body+=(window.LazioEditorial?.freshnessHTML(r)||'');\n  "+marker)
svc=svc.replace("mapLink.href='/mappa.html'+(p.size?'?'+p:'');", "if(state.asl)p.set('vista','sanitaria');mapLink.href='/mappa.html'+(p.size?'?'+p:'');document.querySelectorAll('[data-full-map]').forEach(a=>a.href=mapLink.href);")
svc=svc.replace("window.LazioProvinceMap?.update({rows,filtered,state:{...state}});", "window.LazioProvinceMap?.update({rows,filtered,state:{...state}});window.LazioEditorial?.notice();")
put('assets/servizi-v7-18.js',svc)
mapdata=old('assets/map-data-v7-16.js').replace('async function load(){','async function load(){\n  await root.LazioEditorial?.ready;')
put('assets/map-data-v7-18.js',mapdata)
# Both maps retain the exact same source points/geometry. Palette changes do not imply ASL borders.
for source,target in [('assets/search-map-v7-16.js','assets/search-map-v7-18.js'),('assets/map-hierarchy-v7-14.js','assets/map-hierarchy-v7-18.js')]:
 js=old(source).replace("'#245b48'","'#126899'").replace("'#6d8778'","'#7899a8'").replace("'#8fc3a6'","'#90bed4'").replace("'#dcebdd'","'#e2f0f5'").replace("'#7b9384'","'#84a4b3'")
 if source.endswith('map-hierarchy-v7-14.js'):
  js=js.replace("mode=supportedMode(params0.get('vista'));", "mode=supportedMode(params0.get('vista')||(params0.get('asl')?'sanitaria':''));")
 put(target,js)
put('assets/ux-ui-v7-18.js',old('assets/ux-ui-v7-12-1.js').replace('820px','1040px'))

support=old('assets/supporto-v7-17.js').replace('async function init(){try{','async function init(){try{await window.LazioEditorial?.ready;')
support=support.replace('const d=await res.json();','let d=await res.json();')
support=support.replace('state.data=d;state.rows=flatten(d);','d=window.LazioEditorial?.applySupport(d)||d;state.data=d;state.rows=flatten(d);')
support=support.replace("function tel(v){return String(v||'').replace(/[^+\\d]/g,'');}","function tel(v){return window.LazioEditorial?.firstPhone(v)||'';}")
support=support.replace("(phone?'<a class=\"button\"", "(tel(phone)?'<a class=\"button\"")
support=support.replace("<p class=\"micro\">Controllo documentale: '+esc(r.checked_at||state.data.checked_at)+'. Contatti e orari possono cambiare.</p></article>'", "'+(window.LazioEditorial?.freshnessHTML(r)||'')+'</article>'")
support=support.replace("render();$('support-controls').hidden=false;", "render();$('support-controls').hidden=false;window.LazioEditorial?.notice();")
put('assets/supporto-v7-18.js',support)

# Structure/private directories apply exactly the same approved field corrections.
directory=old('assets/directory-v7-12.js')
directory=directory.replace(']).then(function(x){var c=cat(cfg.source)',']).then(async function(x){await window.LazioEditorial?.ready;var c=cat(cfg.source)')
# Last integration point; also reconcile the already-published V7.16 scope before collaborative changes.
directory=directory.replace(';init(rows)}).catch',";const latest=await fetch('/data/audit_operativo_v7_16.json').then(r=>{if(!r.ok)throw Error('Aggiornamento di base non disponibile');return r.json();});rows=window.LazioAudit716.directory(c,rows,latest);rows=window.LazioEditorial?.applyDirectory(c,rows)||rows;init(rows);window.LazioEditorial?.notice()}).catch")
# The legacy loader uses a different Promise nesting ending; ensure callback is async.
directory=directory.replace('.then(function(x){var c=cat(cfg.source)', '.then(async function(x){await window.LazioEditorial?.ready;var c=cat(cfg.source)')
directory=directory.replace('return out+"</article>"','return out+(window.LazioEditorial?.freshnessHTML(r)||\'\')+"</article>"')
put('assets/directory-v7-18.js',directory)

NAV='''<nav aria-label="Navigazione principale" id="site-navigation"><ul class="nav-primary"><li><a href="/index.html">Home</a></li><li><a href="/servizi.html">Trova un servizio</a></li><li><a href="/mappa.html">Mappa</a></li><li><a href="/network-giovani.html">Network Giovani</a></li><li class="nav-more"><details id="nav-more"><summary>Altro<span class="nav-chevron" aria-hidden="true"></span></summary><div class="nav-more-panel"><div><h3>Per orientarti</h3><ul><li><a href="/orientati.html">Orientati con Menta</a></li><li><a href="/guide/index.html">Guide ai servizi</a></li><li><a href="/ascolto.html">Numeri utili e ascolto</a></li><li><a href="/aiuto-adesso.html">Aiuto adesso</a></li></ul></div><div><h3>Persone e territorio</h3><ul><li><a href="/studenti.html">Sei uno studente?</a></li><li><a href="/supporto-territoriale.html">Consultori, PUA e supporto</a></li><li><a href="/strutture-approfondite.html">Comunità e centri diurni</a></li><li><a href="/fondazione-di-liegro.html">Fondazione Don Luigi Di Liegro</a></li></ul></div><div><h3>Il progetto</h3><ul><li><a href="/network-giovani.html">Notizie e iniziative</a></li><li><a href="/metodo.html">Fonti e metodo</a></li><li><a href="/documenti.html">Documenti e download</a></li><li><a href="/redazione.html">Area redazione</a></li></ul></div><div class="ux-all-link"><a href="/sezioni.html">Tutte le sezioni →</a></div></div></details></li></ul></nav>'''
FOOT='''<footer class="site-footer ux-footer"><div class="container ux-footer-grid"><div><strong>Salute mentale Lazio</strong><p>Un progetto del Network Giovani.</p><p>Uno strumento per orientarsi, non un servizio di assistenza sanitaria né un portale della Regione Lazio.</p><p>Contatti, modalità di accesso e disponibilità vanno confermati con i servizi.</p></div><nav aria-label="Percorsi utili"><span class="ux-footer-label">Da dove iniziare</span><a href="/orientati.html">Orientati con Menta</a><a href="/servizi.html">Trova un servizio</a><a href="/mappa.html">Esplora la mappa</a><a href="/sezioni.html">Tutte le sezioni</a></nav><nav aria-label="Progetto e informazioni"><span class="ux-footer-label">Network Giovani</span><a href="/network-giovani.html">Notizie e iniziative</a><a href="/fondazione-di-liegro.html">Fondazione Don Luigi Di Liegro</a><a href="/metodo.html">Fonti e metodo</a><a href="/privacy.html">Privacy e uso del sito</a><a href="/redazione.html">Accesso redazione</a></nav></div><div class="container footer-note">Informazioni orientative, non diagnosi o prescrizioni. Revisione clinica indipendente non effettuata.</div></footer>'''
BRAND='''<span class="brand-mark" aria-hidden="true"><img src="/assets/network-logo-v7-18.webp" width="64" height="64" alt="" decoding="async"/></span><span>Salute mentale <b>Lazio</b><small>Un progetto del Network Giovani</small></span>'''
PUBLIC_SCRIPTS={
 '/assets/ux-ui-v7-12-1.js':'/assets/ux-ui-v7-18.js','/assets/servizi-v7-16.js':'/assets/servizi-v7-18.js','/assets/map-data-v7-16.js':'/assets/map-data-v7-18.js','/assets/search-map-v7-16.js':'/assets/search-map-v7-18.js','/assets/map-hierarchy-v7-14.js':'/assets/map-hierarchy-v7-18.js','/assets/supporto-v7-17.js':'/assets/supporto-v7-18.js','/assets/directory-v7-12.js':'/assets/directory-v7-18.js'
}
def inject_editorial(soup):
 if soup.select_one('script[src="/assets/editorial-data-v7-18.js"]'):return
 script=soup.new_tag('script',src='/assets/editorial-data-v7-18.js');script['defer']=''
 audits=soup.select('script[src^="/assets/audit-data-"]')
 if audits:
  if not soup.select_one('script[src="/assets/audit-data-v7-16.js"]'):
   a=soup.new_tag('script',src='/assets/audit-data-v7-16.js');a['defer']='';audits[-1].insert_after(a);a.insert_after(script)
  else:audits[-1].insert_after(script)
 else:
  # Support script at end of body is synchronous, so its adapter must be synchronous as well.
  script.attrs.pop('defer',None);support_script=soup.select_one('script[src="/assets/supporto-v7-18.js"]');support_script.insert_before(script)

def brand_page(soup,path):
 body=soup.body;body['class']=list(dict.fromkeys(body.get('class',[])+['ng-site']));body['data-brand-version']='7.18'
 theme=soup.select_one('meta[name="theme-color"]')
 if theme:theme['content']='#126899'
 favicon=soup.select_one('link[rel="icon"]')
 if favicon:favicon['href']='/assets/network-logo-v7-18.webp';favicon['type']='image/webp'
 b=soup.select_one('a.brand')
 if b:replace_html(b,BRAND);b['aria-label']='Salute mentale Lazio, un progetto del Network Giovani: homepage'
 nav=soup.select_one('#site-navigation')
 if nav:nav.replace_with(fragment(NAV).nav)
 for a in soup.select('#site-navigation a[href]'):
  if a['href']=='/'+path or (path=='notizia.html' and a['href']=='/network-giovani.html'):a['aria-current']='page'
 f=soup.select_one('footer.site-footer')
 if f:f.replace_with(fragment(FOOT).footer)
 for script in soup.select('script[src]'):
  if script['src'] in PUBLIC_SCRIPTS:script['src']=PUBLIC_SCRIPTS[script['src']]
 for oldcss in soup.select('link[href="/assets/network-v7-18.css"]'):oldcss.decompose()
 soup.head.append(soup.new_tag('link',rel='stylesheet',href='/assets/network-v7-18.css'))
 for svg in soup.select('svg[viewbox]'):svg['viewBox']=svg['viewbox'];del svg['viewbox']
 if path in ['servizi.html','mappa.html','strutture-approfondite.html','privati.html','supporto-territoriale.html']:inject_editorial(soup)
 return soup

# Generate from original HTML each time to preserve original content and avoid cumulative rewrites.
paths=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE],cwd=ROOT,text=True).splitlines();styled=[]
for p in paths:
 if not p.endswith('.html') or (('/' in p) and not p.startswith('guide/')):continue
 original=old(p);soup=fragment(original)
 if not soup.select_one('body.ux-shell') or p=='archivio.html':continue
 brand_page(soup,p)
 if p=='index.html':
  soup.select_one('.ux-hero .eyebrow').string='Salute mentale, un passo alla volta'
  replace_html(soup.select_one('#ux-home-title'),'Trova il supporto<br/><em>da cui iniziare.</em>')
  soup.select_one('.ux-hero .lede').string='Lasciati guidare da Menta oppure cerca direttamente servizi, indirizzi e contatti nel Lazio.'
  append_html(soup.select_one('.ux-choice-grid'),'<p class="ng-map-entry">Preferisci partire dal territorio? <a href="/mappa.html">Esplora la mappa →</a></p>')
  home_map=soup.select_one('#inizia a[href="/mappa.html"]')
  if home_map:
   home_map['href']='/guide/index.html';home_map.h3.string='Capire i servizi';home_map.p.string='Guide pratiche per scegliere il percorso e sapere come accedere.'
  banner=fragment('<div data-ng-banner="home" hidden></div>').div;soup.select_one('.ux-hero').insert_after(banner)
  append_html(soup.main,'''<section class="ng-section" aria-labelledby="ng-home-title"><div class="ng-section-header"><h2 id="ng-home-title">Dal Network Giovani</h2><a href="/network-giovani.html">Tutte le notizie e iniziative →</a></div><p>Uno spazio per notizie, iniziative e opportunità del Network.</p><div class="ng-grid" data-ng-feed="home" hidden></div><p class="ng-empty" data-ng-empty="home">Le prossime notizie e iniziative saranno raccolte qui. Nel frattempo, scopri lo spazio <a href="/network-giovani.html">Network Giovani</a>.</p></section><section class="ng-section ng-teaser" aria-labelledby="ng-foundation-home"><div><p class="ng-kicker">Conoscere chi si occupa di salute mentale</p><h2 id="ng-foundation-home">Fondazione Don Luigi Di Liegro</h2><p>Una sezione informativa dedicata alla Fondazione e alle sue attività. La presenza in questa pagina non indica una partnership con il progetto.</p></div><a class="button secondary" href="/fondazione-di-liegro.html">Conosci la Fondazione →</a></section>''')
  soup.head.append(soup.new_tag('script',type='module',src='/assets/editorial-public-v7-18.mjs'))
 if p=='servizi.html':
  for a in soup.select('#province-explorer a[href="/mappa.html"]'):a['data-full-map']=''
 if p=='supporto-territoriale.html':
  eyebrow=soup.select_one('.support-hero .eyebrow')
  if eyebrow:eyebrow.string='Famiglie, persone e territorio'
 if p=='metodo.html':append_html(soup.main,'''<section class="callout" id="redazione-v718"><h2>Un progetto del Network Giovani</h2><p>Il portale è promosso dal Network Giovani. Menta resta una guida di orientamento, non un professionista sanitario. La sezione dedicata alla Fondazione Don Luigi Di Liegro è informativa: non dichiara una partnership, un patrocinio o un’approvazione della Fondazione.</p><h3>Controlli e aggiornamenti per campo</h3><p>La data nelle schede indica un controllo documentale, non una certificazione clinica. Quando sono stati controllati solo alcuni campi viene indicato “controllo parziale”. Aggiornare un telefono non riconferma orari, convenzioni, disponibilità o ingresso. Le fonti e le incertezze pertinenti restano consultabili.</p><p>Le correzioni collaborative richiedono una proposta, fonti per i campi interessati e approvazione. Nuove schede e campi amministrativi/sanitari sensibili richiedono anche una verifica specialistica. Le identità dei redattori, i motivi interni, le proposte respinte e la cronologia restano nell’area riservata. La revisione documentale non sostituisce la revisione clinica indipendente, ancora non effettuata.</p></section>''')
 if p=='privacy.html':append_html(soup.main,'''<section class="callout" id="privacy-redazione"><h2>Area redazione e contenuti del Network</h2><p>La ricerca pubblica continua a essere elaborata nel browser. Il codice del portale non aggiunge analytics né richiede la posizione del dispositivo. Le notizie e le correzioni approvate sono lette da endpoint del sito; le bozze e l’audit interno non sono inclusi nelle risposte pubbliche.</p><p>L’area redazione, separata dalla consultazione pubblica, richiede un’identità verificata e un’autorizzazione applicativa. Quando attivata, Cloudflare Access gestisce l’autenticazione e i relativi cookie di sessione. Il sistema editoriale tratta email, ruoli, bozze, immagini e cronologia delle operazioni autorizzate. Non è uno spazio per dati clinici di pazienti, referti o informazioni sanitarie personali.</p><p>Prima di attivare l’area riservata, i responsabili del progetto devono completare le informazioni sul titolare, il recapito per la privacy e i tempi di conservazione di account, audit, bozze e immagini. Nessuna registrazione pubblica è prevista. L’accesso amministrativo rimane disabilitato finché non è configurato e verificato.</p><p>Un link a un questionario apre il sito esterno che lo ospita: finalità, dati richiesti e informativa del questionario devono essere consultabili prima della compilazione. Il portale non acquisisce le risposte tramite il banner.</p></section>''')
 if p=='documenti.html':append_html(soup.main,'''<section class="callout" id="release-v718"><h2>V7.18 · Network Giovani e redazione</h2><p>Nuovo stile del Network, navigazione semplificata, pagine informative e strumenti editoriali ad accesso riservato. Il database sanitario di base rimane invariato.</p><p><a href="/downloads/Release_Notes_V7_18.md">Note della versione</a> · <a href="/downloads/Configurazione_Redazione_V7_18.md">Attivazione tecnica dell’area riservata</a></p></section>''')
 if p=='sezioni.html':
  group=soup.select_one('[data-ux-group] .ux-route-grid') or soup.select_one('.ux-route-grid')
  if group:append_html(group,'''<a class="ux-route-card" href="/network-giovani.html" data-ux-section="network" data-ux-category="servizi" data-ux-search="network giovani notizie eventi link opportunità"><h3>Network Giovani</h3><p>Notizie, iniziative, link e opportunità.</p></a><a class="ux-route-card" href="/fondazione-di-liegro.html" data-ux-section="fondazione" data-ux-category="servizi" data-ux-search="fondazione don luigi di liegro salute mentale associazioni"><h3>Fondazione Don Luigi Di Liegro</h3><p>Informazioni e collegamenti alle attività della Fondazione.</p></a>''')
 put(p,str(soup));styled.append(p)

# Legacy search entry now forwards URL state to the canonical and current interface.
put('assets/archivio-redirect-v7-18.js',"location.replace('/servizi.html'+location.search+location.hash);\n")
put('archivio.html','''<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Ricerca dei servizi | Network Giovani</title><script src="/assets/archivio-redirect-v7-18.js"></script></head><body><p>La ricerca dei servizi è disponibile in <a href="/servizi.html">Trova un servizio</a>. Le versioni precedenti restano nei <a href="/documenti.html">documenti</a>.</p></body></html>''')

base_soup=fragment((ROOT/'index.html').read_text())
def page(path,title,description,content,module=None):
 soup=fragment(str(base_soup));soup.title.string=title+' | Salute mentale Lazio';
 for s in soup.select('script[src="/assets/editorial-public-v7-18.mjs"]'):s.decompose()
 for name in ['description']:
  tag=soup.select_one('meta[name="'+name+'"]')
  if tag:tag['content']=description
 for name in ['og:title','og:description','og:url']:
  tag=soup.select_one('meta[property="'+name+'"]')
  if tag:tag['content']=title if name.endswith('title') else description if name.endswith('description') else 'https://mappatura-servizi-assistenza-psicologica.pages.dev/'+path
 canonical=soup.select_one('link[rel="canonical"]')
 if canonical:canonical['href']='https://mappatura-servizi-assistenza-psicologica.pages.dev/'+path
 for ld in soup.select('script[type="application/ld+json"]'):ld.decompose()
 replace_html(soup.main,content);brand_page(soup,path)
 if module:soup.head.append(soup.new_tag('script',type='module',src=module))
 put(path,str(soup))

page('network-giovani.html','Network Giovani','Notizie, iniziative, link e opportunità del Network Giovani.', '''<nav class="breadcrumb ux-breadcrumb" aria-label="Percorso"><a href="/index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">Network Giovani</span></nav><section class="ng-hero"><img class="ng-hero-logo" src="/assets/network-logo-v7-18.webp" alt="Logo Network Giovani" width="110" height="110"><p class="ng-kicker">Notizie, iniziative, opportunità</p><h1>Network Giovani</h1><p class="lede">Lo spazio del Network per condividere notizie, iniziative e collegamenti utili.</p><p>Salute mentale Lazio è un progetto del Network Giovani. Menta, la ricerca dei servizi e la mappa restano gli strumenti per orientarti; qui trovi la parte editoriale del progetto.</p><div class="ng-page-links"><a href="/orientati.html">Orientati con Menta →</a><a href="/servizi.html">Trova un servizio →</a></div></section><div data-ng-banner="network" hidden></div><section class="ng-section" aria-labelledby="ng-news-title"><div class="ng-section-header"><h2 id="ng-news-title">Notizie e link</h2><div><label for="ng-category">Categoria</label> <select id="ng-category"><option value="">Tutte</option></select></div></div><p id="ng-editorial-message" class="ng-meta-muted">I contenuti pubblicati dalla redazione appariranno in questa sezione.</p><div class="ng-grid" data-ng-feed="network" hidden></div><p class="ng-empty" data-ng-empty="network">Non ci sono ancora contenuti pubblicati. Le iniziative, il questionario e i nuovi link saranno resi disponibili dalla redazione quando pronti.</p></section><section class="ng-section ng-teaser"><div><h2>Fondazione Don Luigi Di Liegro</h2><p>Conosci le attività della Fondazione attraverso una pagina informativa e i suoi collegamenti ufficiali.</p></div><a class="button secondary" href="/fondazione-di-liegro.html">Scopri di più →</a></section>''','/assets/editorial-public-v7-18.mjs')
page('notizia.html','Notizia del Network Giovani','Contenuti e iniziative pubblicati dalla redazione del Network Giovani.','''<nav class="breadcrumb ux-breadcrumb" aria-label="Percorso"><a href="/index.html">Home</a><span aria-hidden="true">/</span><a href="/network-giovani.html">Network Giovani</a></nav><article class="ng-article" id="ng-article"><h1>Notizia del Network</h1><p>Caricamento del contenuto…</p></article><noscript><p>Per leggere le notizie dinamiche serve JavaScript. <a href="/network-giovani.html">Torna a Network Giovani</a>.</p></noscript>''','/assets/editorial-public-v7-18.mjs')
page('fondazione-di-liegro.html','Fondazione Don Luigi Di Liegro','Conosci la Fondazione Internazionale Don Luigi Di Liegro ETS e le sue attività per la salute mentale.', '''<nav class="breadcrumb ux-breadcrumb" aria-label="Percorso"><a href="/index.html">Home</a><span aria-hidden="true">/</span><span aria-current="page">Fondazione Don Luigi Di Liegro</span></nav><section class="ng-hero"><p class="ng-kicker">Conoscere le realtà del territorio</p><h1>Fondazione Don Luigi Di Liegro</h1><p class="lede">Una pagina per conoscere la Fondazione Internazionale Don Luigi Di Liegro ETS e raggiungere le sue informazioni ufficiali.</p></section><p class="ng-note"><strong>Una sezione informativa, non una partnership.</strong> Questa pagina è curata dal progetto del Network Giovani. Non rappresenta la Fondazione e non implica collaborazione, patrocinio o approvazione del portale da parte sua.</p><section class="ng-section"><h2>Chi è e di cosa si occupa</h2><p>La Fondazione promuove il benessere psicosociale e sostiene le persone che affrontano problemi di salute mentale e le loro famiglie. Le sue attività comprendono orientamento e supporto sociale, formazione, partecipazione e iniziative contro lo stigma.</p><p>Per conoscere obiettivi, progetti e modalità di partecipazione consulta direttamente la <a href="https://www.fondazionediliegro.com/la-fondazione/mission-e-vision/" target="_blank" rel="noopener noreferrer">missione sul sito della Fondazione</a>.</p></section><section class="ng-section" aria-labelledby="foundation-paths"><h2 id="foundation-paths">Approfondisci sul sito ufficiale</h2><div class="ng-grid"><article class="ng-card"><h3>Orientamento e supporto sociale</h3><p>Informazioni sullo Sportello di orientamento e supporto sociale e sulle modalità di contatto.</p><a href="https://www.fondazionediliegro.com/cosa-facciamo/sportello-orientamento-e-supporto-sociale/" rel="noopener noreferrer" target="_blank">Scopri lo sportello ↗</a></article><article class="ng-card"><h3>Attività e progetti</h3><p>Iniziative, percorsi e aggiornamenti pubblicati direttamente dalla Fondazione.</p><a href="https://www.fondazionediliegro.com/" rel="noopener noreferrer" target="_blank">Visita il sito ufficiale ↗</a></article><article class="ng-card"><h3>Partecipare come volontario</h3><p>Indicazioni per conoscere il volontariato e le opportunità di partecipazione.</p><a href="https://www.fondazionediliegro.com/cosa-puoi-fare-tu/diventa-volontario/" rel="noopener noreferrer" target="_blank">Informazioni sul volontariato ↗</a></article></div></section><p class="ng-meta-muted">Sintesi informativa basata sulle pagine ufficiali consultate il 28/09/2026. Contatti, attività e disponibilità vanno confermati con la Fondazione.</p>''')
page('redazione.html','Area redazione','Accesso riservato alle persone autorizzate alla redazione del progetto.', '''<section class="ng-hero"><p class="ng-kicker">Network Giovani</p><h1>Area redazione</h1><p class="lede">Lo spazio riservato per preparare notizie e iniziative, proporre correzioni documentali e seguire le revisioni.</p></section><section class="ng-section"><h2>Accesso solo per persone autorizzate</h2><p>Non è prevista una registrazione pubblica. Il responsabile del progetto autorizza i collaboratori e assegna ruoli editoriali o di revisione dati. La consultazione del sito non richiede un account.</p><p>Quando l’area è attiva, il pulsante apre l’accesso protetto. Se compare “Area redazione non ancora attiva”, la configurazione deve essere completata dal responsabile tecnico.</p><p><a class="button" href="/admin/">Accedi all’area riservata →</a></p><p class="ng-note">Non usare questa area per chiedere assistenza sanitaria e non caricare dati di pazienti, referti o documenti personali.</p><p><a href="/privacy.html#privacy-redazione">Informazioni sull’area riservata e la privacy</a></p></section>''')
put('admin/index.html','''<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>Redazione | Network Giovani</title><link rel="icon" href="/assets/network-logo-v7-18.webp" type="image/webp"><link rel="stylesheet" href="/assets/site-v7-4.css"><link rel="stylesheet" href="/assets/network-v7-18.css"><script type="module" src="/assets/admin-v7-18.mjs"></script></head><body class="ng-site"><a class="skip-link" href="#admin-root">Salta agli strumenti</a><main class="ng-admin"><header class="ng-admin-top"><div><p class="ng-kicker">Network Giovani</p><h1>Area redazione</h1><p id="admin-identity"></p></div><div class="ng-page-links"><a href="/index.html" target="_blank" rel="noopener noreferrer">Apri il sito</a><a href="/cdn-cgi/access/logout">Esci</a></div></header><p class="ng-message" id="admin-message" role="status">Verifica dell’accesso…</p><nav class="ng-admin-nav" id="admin-nav" aria-label="Strumenti della redazione" hidden></nav><div id="admin-root" tabindex="-1"></div><noscript><p>L’area riservata richiede JavaScript. Nessuna modifica è possibile senza accesso verificato.</p></noscript></main></body></html>''')
put('_routes.json',json.dumps({'version':1,'include':['/api/*','/admin','/admin/*'],'exclude':[]},indent=2)+'\n')
put('.gitignore','node_modules/\n.dev.vars\n.env\n.wrangler/\n.tmp/\n__pycache__/\n')

# Add explicit cache/noindex protection for private paths and generated API catalog.
headers=old('_headers')+'\n/admin/*\n  Cache-Control: private, no-store\n  X-Robots-Tag: noindex, nofollow, noarchive\n/data/editorial-catalog-v7-18.json\n  Cache-Control: no-store\n  X-Robots-Tag: noindex, nofollow, noarchive\n'
put('_headers',headers)
# Existing release assertions must not run against a different release manifest.
wf=old('.github/workflows/verify-v7-17.yml').replace('name: V7.17 territorial support verification','name: V7.17 historical verification (manual)')
wf=re.sub(r'on:\n  push:\n    branches: \[release-v7-17-territorial-support, main\]\n  workflow_dispatch:', 'on:\n  workflow_dispatch:',wf)
put('.github/workflows/verify-v7-17.yml',wf)
v=json.loads(old('version.json'));v.update(web_version='7.18',ux_version='7.18',brand_version='7.18')
v['release_note']='V7.18: Network Giovani, interfaccia semplificata, notizie/link/banner e strumenti editoriali e di revisione dati. Area riservata disabilitata fino alla configurazione Cloudflare. Dataset clinici e territoriali di base invariati.'
v['v7_18']={'baseline_commit':BASE,'brand':'Network Giovani','attribution':'Un progetto del Network Giovani','menta_preserved':True,'foundation_section':'informational_only_no_partnership','clinical_records_preserved':443,'support_records_preserved':237,'geography_preserved':'7.16','questionnaire_url_provided':False,'editorial':{'code_included':True,'activation':'requires_cloudflare_configuration','open_registration':False,'roles':['admin','editor','data_reviewer','specialist'],'private_audit':True,'public_dates':'per_field_partial_verification','self_approval_data':False},'logo':{'path':'assets/network-logo-v7-18.webp','bytes':len(logo),'sha256':hashlib.sha256(logo).hexdigest()},'verification_workflow':'.github/workflows/verify-network-v7-18.yml'}
put('version.json',json.dumps(v,ensure_ascii=False,indent=2)+'\n')
notes='''# V7.18 — Network Giovani, redazione e revisione dei dati

Base: V7.17, commit `712ba70a5cce0b65243c500451fa25536544c1ae`.

## Interfaccia pubblica
Logo fornito dal Network, palette blu/turchese, dicitura “Un progetto del Network Giovani”, menu Home / Trova un servizio / Mappa / Network Giovani / Altro. Menta e tutti i percorsi esistenti restano disponibili. Nuove pagine Network Giovani, singola notizia, Fondazione Don Luigi Di Liegro (informativa, nessuna partnership) e accesso redazione. Banner compatto in Home e Network, chiudibile e con scadenza; nessun questionario fittizio pubblicato.

## Redazione inclusa, attivazione separata
Codice del Worker, schema D1 e interfaccia riservata inclusi. L’area rimane chiusa senza configurazione valida. Accesso via identità Cloudflare Access verificata crittograficamente e autorizzazione applicativa. Ruoli Admin, Editor, Revisore dati, Specialista. Bozze separate dalla versione pubblicata, approvazione, media R2 privati, storico e ripristino. Nessuna email personale o password nel repository.

## Revisione schede
Fonti e date per campo, conferme senza modifiche, nuove schede con identificativo distinto, controlli specialistici sui campi sensibili. Un Admin non approva le proprie proposte dati. Le API pubbliche escludono nomi dei revisori, approvatori e note interne. Una correzione della sede rende inutilizzabili coordinate precedenti non più coerenti; nessuna posizione nuova è dedotta.

## Dati invariati
443 servizi clinici, 379 localizzati / 64 senza pin; 237 schede territoriali (135 consultori, 96 PUA, 6 PIS/emergenze). Versioni originali, geografia, fonti e date storiche preservate. Il cambio grafico non costituisce una nuova revisione sanitaria.

## Limiti di attivazione
Prima dell’uso reale: D1 + migrazione, R2 privato, protezione Access produzione, variabili d’ambiente, prima identità Admin, controllo autorizzazioni e aggiornamento dei dati privacy. Nessuna registrazione aperta; nessun invito email inviato dalla preparazione del codice. Il link del questionario deve ancora essere fornito.
'''
put('downloads/Release_Notes_V7_18.md',notes)
put('README.md','## V7.18 — Network Giovani\n\nRebranding, interfaccia semplificata e strumenti di redazione e revisione dati. Il backend è chiuso finché Cloudflare non è configurato. Leggere `downloads/Configurazione_Redazione_V7_18.md` prima di abilitare l’area riservata. Nessun dato sanitario originale modificato.\n\n'+old('README.md'))
put('CHANGELOG.md','## 7.18 — 2026-09-28\n\n- Network Giovani: logo, palette e navigazione semplificata; Menta preservata.\n- Notizie, link, banner non invasivo e Fondazione Di Liegro informativa.\n- Redazione multi-ruolo e revisione dati per campo con audit privato.\n- API protette con Access JWT, ruoli, controlli anti-CSRF, versioni concorrenti e storico.\n- Backend incluso ma non attivato senza configurazione Cloudflare.\n- Dataset clinici, geografia e supporto V7.17 invariati.\n\n'+old('CHANGELOG.md'))
print(json.dumps({'version':'7.18','styled_pages':len(styled),'new_pages':4,'clinical_unchanged':443,'support_unchanged':237,'editorial_activation':'not_configured'},indent=2))
