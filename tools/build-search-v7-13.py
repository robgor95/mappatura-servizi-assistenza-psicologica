#!/usr/bin/env python3
"""Apply the V7.13 presentation layer without rewriting clinical source data.

Run on the V7.12.1 source snapshot after adding the province assets. Idempotent.
"""
from pathlib import Path
import json
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
BASELINE='110b564a777f94c93f972594c67bb0a4b1f41d8c'
SECTION='''<section aria-labelledby="province-title" class="province-explorer" id="province-explorer">
<div class="province-heading"><div><p class="eyebrow">Esplora il territorio</p><h2 id="province-title">Scegli una provincia sulla mappa</h2><p>Apri un territorio, poi un punto per vedere il servizio. La mappa e l’elenco seguono gli stessi filtri.</p></div><div class="province-head-actions" id="province-head-actions" hidden><button type="button" class="province-control" id="province-toggle" aria-controls="province-layout" aria-expanded="true">Nascondi mappa</button><a class="province-control" href="#risultati">Vai ai risultati ↓</a></div></div>
<p id="province-loading" class="province-status" role="status">La mappa si sta preparando. Puoi già usare ricerca e filtri.</p>
<p id="province-error" class="province-warning" role="status" hidden></p><button id="province-retry" type="button" class="province-control" hidden>Ricarica e riprova</button>
<div class="province-layout" id="province-layout" hidden>
<div class="province-map-column"><div class="province-toolbar"><button type="button" class="province-control" id="province-all">Tutto il Lazio</button><button type="button" class="province-control" id="province-expand" aria-pressed="false">Espandi mappa</button><p>Zoom con +/− o due dita. Puoi anche scegliere un nome dall’elenco province.</p></div>
<div class="province-canvas" id="province-canvas" role="region" tabindex="0" aria-label="Mappa dei servizi nel Lazio, divisa per province" aria-describedby="province-map-help"></div>
<div class="province-toolbar"><button type="button" class="province-control province-tiles-button" id="province-tiles" aria-pressed="false" aria-describedby="province-tile-privacy">Attiva sfondo stradale</button><p id="province-tile-privacy">Facoltativo: contatta OpenStreetMap solo dopo il clic. Nessuna posizione del dispositivo viene richiesta.</p></div>
<p id="province-tile-warning" class="province-warning" role="status" hidden>Sfondo stradale non disponibile. I confini locali, i punti dei servizi e l’elenco restano consultabili.</p>
<div class="province-legend" aria-label="Legenda dei punti"><span><b>ASL</b> Rete pubblica</span><span><b>P</b> Privata / non ASL</span><span><b>?</b> Gestione da verificare</span><span>Tratto discontinuo: posizione indicativa</span></div>
<p class="province-help" id="province-map-help">I contatori delle province non sono sedi. Ingrandisci per separare i punti vicini; un gruppo non indica necessariamente un solo edificio. <a href="/metodo.html#province-v713">Fonti e criteri</a>.</p>
<p id="province-feedback" class="province-status" role="status" aria-live="polite"></p>
<div id="province-selected" class="province-selected" hidden></div>
</div>
<aside aria-labelledby="province-active"><section class="province-summary"><h3 id="province-active" tabindex="-1">Tutto il Lazio</h3><p class="province-total" id="province-total"></p><p class="province-coverage" id="province-coverage"></p><p id="province-empty" class="province-warning" hidden>Nessun servizio con questi filtri. Cambia provincia o rimuovi un filtro: non significa che nel territorio non esistano servizi.</p><p class="province-summary-label">Gestione indicata nel portale</p><dl class="province-stats" id="province-ownership"></dl><details><summary>Rapporto con il SSN</summary><dl class="province-stats" id="province-ssn"></dl><p>È un’informazione distinta dalla gestione. “Indicato nelle fonti” include documenti precedenti: non certifica convenzioni attuali, gratuità o posti disponibili. Accreditamento e contratto SSN non sono sinonimi.</p></details></section><section class="province-selector"><h3>Province e città metropolitana</h3><p>Conteggi con gli altri filtri della ricerca; scegli un territorio per cambiare selezione.</p><div class="province-buttons" id="province-buttons"></div></section></aside>
</div>
<details class="province-missing" id="province-missing" hidden><summary id="province-missing-title"></summary><p>Questi servizi rimangono nei risultati e nei conteggi del territorio noto, ma non ricevono un punto geografico inventato.</p><ul id="province-missing-list"></ul></details>
<p class="province-footnote">Schede di servizio, non sedi uniche. Roma comprende la città metropolitana; la provincia indica la sede, non il diritto di accesso. <a href="/supporto-territoriale.html">Consultori e altri aiuti territoriali →</a></p>
<noscript><p>La mappa richiede JavaScript. Restano disponibili <a href="/sezioni.html">tutte le sezioni</a> e <a href="/documenti.html">gli elenchi scaricabili</a>.</p></noscript>
</section>'''

def replace_once(s,a,b):
    if s.count(a)!=1:raise ValueError('Expected one patch anchor: '+a[:100])
    return s.replace(a,b,1)

def main():
    p=ROOT/'assets/servizi-v7-11-7.js';s=p.read_text()
    s=replace_once(s,"let D,rows=[],filtered=[],state={},notices=[],returnKey='',timer,lastTyping=0,openKey='';", "let D,rows=[],filtered=[],state={},notices=[],returnKey='',timer,lastTyping=0,openKey='',territoriesReady=false;")
    s=replace_once(s,"function mapURL(r){return '/mappa.html?presidio='+encodeURIComponent(r.key);}","function mapURL(r){const p=new URLSearchParams();A.filterKeys.forEach(k=>{if(state[k])p.set(k,state[k]);});p.set('presidio',r.key);return '/mappa.html?'+p;}")
    s=s.replace("esc(mapURL(r))+'\">Mappa</a>'", "esc(mapURL(r))+'\" data-locate=\"'+esc(r.key)+'\">Mappa</a>'")
    s=s.replace("esc(mapURL(r))+'\">Vedi sulla mappa</a>'", "esc(mapURL(r))+'\" data-locate=\"'+esc(r.key)+'\">Vedi sulla mappa</a>'")
    if s.count('data-locate=')!=2:raise ValueError('Map link patch not applied')
    s=replace_once(s,"setNotice(notices);renderDialog();renderTechnical();$('risultati').setAttribute('aria-busy','false');", "setNotice(notices);renderDialog();renderTechnical();$('risultati').setAttribute('aria-busy','false');\n  window.LazioProvinceMap?.update({rows,filtered,state:{...state}});")
    s=replace_once(s,'function wire(){',"function selectProvince(code){\n  if(!window.LazioProvinceCore?.codes.concat('ND','').includes(code))return;\n  clearTimeout(timer);const next=takeForm();if(code)next.provincia=code;else delete next.provincia;\n  notices=[];commit(next);\n}\nfunction wire(){")
    s=replace_once(s,"const preset=e.target.closest('[data-preset]');", "const mapTarget=e.target.closest('a[data-locate]');\n    if(mapTarget&&$('province-explorer')?.dataset.ready==='true'){if(dialog.open)closeDetail();if(window.LazioProvinceMap?.locate(mapTarget.dataset.locate)){e.preventDefault();return;}}\n    const preset=e.target.closest('[data-preset]');")
    s=replace_once(s,'current7115,current7116,current7117]=await Promise.allSettled([','current7115,current7116,current7117,territoryIndex]=await Promise.allSettled([')
    s=replace_once(s,"getJSON('/data/audit_operativo_v7_11_7.json')\n  ]);","getJSON('/data/audit_operativo_v7_11_7.json'),\n    getJSON('/data/comuni_province_istat2026_v7_13.json')\n  ]);")
    s=replace_once(s,"rows=A.build(D,extra.status==='fulfilled'?extra.value:null);populate();wire();", "rows=A.build(D,extra.status==='fulfilled'?extra.value:null);\n  if(territoryIndex.status==='fulfilled'&&window.LazioProvinceCore){try{rows=window.LazioProvinceCore.assign(rows,territoryIndex.value);territoriesReady=true;}catch(_){territoriesReady=false;}}\n  populate();wire();")
    s=replace_once(s,"$('svc-controls').disabled=false;state=stateFromURL();commit(state,false);", "$('svc-controls').disabled=false;state=stateFromURL();commit(state,false);\n  window.LazioProvinceMap?.connect({territoriesReady,snapshot:()=>({rows,filtered,state:{...state}}),selectProvince});")
    (ROOT/'assets/servizi-v7-13.js').write_text(s)
    for file in ['servizi.html','archivio.html']:
        p=ROOT/file; soup=BeautifulSoup(p.read_text(),'html.parser')
        if soup.select_one('#province-explorer'):continue
        script=soup.find('script',src='/assets/servizi-v7-11-7.js')
        if not script:raise ValueError('Missing service entrypoint '+file)
        for source in ['/assets/vendor/leaflet/leaflet.js','/assets/map-data-v7-11-7.js','/assets/province-core-v7-13.js','/assets/province-map-v7-13.js']:
            tag=soup.new_tag('script',src=source);tag['defer']='';script.insert_before(tag)
        script['src']='/assets/servizi-v7-13.js'
        for source in ['/assets/vendor/leaflet/leaflet.css','/assets/province-map-v7-13.css']:
            tag=soup.new_tag('link',href=source,rel='stylesheet');soup.head.append(tag)
        soup.select_one('#ricerca').insert_after(BeautifulSoup(SECTION,'html.parser'))
        switch=soup.select_one('.service-view-switch')
        if switch:
            a=soup.new_tag('a',href='#province-explorer');a.string='Esplora le province ↓';switch.insert(1,a)
            soup.select_one('#svc-map-results').string='Mappa a pagina intera →'
        soup.body['data-search-map-version']='7.13'
        p.write_text(str(soup)+'\n')
    p=ROOT/'metodo.html';soup=BeautifulSoup(p.read_text(),'html.parser')
    if not soup.select_one('#province-v713'):
        text='''<section class="callout" id="province-v713"><h2>Mappa per province: cosa viene contato</h2><p>La mappa integrata nella ricerca usa i confini generalizzati ISTAT al 1° gennaio 2026, riproiettati in WGS84 geografico e arrotondati per la visualizzazione. Fonte: <a href="https://www.istat.it/notizia/confini-delle-unita-amministrative-a-fini-statistici-al-1-gennaio-2018-2/" target="_blank" rel="noopener noreferrer">ISTAT, confini amministrativi</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Elaborazione indipendente; non confini catastali, nessun avallo ISTAT.</p><p>La provincia è attribuita dal comune della sede confrontato con l’elenco ISTAT, non dall’ASL, dal bacino di accesso o da un punto al centro del territorio. I servizi senza coordinate restano nei conteggi e negli elenchi del comune noto. I casi non riconciliati sono distinti come “Territorio da verificare”.</p><p>Si contano schede e moduli, non sedi fisiche uniche; record storici riconciliati conservati nel database possono ancora concorrere al conteggio. I gruppi sulla mappa dipendono anche dalla scala o da coordinate indicative condivise. Non attestano coincidenza di sede. Le coordinate e gli ingressi mantengono i limiti documentali della V7.11.7.</p><p>Gestione e rapporto SSN sono due dimensioni separate. L’indicazione “SSN nelle fonti” comprende evidenze anche precedenti; non significa contratto attuale, gratuità o disponibilità. Si conservano le distinzioni del dataset fra rapporto indicato, dichiarato e da verificare. I totali di ciascuna dimensione non vanno sommati fra loro.</p><p>I confini, i contatori e i punti si caricano dal sito. Solo “Attiva sfondo stradale” richiede tasselli a OpenStreetMap: nessun rilevamento della posizione del dispositivo, tracciamento o geocodifica live. Nascondere la mappa disattiva lo sfondo esterno. L’elenco resta utilizzabile anche se la cartografia non si carica.</p><p><a href="/downloads/Release_Notes_V7_13.md">Note della versione</a> · <a href="/downloads/Audit_Province_V7_13.json">Audit territoriale e conteggi</a></p></section>'''
        soup.main.append(BeautifulSoup(text,'html.parser'));p.write_text(str(soup)+'\n')
    p=ROOT/'version.json';v=json.loads(p.read_text());v['web_version']='7.13';v['ux_version']='7.13';v['map_version']='7.13';v['geography_data_version']='7.11.7'
    v['release_note']='V7.13: mappa provinciale integrata nella ricerca, conteggi per territorio e risultati sincronizzati; geometrie ISTAT 2026 locali, sfondo stradale facoltativo. Homepage, dati clinici e coordinate V7.11.7 preservati.'
    v['v7_13']={'baseline_commit':BASELINE,'feature':'province_search_map','source_date':'2026-01-01','geography_data_unchanged':'7.11.7','regional_polygons':5,'municipality_lookup':378,'map_tiles_opt_in':True,'device_geolocation':False,'tracking':False,'count_unit':'service_record_not_unique_site','verification_workflow':'.github/workflows/verify-v7-13.yml','report':'downloads/Audit_Province_V7_13.json'}
    p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
    note='''# V7.13 — Ricerca con mappa delle province

27 settembre 2026. Baseline V7.12.1, commit 110b564a777f94c93f972594c67bb0a4b1f41d8c.

La ricerca servizi e l’ingresso legacy integrano una mappa locale delle cinque province/città metropolitana, prima dei risultati. Le aree e i contatori sono selezionabili; il clic aggiorna il filtro provincia e l’elenco nella stessa pagina, preservando gli altri filtri. Ingrandendo compaiono gruppi e servizi, con nome, tipo, gestione, rapporto SSN e precisione geografica. I dettagli si aprono nella scheda esistente e conservano i filtri.

Confini generalizzati ISTAT al 1° gennaio 2026 (CC BY 4.0), riproiettati in EPSG:4326 e arrotondati. L’attribuzione provinciale usa i comuni, non la competenza ASL. Nessuna coordinata di servizio viene generata, corretta o spostata. Homepage, orientamento con Menta, dataset clinici e file storici invariati.

443 schede di servizio, 373 localizzate, 70 senza pin: non sedi uniche. I non localizzati restano nell’elenco e nei conteggi del territorio noto. I contatori delle altre province applicano gli altri filtri; il riepilogo della provincia selezionata coincide con l’elenco. Spostare la mappa non cambia i filtri. 69 casi rimangono nella coda geografica azionabile.

Gestione e rapporto SSN restano separati; “indicato nelle fonti” può riferirsi a documenti precedenti. Nessuna convenzione attuale, gratuità, ingresso o posto libero viene dedotto. Le categorie non sono sinonimi di qualità clinica.

Nessuna richiesta cartografica esterna prima dell’attivazione dello sfondo stradale. Disattivarlo o nascondere la mappa interrompe le richieste successive. Nessun tracking, account, geolocalizzazione del dispositivo o geocodifica live. Mappa compattabile ed espandibile, scelta alternativa tramite pulsanti e filtri, tastiera e movimento ridotto. Errori di confini/indice/coordinate hanno messaggi distinti; la ricerca non viene bloccata. I test automatici non sono certificazione completa di accessibilità o studio con utenti reali.

Ripristino: checkpoint-v7-12-1-before-province-v7-13. Verifiche e schermate vanno lette nel run relativo al commit pubblicato.
'''
    (ROOT/'downloads/Release_Notes_V7_13.md').write_text(note)
    p=ROOT/'documenti.html';soup=BeautifulSoup(p.read_text(),'html.parser')
    if not soup.select_one('#release-v713'):
        sec=BeautifulSoup('<section class="callout" id="release-v713"><h2>V7.13 · ricerca con mappa delle province</h2><p>Province selezionabili, riepiloghi distinti e schede sincronizzate con i filtri. I servizi senza coordinate restano consultabili.</p><p><a href="/downloads/Release_Notes_V7_13.md">Note di rilascio</a> · <a href="/downloads/Audit_Province_V7_13.json">Audit territoriale e conteggi</a> · <a href="/servizi.html#province-explorer">Apri la ricerca con mappa</a></p></section>','html.parser')
        intro=soup.main.find('section');intro.insert_after(sec) if intro else soup.main.insert(0,sec)
        p.write_text(str(soup)+'\n')
    for name,title in [('CHANGELOG.md','## 7.13 — 2026-09-27'),('README.md','## Versione V7.13 — Ricerca per province')]:
        p=ROOT/name;old=p.read_text()
        if title not in old:p.write_text(title+'\n\nMappa locale delle province nella ricerca, con contatori e risultati sincronizzati. Dati e coordinate V7.11.7, Menta e homepage preservati. Sfondo OpenStreetMap facoltativo. Vedi `downloads/Release_Notes_V7_13.md`.\n\n'+old)
    p=ROOT/'.github/workflows/verify-ux-v7-12-1.yml';text=p.read_text()
    # Keep the previous release workflow available manually; it asserts its historical manifest version.
    start=text.index('on:');end=text.index('permissions:')
    text=text[:start]+'on:\n  workflow_dispatch:\n'+text[end:];p.write_text(text)

if __name__=='__main__':main()
