"""Deterministic V7.11.1 build from manually approved, attributed decisions.
No network; no geocoding; no automatic coordinate matching or promotion.
Reproduce from git baseline, or V7111_BASE_DIR pointing to its exact checkout.
"""
from pathlib import Path
from collections import Counter
import os,json,copy,csv,re,hashlib,subprocess,tempfile
R=Path(__file__).resolve().parents[1]
P=json.loads((R/'research/v7_11_1/approved.json').read_text())
BASE=P['baseline_commit'];DATE=P['checked_at'];VER='7.11.1'
assert BASE=='791f21cf12724ff3441492d39b6d77b4bcb36589'
assert len(P['pins'])==14 and len(P['revisions'])==23
B=Path(os.environ['V7111_BASE_DIR']) if os.environ.get('V7111_BASE_DIR') else None
outputs=[]
def oldbytes(path):
 if B:return (B/path).read_bytes()
 return subprocess.check_output(['git','show',BASE+':'+path],cwd=R)
def old(path):return oldbytes(path).decode('utf-8')
def write(path,text):
 p=R/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text,encoding='utf-8');outputs.append(path)
def jsave(path,data):write(path,json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def swap(s,a,b,n=1):
 assert s.count(a)==n,(a[:100],s.count(a),n)
 return s.replace(a,b)
paths=[str(p.relative_to(B)) for p in B.rglob('*') if p.is_file()] if B else subprocess.check_output(['git','ls-tree','-r','--name-only',BASE],cwd=R,text=True).splitlines()
protected={p:hashlib.sha256(oldbytes(p)).hexdigest() for p in paths if p.startswith(('data/','downloads/','assets/'))}
jsave('downloads/Integrita_Baseline_V7_11_1.json',{'baseline_commit':BASE,'sha256':protected,'scope':'Tutti i file preesistenti data/downloads/assets conservati byte per byte; V7.11.1 è aggiuntiva.'})
revisions=[]
for e in P['revisions']:
 docs=[P['sources'][k] for k in e['sources']];urls=[d['url'] for d in docs]
 revisions.append({'service_key':e['key'],'origin':e['key'].split(':')[0],'checked_at':DATE,'scope':'Riesame mirato dei soli campi o delle note indicati, non nuova validazione integrale del servizio. Nessuna telefonata, ingresso, disponibilità o revisione clinica.','status':e['status'],'note':e['note'],'fields':e['fields'],'sources':urls,'source_documents':docs,'evidence':{k:{'sources':urls,'source_documents':docs,'checked_at':DATE,'basis':'Decisione documentale manuale; eventuale evidenza ereditata esplicitamente identificata nei documenti fonte.'} for k in e['fields']}})
jsave('data/audit_operativo_v7_11_1.json',{'version':VER,'baseline_commit':BASE,'checked_at':DATE,'revisions':revisions,'additions':[],'method':'Nuove localizzazioni indicative e segnalazione di conflitti; nessun trasferimento o orario di accesso dedotto da informazioni generiche.'})
adapter=old('assets/audit-data-v7-11.js').replace('V7.11','V7.11.1').replace("'7.11'","'7.11.1'").replace('v711','v7111').replace('LazioAudit711','LazioAudit7111')
write('assets/audit-data-v7-11-1.js',adapter)
export=old('tools/export-current-v7-11.cjs')
export=swap(export,"'audit-data-v7-11']","'audit-data-v7-11','audit-data-v7-11-1']")
export=swap(export,'const rows=sandbox.LazioServices.build',"sandbox.LazioAudit7111.set(read('data/audit_operativo_v7_11_1.json'));\nconst rows=sandbox.LazioServices.build")
write('tools/export-current-v7-11-1.cjs',export.replace('/tmp/current-rows-v711.json','/tmp/current-rows-v7111.json'))
with tempfile.TemporaryDirectory() as t:
 before=Path(t)/'before.json';after=Path(t)/'after.json'
 subprocess.run(['node','tools/export-current-v7-11.cjs',str(before)],cwd=R,check=True)
 subprocess.run(['node','tools/export-current-v7-11-1.cjs',str(after)],cwd=R,check=True)
 oldrows=json.loads(before.read_text());rows=json.loads(after.read_text())
by={r['key']:r for r in rows};oldby={r['key']:r for r in oldrows};assert len(by)==len(rows)==443
assert set(by)==set(oldby)
g=copy.deepcopy(json.loads(old('data/presidi_geo_v7_11.json')));prior=copy.deepcopy(g['records'])
oldlocated={k for k,p in prior.items() if p.get('lat') is not None};assert len(oldlocated)==330
for p in P['pins']:
 key=p['key'];assert key in by and key not in oldlocated and p['quality']=='C'
 assert 40.7<p['lat']<42.95 and 11.3<p['lng']<14.1
 g['records'][key]={k:copy.deepcopy(v) for k,v in p.items() if k not in ['key','source','evidence']}
 g['records'][key].update(service_key=key,checked_at=DATE,source_address=by[key]['address'],source_town=by[key]['town'],comune=by[key]['town'],entrance_verified=False,address_source_url=P['sources'][p['source']]['url'],evidence_ref='downloads/Fonti_V7_11_1.json#'+key)
for e in revisions:
 key=e['service_key'];p=g['records'][key]
 if p.get('lat') is None:
  p['source_address']=by[key]['address'];p['source_town']=by[key]['town']
  if 'nota_geografia_v7111' in e['fields']:p['note']=e['fields']['nota_geografia_v7111']
  elif 'nota_indirizzo' in e['fields']:p['note']=e['fields']['nota_indirizzo']
loc={k for k,p in g['records'].items() if p.get('lat') is not None};assert len(loc)==344
assert all(g['records'][k]==prior[k] for k in oldlocated)
quality=dict(Counter(p['quality'] for p in g['records'].values()));precision=Counter(p['precision'] for p in g['records'].values())
g.update(version=VER,baseline_commit=BASE,generated_at=DATE,summary={'services_before':443,'services_after':443,'located_before':330,'located_after':344,'unlocated_before':113,'unlocated_after':99,'address_after':precision['address'],'street_after':precision['street'],'building_after':precision['building'],'quality_counts':quality,'newly_localized_existing':[x['key'] for x in P['pins']],'new_service_localized':[],'entrances_verified':0,'nominatim_requests_this_release':0},method_note='V7.11.1: 14 servizi prima senza pin ora localizzati in modo indicativo, tutti C: 8 a livello di edificio/presidio, 6 su brevi vie. Dieci coordinate distinte, non 14 nuove sedi. Nessun civico o ingresso certificato. Tutti i 330 punti precedenti conservati.',source_extract=P['osm_extract'])
jsave('data/presidi_geo_v7_11_1.json',g)
s=old('assets/servizi-v7-11.js')
s=swap(s,'current4,current711]=','current4,current711,current7111]=')
s=swap(s,"getJSON('/data/audit_operativo_v7_11.json')","getJSON('/data/audit_operativo_v7_11.json'),\n    getJSON('/data/audit_operativo_v7_11_1.json')")
s=swap(s,"if(current711.status==='fulfilled')window.LazioAudit711.set(current711.value);","if(current711.status==='fulfilled')window.LazioAudit711.set(current711.value);\n  if(current7111.status==='fulfilled')window.LazioAudit7111.set(current7111.value);")
s=swap(s,"&&current711.status==='fulfilled')$('svc-load-status').hidden=true;","&&current711.status==='fulfilled'&&current7111.status==='fulfilled')$('svc-load-status').hidden=true;")
s=swap(s,"if(current711.status!=='fulfilled')missing.push('le correzioni operative V7.11 (dati precedenti da riconfermare)');","if(current711.status!=='fulfilled')missing.push('le correzioni operative V7.11 (dati precedenti da riconfermare)');\n    if(current7111.status!=='fulfilled')missing.push('le precisazioni operative V7.11.1 (conflitti e dati precedenti da riconfermare)');")
s=swap(s,"body+=sourceLinks(r.sources);","if(r.v7111)body+=section('Riesame mirato V7.11.1',field('Campi o note riesaminati',r.v7111.fields.join(', '),true)+field('Data di consultazione',r.v7111.checked_at)+field('Ambito e limiti',r.v7111.scope,true)+field('Note',r.v7111.note,true)+field('Precisazioni geografiche',v.nota_geografia_v7111,true)+field('Precisazioni sui contatti',v.nota_contatti_v7111,true));\n  body+=sourceLinks(r.sources);")
write('assets/servizi-v7-11-1.js',s)
s=old('assets/map-data-v7-11.js').replace('/data/presidi_geo_v7_11.json','/data/presidi_geo_v7_11_1.json')
s=swap(s,"'/data/audit_operativo_v7_11.json']","'/data/audit_operativo_v7_11.json','/data/audit_operativo_v7_11_1.json']")
s=swap(s,'  return {data,rows:A.build',"  if(result[10].status==='fulfilled')root.LazioAudit7111.set(result[10].value);else missing.push('precisazioni V7.11.1: conflitti e dati precedenti da riconfermare');\n  return {data,rows:A.build")
write('assets/map-data-v7-11-1.js',s)
s=old('assets/map-v7-9-1.js')
s=swap(s,"group.length+' servizi in questa posizione'","group.length+' servizi raggruppati sulla mappa'")
s=swap(s,"Sedi vicine o servizi nello stesso edificio: ogni servizio resta distinto.","Il raggruppamento può dipendere dalla scala o da una posizione indicativa sulla via: non certifica che i servizi siano nello stesso edificio. Ogni servizio resta distinto.")
s=swap(s,"    if(p.note)section.append(element('p',p.note,{class:'micro'}));", "    if(row.raw?.nota_geografia_v7111 && row.raw.nota_geografia_v7111!==p.note)section.append(element('p',row.raw.nota_geografia_v7111,{class:'micro'}));")
# p.note is already displayed once in the cartographic-check line: avoid duplicating it.
write('assets/map-v7-11-1.js',s)
s=old('assets/directory-v7-11.js')
s=swap(s,'var extraSources=',"var v7111Source=fetch('/data/audit_operativo_v7_11_1.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Audit V7.11.1 non caricato');return r.json()});\nvar extraSources=")
s=swap(s,'v794Source,v711Source]','v794Source,v711Source,v7111Source]')
s=swap(s,'audit=x[x.length-6],current=x[x.length-5],latest=x[x.length-4],v793=x[x.length-3],v794=x[x.length-2],v711=x[x.length-1],additional=x.slice(2,-6)','audit=x[x.length-7],current=x[x.length-6],latest=x[x.length-5],v793=x[x.length-4],v794=x[x.length-3],v711=x[x.length-2],v7111=x[x.length-1],additional=x.slice(2,-7)')
s=swap(s,'rows=window.LazioAudit711.directory(c,rows,v711);init(rows)','rows=window.LazioAudit711.directory(c,rows,v711);rows=window.LazioAudit7111.directory(c,rows,v7111);init(rows)')
write('assets/directory-v7-11-1.js',s)
for path in ['servizi.html','archivio.html','mappa.html','strutture-approfondite.html','privati.html']:
 s=old(path)
 pattern=r'(<script[^>]*src="/assets/audit-data-v7-11.js"[^>]*></script>)';assert len(re.findall(pattern,s))==1
 defer=' defer' if path in ['servizi.html','archivio.html','mappa.html'] else ''
 s=re.sub(pattern,r'\1<script'+defer+' src="/assets/audit-data-v7-11-1.js"></script>',s)
 if path in ['servizi.html','archivio.html']:s=swap(s,'src="/assets/servizi-v7-11.js"','src="/assets/servizi-v7-11-1.js"')
 if path=='mappa.html':
  s=swap(s,'src="/assets/map-data-v7-11.js"','src="/assets/map-data-v7-11-1.js"').replace('/data/presidi_geo_v7_11.json','/data/presidi_geo_v7_11_1.json')
  s=swap(s,'src="/assets/map-v7-9-1.js"','src="/assets/map-v7-11-1.js"')
 if path in ['strutture-approfondite.html','privati.html']:
  s=swap(s,'/assets/directory-v7-11.js','/assets/directory-v7-11-1.js')
  m=re.search(r'window.V75_CONFIG=(\{.*?\});</script>',s);assert m
  cfg=json.loads(m[1]);cfg['fields']+=['nota_contatti_v7111','nota_geografia_v7111','riesame_v7111','fonti_v7111','note_v7111'];cfg['fields']=list(dict.fromkeys(cfg['fields']))
  cfg.setdefault('fieldLabels',{}).update(riesame_v7111='Riesame mirato V7.11.1',fonti_v7111='Fonti delle precisazioni',note_v7111='Limiti e conflitti',nota_geografia_v7111='Precisazione geografica corrente',nota_contatti_v7111='Precisazione sui contatti corrente')
  s=s[:m.start(1)]+json.dumps(cfg,ensure_ascii=False,separators=(',',':'))+s[m.end(1):]
  if path=='strutture-approfondite.html':s=s.replace('riesami cumulativi fino alla V7.11;','riesami cumulativi fino alla V7.11.1;').replace('Riesame V7.11 per campi selezionati:','Riesame V7.11.1 per campi selezionati:')
 write(path,s)
fieldchanges=[]
for e in revisions:
 for k,value in e['fields'].items():
  previous=oldby[e['service_key']]['raw'].get(k)
  fieldchanges.append({'key':e['service_key'],'field':k,'before':previous,'after':value,'changed':previous!=value,'sources':e['sources'],'source_documents':e['source_documents']})
queue=[];initial=[k for k,p in prior.items() if p.get('lat') is None];assert len(initial)==113
notes={e['service_key']:e['note'] for e in revisions}
for key in initial:
 r=by[key];p=g['records'][key]
 queue.append({'key':key,'name':r['name'],'address':r['address'],'town':r['town'],'status':'localizzazione_indicativa' if key in loc else 'ancora_senza_pin','decision_in_this_release':key in notes,'note':p.get('note',''),'remaining_work':'Confermare civico e ingresso' if key in loc else 'Ulteriore riscontro puntuale: assenza di pin non equivale a chiusura del servizio.'})
report={'version':VER,'baseline_commit':BASE,'checked_at':DATE,'scope':'Secondo ciclo mirato; il conteggio delle schede comprende precisazioni geografiche e conflitti, non 23 verifiche integrali di operatività.','summary':g['summary'],'records_with_targeted_decisions':len(revisions),'fields_or_notes_compared':len(fieldchanges),'fields_or_notes_changed':sum(x['changed'] for x in fieldchanges),'new_coordinates_distinct':len({(p['lat'],p['lng']) for p in P['pins']}),'field_changes':fieldchanges,'new_positions':P['pins'],'queue_review':queue,'reconnaissance':P['reconnaissance'],'acquisition_log':P['acquisition_log'],'excluded_candidates':P['excluded_candidates'],'clinical_review':False,'telephone_confirmation':False,'physical_entrances_verified':0,'availability_checked':False,'existing_C_records_rechecked_completely':False,'complete':False}
jsave('downloads/Audit_Geografia_Operativo_V7_11_1.json',report)
jsave('downloads/Fonti_V7_11_1.json',{'version':VER,'sources':P['sources'],'osm_extract':P['osm_extract'],'new_positions':P['pins'],'exclusions':P['excluded_candidates'],'source_date_policy':'Date dichiarate dalle pagine distinte dalla consultazione. Evidenze Rieti ereditate dalla baseline e identificate come tali; non nuova verifica del PDF né degli orari.','license_note':'Oggetti e geometrie OpenStreetMap: ODbL-1.0, © OpenStreetMap contributors. Le altre evidenze sono attribuite alle singole fonti primarie; nessuna licenza viene attribuita a testi di terzi.'})
with (R/'downloads/Coda_Geografia_V7_11_1.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f,delimiter=';');w.writerow(['service_key','denominazione','comune','indirizzo','livello','nota','fonti'])
 for key in initial:
  if key not in loc:
   r=by[key];p=g['records'][key];w.writerow([key,r['name'],r['town'],r['address'],p['quality'],p.get('note',''),' | '.join(r['sources'])])
outputs.append('downloads/Coda_Geografia_V7_11_1.csv')
md=f'''# V7.11.1 — secondo ciclo geografico e chiarimento dei conflitti

Baseline: `{BASE}` (V7.11). Consultazione: {DATE}.

## Risultati e precisione

443 servizi clinici invariati; **344 localizzati e 99 senza pin**, prima 330/113.
**14 servizi** ricevono una nuova localizzazione indicativa di qualità C: **8 edifici/presidi e 6 brevi vie**, corrispondenti a **10 coordinate distinte**. Non sono 14 nuove strutture. Nessun nuovo civico certificato e **zero ingressi fisici verificati**.
Conservati integralmente i 330 punti precedenti. Le vie sono tratti nominativi selezionati manualmente nel comune corretto, tutti inferiori a 600 m. La loro posizione non identifica un civico.

## Decisioni documentali

**23 schede** con note o campi riesaminati in modo mirato; {len(fieldchanges)} campi/note confrontati e {sum(x['changed'] for x in fieldchanges)} aggiornati. La maggioranza sono precisazioni geografiche: non rappresentano 23 verifiche integrali di contatti, orari o operatività.

- CSM Boccea: reso esplicito il contrasto sull'orario del sabato fra pagina del presidio (12/08/2026) e rubrica DSM (19/06/2026).
- CSM Innocenzo IV: civici 16/B e 16/d e orari discordanti conservati come conflitto, non risolti scegliendo arbitrariamente una fonte.
- DNA Frosinone: la medesima pagina (07/08/2026) indica Fabi/Palazzina L e, nei contatti, Viale Mazzini/ex ospedale. Nessun trasferimento dedotto; resta senza pin.
- Maieusis: distinti residenza Capena, centro diurno Fiano e sede in calce. Nessuna attribuzione automatica della sede legale.
- Samadi: orari generici dei contatti non usati per sovrascrivere quelli specifici dell'accettazione o per definire l'assistenza residenziale.
- Villa Licia: scartato il collegamento del gestore che porta a Roccasecca invece di Itri. Il punto precedente a Itri è conservato, non nuovamente certificato.
- Monteverde: ignorato il collegamento non coerente verso Catacombe di Generosa; localizzata solo la breve via documentata nel testo.

## Punti condivisi e fonti ereditate

Exodus Cassino e Borgo San Tommaso mantengono distinti i rispettivi moduli. L'oggetto OSM nominativo Exodus sostiene solo il presidio indicativo, non il civico 23. Per Poggio Mirteto la relazione CSM/SerD con il poliambulatorio deriva dall'audit precedente: le nuove richieste al sito ASL non sono riuscite e non vengono presentate come una riconferma corrente.
I due servizi Viterbo di Via Romiti hanno civici diversi (86 e 54): il pin stradale condiviso non implica lo stesso edificio. I raggruppamenti della mappa ora esplicitano questo limite.

## Lavoro residuo e integrità

Restano **99 servizi senza pin**. La coda originaria di 113 è tracciata, ma non si dichiara un nuovo controllo manuale completo di tutte le sedi né di tutti i precedenti punti C.
Menta, studenti, università, consultori/PUA/PIS, indicizzazione e classificazioni sanitarie restano invariati. Nessuna telefonata, disponibilità, ingresso fisico o revisione clinica verificati.
Tutti i vecchi dati, download e asset sono conservati byte per byte. Checkpoint: `checkpoint-v7-11-before-v7111-2026-09-26`.
Le verifiche del candidato e della produzione sono distinte: esiti nel workflow del commit effettivo, non ereditati da release precedenti.

Cartografia derivata OpenStreetMap: © OpenStreetMap contributors, ODbL-1.0. Evidenze puntuali in `Fonti_V7_11_1.json`.
'''
write('downloads/Report_Geografia_V7_11_1.md',md);write('downloads/Release_Notes_V7_11_1.md',md)
s=old('documenti.html');section='<section class="callout" id="release-v7111"><h2>V7.11.1 · secondo ciclo geografico e conflitti di sede</h2><p>443 servizi; 344 localizzati e 99 senza pin. Quattordici nuove localizzazioni indicative, non ingressi verificati; note o campi riesaminati su 23 schede. I pin sulla stessa via non certificano lo stesso edificio.</p><p><a href="/downloads/Report_Geografia_V7_11_1.md">Report e limiti</a> · <a href="/downloads/Audit_Geografia_Operativo_V7_11_1.json">Audit delle decisioni</a> · <a href="/downloads/Fonti_V7_11_1.json">Fonti e precisione</a> · <a href="/downloads/Coda_Geografia_V7_11_1.csv">99 casi aperti</a></p></section>'
write('documenti.html',swap(s,'</main>',section+'</main>'))
write('CHANGELOG.md','## 7.11.1 — '+DATE+'\n\n- Secondo ciclo mirato: 443 servizi invariati, 344 localizzati, 99 senza pin. Quattordici nuove localizzazioni C: 8 edifici/presidi e 6 brevi vie. Zero ingressi verificati.\n- Note o campi riesaminati su 23 schede: conflitti di orario, civici e collegamenti incongruenti esplicitati.\n- Raggruppamenti sulla mappa distinti dalla coincidenza fisica di sede.\n- Conservati dati/asset precedenti, Menta, studenti, supporto territoriale, noindex e classificazioni amministrative.\n\n'+old('CHANGELOG.md'))
write('README.md','# Versione corrente V7.11.1\n\n**443 servizi, 344 localizzati, 99 senza pin**. Secondo ciclo mirato: 14 localizzazioni indicative C e precisazioni su 23 schede; nessun ingresso verificato e nessun censimento dichiarato completo.\n\nReport: `downloads/Report_Geografia_V7_11_1.md`; audit: `downloads/Audit_Geografia_Operativo_V7_11_1.json`; protezione: `downloads/Integrita_Baseline_V7_11_1.json`.\n\nCheckpoint: `checkpoint-v7-11-before-v7111-2026-09-26` → `'+BASE+'`.\n\n## Edizioni precedenti\n\n'+old('README.md').replace('# Versione corrente V7.11','# Edizione precedente V7.11',1))
v=json.loads(old('version.json'));v.update(web_version=VER,data_extension_version=VER,built_at=DATE,map_version=VER,audit_version=VER,baseline_commit=BASE,release_note='V7.11.1: 14 nuove localizzazioni indicative C e precisazioni mirate su 23 schede; 443 servizi, 344 localizzati, 99 senza pin. Nessun ingresso verificato; Menta, studenti e supporto territoriale invariati.')
v['map'].update(localized=len(loc),unlocated=443-len(loc),address_geocoded=precision['address'],street_approximate=precision['street'],building_approximate=precision['building'],quality=quality,entrances_verified=0)
v['v7_11_1_verification']={'workflow':'.github/workflows/verify-v7-11-1.yml','baseline_commit':BASE,'scope':'Test nuovi di provenienza, dati, integrità e browser; esiti di produzione da leggere nel run del commit effettivo.'}
v['v7_11_1_audit']={'report':'downloads/Audit_Geografia_Operativo_V7_11_1.json','initial_queue':113,'records_with_targeted_decisions':len(revisions),'new_locations':14,'distinct_new_coordinates':10,'remaining_unlocated':99,'complete':False}
jsave('version.json',v)
s=old('tools/test-ui-v7-11.mjs').replace('presidi_geo_v7_11.json','presidi_geo_v7_11_1.json').replace('443 / 330 / 113','443 / 344 / 99').replace('/330 localizzati/','/344 localizzati/').replace('/113 senza posizione/','/99 senza posizione/').replace('points:330','points:344').replace("version:'7.11'","version:'7.11.1'")
write('tools/test-ui-v7-11-1.mjs',s)
w=old('.github/workflows/verify-v7-11.yml');w=re.sub(r'\non:\n[\s\S]*?\npermissions:', '\non:\n  workflow_dispatch:\npermissions:',w,count=1).replace('name: V7.11 geography and operational verification','name: V7.11 historical verification (manual)')
write('.github/workflows/verify-v7-11.yml',w)
# This local manifest is consumed by the branch build, not shipped as a data claim.
write('research/v7_11_1/generated-files.json',json.dumps(sorted(outputs),indent=2)+'\n')
print(json.dumps({'version':VER,'services':len(rows),'localized':len(loc),'unlocated':443-len(loc),'quality':quality,'precision':dict(precision),'changed_fields_or_notes':sum(x['changed'] for x in fieldchanges),'targeted_records':len(revisions),'protected_files':len(protected)},ensure_ascii=False))
