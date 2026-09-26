"""Build V7.11 from explicitly approved documentary decisions.
No network, geocoding or automatic promotion. Historical files stay unchanged.
"""
from pathlib import Path
from collections import Counter
import os,json,copy,csv,re,hashlib,subprocess,tempfile
R=Path(__file__).resolve().parents[1]
P=json.loads((R/'research/v7_11/approved.json').read_text())
BASE=P['baseline_commit'];DATE=P['checked_at']
assert BASE=='85808c6fad9dec32098558e466a3997a18b95d22'
assert len(P['pins'])==15 and len(P['revisions'])==30
B=Path(os.environ['V711_BASE_DIR']) if os.environ.get('V711_BASE_DIR') else None
def oldbytes(path):
 if B:return (B/path).read_bytes()
 return subprocess.check_output(['git','show',BASE+':'+path],cwd=R)
def old(path):return oldbytes(path).decode('utf-8')
def write(path,text):
 p=R/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text,encoding='utf-8')
def jsave(path,data):write(path,json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def swap(s,a,b,n=1):
 assert s.count(a)==n,(a[:100],s.count(a),n)
 return s.replace(a,b)
paths=[str(p.relative_to(B)) for p in B.rglob('*') if p.is_file()] if B else subprocess.check_output(['git','ls-tree','-r','--name-only',BASE],cwd=R,text=True).splitlines()
protected={p:hashlib.sha256(oldbytes(p)).hexdigest() for p in paths if p.startswith(('data/','downloads/','assets/'))}
jsave('downloads/Integrita_Baseline_V7_11.json',{'baseline_commit':BASE,'sha256':protected,'scope':'File preesistenti data/downloads/assets: preservazione byte per byte; le risorse V7.11 sono aggiuntive.'})
revisions=[]
for e in P['revisions']:
 u=P['sources'][e['source']]
 revisions.append({'service_key':e['key'],'origin':e['key'].split(':')[0],'checked_at':DATE,'scope':'Riesame documentale limitato ai campi elencati; nessuna verifica clinica, telefonica, di posti o ingressi.','status':e['status'],'note':e['note'],'fields':e['fields'],'sources':[u],'evidence':{k:{'sources':[u],'source_date':e.get('source_date'),'checked_at':DATE,'basis':'Pagina primaria del servizio; confronto manuale per campo'} for k in e['fields']}})
jsave('data/audit_operativo_v7_11.json',{'version':'7.11','baseline_commit':BASE,'checked_at':DATE,'revisions':revisions,'additions':[],'method':'Aggiornamento e riscontro documentale per campo; nessuna revisione clinica o disponibilità in tempo reale.'})
adapter=r'''/* V7.11: strictly scoped, additive operational overlay. No network or storage. */
(function(root){
'use strict';
const A=root.LazioServices,copy=x=>JSON.parse(JSON.stringify(x));let overlay=null;
const fields=new Set(['indirizzo','sede','telefono','contatti','email','orari','accesso','sede_dettaglio','nota_indirizzo','nota_contatti_v711','nota_geografia_v711']);
function validate(d){
 if(!d||d.version!=='7.11'||!Array.isArray(d.revisions)||!Array.isArray(d.additions)||d.additions.length)throw Error('Overlay V7.11 non valido');
 const seen=new Set();for(const e of d.revisions){
  if(!/^(rete|moduli|privati):[A-Za-z0-9_-]+$/.test(e.service_key||'')||seen.has(e.service_key))throw Error('Identificativo V7.11 non valido');seen.add(e.service_key);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(e.checked_at||'')||!Array.isArray(e.sources)||!e.sources.length||e.sources.some(u=>!/^https:\/\//.test(u)))throw Error('Provenienza V7.11 incompleta');
  if(!e.fields||!Object.keys(e.fields).length||Object.keys(e.fields).some(k=>!fields.has(k)||typeof e.fields[k]!=='string'||!e.evidence?.[k]?.sources?.length||e.evidence[k].sources.some(u=>!/^https:\/\//.test(u))))throw Error('Campo V7.11 non ammesso o privo di fonte');
 }return d;
}
function set(d){overlay=validate(copy(d));}
function raw(r,e){const v=copy(r);Object.assign(v,copy(e.fields));v._riesame_v711={checked_at:e.checked_at,fields:Object.keys(e.fields),sources:e.sources,note:e.note,scope:e.scope,status:e.status};return v;}
if(A){const previous=A.build;A.build=function(data,privateData){
 const rows=previous(data,privateData).map(copy);if(!overlay)return rows;
 const rev=new Map(overlay.revisions.map(e=>[e.service_key,e]));
 for(const r of rows){const e=rev.get(r.key);if(!e)continue;
  const v=r.raw=raw(r.raw,e);r.v711=copy(v._riesame_v711);r.auditDate=e.checked_at;
  r.sources=[...new Set(r.sources.concat(e.sources))];
  if('indirizzo' in e.fields||'sede' in e.fields)r.address=A.nd(e.fields.indirizzo||e.fields.sede);
  if('telefono' in e.fields||'contatti' in e.fields)r.phone=A.phone(e.fields.telefono||e.fields.contatti);
  if('email' in e.fields)r.email=A.email(e.fields.email);
  if('accesso' in e.fields)r.access=A.nd(e.fields.accesso);
  // Classification, ownership, SSN evidence, capacity and historical dates are untouched.
  r.search=A.norm([r.search,r.address,r.access,JSON.stringify(e.fields)].join(' '));
 }return rows;
};}
function directory(category,rows,d){
 validate(d);if(!['strutture','privati'].includes(category))return rows;
 const rev=new Map(d.revisions.map(e=>[e.service_key,e]));return rows.map(r=>{
  const id=r.id_modulo||r.id;const e=category==='privati'?rev.get('privati:'+id):(rev.get('moduli:'+id)||rev.get('rete:'+id));
  if(!e)return r;const v=raw(r,e);const aliases={indirizzo:'sede',telefono:'contatti',orari:'orari_segreteria'};
  for(const [k,a] of Object.entries(aliases))if(k in e.fields)v[a]=e.fields[k];
  v.riesame_v711='Documentale, per campo: '+e.checked_at;v.fonti_v711=e.sources.join(' | ');v.note_v711=e.note;
  return v;
 });
}
root.LazioAudit711={set,validate,directory};
})(typeof window==='object'?window:globalThis);
'''
write('assets/audit-data-v7-11.js',adapter)
export=old('tools/export-current-v7-9-4.cjs')
export=swap(export,"'audit-data-v7-9-4']","'audit-data-v7-9-4','audit-data-v7-11']")
export=swap(export,'const rows=sandbox.LazioServices.build',"sandbox.LazioAudit711.set(read('data/audit_operativo_v7_11.json'));\nconst rows=sandbox.LazioServices.build")
export=export.replace('/tmp/current-rows-v794.json','/tmp/current-rows-v711.json')
write('tools/export-current-v7-11.cjs',export)
with tempfile.TemporaryDirectory() as t:
 before=Path(t)/'before.json';after=Path(t)/'after.json'
 subprocess.run(['node','tools/export-current-v7-9-4.cjs',str(before)],cwd=R,check=True)
 subprocess.run(['node','tools/export-current-v7-11.cjs',str(after)],cwd=R,check=True)
 oldrows=json.loads(before.read_text());rows=json.loads(after.read_text())
by={r['key']:r for r in rows};oldby={r['key']:r for r in oldrows}
assert len(by)==len(rows)==443
g=copy.deepcopy(json.loads(old('data/presidi_geo_v7_9_4.json')))
prior=copy.deepcopy(g['records']);oldlocated={k for k,p in prior.items() if p.get('lat') is not None}
assert len(oldlocated)==315
for p in P['pins']:
 key=p['key'];assert key in by and key not in oldlocated
 assert 40.7<p['lat']<42.95 and 11.3<p['lng']<14.1
 g['records'][key]={k:copy.deepcopy(v) for k,v in p.items() if k not in ['key','source']}
 g['records'][key].update(service_key=key,checked_at=DATE,source_address=by[key]['address'],source_town=by[key]['town'],comune=by[key]['town'],entrance_verified=False,address_source_url=P['sources'][p['source']])
for e in revisions:
 key=e['service_key'];p=g['records'][key]
 if p.get('lat') is None:
  p['source_address']=by[key]['address'];p['source_town']=by[key]['town']
  if 'nota_geografia_v711' in e['fields']:p['note']=e['fields']['nota_geografia_v711']
loc={k for k,p in g['records'].items() if p.get('lat') is not None}
assert len(loc)==330 and all(g['records'][k]==prior[k] for k in oldlocated)
quality=dict(Counter(p['quality'] for p in g['records'].values()));precision=Counter(p['precision'] for p in g['records'].values())
g.update(version='7.11',baseline_commit=BASE,generated_at=DATE,summary={'services_before':443,'services_after':443,'located_before':315,'located_after':330,'unlocated_before':128,'unlocated_after':113,'address_after':precision['address'],'street_after':precision['street'],'building_after':precision['building'],'quality_counts':quality,'newly_localized_existing':[x['key'] for x in P['pins']],'new_service_localized':[],'entrances_verified':0,'nominatim_requests_this_release':0},method_note='V7.11: 15 localizzazioni documentali nuove; 13 edifici/presidi indicativi, un civico e una breve via. Nessun ingresso fisico verificato. Tutti i 315 punti precedenti sono conservati.',provider='OpenStreetMap (estratto regionale offline) e destinazioni cartografiche pubblicate dalle fonti dei servizi; nessuna geocodifica nel browser',source_extract=P['osm_extract'])
jsave('data/presidi_geo_v7_11.json',g)
s=old('assets/servizi-v7-9-4.js')
s=swap(s,'current3,current4]=','current3,current4,current711]=')
s=swap(s,"getJSON('/data/audit_operativo_v7_9_4.json')","getJSON('/data/audit_operativo_v7_9_4.json'),\n    getJSON('/data/audit_operativo_v7_11.json')")
s=swap(s,"if(current4.status==='fulfilled')window.LazioAudit794.set(current4.value);","if(current4.status==='fulfilled')window.LazioAudit794.set(current4.value);\n  if(current711.status==='fulfilled')window.LazioAudit711.set(current711.value);")
s=swap(s,"&&current4.status==='fulfilled')$('svc-load-status').hidden=true;","&&current4.status==='fulfilled'&&current711.status==='fulfilled')$('svc-load-status').hidden=true;")
s=swap(s,"if(current4.status!=='fulfilled')missing.push('le correzioni operative V7.9.4 (dati precedenti da riconfermare)');","if(current4.status!=='fulfilled')missing.push('le correzioni operative V7.9.4 (dati precedenti da riconfermare)');\n    if(current711.status!=='fulfilled')missing.push('le correzioni operative V7.11 (dati precedenti da riconfermare)');")
s=swap(s,"body+=sourceLinks(r.sources);","if(r.v711)body+=section('Riesame documentale V7.11',field('Campi riesaminati',r.v711.fields.join(', '),true)+field('Data di consultazione',r.v711.checked_at)+field('Ambito e limiti',r.v711.scope,true)+field('Note',r.v711.note,true)+field('Precisazioni geografiche',v.nota_geografia_v711,true)+field('Precisazioni sui contatti',v.nota_contatti_v711,true));\n  body+=sourceLinks(r.sources);")
write('assets/servizi-v7-11.js',s)
s=old('assets/map-data-v7-9-4.js').replace('presidi_geo_v7_9_4.json','presidi_geo_v7_11.json')
s=swap(s,"'/data/audit_operativo_v7_9_4.json'].map(json)","'/data/audit_operativo_v7_9_4.json','/data/audit_operativo_v7_11.json'].map(json)")
s=swap(s,'  return {data,rows:A.build',"  if(result[9].status==='fulfilled')root.LazioAudit711.set(result[9].value);else missing.push('correzioni operative V7.11: dati precedenti da riconfermare');\n  return {data,rows:A.build")
s=s.replace('C · Complesso ospedaliero indicativo; reparto e ingresso non verificati','C · Edificio o presidio indicativo; reparto e ingresso non verificati')
write('assets/map-data-v7-11.js',s)
s=old('assets/directory-v7-9-4.js')
s=swap(s,'var extraSources=',"var v711Source=fetch('/data/audit_operativo_v7_11.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Audit V7.11 non caricato');return r.json()});\nvar extraSources=")
s=swap(s,'latestSource,v793Source,v794Source]','latestSource,v793Source,v794Source,v711Source]')
s=swap(s,'audit=x[x.length-5],current=x[x.length-4],latest=x[x.length-3],v793=x[x.length-2],v794=x[x.length-1],additional=x.slice(2,-5)','audit=x[x.length-6],current=x[x.length-5],latest=x[x.length-4],v793=x[x.length-3],v794=x[x.length-2],v711=x[x.length-1],additional=x.slice(2,-6)')
s=swap(s,'rows=window.LazioAudit794.directory(c,rows,v794);init(rows)','rows=window.LazioAudit794.directory(c,rows,v794);rows=window.LazioAudit711.directory(c,rows,v711);init(rows)')
write('assets/directory-v7-11.js',s)
for path in ['servizi.html','archivio.html','mappa.html','strutture-approfondite.html','privati.html']:
 s=old(path)
 if path in ['servizi.html','archivio.html']:s=swap(s,'src="/assets/servizi-v7-9-4.js"','src="/assets/servizi-v7-11.js"')
 if path=='mappa.html':
  s=swap(s,'src="/assets/map-data-v7-9-4.js"','src="/assets/map-data-v7-11.js"').replace('/data/presidi_geo_v7_9_4.json','/data/presidi_geo_v7_11.json')
  s=s.replace('Le coordinate derivano dalla localizzazione degli indirizzi pubblici con OpenStreetMap/Nominatim.','Le coordinate derivano dal confronto documentale degli indirizzi con OpenStreetMap e con le destinazioni cartografiche pubblicate dai servizi. Un punto di edificio o presidio non identifica necessariamente il reparto o il suo ingresso.')
 if path=='privati.html':
  chain=''.join('<script src="/assets/'+x+'.js"></script>' for x in ['audit-data-v7-9','audit-data-v7-9-1','audit-data-v7-9-2','audit-data-v7-9-3','audit-data-v7-9-4','audit-data-v7-11'])
  s=swap(s,'<script src="/assets/directory-v7-5.js?v=7.7.2"></script>',chain+'<script src="/assets/directory-v7-11.js"></script>')
 else:
  pattern=r'(<script[^>]*src="/assets/audit-data-v7-9-4.js"[^>]*></script>)';assert len(re.findall(pattern,s))==1
  defer=' defer' if path!='strutture-approfondite.html' else ''
  s=re.sub(pattern,r'\1<script'+defer+' src="/assets/audit-data-v7-11.js"></script>',s)
 if path in ['strutture-approfondite.html','privati.html']:
  s=s.replace('/assets/directory-v7-9-4.js','/assets/directory-v7-11.js')
  m=re.search(r'window.V75_CONFIG=(\{.*?\});</script>',s);assert m
  cfg=json.loads(m[1]);cfg['fields']+=['orari','email','nota_contatti_v711','nota_geografia_v711','riesame_v711','fonti_v711','note_v711'];cfg['fields']=list(dict.fromkeys(cfg['fields']))
  cfg.setdefault('fieldLabels',{}).update(riesame_v711='Consultazione documentale V7.11',fonti_v711='Fonti del riesame',note_v711='Limiti del riesame',nota_geografia_v711='Precisazione geografica',nota_contatti_v711='Precisazione sui contatti',data_verifica='Data documentale precedente')
  s=s[:m.start(1)]+json.dumps(cfg,ensure_ascii=False,separators=(',',':'))+s[m.end(1):]
  if path=='strutture-approfondite.html':s=s.replace('riesami cumulativi fino alla V7.9.4','riesami cumulativi fino alla V7.11').replace('Riesame V7.9.4 parziale: 23/09/2026','Riesame V7.11 per campi selezionati: 26/09/2026')
 write(path,s)
fieldchanges=[]
for e in revisions:
 for k,value in e['fields'].items():
  previous=oldby[e['service_key']]['raw'].get(k)
  fieldchanges.append({'key':e['service_key'],'field':k,'before':previous,'after':value,'changed':previous!=value,'sources':e['sources'],'source_date':e['evidence'][k]['source_date']})
changedkeys={x['key'] for x in fieldchanges if x['changed']};confirmedkeys={e['service_key'] for e in revisions}-changedkeys
triage=json.loads((R/'research/v7_11/queue-review.json').read_text());assert len(triage)==128
notes={e['service_key']:e['note'] for e in revisions}
for e in triage:
 key=e['key'];e.pop('candidate_coordinates',None)
 e.update(geography_status='localizzato_documentalmente' if key in loc else 'ancora_senza_pin',manual_operational_review=key in notes,note=notes.get(key,'Ulteriore verifica puntuale necessaria; il controllo degli URL non certifica la sede o l’operatività.'));e['address']=by[key]['address']
 if key in loc:e['note']=g['records'][key]['note']
report={'version':'7.11','baseline_commit':BASE,'checked_at':DATE,'scope':'Primo ciclo geografico e operativo; copertura non esaustiva.','reconnaissance':P['reconnaissance'],'summary':g['summary'],'operational_records_reviewed':len(revisions),'records_with_field_changes':len(changedkeys),'records_confirmed_without_field_change':len(confirmedkeys),'fields_compared':len(fieldchanges),'fields_changed':sum(x['changed'] for x in fieldchanges),'field_changes':fieldchanges,'new_positions':P['pins'],'queue_review':triage,'clinical_review':False,'telephone_confirmation':False,'physical_entrances_verified':0,'availability_checked':False,'existing_C_records_rechecked_completely':False,'exclusions':'Scartati centri di inquadratura delle mappe, indirizzi di sede legale e collegamenti a destinazioni incoerenti. Nessun punto comunale usato per rappresentare una sede.'}
jsave('downloads/Audit_Geografia_Operativo_V7_11.json',report)
jsave('downloads/Fonti_V7_11.json',{'version':'7.11','sources':P['sources'],'osm_extract':P['osm_extract'],'new_positions':P['pins'],'source_date_policy':P['reconnaissance']['source_date_policy'],'license_note':'Oggetti e geometrie OpenStreetMap: ODbL-1.0, © OpenStreetMap contributors. Le altre evidenze sono attribuite alle singole fonti primarie; nessuna licenza viene attribuita a testi di terzi.'})
with (R/'downloads/Coda_Geografia_V7_11.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f,delimiter=';');w.writerow(['service_key','denominazione','comune','indirizzo','livello','nota','fonti'])
 for e in triage:
  key=e['key']
  if key not in loc:
   r=by[key];p=g['records'][key];w.writerow([key,r['name'],r['town'],r['address'],p['quality'],p['note'],' | '.join(r['sources'])])
md=f'''# V7.11 — primo ciclo geografia e informazioni operative

Baseline: `{BASE}` (V7.10.3). Consultazione: {DATE}.

## Risultati

443 servizi clinici invariati. **330 localizzati, 113 senza pin**, rispetto a 315/128.
15 nuovi punti: 13 edifici/presidi indicativi, un civico corroborato e una breve via. **Zero ingressi fisici verificati**.
I 315 punti precedenti sono conservati; questa fase non riesamina integralmente i 288 precedenti record C.

30 schede riesaminate per campi selezionati: {len(changedkeys)} con almeno una modifica e {len(confirmedkeys)} con riscontro senza variazione dei valori. {len(fieldchanges)} campi confrontati, {sum(x['changed'] for x in fieldchanges)} valori o note aggiornati. Le date originarie, il regime SSN, l’accreditamento e i posti non sono stati riscritti.

## Copertura e limiti

Ricognizione degli URL per tutte le 128 schede inizialmente senza pin: 93 URL, 68 risposte HTTP 200. È un controllo tecnico/documentale preliminare, **non una verifica manuale completa di 128 sedi**. I 24 casi con coordinate candidate non sono stati promossi automaticamente.
Le nuove posizioni derivano da destinazioni pubblicate nelle pagine dei servizi oppure da oggetti OSM nominativi/indirizzi coerenti nell’estratto regionale del 25/09/2026. Incertezze e precisione sono registrate per punto.
Un riferimento a edificio/complesso non certifica stanza, accesso o operatività. La data di consultazione non rende corrente un documento datato e non certifica orari effettivi, posti disponibili o risposta telefonica.

## Casi mantenuti aperti

Scartati collegamenti cartografici del gestore diretti a una tabaccheria a Castel Madama e a una falesia a Rocca Canterano. Le relative strutture rimangono senza pin, non sono dichiarate chiuse.
Non estesa la sede centrale di Mondo Nuovo a tutte le comunità. Conservata l’incertezza del record San Carlo/Villa Santa Francesca Romana; la fonte della sola San Carlo non risolve l’identità dell’intera scheda.
Per il centro DNA Rieti rimane un conflitto fra la sede precedente e un avviso datato per un Open Day: nessun trasferimento definitivo viene dedotto.

## Integrità

Supporto territoriale V7.10, Menta e percorso studenti V7.10.3 invariati. Nessun tracking, geolocalizzazione dispositivo, geocoder live o download automatico di tasselli. Noindex conservato.
Gli esiti dei nuovi test e del deploy sono registrati separatamente in GitHub Actions, non dedotti da verifiche delle versioni precedenti.

Dati geografici OSM: © OpenStreetMap contributors, ODbL-1.0. Fonti puntuali e metodi in `Fonti_V7_11.json`.
'''
write('downloads/Report_Geografia_V7_11.md',md);write('downloads/Release_Notes_V7_11.md',md)
s=old('documenti.html');section='<section class="callout" id="release-v711"><h2>V7.11 · geografia e informazioni operative</h2><p>443 servizi; 330 localizzati, 113 senza pin. Quindici nuovi punti documentali e trenta schede riesaminate per campi selezionati; nessun ingresso fisico o posto disponibile verificato.</p><p><a href="/downloads/Report_Geografia_V7_11.md">Report e limiti</a> · <a href="/downloads/Audit_Geografia_Operativo_V7_11.json">Audit per campo</a> · <a href="/downloads/Fonti_V7_11.json">Fonti e metodi</a> · <a href="/downloads/Coda_Geografia_V7_11.csv">113 casi geografici aperti</a></p></section>'
write('documenti.html',swap(s,'</main>',section+'</main>'))
write('CHANGELOG.md','## 7.11 — 2026-09-26\n\n- Primo ciclo geografia: 443 servizi invariati, 330 localizzati e 113 senza pin; 15 nuovi punti, zero ingressi fisici verificati.\n- 30 riesami operativi per campi selezionati; ricognizione degli URL distinta dalla validazione di sede.\n- Contatti e indirizzi privati sincronizzati fra ricerca e directory; classificazioni amministrative invariate.\n- Scartate destinazioni cartografiche incoerenti; incertezze conservate.\n- Menta, studenti, supporto territoriale e noindex invariati.\n\n'+old('CHANGELOG.md'))
write('README.md','# Versione corrente V7.11\n\nPrimo ciclo geografia e audit per campo: **443 servizi clinici, 330 localizzati, 113 senza pin**. Quindici nuove localizzazioni documentali, trenta schede riesaminate e nessun ingresso fisico verificato. Il controllo degli URL delle 128 schede iniziali non equivale alla loro validazione completa.\n\nReport corrente: `downloads/Report_Geografia_V7_11.md`; audit: `downloads/Audit_Geografia_Operativo_V7_11.json`.\n\nCheckpoint: `checkpoint-v7-10-3-before-v711-2026-09-26` → `'+BASE+'`. Menta, percorso studenti e supporto territoriale conservati.\n\n## Cronologia delle edizioni precedenti\n\n'+old('README.md').replace('## Versione corrente','## Edizione precedente'))
v=json.loads(old('version.json'));v.update(web_version='7.11',data_extension_version='7.11',built_at=DATE,map_version='7.11',audit_version='7.11',baseline_commit=BASE,release_note='V7.11: 15 nuove localizzazioni documentali e 30 riesami per campo; 443 servizi, 330 localizzati e 113 senza pin. Nessun ingresso fisico verificato; Menta, studenti e supporto territoriale invariati.')
v['map'].update(localized=330,unlocated=113,address_geocoded=65,street_approximate=229,building_approximate=36,quality=quality,entrances_verified=0)
v['v7_11_verification']={'workflow':'.github/workflows/verify-v7-11.yml','baseline_commit':BASE,'scope':'Nuovi test di dati, integrità, browser e confronto byte di produzione; esiti da consultare nel run del commit effettivamente pubblicato.'}
v['v7_11_audit']={'report':'downloads/Audit_Geografia_Operativo_V7_11.json','url_reconnaissance_records':128,'operational_records_reviewed':30,'records_with_field_changes':len(changedkeys),'records_confirmed_without_field_change':len(confirmedkeys),'new_locations':15,'remaining_unlocated':113,'complete':False}
jsave('version.json',v)
# Adapt the previous full browser suite to the new current geography only.
s=old('tools/test-ui-v7-10-2.mjs').replace('presidi_geo_v7_9_4.json','presidi_geo_v7_11.json')
s=s.replace('443 / 315 / 128','443 / 330 / 113').replace('/315 localizzati/','/330 localizzati/').replace('/128 senza posizione/','/113 senza posizione/').replace('points:315','points:330').replace("version:'7.10.2'","version:'7.11'")
s=s.replace('/complesso ospedaliero/i','/edificio|presidio|complesso ospedaliero/i')
write('tools/test-ui-v7-11.mjs',s)
# Prior release workflow remains available for historical manual runs, not on new releases.
w=old('.github/workflows/verify-v7-10.yml')
w=re.sub(r'\non:\n[\s\S]*?\npermissions:', '\non:\n  workflow_dispatch:\npermissions:',w,count=1)
w=w.replace('name: V7.10.3 consolidated verification','name: V7.10.3 historical verification (manual)')
write('.github/workflows/verify-v7-10.yml',w)
print(json.dumps({'version':'7.11','services':len(rows),'localized':len(loc),'unlocated':len(rows)-len(loc),'quality':quality,'precision':dict(precision),'field_changes':sum(x['changed'] for x in fieldchanges),'compared_fields':len(fieldchanges),'changed_records':len(changedkeys),'unchanged_confirmations':len(confirmedkeys)},ensure_ascii=False))
