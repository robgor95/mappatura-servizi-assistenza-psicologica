"""Build the V7.12 UX layer from the pinned V7.11.7 snapshot.
Run from the repository root. All source datasets, clinical engines, historical
exports and the mascot image remain byte-identical. Requires beautifulsoup4.
"""
from __future__ import annotations
import copy
import hashlib
import html
import json
import subprocess
from pathlib import Path
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE = '9a15c39c6f1c5008cde6fbe44dd4f419f524ba97'
ORIGIN = 'https://mappatura-servizi-assistenza-psicologica.pages.dev'
DATE = '2026-09-27'
IMAGE = '/assets/menta/menta-base-v7-10-1.webp'
CSS = '/assets/menta-design-v7-12.css'
JS = '/assets/ux-ui-v7-12.js'

def git(*args: str) -> str:
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True)

def original(path: str) -> str:
    return git('show', BASE + ':' + path)

def parse(text: str) -> BeautifulSoup:
    return BeautifulSoup(text, 'html.parser')

def element(text: str):
    s = parse(text)
    return next(x for x in s.contents if getattr(x, 'name', None))

def write(path: str, text: str) -> None:
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text.rstrip() + '\n', encoding='utf-8')

# This catalog contains page metadata only, never copies of clinical records.
# Labels describe where the existing content is, not new clinical recommendations.
CATALOG = [
 ('servizi.html','Trova un servizio','Cerca per tipo di aiuto, comune e ASL. Apri indirizzi, contatti e modalità di accesso.','servizi','csm serd psicologo psichiatra dipendenze strutture ssn pubblico convenzionato filtro ricerca'),
 ('mappa.html','Mappa dei servizi','Esplora le posizioni disponibili. La precisione dei punti è sempre indicata.','servizi','luoghi vicino indirizzi coordinate territorio presidi'),
 ('strutture-approfondite.html','Comunità e centri diurni','Approfondisci i servizi residenziali, diurni e i trattamenti territoriali censiti.','servizi','riabilitazione srtr srsr stpit residenze comunità doppia diagnosi'),
 ('privati.html','Strutture private','Consulta i centri privati e le informazioni disponibili sulle loro prestazioni.','servizi','psicologo psicoterapeuta neuropsicologia costi privato'),
 ('supporto-territoriale.html','Consultori e supporto sul territorio','Trova consultori, punti di accesso sociosanitario e servizi per le emergenze sociali.','servizi','famiglia famiglie consultorio pua pis sociale spazio giovani donna'),
 ('aiuto-adesso.html','Aiuto adesso','Distingui emergenza, sanità non urgente e altre forme di assistenza.','ascolto','urgente urgenza emergenza soccorso 112 118 116117 violenza 1522 minori 114'),
 ('ascolto.html','Numeri utili e ascolto','Scegli tra numeri per le urgenze e servizi con cui parlare.','ascolto','telefono parlare qualcuno ascolto numeri'),
 ('helpline.html','Ascolto telefonico','Consulta le helpline: a chi si rivolgono, orari e modalità disponibili.','ascolto','telefonare amico aiuto linea numero verde helpline'),
 ('centri-ascolto.html','Centri e sportelli di ascolto','Esplora i punti di ascolto, orientamento e supporto presenti nel territorio.','ascolto','sportello antiviolenza famiglia orientamento'),
 ('studenti.html','Sei uno studente?','Parti da università, scuola, servizi territoriali o ascolto.','studenti','studiare studio studente studenti università universitario scuola scolastico'),
 ('universita.html','Supporto universitario','Cerca il servizio psicologico del tuo ateneo e verifica come accedere.','studenti','università universitario ateneo sapienza roma tre tor vergata tuscia counselling'),
 ('scuole.html','Sportelli scolastici','Trova le informazioni sugli sportelli delle scuole. L’attivazione va verificata per l’anno scolastico.','studenti','scuola istituto alunni studenti scolastico genitori'),
 ('giovani.html','Bambini e adolescenti','Orientati tra servizi per l’età evolutiva, scuola e ascolto.','studenti','minori giovani bambino adolescente genitori famiglia tsmree npia'),
 ('orientati.html','Lasciati guidare da Menta','Scrivi cosa cerchi oppure scegli una situazione. Non serve conoscere le sigle.','guide','non so iniziare menta orientamento aiuto guida primo passo'),
 ('guide/index.html','Tutte le guide','Scegli un argomento e leggi il percorso con i passaggi essenziali.','guide','capire leggere informazioni percorsi'),
 ('guide/primo-percorso.html','Da dove iniziare','Professionisti, primo colloquio e domande da portare con te.','guide','primo incontro prima volta psicologo psichiatra farmaci'),
 ('guide/pubblico.html','Accedere ai servizi pubblici','Capisci da dove partire e quali informazioni chiedere al servizio.','guide','gratuito pubblico ssn ticket csm serd'),
 ('guide/privato.html','Scegliere un professionista','Qualifiche, domande e aspetti da considerare prima di prenotare.','guide','psicologo psicoterapeuta privato scegliere terapia'),
 ('guide/ricovero.html','Ricovero e urgenze','Leggi come si distinguono i percorsi ospedalieri e territoriali.','guide','ospedale spdc stpit tso ricovero urgenza'),
 ('guide/riabilitazione.html','Capire comunità e centri diurni','Approfondisci progetti riabilitativi, inserimenti e percorsi residenziali.','guide','srtr srsr comunità riabilitazione diurno residenziale'),
 ('orientamento-servizi.html','Che cosa fanno i servizi','Una spiegazione dei diversi tipi di servizio, prima di cercarne uno.','guide','csm dsm serd spdc stpit srtr srsr tsmree npia dca dna consultorio'),
 ('glossario.html','Capire le sigle','Il significato delle parole e delle abbreviazioni usate nel sito.','guide','glossario parole significato sigle dizionario acronimi'),
 ('metodo.html','Fonti e metodo','Come leggere i dati, quali fonti sono state usate e quali limiti restano.','progetto','metodologia fonti progetto indipendente'),
 ('documenti.html','Documenti e download','Guide, elenchi scaricabili, audit e versioni precedenti del progetto.','progetto','pdf excel csv file scaricare scarica documentazione storico'),
 ('qualita-dati.html','Qualità e verifiche dei dati','Consulta il registro documentale e le informazioni sui campi riesaminati.','progetto','audit dati mancanti verifiche registro qualità'),
 ('privacy.html','Privacy e uso del sito','Come funzionano ricerca, Menta, collegamenti esterni e mappa.','progetto','privacy dati personali riservatezza accessibilità sicurezza'),
]
GROUPS = {'servizi':'Servizi e territorio','ascolto':'Ascolto e aiuto','studenti':'Studenti e famiglie','guide':'Guide e orientamento','progetto':'Il progetto'}
META = {x[0]:x for x in CATALOG}
ICON_PATHS = {
 'pin':'<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
 'chat':'<path d="M21 11a8 8 0 0 1-8 8H8l-5 3v-7a8 8 0 1 1 18-4Z"/><path d="M8 10h8M8 14h5"/>',
 'study':'<path d="m2 8 10-5 10 5-10 5Z"/><path d="M6 10v7c4 3 8 3 12 0v-7M22 8v9"/>',
 'people':'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 13a5 5 0 0 1 3 5v3"/>',
 'check':'<path d="M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7Z"/><path d="m8 12 3 3 5-6"/>',
 'leaf':'<path d="M20 3C9 2 3 8 4 15c2 7 17 5 16-12Z"/><path d="M4 21 15 9"/>',
}

def icon(name: str) -> str:
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+ICON_PATHS[name]+'</svg>'

def route(path: str, title: str | None = None, description: str | None = None, glyph: str | None = None, tone: str = 'mint', extra: str = '') -> str:
    data=META.get(path)
    title=title or (data[1] if data else path)
    description=description or (data[2] if data else '')
    return f'<a class="ux-route-card{extra}" href="/{html.escape(path,quote=True)}" data-tone="{tone}">'+(f'<span class="ux-route-icon">{icon(glyph)}</span>' if glyph else '')+f'<h3>{html.escape(title)}</h3><p>{html.escape(description)}</p><span class="ux-route-arrow" aria-hidden="true">↗</span></a>'

def header(current: str) -> str:
    def link(path,label):
        active=' aria-current="page"' if path==current or (path=='servizi.html' and current=='archivio.html') else ''
        return f'<a href="/{path}"{active}>{label}</a>'
    primary=''.join('<li>'+link(p,t)+'</li>' for p,t in [('index.html','Home'),('servizi.html','Trova un servizio'),('mappa.html','Mappa'),('guide/index.html','Guide')])
    menus=[('Cerca supporto',[('ascolto.html','Numeri utili e ascolto'),('supporto-territoriale.html','Consultori e territorio'),('strutture-approfondite.html','Comunità e centri diurni'),('privati.html','Strutture private')]),('Studenti e famiglie',[('studenti.html','Sei uno studente?'),('universita.html','Università'),('scuole.html','Scuole'),('giovani.html','Bambini e adolescenti')]),('Per orientarti',[('orientati.html','Chiedi a Menta'),('orientamento-servizi.html','Che cosa fanno i servizi'),('glossario.html','Capire le sigle'),('documenti.html','Documenti e download')])]
    panel=''.join('<div><h3>'+title+'</h3><ul>'+''.join('<li>'+link(p,t)+'</li>' for p,t in items)+'</ul></div>' for title,items in menus)
    return '<header class="site-header nav-shell ux-header"><div class="container header-inner">'+f'<a class="brand" href="/index.html" aria-label="Salute mentale Lazio: homepage"><span class="brand-mark" aria-hidden="true"><img src="{IMAGE}" width="43" height="44" alt="" decoding="async"/></span><span>Salute mentale <b>Lazio</b><small>Un passo alla volta, con Menta</small></span></a><button id="nav-toggle" class="nav-toggle" type="button" aria-controls="site-navigation" aria-expanded="false" hidden><span aria-hidden="true">☰</span> Menu</button><nav id="site-navigation" aria-label="Navigazione principale"><ul class="nav-primary">'+primary+'<li class="nav-more"><details id="nav-more"><summary>Altre sezioni<span class="nav-chevron" aria-hidden="true"></span></summary><div class="nav-more-panel">'+panel+'<div class="ux-all-link">'+link('sezioni.html','Tutte le sezioni · trova ciò che cerchi →')+'</div></div></details></li></ul></nav></div></header>'

FOOTER='''<footer class="site-footer ux-footer"><div class="container ux-footer-grid"><div><strong>Salute mentale Lazio · con Menta</strong><p>Un progetto indipendente per orientarsi. Non è un portale della Regione Lazio né un servizio di assistenza sanitaria.</p><p>Contatti, modalità di accesso e disponibilità vanno confermati direttamente con i servizi.</p></div><nav aria-label="Esplora il sito"><span class="ux-footer-label">Da dove iniziare</span><a href="/sezioni.html">Tutte le sezioni</a><a href="/orientati.html">Lasciati guidare da Menta</a><a href="/aiuto-adesso.html">Aiuto adesso</a><a href="/studenti.html">Sei uno studente?</a></nav><nav aria-label="Informazioni sul progetto"><span class="ux-footer-label">Il progetto</span><a href="/metodo.html">Fonti e metodo</a><a href="/documenti.html">Documenti e download</a><a href="/qualita-dati.html">Qualità dei dati</a><a href="/privacy.html">Privacy e uso del sito</a></nav></div><div class="container footer-note">Informazioni orientative, non diagnosi o prescrizioni. Revisione clinica indipendente non effettuata.</div></footer>'''

HOME='''<main class="container" id="contenuto" tabindex="-1"><section class="ux-hero" aria-labelledby="ux-home-title"><div class="ux-hero-copy"><p class="eyebrow">Salute mentale nel Lazio</p><h1 id="ux-home-title">Trova il supporto<br/><em>giusto per te.</em></h1><p class="lede">Servizi, ascolto e percorsi spiegati con chiarezza. Scegli da dove iniziare: Menta ti aiuta a orientarti.</p><div class="actions"><a class="button" href="/servizi.html">Trova un servizio <span aria-hidden="true">→</span></a><a class="button secondary" href="/orientati.html">Lasciati guidare da Menta</a></div><p class="ux-hero-note">Non serve conoscere le sigle. Puoi cercare in autonomia oppure farti indicare le sezioni da cui partire.</p></div><div class="ux-mascot-frame"><span class="menta-figure" data-variant="welcome" data-state="idle" aria-hidden="true"><img src="'''+IMAGE+'''" width="480" height="494" alt="" fetchpriority="high" decoding="async"/></span><p class="ux-mascot-caption">Un passo alla volta, con Menta</p></div></section><section class="ux-home-section" id="inizia" aria-labelledby="ux-start-title"><div class="ux-section-heading"><h2 id="ux-start-title">Oppure, parti da qui</h2><a href="/sezioni.html">Tutte le sezioni <span aria-hidden="true">→</span></a></div><div class="ux-route-grid">'''+route('mappa.html','Esplora la mappa','Guarda dove si trovano i servizi localizzati.','pin')+route('ascolto.html','Parla con qualcuno','Numeri utili e servizi di ascolto, distinti dalle emergenze.','chat','peach')+route('studenti.html','Sei uno studente?','Supporto universitario, scolastico e percorsi sul territorio.','study','lilac',extra=' student-entry')+route('supporto-territoriale.html','Famiglie e territorio','Consultori, orientamento sociosanitario e supporto sociale.','people','sand')+'''</div></section><aside class="ux-trust" aria-label="Informazioni sul progetto">'''+icon('check')+'''<p>Una mappa per orientarsi, non una diagnosi. Informazioni e disponibilità vanno confermate con i servizi. <a href="/metodo.html">Fonti e limiti del progetto</a>.</p></aside></main>'''

def page_title(soup, title: str, description: str, path: str) -> None:
    soup.title.string=title+' | Salute mentale Lazio'
    for attrs in ({'name':'description'},{'property':'og:description'},{'name':'twitter:description'}):
        t=soup.find('meta',attrs=attrs)
        if t:t['content']=description
    for attrs in ({'property':'og:title'},{'name':'twitter:title'}):
        t=soup.find('meta',attrs=attrs)
        if t:t['content']=title
    for t in soup.select('link[rel="canonical"],meta[property="og:url"]'):
        t['href' if t.name=='link' else 'content']=ORIGIN+('/' if path=='index.html' else '/'+path)

baseline_files=git('ls-tree','-r','--name-only',BASE).splitlines()
# Versioned offline exports and the original V7.3 interface are historical material.
pages=[p for p in baseline_files if p.endswith('.html') and ('/' not in p or p.startswith('guide/')) and p!='interfaccia-precedente.html']
for p, *_ in CATALOG:
    if p!='orientati.html':assert p in pages, 'Catalog destination missing: '+p
source={p:original(p) for p in pages}
base_home=parse(source['index.html'])
orientation=copy.deepcopy(base_home)
orientation.body['class']=list(orientation.body.get('class',[]))+['ux-orientation']
menta=orientation.select_one('section#menta')
assert menta is not None
menta.select_one('h1').string='Lasciati guidare da Menta'
intro=menta.select_one('.menta-home-intro')
if intro:intro.string='Scrivi il tipo di supporto che cerchi: Menta ti indica i servizi o le guide da cui partire.'
menta.select_one('form')['action']='/orientati.html#menta'
# Everything removed from the homepage remains available in the dedicated page.
rest=orientation.new_tag('details',attrs={'class':'ux-accordion','id':'percorsi-manuali'})
summary=orientation.new_tag('summary');summary.string='Preferisci scegliere senza scrivere? Esplora i percorsi';rest.append(summary)
main=orientation.find('main')
for node in list(main.contents):
    if node is not menta:rest.append(node.extract())
main.append(rest)
page_title(orientation,'Lasciati guidare da Menta','Orientamento locale per parole chiave e percorsi da esplorare. Menta non è una chat né una valutazione clinica.','orientati.html')
for node in orientation.select('script[type="application/ld+json"]'):node.decompose()
source['orientati.html']=str(orientation)
pages.append('orientati.html')

home=parse(source['index.html'])
home.find('main').replace_with(element(HOME))
home.body['class']=list(home.body.get('class',[]))+['ux-home']
for script in home.find_all('script',src=True):
    if any(x in script['src'] for x in ['menta-config-','menta-core-','menta-ui-']):script.decompose()
page_title(home,'Salute mentale nel Lazio: scegli da dove iniziare','Trova un servizio, esplora la mappa o lasciati guidare da Menta. Accessi rapidi ad ascolto, studenti e supporto territoriale.','index.html')
source['index.html']=str(home)

# Local, non-personal section index. It works as a complete list without JavaScript.
sections=copy.deepcopy(home)
sections.body['class']=['ux-directory-page']
chips=''.join(f'<button type="button" data-ux-filter="{g}" aria-pressed="{str(g=="all").lower()}">{html.escape(label)}</button>' for g,label in [('all','Tutte'),*GROUPS.items()])
index_html='<main class="container" id="contenuto" tabindex="-1"><section class="page-lead"><p class="eyebrow">Esplora il sito</p><h1>Tutte le sezioni, in un posto solo.</h1><p class="lede">Non sai quale voce aprire? Cerca una parola come “scuola”, “ascolto” o “comunità”, oppure scegli un argomento.</p></section><section class="ux-discovery-tools" id="ux-discovery-tools" hidden aria-label="Trova una sezione"><form id="ux-discovery-form" action="/sezioni.html" method="get" autocomplete="off"><div class="ux-discovery-row"><div class="ux-discovery-field"><label for="ux-discovery-query">Che cosa stai cercando nel sito?</label><input id="ux-discovery-query" type="search" maxlength="120" autocomplete="off" spellcheck="false" placeholder="Per esempio: università, sigle, consultori" aria-describedby="ux-discovery-privacy"/></div><button type="button" class="text-button" data-ux-reset>Azzera la ricerca</button></div><p id="ux-discovery-privacy">Il filtro funziona sul tuo dispositivo. Non inserire informazioni personali.</p><div class="ux-discovery-chips" role="group" aria-label="Filtra per argomento">'+chips+'</div></form></section><p class="ux-discovery-count" id="ux-discovery-count" role="status" aria-live="polite" aria-atomic="true">'+str(len(CATALOG))+' sezioni disponibili.</p><section class="ux-discovery-empty" id="ux-discovery-empty" hidden><h2>Nessuna sezione corrisponde.</h2><p>Prova una parola più semplice oppure torna all’elenco completo. Per il nome di una struttura usa la ricerca dei servizi.</p><div class="actions"><button type="button" class="button secondary" data-ux-reset>Mostra tutte le sezioni</button><a class="button" href="/servizi.html">Cerca nei servizi</a></div></section>'
for group,label in GROUPS.items():
    index_html+=f'<section class="ux-section-group" id="{group}" data-ux-group aria-labelledby="group-{group}"><h2 id="group-{group}">{html.escape(label)}</h2><div class="ux-section-index">'
    for path,title,description,g,tags in CATALOG:
        if g!=group:continue
        c=element(route(path,title,description))
        c['data-ux-section']=path;c['data-ux-category']=g;c['data-ux-search']=tags
        index_html+=str(c)
    index_html+='</div></section>'
index_html+='</main>'
sections.find('main').replace_with(element(index_html))
page_title(sections,'Tutte le sezioni','Trova la sezione giusta tra servizi, ascolto, studenti, famiglie, guide e documenti. Ricerca locale senza registrazione.','sezioni.html')
for node in sections.select('script[type="application/ld+json"]'):node.decompose()
source['sezioni.html']=str(sections);pages.append('sezioni.html')

SIBLINGS={
 'ascolto':['ascolto.html','helpline.html','centri-ascolto.html','aiuto-adesso.html'],
 'studenti':['studenti.html','universita.html','scuole.html','giovani.html'],
 'servizi':['servizi.html','mappa.html','strutture-approfondite.html','supporto-territoriale.html'],
 'guide':['orientati.html','guide/index.html','orientamento-servizi.html','glossario.html'],
 'progetto':['metodo.html','documenti.html','qualita-dati.html','privacy.html'],
}
SHORT={'servizi.html':'Ricerca servizi','mappa.html':'Mappa','strutture-approfondite.html':'Comunità e centri diurni','supporto-territoriale.html':'Supporto territoriale','ascolto.html':'Numeri utili','helpline.html':'Ascolto telefonico','centri-ascolto.html':'Sportelli di ascolto','aiuto-adesso.html':'Aiuto adesso','studenti.html':'Percorsi per studenti','universita.html':'Università','scuole.html':'Scuole','giovani.html':'Bambini e adolescenti','orientati.html':'Menta','guide/index.html':'Guide','orientamento-servizi.html':'Tipi di servizio','glossario.html':'Sigle e parole','metodo.html':'Metodo','documenti.html':'Documenti','qualita-dati.html':'Qualità dati','privacy.html':'Privacy'}

inventory=[]
for path in pages:
    s=parse(source[path]);main=s.find('main');assert main and s.head and s.body,path
    s.body['class']=list(dict.fromkeys(s.body.get('class',[])+['ux-shell']))
    s.body['data-navigation-version']='7.12';s.body['data-ux-version']='7.12'
    if 'container' not in main.get('class',[]):main['class']=list(main.get('class',[]))+['container']
    main['id']='contenuto';main['tabindex']='-1'
    old=s.select_one('header.site-header')
    if old:old.replace_with(element(header(path)))
    else:main.insert_before(element(header(path)))
    old=s.select_one('footer.site-footer')
    if old:old.replace_with(element(FOOTER))
    else:main.insert_after(element(FOOTER))
    if not s.select_one('.skip-link'):s.body.insert(0,element('<a class="skip-link" href="#contenuto">Salta al contenuto</a>'))
    emergency=s.select_one('.emergency-strip .container')
    if emergency and not emergency.select_one('.ux-emergency-route'):
        emergency.append(element('<a class="ux-emergency-route" href="/aiuto-adesso.html">Quale aiuto chiamare? →</a>'))
    for script in s.find_all('script',src=True):
        if 'navigation-v7-7-3.js' in script['src']:script.decompose()
    for asset,tag,attrs in [(CSS,'link',{'rel':'stylesheet','href':CSS}),(JS,'script',{'defer':'','src':JS})]:
        s.head.append(s.new_tag(tag,attrs=attrs))
    # The original stylesheet is available even on utility pages without Menta.
    if not s.find('link',href='/assets/menta-v7-7.css'):
        first=s.find('link',href=CSS);first.insert_before(s.new_tag('link',attrs={'rel':'stylesheet','href':'/assets/menta-v7-7.css'}))
    for node in s.select('meta[name="theme-color"]'):node['content']='#245b48'
    if path not in ['index.html','404.html']:
        for crumb in main.select('.breadcrumb'):crumb.decompose()
        group=META.get(path,('','','','servizi'))[3]
        title=META[path][1] if path in META else ('Tutte le sezioni' if path=='sezioni.html' else 'Trova un servizio')
        parent=('guide/index.html','Guide') if path.startswith('guide/') and path!='guide/index.html' else ('sezioni.html#'+group,GROUPS.get(group,'Sezioni'))
        crumb='<nav class="breadcrumb ux-breadcrumb" aria-label="Percorso"><a href="/index.html">Home</a><span aria-hidden="true">/</span>'
        if path!='sezioni.html':crumb+=f'<a href="/{parent[0]}">{parent[1]}</a><span aria-hidden="true">/</span>'
        crumb+=f'<span aria-current="page">{html.escape(title)}</span></nav>'
        main.insert(0,element(crumb))
        if path!='sezioni.html' and path not in ['servizi.html','archivio.html','mappa.html']:
            candidates=SIBLINGS[group]
            nav_html='<nav class="ux-section-nav" aria-label="Sezioni collegate"><span>In questa area</span>'+''.join(f'<a href="/{p}"'+(' aria-current="page"' if p==path else '')+'>'+SHORT[p]+'</a>' for p in candidates)+'</nav>'
            main.insert(1,element(nav_html))
        if path not in ['sezioni.html','aiuto-adesso.html','orientati.html']:
            related_paths=[p for p in SIBLINGS[group] if p!=path][:2]+['orientati.html' if group!='guide' else 'servizi.html']
            related_paths=list(dict.fromkeys(related_paths))[:3]
            related='<nav class="ux-related" aria-label="Altri percorsi utili"><h2>Da qui puoi continuare</h2><div class="ux-route-grid">'+''.join(route(p) for p in related_paths)+'</div></nav>'
            main.append(element(related))
    if path in ['servizi.html','archivio.html']:
        lead=main.select_one('.svc-intro')
        if lead:lead.append(element('<p class="micro ux-search-hint">Non conosci le sigle? <a href="/orientamento-servizi.html">Scopri che cosa fanno i servizi</a>, oppure <a href="/orientati.html">lasciati guidare da Menta</a>.</p>'))
    if path=='privacy.html':
        main.append(element('<section class="article-section" id="ux-local-search"><h2>Ricerca delle sezioni del sito</h2><p>Il filtro della pagina “Tutte le sezioni” viene elaborato nel browser: il testo non viene inviato a servizi esterni, inserito nell’indirizzo della pagina o salvato in memoria persistente. Non occorre un account. Le normali richieste necessarie per aprire le pagine restano descritte nelle altre sezioni di questa informativa.</p></section>'))
    if path=='documenti.html':
        history=s.new_tag('details',attrs={'class':'ux-accordion ux-history','id':'versioni-precedenti'})
        summary=s.new_tag('summary');summary.string='Versioni precedenti, audit e cronologia';history.append(summary)
        for section in list(main.find_all('section',recursive=False)):
            if str(section.get('id','')).startswith('release-') or ('ultimo riesame' in section.get_text()):history.append(section.extract())
        if len(history.contents)>1:main.append(history)
        for h in main.find_all('h2'):
            if h.get_text(strip=True)=='Questa edizione':h.string='Prima edizione web V7.4'
        current='<section class="ux-doc-current" id="release-v712"><h2>V7.12 · Navigazione e grafica Menta</h2><p>Homepage essenziale, orientamento in una pagina dedicata e indice ricercabile di tutte le sezioni. I dati e le localizzazioni restano quelli della V7.11.7.</p><div class="actions"><a href="/downloads/Release_Notes_V7_12.md">Note di rilascio</a><a href="/downloads/Audit_UX_V7_12.json">Ambito e integrità</a><a href="/downloads/Verifiche_UX_V7_12.json">Verifiche automatiche</a></div></section>'
        main.insert(3,element(current))
        # These links remain independent of any accordion state and open it on use.
        main.insert(3,element('<nav class="ux-doc-nav" aria-label="Vai ai documenti"><a href="#elenchi-download">Elenchi e dataset</a><a href="#documentazione-tecnica">Documentazione tecnica</a><a href="#versioni-precedenti">Versioni precedenti</a><a href="/guide/index.html">Leggi le guide online</a></nav>'))
    # Existing links to old homepage content go directly to the dedicated page.
    for a in s.find_all('a',href=True):
        u=urlsplit(a['href'])
        if u.path=='/index.html' and u.fragment in ['menta','menta-results','menta-query','ricerca-rapida','esplora','risorse','download-home','student-entry-title','supporto-v710-title']:
            a['href']='/orientati.html#'+u.fragment
    write(path,str(s))
    inventory.append({'path':path,'title':s.title.get_text(' ',strip=True),'h1':[h.get_text(' ',strip=True) for h in s.find_all('h1')],'category':META.get(path,('','','','utility'))[3]})

manifest=json.loads(original('version.json'))
manifest['web_version']='7.12';manifest['navigation_version']='7.12';manifest['ux_version']='7.12';manifest['built_at']=DATE
manifest['release_note']='V7.12: homepage essenziale, Menta in /orientati.html, tutte le sezioni ricercabili e design coerente sulle pagine correnti. Dataset e geografia V7.11.7 preservati.'
manifest['v7_12_ux']={'baseline_commit':BASE,'pages_styled':len(pages),'new_pages':['orientati.html','sezioni.html'],'essential_home_routes':6,'section_index_entries':len(CATALOG),'data_changes':False,'mascot_image_changed':False,'menta_engine_changed':False,'device_geolocation':False,'tracking':False,'workflow':'.github/workflows/verify-ux-v7-12.yml','verification_note':'Esiti del commit effettivo nei workflow; i controlli precedenti restano storici.'}
write('version.json',json.dumps(manifest,ensure_ascii=False,indent=2))

ns='http://www.sitemaps.org/schemas/sitemap/0.9';ET.register_namespace('',ns)
xml=ET.fromstring(original('sitemap.xml'));existing={e.find('{'+ns+'}loc').text for e in xml}
for p, *_ in CATALOG:
    url=ORIGIN+'/'+p
    if url not in existing:
        item=ET.SubElement(xml,'{'+ns+'}url');ET.SubElement(item,'{'+ns+'}loc').text=url;ET.SubElement(item,'{'+ns+'}lastmod').text=DATE
url=ORIGIN+'/sezioni.html'
if url not in existing:
    item=ET.SubElement(xml,'{'+ns+'}url');ET.SubElement(item,'{'+ns+'}loc').text=url;ET.SubElement(item,'{'+ns+'}lastmod').text=DATE
write('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n'+ET.tostring(xml,encoding='unicode'))
notes='''# V7.12 — Home essenziale e navigazione Menta

Data: 27 settembre 2026. Baseline: V7.11.7.

## Cosa cambia
La homepage contiene due azioni principali (ricerca servizi e orientamento con Menta) e quattro accessi rapidi (mappa, ascolto, studenti, famiglie/territorio). Il motore locale di Menta e tutti i percorsi precedentemente presenti in homepage restano in `orientati.html`.

`sezioni.html` espone tutte le sezioni correnti, raggruppate per bisogno, con filtro locale per parole e argomenti. Menu, percorsi di ritorno, collegamenti alle aree vicine, schede, moduli e guide condividono lo stesso sistema grafico: verdi Menta, crema e accenti pastello. I filtri dei servizi esplicitano il significato delle sigle senza cambiare i valori di ricerca.

## Dati preservati
Nessuna modifica a dataset, localizzazioni, stati amministrativi, contatti, numeri utili, motore di Menta, immagine WebP, esportazioni storiche o portale offline. Il conteggio rimane quello della V7.11.7: 443 schede nella ricerca, 373 localizzate e 70 senza pin. Questi numeri non rappresentano sedi fisiche uniche.

## Accessibilità e privacy
Navigazione tramite tastiera, chiusura menu con Escape, focus visibile, controlli touch, stati vuoti e fallback senza JavaScript. Animazioni brevi e rispetto della preferenza di movimento ridotto. La mappa conserva il caricamento volontario dei tasselli. Nessun account, tracciamento o geolocalizzazione del dispositivo aggiunti. Indicizzazione sempre disabilitata.

I test automatici e le schermate non costituiscono una certificazione completa di accessibilità o una prova di usabilità con persone reali. Verifica clinica indipendente non effettuata.

## Ripristino
Checkpoint `checkpoint-v7-11-7-before-ux-v7-12`, commit `'''+BASE+'''`. La release si sviluppa su un ramo separato e viene pubblicata solo dopo le verifiche.
'''
write('downloads/Release_Notes_V7_12.md',notes)
for path,title in [('README.md','## Versione V7.12 — homepage essenziale e navigazione Menta'),('CHANGELOG.md','## 7.12 — 2026-09-27')]:
    write(path,title+'\n\nHomepage con sei percorsi essenziali; Menta e tutti i percorsi estesi in `orientati.html`; indice ricercabile `sezioni.html`; menu e design condivisi sulle pagine correnti. Dataset/geografia V7.11.7 e contenuti storici preservati. Nessun tracciamento o geolocalizzazione aggiunti.\n\nVedi `downloads/Release_Notes_V7_12.md` e `.github/workflows/verify-ux-v7-12.yml`.\n\n'+original(path))

# Reuse the data checks with only the web-version expectation adapted to this UX release.
data_test=original('tools/test-v7-11-7.cjs').replace("assert.equal(v.web_version,'7.11.7')","assert.equal(v.web_version,'7.12')")
write('tools/test-data-v7-12.cjs',data_test)
# Clinical source data and prior reports must be identical; hash every baseline data file.
protected=[p for p in baseline_files if p.startswith(('data/','downloads/','offline/','assets/menta/')) or p in ['robots.txt','_headers','interfaccia-precedente.html']]
protected_hashes={}
for p in protected:
    actual=(ROOT/p).read_bytes();old=subprocess.check_output(['git','show',BASE+':'+p],cwd=ROOT)
    assert actual==old,'Protected file changed: '+p
    protected_hashes[p]=hashlib.sha256(actual).hexdigest()
audit={'version':'7.12','date':DATE,'baseline_commit':BASE,'pages':inventory,'section_catalog':[{'path':p,'title':t,'description':d,'category':g,'keywords':k} for p,t,d,g,k in CATALOG],'protected_files':protected_hashes,'protected_count':len(protected_hashes),'scope':'Architettura informativa e grafica; non nuovo audit delle informazioni sanitarie.','all_old_home_sections_moved_to':'orientati.html','historic_interface_unchanged':'interfaccia-precedente.html','indexing_enabled':False,'new_tracking':False,'new_data_collection':False}
write('downloads/Audit_UX_V7_12.json',json.dumps(audit,ensure_ascii=False,indent=2))
outputs=pages+['version.json','sitemap.xml','README.md','CHANGELOG.md','downloads/Release_Notes_V7_12.md','downloads/Audit_UX_V7_12.json','tools/test-data-v7-12.cjs']
write('research/v7_12/generated-files.json',json.dumps(outputs,ensure_ascii=False,indent=2))
print(json.dumps({'version':'7.12','styled_pages':len(pages),'section_entries':len(CATALOG),'protected_files':len(protected_hashes),'outputs':outputs},ensure_ascii=False,indent=2))
