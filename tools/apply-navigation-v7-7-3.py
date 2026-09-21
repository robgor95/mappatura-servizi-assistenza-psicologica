"""Build static navigation from the audited baseline. Development-only; never a backend."""
from pathlib import Path
from bs4 import BeautifulSoup
from html import escape
import hashlib, json, os, re, subprocess

ROOT = Path(__file__).resolve().parents[1]
BASE = '1979f0d51ed6d2203be6c02605bee313ac5cd91e'
VERSION = '7.7.3'

def original(path):
    source = os.environ.get('NAV_BASELINE_DIR')
    if source:
        return (Path(source) / path).read_text()
    return subprocess.check_output(['git', 'show', BASE + ':' + path], cwd=ROOT).decode()

def fragment(text):
    return BeautifulSoup(text, 'html.parser')

def put(path, text):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding='utf-8')

def item(href, label, desc=''):
    return '<a href="' + escape(href, quote=True) + '"><strong>' + escape(label) + '</strong>' + ('<span>' + escape(desc) + '</span>' if desc else '') + '</a>'

PRIMARY = [('/index.html','Inizia qui'),('/servizi.html','Trova un servizio'),('/guide/index.html','Guide'),('/ascolto.html','Numeri utili')]
DEDICATED = [('/studenti.html','Studenti: università e scuole'),('/universita.html','Università'),('/scuole.html','Sportelli scolastici'),('/centri-ascolto.html','Centri di ascolto'),('/helpline.html','Helpline e ascolto telefonico'),('/strutture-approfondite.html','Comunità e centri diurni'),('/privati.html','Strutture private')]
RESOURCES = [('/glossario.html','Glossario'),('/orientamento-servizi.html','Come funzionano i servizi'),('/metodo.html','Fonti e metodo'),('/documenti.html','Documenti e download')]
GUIDES = [('primo-percorso','Da dove iniziare','Professionisti e primo colloquio'),('pubblico','Cure pubbliche e ascolto','Accesso, requisiti e costi'),('privato','Scegliere psicologo o psicoterapeuta','Qualifiche, domande e approcci'),('ricovero','Ricovero e urgenze','SPDC, STPIT e percorsi distinti'),('riabilitazione','Comunità e centri diurni','Riabilitazione e accesso')]

def header(page):
    def a(href,label):
        active = ' aria-current="page"' if '/' + page == href or (page == 'archivio.html' and href == '/servizi.html') else ''
        parent = ' class="nav-parent-active"' if page.startswith('guide/') and href == '/guide/index.html' and page != 'guide/index.html' else ''
        return '<a href="'+href+'"'+active+parent+'>'+escape(label)+'</a>'
    groups = '<div><h3>Servizi dedicati</h3><ul>' + ''.join('<li>'+a(h,l)+'</li>' for h,l in DEDICATED) + '</ul></div>'
    groups += '<div><h3>Per approfondire</h3><ul>' + ''.join('<li>'+a(h,l)+'</li>' for h,l in RESOURCES) + '</ul></div>'
    return '<header class="site-header nav-shell"><div class="container header-inner"><a class="brand" href="/index.html" aria-label="Salute mentale Lazio, pagina iniziale"><span class="brand-mark" aria-hidden="true">L</span><span>Salute mentale <b>Lazio</b><small>Orientamento e servizi</small></span></a><button type="button" class="nav-toggle" id="nav-toggle" aria-controls="site-navigation" aria-expanded="false" hidden><span aria-hidden="true">☰</span> Menu</button><nav id="site-navigation" aria-label="Navigazione principale"><ul class="nav-primary">'+''.join('<li>'+a(h,l)+'</li>' for h,l in PRIMARY)+'<li class="nav-more"><details id="nav-more"><summary>Altro<span class="nav-chevron" aria-hidden="true"></span></summary><div class="nav-more-panel">'+groups+'</div></details></li></ul></nav></div></header>'

FOOTER = '<footer class="site-footer"><div class="container nav-footer"><div><strong>Mappatura salute mentale · Lazio</strong><p>Progetto indipendente di orientamento, non un portale della Regione Lazio né un servizio di assistenza sanitaria.</p><p>Contatti, costi e disponibilità vanno confermati con i servizi. Le fonti e le date di controllo sono riportate dove disponibili.</p></div><nav aria-label="Informazioni sul progetto"><a href="/glossario.html">Glossario</a><a href="/metodo.html">Fonti e metodo</a><a href="/documenti.html">Documenti e download</a><a href="/privacy.html">Privacy e uso del sito</a></nav></div><div class="container footer-note">Informazioni orientative, non diagnosi o prescrizioni. Revisione clinica indipendente non effettuata.</div></footer>'

CSS = '''/* Static information architecture layer. No fonts, images or dependencies. */
.nav-shell{position:relative;z-index:30}.nav-shell .header-inner{gap:16px;flex-wrap:wrap;padding-block:16px}
.nav-shell #site-navigation{display:block}.nav-shell .nav-primary{list-style:none;display:flex;align-items:center;gap:4px;margin:0;padding:0}.nav-shell li{list-style:none;margin:0;padding:0}
.nav-shell a,.nav-shell summary,.nav-toggle{min-height:44px}.nav-shell nav a{white-space:normal;display:flex;align-items:center;line-height:1.4;border-radius:12px;font-size:.87rem}
.nav-shell .nav-primary>li>a,.nav-shell summary{padding:10px 12px}.nav-shell summary{display:flex;align-items:center;gap:10px;cursor:pointer;font-size:.87rem;font-weight:650;line-height:1.4;list-style:none;border-radius:12px}.nav-shell summary::-webkit-details-marker{display:none}
.nav-chevron{display:block;width:7px;height:7px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);margin-bottom:4px}.nav-shell details[open]>summary .nav-chevron{transform:rotate(225deg);margin-bottom:0}
.nav-shell .nav-parent-active,.nav-shell a[aria-current="page"]{background:var(--soft);text-decoration:underline;text-underline-offset:5px}.nav-shell details[open]>summary,.nav-shell summary:hover{background:var(--soft)}
.nav-more{position:relative}.nav-more-panel{position:absolute;right:0;top:calc(100% + 10px);width:min(550px,calc(100vw - 36px));padding:20px;display:grid;grid-template-columns:1.15fr 1fr;gap:18px;background:var(--paper);border:1px solid var(--line);border-radius:18px;box-shadow:0 14px 36px #153d361a;max-height:calc(100vh - 180px);overflow-y:auto}
.nav-more-panel ul{padding:0;margin:0;display:block}.nav-more-panel h3{font-size:.8rem;letter-spacing:0;margin:0 0 10px;color:var(--muted)}.nav-more-panel a{padding:9px 8px;font-size:.83rem}
.nav-toggle{background:var(--paper);color:var(--ink);border:1px solid #7c9589;border-radius:12px;padding:8px 12px;display:none;gap:8px;align-items:center;font-size:.88rem}
.nav-footer{display:grid;grid-template-columns:1.7fr 1fr;gap:36px;padding-block:26px}.nav-footer p{font-size:.81rem;max-width:65ch;margin-bottom:8px}.nav-footer nav{display:flex;flex-wrap:wrap;align-content:start;gap:0 18px}.nav-footer nav a{min-height:44px;display:flex;align-items:center;font-size:.82rem}
.home-start,.home-situations,.home-resources{margin-top:38px}.home-start h2,.home-situations h2,.home-resources h2{font-size:1.6rem}.home-start-grid,.home-situations-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.home-start-grid>a,.home-situations-grid>a{position:relative;display:flex;flex-direction:column;gap:8px;padding:22px 24px;border:1px solid var(--line);border-radius:18px;text-decoration:none;background:var(--paper);color:var(--ink);min-width:0;line-height:1.45}.home-start-grid>a:after,.home-situations-grid>a:after{content:'→';font-size:1.1rem;margin-top:auto;padding-top:8px;color:var(--accent)}
.home-start-grid strong,.home-situations-grid strong{font-size:1.04rem;font-weight:700}.home-start-grid span,.home-situations-grid span{font-size:.88rem;color:var(--muted)}.home-start-grid>a:hover,.home-situations-grid>a:hover{background:var(--soft);border-color:#7caa92}.home-start-grid>a:first-child{border-color:#7caa92}
.home-quick{margin-top:14px}.home-quick>summary,.resource-downloads>summary,.nav-filter-shortcuts>summary,.nav-docs-group>summary,.nav-historical>summary{cursor:pointer;min-height:48px;padding:12px 4px;line-height:1.5;font-weight:650;font-size:.88rem}.home-quick .quick-search{margin-top:8px}
.home-resources{border-top:1px solid var(--line);padding-top:28px}.home-guide-list{padding:0;margin:16px 0 20px;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:0 26px}.home-guide-list li{margin:0;border-bottom:1px solid var(--line);list-style:none}.home-guide-list a{display:block;min-height:44px;padding:12px 0;font-size:.92rem}
.resource-downloads{margin-top:16px;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.resource-downloads ul{margin:0 0 14px;padding-left:22px}.resource-downloads li{margin:4px 0}.resource-downloads a{display:inline-block;min-height:44px;padding-block:8px;font-size:.87rem}
.home-help-links{display:flex;flex-wrap:wrap;gap:8px 22px;margin-top:18px}.home-help-links a{min-height:44px;display:flex;align-items:center;font-size:.87rem}.home-trust{font-size:.83rem;color:var(--muted);margin:20px 0 0;max-width:80ch}
[data-navigation-version] .page-lead{padding-block:30px 16px}[data-navigation-version] .page-lead h1{font-size:clamp(1.9rem,3.5vw,2.8rem)}[data-navigation-version] .page-lead .lede{margin-bottom:8px}
.nav-docs-group{margin:18px 0;border:1px solid var(--line);border-radius:16px;padding:4px 18px;background:var(--paper)}.nav-docs-group>.section-block{margin-top:24px}.nav-docs-group summary{padding-block:16px}.nav-docs-intro{font-size:.88rem;color:var(--muted)}
.nav-docs-page .document-list>section{padding:20px 0}.nav-docs-page .document-list h2{font-size:1.12rem}.nav-docs-page .document-list .actions{margin:12px 0 0}.nav-docs-page .document-list a:not(.button){font-size:.85rem;padding:10px 2px;min-height:44px}.nav-docs-page .guide-number{display:none}
.nav-historical{margin-top:30px;border-top:1px solid var(--line);padding-top:8px}.nav-historical>p{font-size:.85rem;color:var(--muted)}.nav-students-intro .home-start-grid{grid-template-columns:1fr 1fr}.nav-students-intro h2{font-size:1.5rem}
[data-navigation-version] .svc-intro{padding-top:26px;padding-bottom:20px;gap:24px}[data-navigation-version] .svc-intro h1{font-size:clamp(1.95rem,3vw,2.9rem)}[data-navigation-version] .svc-intro .lede{font-size:1rem;margin-bottom:10px}
.nav-filter-shortcuts{margin:14px 0 24px;border-block:1px solid var(--line)}.nav-filter-shortcuts .svc-explore{margin:8px 0 12px}.nav-filter-shortcuts .svc-shortcuts{padding-block:12px}.nav-filter-shortcuts summary{font-size:.95rem}
.nav-guide-download{font-size:.83rem;position:relative}.nav-guide-download summary{cursor:pointer;min-height:44px;padding:10px 8px}.nav-guide-download[open]{flex-basis:100%}.nav-guide-download a{display:inline-block;min-height:44px;padding:8px}.nav-quiet-links{display:flex;flex-wrap:wrap;gap:8px 20px;margin:16px 0}.nav-quiet-links a{min-height:44px;display:inline-flex;align-items:center;font-size:.86rem}
@media(max-width:1000px){.nav-shell .header-inner{gap:12px}.nav-shell .nav-primary>li>a,.nav-shell summary{padding-inline:9px}.nav-shell .brand small{font-size:.65rem}.home-start-grid,.home-situations-grid{gap:12px}}
@media(max-width:820px){.nav-shell .header-inner{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;padding-block:12px;gap:10px}.nav-shell .brand{font-size:.96rem}.nav-shell .brand-mark{width:38px;height:38px}.nav-shell #site-navigation{grid-column:1/-1;width:100%}.nav-shell .nav-primary{display:flex;flex-direction:column;align-items:stretch;gap:2px}.nav-shell .nav-primary>li>a,.nav-shell summary{padding:12px;min-height:46px}.nav-shell .nav-more-panel{position:static;width:100%;max-height:none;box-shadow:none;grid-template-columns:1fr 1fr;padding:12px;gap:12px;margin-top:4px}.nav-enhanced .nav-toggle{display:flex}.nav-enhanced .nav-toggle[hidden]{display:none}.nav-enhanced #site-navigation[data-open="false"]{display:none}.nav-shell nav a{font-size:.89rem}.home-start-grid{grid-template-columns:1fr}.home-start-grid>a{padding:17px 20px}.home-start-grid>a:after{display:none}.home-situations-grid{grid-template-columns:1fr 1fr}.home-situations-grid>a{padding:18px}.nav-footer{grid-template-columns:1fr;gap:12px}.nav-students-intro .home-start-grid{grid-template-columns:1fr 1fr}}
@media(max-width:480px){.nav-shell .nav-more-panel{grid-template-columns:1fr}.home-start,.home-situations,.home-resources{margin-top:28px}.home-start h2,.home-situations h2,.home-resources h2{font-size:1.4rem}.home-situations-grid{gap:10px}.home-situations-grid>a{padding:16px 13px}.home-situations-grid strong{font-size:.96rem}.home-situations-grid span{font-size:.81rem}.home-guide-list{grid-template-columns:1fr}.nav-students-intro .home-start-grid{grid-template-columns:1fr}.nav-docs-group{padding-inline:12px}.nav-docs-page .document-list .actions{align-items:flex-start}.nav-toggle{padding:8px 10px}}
@media(prefers-reduced-motion:reduce){.nav-shell *{scroll-behavior:auto!important;transition:none!important}.nav-chevron{transition:none}}
@media(forced-colors:active){.nav-more-panel,.nav-toggle,.home-start-grid>a,.home-situations-grid>a,.nav-docs-group{border:1px solid CanvasText}}
@media print{.nav-shell,.nav-footer nav,.home-quick,.resource-downloads{display:none!important}.nav-docs-group{break-inside:avoid}.nav-docs-group:not([open])>:not(summary){display:block!important}}
'''

JS = '''/* Disclosure navigation only. No query access, network, tracking or persistence. */
(function(){
'use strict';
const header=document.querySelector('.nav-shell'),nav=document.getElementById('site-navigation'),button=document.getElementById('nav-toggle'),more=document.getElementById('nav-more');
if(!header||!nav||!button||!more)return;
const mobile=window.matchMedia('(max-width: 820px)');
function mainMenu(open,restore){nav.dataset.open=String(open);button.setAttribute('aria-expanded',String(open));if(!open){more.open=false;if(restore)button.focus();}}
function sync(){const lostFocus=nav.contains(document.activeElement);button.hidden=!mobile.matches;mainMenu(!mobile.matches,mobile.matches&&lostFocus);document.querySelectorAll('.toc details').forEach(d=>{d.open=!mobile.matches;});}
button.addEventListener('click',()=>mainMenu(nav.dataset.open!=='true',false));
more.addEventListener('toggle',()=>more.querySelector('summary').setAttribute('aria-expanded',String(more.open)));
header.addEventListener('keydown',event=>{if(event.key!=='Escape')return;if(more.open){more.open=false;more.querySelector('summary').focus();event.preventDefault();}else if(mobile.matches&&nav.dataset.open==='true'){mainMenu(false,true);event.preventDefault();}});
document.addEventListener('click',event=>{if(!header.contains(event.target)){more.open=false;if(mobile.matches)mainMenu(false,false);}});
header.addEventListener('focusout',()=>{setTimeout(()=>{if(!header.contains(document.activeElement)){more.open=false;if(mobile.matches)mainMenu(false,false);}},0);});
if(mobile.addEventListener)mobile.addEventListener('change',sync);else mobile.addListener(sync);
document.documentElement.classList.add('nav-enhanced');sync();
function reveal(hash,moveFocus){let id;try{id=decodeURIComponent(hash.slice(1));}catch(_){return;}const target=document.getElementById(id);if(!target)return;let p=target;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}if(moveFocus){if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}
window.addEventListener('hashchange',()=>reveal(location.hash,false));
document.addEventListener('click',event=>{const link=event.target.closest('a[href^="#"]');if(!link||link.getAttribute('href')==='#')return;reveal(link.getAttribute('href'),true);});
if(location.hash)reveal(location.hash,false);
})();
'''

put('assets/navigation-v7-7-3.css',CSS)
put('assets/navigation-v7-7-3.js',JS)

pages=sorted(str(p.relative_to(ROOT)) for p in [*ROOT.glob('*.html'),*(ROOT/'guide').glob('*.html')] if fragment(original(str(p.relative_to(ROOT)))).select_one('header.site-header'))
audit={'version':VERSION,'baseline_commit':BASE,'pages':pages,'removed_passages':[],'preserved_sha256':{},'layout':'four primary routes, optional dedicated pages, secondary downloads'}
baseline_dir=os.environ.get('NAV_BASELINE_DIR')
if baseline_dir:
    baseline_files=[p for folder in ['data','downloads','offline'] for p in (Path(baseline_dir)/folder).rglob('*') if p.is_file()]
    for p in baseline_files:audit['preserved_sha256'][str(p.relative_to(baseline_dir))]=hashlib.sha256(p.read_bytes()).hexdigest()
else:
    names=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'data','downloads','offline'],cwd=ROOT).decode().splitlines()
    for name in names:audit['preserved_sha256'][name]=hashlib.sha256(subprocess.check_output(['git','show',BASE+':'+name],cwd=ROOT)).hexdigest()
for p in ['assets/servizi-data-v7-5-1.js','assets/menta-config-v7-7.js','assets/menta-core-v7-7.js','assets/menta-ui-v7-7.js']:
    audit['preserved_sha256'][p]=hashlib.sha256((ROOT/p).read_bytes()).hexdigest()

for page in pages:
    soup=fragment(original(page));main=soup.select_one('main')
    before_ids={e['id'] for e in soup.select('[id]')}
    soup.select_one('header').replace_with(fragment(header(page)))
    footer=soup.select_one('footer')
    if footer:footer.replace_with(fragment(FOOTER))
    else:soup.body.append(fragment(FOOTER))
    soup.body['data-navigation-version']=VERSION
    soup.body['data-ui-version']=VERSION
    soup.head.append(fragment('<link rel="stylesheet" href="/assets/navigation-v7-7-3.css"><script defer src="/assets/navigation-v7-7-3.js"></script>'))
    for el in soup.select('script[src^="/assets/site-v7-4.js"]'):el['src']='/assets/site-v7-4.js?v=7.7.3'
    for a in soup.select('.breadcrumb'):
        a.name='nav';a['aria-label']='Percorso'
    for node in list(soup.find_all(string=True)):
        if node.parent.name in ['script','style','code','pre'] or node.find_parent(attrs={'data-preserve-original':True}):continue
        s=str(node)
        if s=='Schede di orientamento':node.replace_with('Come funzionano i servizi')
        elif s=='Puoi consultare questa guida in autonomia e aprire il database quando ti serve.':node.replace_with('Leggi ciò che ti serve, poi passa alla ricerca dei servizi.')
    if page=='index.html':
        hero=main.select_one('#menta').extract()
        quick=main.select_one('.quick-search').extract()
        main.clear();main.append(hero)
        hero.select_one('.menta-home-intro').string='Scrivi cosa cerchi: ti mostro i servizi o le guide da cui partire.'
        main.append(fragment('<section class="home-start" aria-labelledby="iniziare-title"><h2 id="iniziare-title">Scegli come iniziare</h2><div class="home-start-grid">'+item('/servizi.html','Trova un servizio','Cerca direttamente per tipo o territorio.')+item('/guide/primo-percorso.html','Non so da dove iniziare','Capisci a chi rivolgerti e cosa chiedere.')+item('/ascolto.html','Ho bisogno di parlare con qualcuno','Distingui ascolto telefonico e numeri di soccorso.')+'</div></section>'))
        d=soup.new_tag('details',attrs={'class':'home-quick','id':'ricerca-rapida'});d.append(fragment('<summary>Ricerca rapida per tipo e comune</summary>'));d.append(quick);main.select_one('.home-start').append(d)
        situations=[('/studenti.html','Studenti e università','Supporto negli atenei e nelle scuole.'),('/servizi.html?tipo=TSMREE%2FNPIA','Bambini e adolescenti','Servizi per l’età evolutiva e accesso.'),('/servizi.html?percorso=dipendenze','Dipendenze','SerD e altri servizi dedicati.'),('/guide/ricovero.html','Ricovero e urgenze','Capire i percorsi, senza confondere ascolto e soccorso.'),('/servizi.html?percorso=riabilitazione','Comunità e centri diurni','Cerca servizi di riabilitazione.'),('/guide/privato.html','Psicologo o psicoterapeuta privato','Qualifiche, approcci e domande per scegliere.')]
        main.append(fragment('<section class="home-situations" id="esplora" aria-labelledby="esplora-title"><h2 id="esplora-title">Esplora per situazione</h2><div class="home-situations-grid">'+''.join(item(*s) for s in situations)+'</div></section>'))
        guide_links=''.join('<li><a href="/guide/'+slug+'.html">'+escape(label)+'</a></li>' for slug,label,_ in GUIDES)
        pdfs=''.join('<li><a href="/downloads/guide/Guida_0'+str(i)+'_'+slug+'.pdf">'+escape(label)+' · PDF</a></li>' for i,(slug,label,_) in enumerate(GUIDES,1))
        main.append(fragment('<section class="home-resources" id="risorse" aria-labelledby="risorse-title"><h2 id="risorse-title">Guide e risorse</h2><p>Leggi solo l’argomento che ti serve.</p><ul class="home-guide-list">'+guide_links+'</ul><details class="resource-downloads" id="download-home"><summary>Documenti da scaricare</summary><p class="micro">I PDF sono copie delle edizioni precedenti e possono differire dalle guide online. Per il testo corrente, leggi le pagine del sito.</p><ul>'+pdfs+'</ul><a href="/documenti.html">Tutti i documenti e i download →</a></details><div class="home-help-links"><a href="/glossario.html">Non conosci una sigla?</a><a href="/orientamento-servizi.html">Come funzionano i servizi</a><a href="/metodo.html">Fonti e metodo</a></div><p class="home-trust">Il portale aiuta a orientarsi. Contatti, accesso e disponibilità vanno confermati direttamente con i servizi.</p></section>'))
        soup.find('meta',attrs={'name':'description'})['content']='Trova servizi di salute mentale nel Lazio, leggi le guide o consulta i numeri utili. Menta ti aiuta a scegliere da dove iniziare.'
    if page=='documenti.html':
        soup.body['class']=soup.body.get('class',[])+['nav-docs-page']
        lead=main.select_one('.page-lead');lead.h1.string='Documenti e download';lead.select_one('.lede').string='Le guide si leggono direttamente sul sito. Qui trovi le copie scaricabili e la documentazione della mappatura.'
        lead.insert_before(fragment('<nav class="breadcrumb" aria-label="Percorso"><a href="/index.html#risorse">Guide e risorse nella home</a><span aria-hidden="true"> / </span>Documenti e download</nav>'))
        for meta in soup.select('meta[name="description"],meta[property="og:description"]'):meta['content']='Guide da leggere online, copie scaricabili e documentazione della mappatura. I download sono una risorsa facoltativa.'
        soup.title.string='Documenti e download | Salute mentale Lazio'
        soup.find('meta',attrs={'property':'og:title'})['content']='Documenti e download'
        files_before={a['href'] for a in main.select('a[href]') if a['href'].startswith(('/downloads/','/data/','/offline/'))}
        listing=main.select_one('.document-list')
        for i,section in enumerate(listing.find_all('section',recursive=False)):
            section.h2.string=GUIDES[i][1];section.p.string=GUIDES[i][2]+'.'
            for a in section.select('a[href$=".pdf"]'):a['class']=[];a.string='PDF · copia precedente'
        notice=fragment('<p class="nav-docs-intro">Le copie PDF e gli elenchi scaricabili mantengono le rispettive date. Possono precedere gli aggiornamenti delle pagine online; non indicano disponibilità in tempo reale.</p>')
        listing.insert_before(notice)
        tail=[];el=listing.next_sibling
        while el:
            nxt=el.next_sibling;tail.append(el.extract());el=nxt
        downloads=soup.new_tag('details',attrs={'class':'nav-docs-group','id':'elenchi-download'});downloads.append(fragment('<summary>Elenchi dei servizi e dati scaricabili</summary>'))
        technical=soup.new_tag('details',attrs={'class':'nav-docs-group','id':'documentazione-tecnica'});technical.append(fragment('<summary>Aggiornamenti e documentazione tecnica</summary>'))
        for el in tail:
            text=el.get_text(' ',strip=True) if hasattr(el,'get_text') else str(el)
            if getattr(el,'get',lambda _:None)('id') in ['download-v76','rilascio-menta'] or text.startswith('Questa edizione'):
                technical.append(el)
            else:downloads.append(el)
        main.append(downloads);main.append(technical)
        assert files_before <= {a['href'] for a in main.select('a[href]')},'A download was lost'
    if page=='studenti.html':
        lead=main.select_one('.page-lead');lead.h1.string='Supporto per studenti';lead.select_one('.lede').string='Scegli il contesto in cui studi: università e scuole hanno servizi e requisiti di accesso diversi.'
        children=[e.extract() for e in list(main.contents) if e is not lead]
        main.append(fragment('<section class="nav-students-intro" id="service-links" aria-labelledby="studenti-scelta"><h2 id="studenti-scelta">Dove studi?</h2><div class="home-start-grid">'+item('/universita.html','Università','Counselling e supporto psicologico negli atenei. Verifica chi può accedere e come prenotare.')+item('/scuole.html','Scuole','Sportelli psicologici scolastici. Controlla anno scolastico e disponibilità con il tuo istituto.')+'</div><div class="nav-quiet-links"><a href="/servizi.html">Cerchi un servizio fuori dalla scuola?</a><a href="/ascolto.html">Numeri utili e ascolto</a></div></section>'))
        old=soup.new_tag('details',attrs={'class':'nav-historical','id':'prima-raccolta-studenti'});old.append(fragment('<summary>Consulta gli esempi della prima raccolta</summary><p>Questi contenuti precedono le directory dedicate. Per gli elenchi più ampi usa i collegamenti Università e Scuole qui sopra; i riferimenti originali restano disponibili.</p>'))
        for el in children:old.append(el)
        main.append(old)
    if page=='ascolto.html':
        helper=main.select_one('.menta-guide')
        if helper:helper.decompose()
        lead=main.select_one('.page-lead');lead.insert_after(fragment('<nav class="nav-quiet-links" id="service-links" aria-label="Altri servizi di ascolto"><a href="/helpline.html">Tutte le helpline</a><a href="/centri-ascolto.html">Centri di ascolto sul territorio</a></nav>'))
    if page in ['servizi.html','archivio.html']:
        panel=main.select_one('.svc-explore');shortcut=main.select_one('.svc-shortcuts')
        d=soup.new_tag('details',attrs={'class':'nav-filter-shortcuts'});d.append(fragment('<summary>Esplora per tipo di servizio</summary>'));panel.insert_before(d);d.append(panel.extract())
        if shortcut:d.append(shortcut.extract())
    if page.startswith('guide/') and page!='guide/index.html':
        for p in list(main.select('p')):
            if 'Non attribuiamo a etichette diverse' in p.get_text():
                audit['removed_passages'].append({'page':page,'text':p.get_text(' ',strip=True)})
                p.replace_with(fragment('<p class="nav-approach-note"><strong>Il nome dell’approccio è solo un punto di partenza.</strong> Chiedi al professionista come lavora concretamente, quale formazione ha e come vengono concordati e verificati gli obiettivi del percorso.</p>'))
        if page=='guide/privato.html':
            p=main.select_one('#approcci > p')
            if p:p.string='Il nome dell’approccio è solo un punto di partenza. Chiedi al professionista come lavora concretamente, quale formazione ha e come vengono concordati e verificati gli obiettivi del percorso.'
        tools=main.select_one('.guide-tools')
        if tools:
            links=list(tools.select('a[href$=".pdf"]'))
            for a in links:
                d=soup.new_tag('details',attrs={'class':'nav-guide-download'});d.append(fragment('<summary>Scarica una copia</summary><p class="micro">Il PDF è una copia precedente; per i contenuti correnti fai riferimento alla guida online.</p>'));a.insert_before(d);d.append(a.extract());a.string='Apri il PDF precedente'
    # Preserve fragment URLs even when redundant content moved to secondary pages.
    after_ids={e['id'] for e in soup.select('[id]')}
    for missing in sorted(before_ids-after_ids):main.append(fragment('<span class="svc-sr" id="'+escape(missing,quote=True)+'"></span>'))
    # BeautifulSoup retains SVG case incorrectly on older generated files: normalize attribute only.
    result=str(soup).replace('viewbox=', 'viewBox=')
    put(page,result)

site=original('assets/site-v7-4.js')
site=site.replace("if (maps[path] && !document.getElementById('service-links'))", "if (!document.body.hasAttribute('data-navigation-version') && maps[path] && !document.getElementById('service-links'))")
site=site.replace("' schede mostrate.'", "' risultati.'")
put('assets/site-v7-4.js',site)
version=json.loads(original('version.json'));version['web_version']=VERSION
version['deployment_checked_by_preparer']=False
version['release_note']='Navigazione semplificata: quattro percorsi principali, home per situazioni, download secondari, guida con linguaggio più naturale. Dati e orientatore invariati.'
version['navigation_version']=VERSION
put('version.json',json.dumps(version,ensure_ascii=False,indent=2)+'\n')
notes='''Navigazione 7.7.3 — 21 settembre 2026

Quattro percorsi principali: Inizia qui, Trova un servizio, Guide, Numeri utili.
Menu Altro per servizi dedicati e risorse. Menu mobile con pulsante, tastiera, Escape e fallback senza JavaScript.
Home: Menta, tre punti di partenza, sei situazioni, guide online e download facoltativi in un riquadro chiuso.
Documenti e download raggruppati, con tutti i file precedenti conservati.
Studenti: accesso diretto a Università e Scuole; esempi precedenti consultabili a parte.
Frase cognitivo-interpersonale/IPT sostituita nella guida Da dove iniziare con domande pratiche sul metodo.
Guida al privato coerente; PDF indicati come copie precedenti, senza sovrascriverli.
Ricerche rapide dei servizi raccolte in un riquadro facoltativo; filtri e URL restano invariati.
Nessun nuovo contenuto clinico, dataset, contatto o data di verifica dei servizi.
Nessuna API, tracking, cookie o dipendenza aggiunta al sito.
'''
put('downloads/Note_Rilascio_V7_7_3.txt',notes)
changelog=original('CHANGELOG.md').replace('# Changelog\n\n','# Changelog\n\n## 7.7.3 — 21 settembre 2026\n\n- Navigazione a quattro percorsi, Altro e menu mobile accessibile.\n- Home lineare: Menta, tre alternative, sei situazioni e risorse secondarie.\n- Download raggruppati e dichiarati copie precedenti; pagine, file e collegamenti conservati.\n- Studenti conduce alle directory complete; ricerche rapide e contenuti storici restano facoltativi.\n- Rimossa la precisazione meta cognitivo-interpersonale/IPT in favore di domande pratiche.\n- Dataset, fonti, orientatore e filtri invariati. Report: downloads/Verifiche_Navigazione_V7_7_3.json.\n\n')
put('CHANGELOG.md',changelog)
readme=original('README.md').replace('## Versione corrente V7.7.2 — Menta','## Versione corrente V7.7.3 — Navigazione semplificata').replace('La produzione usa **V7.7.2** per l’interfaccia','La produzione usa **V7.7.3** per l’interfaccia')
readme += '\n## Navigazione 7.7.3\n\nHeader e footer sono HTML statico: nessun caricamento remoto del menu. I file navigation-v7-7-3.css/js migliorano la navigazione senza leggere o salvare bisogni. Quattro percorsi primari, Altro per directory e risorse, download secondari. I file PDF precedenti restano immutati e sono etichettati come tali.\n\nControlli: `node tools/test-menta-v7-7.cjs` e `python tools/test-navigation-v7-7-3.py`. Gli strumenti Python richiedono BeautifulSoup e Playwright solo in sviluppo. Nessuna dipendenza serve al sito statico.\n'
put('README.md',readme)
put('downloads/Audit_Navigazione_V7_7_3.json',json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'pages':len(pages),'passages_replaced':audit['removed_passages'],'preserved_files':len(audit['preserved_sha256'])},ensure_ascii=False,indent=2))
