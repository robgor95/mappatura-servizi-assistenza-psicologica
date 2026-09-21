"""Current reports and tests. All prior data/downloads/overlays remain byte-identical."""
from pathlib import Path
import json,subprocess,hashlib,re,collections,csv,unicodedata,sys
R=Path(__file__).resolve().parents[1];BASE='498195783ca07dff14dd4f3640e7e2fae3598e06';D='2026-09-22'
def read(p):return json.loads((R/p).read_text())
def out(p,x):(R/p).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n')
a=read('data/audit_operativo_v7_9.json');g=read('data/presidi_geo_v7_9.json');s=g['summary'];rows=json.loads(Path('/tmp/current-rows-v79.json').read_text());baseline=json.loads(Path('/tmp/baseline-rows.json').read_text());by={r['key']:r for r in rows}
for source in a['sources']:
 if 'aslroma' in source['url']:source['kind']='asl'
 if 'italianhospitalgroup.it' in source['url']:source['verification']='tentativo non riuscito; fonte non acquisita, nessun aggiornamento operativo'
out('data/audit_operativo_v7_9.json',a)
allowed={'README.md','CHANGELOG.md','version.json','servizi.html','archivio.html','mappa.html','strutture-approfondite.html','documenti.html'}
oldfiles=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE],cwd=R,text=True).splitlines();hashes={};bad=[]
for p in oldfiles:
 data=subprocess.check_output(['git','show',BASE+':'+p],cwd=R);h=hashlib.sha256(data).hexdigest();hashes[p]={'sha256':h,'bytes':len(data)}
 if p not in allowed and (not (R/p).exists() or hashlib.sha256((R/p).read_bytes()).hexdigest()!=h):bad.append(p)
assert not bad,('Historical bytes changed',bad)
checks=[]
def check(name,condition):
 checks.append({'name':name,'passed':bool(condition)});assert condition,name
check('432 baseline services preserved; 8 additions; unique service keys',len(baseline)==432 and len(rows)==440 and len(by)==440 and {r['key'] for r in baseline}<=set(by))
check('Geography covers every runtime service',set(g['records'])==set(by))
check('Every coordinate keeps exact source address and municipality',all(p['source_address']==by[k]['address'] and p['source_town']==by[k]['town'] for k,p in g['records'].items()))
check('No municipal centroids for D/E and no entrance verification claims',all(p['entrance_verified'] is False and ((p['lat'] is None and p['lng'] is None) if p['quality'] in ['D','E'] else isinstance(p['lat'],float) and isinstance(p['lng'],float)) for p in g['records'].values()))
check('A/B have field-specific documentary evidence',all(p['address_checked_at'] and p['address_source_url'] for p in g['records'].values() if p['quality'] in ['A','B']))
check('Reverie four units and shared site preserved',sum('REVERIE'==r['raw'].get('ente_id') for r in rows)==4 and by['moduli:MS775-REV-CTC2']['raw']['struttura_id']==by['moduli:MS775-REV-CD']['raw']['struttura_id'])
check('Il Ponte three distinct services; no unsupported per-site SSN promotion',all(by[k]['ssn']=='da-verificare' for k in ['moduli:MOD-109','moduli:V79-PONTE-RES','moduli:V79-PONTE-COCCINELLA']))
check('FEBO and Villa Licia not promoted to accredited/contracted',all(by[k]['ssn']=='da-verificare' for k in ['moduli:V79-COOPERATE-FEBO','moduli:V79-GV-LICIA']))
check('All operational changes have source and per-field dates',all(e['sources'] and e['checked_at']==D and set(e['fields'])==set(e['field_evidence']) for e in a['revisions']))
check('Clinical review and indexing remain disabled',read('version.json').get('clinical_review') is False and 'noindex' in (R/'_headers').read_text() and 'Sitemap:' not in (R/'robots.txt').read_text())
# Independent checks of geometry and documented operator identity.
from shapely.geometry import shape,Point
region=shape(read('downloads/Lazio_Boundary_OSM_V7_9.geojson'))
check('All published pins lie in cached Lazio polygon',all(region.covers(Point(p['lng'],p['lat'])) for p in g['records'].values() if p['lat'] is not None))
check('Il Ponte shared site retains both service identities',all(g['records']['moduli:V79-PONTE-RES'][k]==g['records']['moduli:V79-PONTE-COCCINELLA'][k] for k in ['lat','lng']))
check('Additions reuse documented operator identity',all(by[new]['raw']['ente_id']==by[old]['raw']['ente_id'] for new,old in [('moduli:V79-PONTE-RES','moduli:MOD-109'),('moduli:V79-COOPERATE-FEBO','moduli:MOD-108'),('moduli:V79-GV-LICIA','moduli:MOD-094')]))
groups=collections.defaultdict(list)
for key,p in g['records'].items():
 if p['lat'] is not None:groups[(p['lat'],p['lng'])].append(key)
shared=[]
for pos,keys in groups.items():
 if len(keys)<2:continue
 addresses=sorted({g['records'][k]['source_address'] for k in keys});towns=sorted({g['records'][k]['comune'] for k in keys})
 shared.append({'coordinates':list(pos),'service_keys':keys,'source_addresses':addresses,'municipalities':towns,'interpretation':'Coincidenza cartografica; indirizzi diversi non provano lo stesso edificio. Nessuna deduplicazione.' if len(addresses)>1 else 'Indirizzo condiviso; servizi distinti.'})
check('No coordinate shared across inconsistent municipalities',all(len(x['municipalities'])==1 for x in shared))
out('downloads/Coordinate_Condivise_V7_9.json',{'groups':shared,'policy':'I gruppi di via possono contenere civici diversi: approssimazione esplicita, non verifica della sede condivisa.'})
fields={}
for e in a['revisions']:
 for k,v in e['field_evidence'].items():
  f=fields.setdefault(k,{'reviewed':0,'text_changed':0,'service_keys':[]});f['reviewed']+=1;f['text_changed']+=int(v['changed']);f['service_keys'].append(e['service_key'])
def norm(v):return re.sub('[^a-z0-9]','',unicodedata.normalize('NFD',str(v or '')).encode('ascii','ignore').decode().lower())
def phones(v):
 v=re.sub(r'\([^)]*\)','',str(v or''));return sorted({re.sub(r'[^0-9]','',re.sub(r'^\+39','',m)) for m in re.findall(r'(?:\+39[\s.]*)?(?:0\d|3\d)[\d\s.\-]{5,}\d',v)})
for k,fn in [('telefono',phones),('indirizzo',norm),('email',norm)]:fields[k]['normalized_value_changed']=sum(fn(e['fields'][k])!=fn(e['field_evidence'][k]['previous_value']) for e in a['revisions'] if k in e['fields'])
ops={'cases_screened':len(a['operator_audits']),'cases_with_sources_acquired':11,'private_operator_groups_with_sources':10,'public_operator_samples':1,'unverified_attempts':1,'multisite_cases':9,'single_site_multiservice_cases':2,'new_distinct_services':8,'new_physical_addresses_documented':5,'new_modules_with_building_unresolved':2,'cases_with_pending_items':sum(bool(o['pending']) for o in a['operator_audits']),'existing_records_partially_reviewed':47,'new_records':8,'all_services_documentarily_reverified':False,'fields':fields,'source_count':len(a['sources']),'actual_calls':0,'site_visits':0,'closures_or_transfers_proven':0,'address_correction_not_transfer':['rete:NET-002'],'positive_new_ssn_contracts_proven':0}
out('downloads/Audit_Operativo_V7_9.json',{'version':'7.9','date':D,'baseline_commit':BASE,'summary':ops,'operator_audits':a['operator_audits'],'revisions':a['revisions'],'additions':a['additions'],'pending_conflicts':a['pending_conflicts'],'directory_policy':a['directory_policy']})
out('downloads/Audit_Iniziale_V7_9.json',{'baseline_commit':BASE,'baseline_files':hashes,'protected_paths':[p for p in oldfiles if p not in allowed],'allowed_current_entrypoints':sorted(allowed),'current_baseline_differences':[p for p in oldfiles if (R/p).exists() and hashlib.sha256((R/p).read_bytes()).hexdigest()!=hashes[p]['sha256']]})
# Inventory all non-ASL modules, keeping administrative identity unresolved when necessary.
reviewed={e['service_key'] for e in a['revisions']+a['additions']};inventory=[]
for r in rows:
 if r['origin']=='moduli' or r['type'] in ['SRSR','SRTR','STPIT','Centro diurno']:
  v=r['raw'];inventory.append({'service_key':r['key'],'operator_raw':v.get('gestore') or v.get('gestione') or 'Non documentato','operator_group_reviewed':v.get('ente_gruppo') or v.get('ente_id'),'site_id':v.get('struttura_id'),'name':r['name'],'type':r['type'],'municipality':r['town'],'address':r['address'],'review':'parziale V7.9' if r['key'] in reviewed else 'non riesaminato in questo ciclo','same_address_is_not_deduplication_key':True})
out('downloads/Inventario_Multisede_V7_9.json',{'method':'Inventario sistematico; non equivale a verifica documentale di tutti i gestori. Ragioni sociali grezze conservate, senza aggregazioni arbitrarie.','records':inventory})
source_index=Path('/tmp/v79-research/official-snapshots/index.json');out('downloads/Fonti_Verificate_V7_9.json',{'curated_sources':a['sources'],'snapshots':json.loads(source_index.read_text()) if source_index.exists() else [],'anncsu_attempt':{'url':'https://anncsu.open.agenziaentrate.gov.it/age-inspire/opendata/anncsu/getds.php?INDIR_LAZI=','outcome':'HTTP 406 nel tentativo documentato; dati non acquisiti e nessun pin creato da questa fonte'},'pdf_dates':'Nuovi Orizzonti: carta giugno 2021 anche se URL /2025/01/. Il Ponte: carta gennaio 2020; non usata per affermare contatti o disponibilità correnti.'})
with (R/'downloads/Coda_Geografia_V7_9.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['service_key','denominazione','comune','indirizzo','qualita','motivo','fonte'])
 for k,p in g['records'].items():
  if p['lat'] is None:w.writerow([k,by[k]['name'],p['comune'],p['source_address'],p['quality'],p['note'],p['address_source_url']])
geo='# Geografia V7.9 — '+D+'\n\nBaseline `'+BASE+'`. Tutti i servizi restano ricercabili, anche senza pin.\n\n| Misura | Prima | Dopo |\n|---|---:|---:|\n'
for label,before,after in [('Servizi',432,len(rows)),('Localizzati',195,s['located_after']),('Corrispondenza cartografica al civico',55,s['address_after']),('Posizione sulla via',140,s['street_after']),('Non localizzati',237,s['unlocated_after'])]:geo+=f'| {label} | {before} | {after} |\n'
geo+='\n## Qualità e limiti\n\n'+json.dumps(s,ensure_ascii=False,indent=2)+'\n\nLe 58 corrispondenze cartografiche al civico NON sono 58 ingressi verificati. Solo i record A hanno anche prova documentale per campo dell’indirizzo del servizio; C conserva esplicitamente l’incertezza. Nessun ingresso è stato verificato. B non assegnato senza riscontri sufficienti. D/E non producono pin.\n\n46 dei 237 record originali non localizzati hanno ora un pin, e 6 degli 8 nuovi servizi sono localizzati. 11 pin precedenti sono ritirati per ambiguità; rimangono nel confronto storico. Nessuna delle 140 posizioni precedentemente sulla via è stata promossa al civico in questo ciclo.\n\nMetodo: cache OSM, comune e strada coerenti, civico completo quando presente, controllo poligonale del Lazio, rigetto di vie troppo estese e candidati distanti. Nessun centroide comunale. La cache è riusata, non esistono richieste geocodifica nel browser. I tasselli sono caricati solo su attivazione volontaria.\n\n## Pin precedenti corretti o ritirati\n\n'
for t in g['transitions']:geo+='- `'+t['service_key']+'`: '+t['action']+'. '+t['reason']+'\n'
geo+='\nLe directory università, scuole, ascolto e helpline restano separate. La loro geografia non è stata ampliata: prima occorre distinguere sedi effettive, appuntamenti e destinatari.\n'
(R/'downloads/Report_Geografia_V7_9.md').write_text(geo)
text='# Audit multisede e operativo V7.9\n\nRiesame documentale parziale: 47 record esistenti, 8 nuovi servizi, 12 casi di gestore/gruppo. 11 casi con fonti consultabili, 1 tentativo non riuscito (IHG). Non è una verifica esaustiva di ogni servizio del Lazio. Nessuna chiamata, disponibilità attuale o visita fisica.\n\n'
for o in a['operator_audits']:
 text+='## '+o['operator']+'\n\n'+o['outcome']+'\n\nSedi documentate nel perimetro: '+str(o['documented_sites_in_scope'] or 'conteggio non consolidato')+'; servizi: '+str(o['documented_services_in_scope'])+'.\n\n'
 text+='Fonti: '+'; '.join(o['sources'])+'\n\n'
 if o['pending']:text+='Da verificare: '+'; '.join(o['pending'])+'\n\n'
text+='## Variazioni dei campi\n\nI valori cambiati includono precisazioni e normalizzazioni: non sono tutti nuovi numeri o trasferimenti.\n\n'+json.dumps(fields,ensure_ascii=False,indent=2)+'\n\nAutorizzato, accreditato e contrattualizzato SSN rimangono stati diversi. Per Il Ponte il dettaglio per sede resta pendente; i 24 posti precedenti non sono duplicati sulle nuove unità.\n'
(R/'downloads/Audit_Multisede_V7_9.md').write_text(text)
release='# V7.9 — Geografia e audit operativo\n\n'+D+' · baseline `'+BASE+'`\n\n440 servizi (+8); '+str(s['located_after'])+' localizzati, '+str(s['unlocated_after'])+' senza pin. 47 schede precedenti riesaminate solo per i campi documentati. 11 casi di gestore con riscontri, IHG pendente. Cinque nuovi indirizzi fisici documentati; Venere/Marte sono due servizi ulteriori ma il loro edificio esatto non è consolidato.\n\nReverie mantiene quattro servizi; Il Ponte mantiene traccia del record precedente e separa accoglienza, comunità e Coccinella. FEBO e Villa Licia non sono classificati come convenzionati. Corretto lo SPDC San Filippo Neri: non è prova di trasferimento.\n\nStorici, vecchi overlay e download conservati byte per byte. Noindex invariato; Leaflet locale; nessun geocoder, posizione dispositivo o tracking; tasselli su consenso.\n\nQuesta release non conclude l’audit di tutti i servizi o la geografia. Gli esiti tecnici effettivi sono in `Verifiche_V7_9.json`; la verifica di produzione è un controllo successivo al merge, registrato separatamente in GitHub Actions. VoiceOver reale non eseguito in ambiente Linux.\n'
(R/'downloads/Release_Notes_V7_9.md').write_text(release)
for name in ['README.md','CHANGELOG.md']:
 p=R/name;text=p.read_text();marker='## V7.9 — geografia e audit operativo'
 if marker not in text:p.write_text(marker+'\n\n'+release.split('\n\n',2)[2]+'\nReport: `downloads/Audit_Operativo_V7_9.json`, `downloads/Report_Geografia_V7_9.md`, `downloads/Verifiche_V7_9.json`.\n\n---\n\n'+text)
v=read('version.json');v.update(web_version='7.9',map_version='7.9',data_extension_version='7.9',built_at=D,audit_version='7.9',baseline_commit=BASE,indexing_enabled=False)
v['counts_current'].update(rete=298,moduli=125,privati=17,search=440,structure_directory=181,audit_additions=8)
v['map'].update(services=440,localized=s['located_after'],address_geocoded=s['address_after'],street_approximate=s['street_after'],unlocated=s['unlocated_after'],quality=s['quality_counts'],entrances_verified=0)
v['release_note']='Geografia ampliata con incertezza esplicita; audit documentale parziale, 47 revisioni e 8 servizi distinti. Storici preservati; noindex invariato.'
v['research_status']='parziale_per_campo_non_esaustivo';v['v7_9_verification']={'local_report':'downloads/Verifiche_V7_9.json','production_evidence':'GitHub Actions successivo al merge; non confondere i controlli V7.8 con quelli correnti.'}
out('version.json',v)
p=R/'documenti.html';text=p.read_text()
if 'id="release-v79"' not in text:text=text.replace('</main>','<section class="panel" id="release-v79"><h2>V7.9 · audit e geografia correnti</h2><p>Riesame parziale; i download precedenti sono conservati.</p><p><a href="/downloads/Release_Notes_V7_9.md">Note di rilascio</a> · <a href="/downloads/Audit_Multisede_V7_9.md">Audit multisede</a> · <a href="/downloads/Report_Geografia_V7_9.md">Report geografia</a> · <a href="/downloads/Verifiche_V7_9.json">Verifiche tecniche</a> · <a href="/downloads/Coda_Geografia_V7_9.csv">Casi geografici da verificare</a></p></section></main>');p.write_text(text)
# Generate a new browser suite; do not rewrite the historical V7.8 suite.
t=(R/'tools/test-ux-map-v7-8.mjs').read_text().replace("version:'7.8'","version:'7.9'").replace('all 432 services','all 440 services').replace('/432','/440').replace('presidi_geo_v7_8.json','presidi_geo_v7_9.json').replace(".includes('Posizione da verificare')",".toLowerCase().includes('posizione da verificare')").replace("['index.html','servizi.html','mappa.html','giovani.html']","['index.html','servizi.html','mappa.html','giovani.html','universita.html','scuole.html','strutture-approfondite.html','centri-ascolto.html']")
extra="""  await test('Current operational fields and correct unknown SSN labels',async()=>{
 await p.setViewportSize({width:390,height:900});await p.goto(BASE+'/servizi.html?q=FEBO',{waitUntil:'networkidle'});await p.locator('#svc-controls:not([disabled])').waitFor();assert.equal(await p.locator('.svc-card').count(),1);assert.match(await p.locator('.svc-card').innerText(),/Struttura non ASL/);await p.locator('#svc-list a[data-open]').first().click();let text=await p.locator('#svc-detail').innerText();assert.match(text,/in attesa di accreditamento/);assert.match(text,/31.12.2019/);assert.match(text,/Riesame operativo V7.9/);await shot(p,'febo-dettagli-390');const ax=await new AxeBuilder({page:p}).analyze();assert.equal(ax.violations.length,0,JSON.stringify(ax.violations));await p.keyboard.press('Escape');
 await p.goto(BASE+'/servizi.html?q=Le+Ali+del+Ponte&comune=Civitavecchia',{waitUntil:'networkidle'});await p.locator('#svc-controls:not([disabled])').waitFor();assert.equal(await p.locator('.svc-card').count(),3);
 await p.goto(BASE+'/strutture-approfondite.html',{waitUntil:'networkidle'});assert.match(await p.locator('#result-count').innerText(),/181/);await p.locator('#directory-search').fill('FEBO');await p.waitForTimeout(500);assert.match(await p.locator('#directory-grid').innerText(),/FEBO/);
 });
 await test('Il Ponte shared address retains two services in one popup',async()=>{
 await p.goto(BASE+'/mappa.html?q=Le+Ali+del+Ponte+Veneto',{waitUntil:'networkidle'});await p.locator('#map-controls:not([disabled])').waitFor();assert.equal(await p.locator('#map-list>li').count(),2);await p.locator('#map-activate').click();await p.waitForTimeout(450);assert.equal(await p.locator('.presidio-marker').count(),1);await p.locator('.presidio-marker').click();assert.equal(await p.locator('.map-popup-item').count(),2);assert.match(await p.locator('.leaflet-popup-content').innerText(),/Coccinella/);assert.match(await p.locator('.leaflet-popup-content').innerText(),/Comunità residenziale/);await shot(p,'ponte-popup-390');
 });
 await test('Search text stays local and missing audit has a visible warning',async()=>{
 const {c:ct,p:pg}=await context();const req=[];pg.on('request',r=>req.push(r.url()));await pg.goto(BASE+'/servizi.html',{waitUntil:'networkidle'});await pg.locator('#svc-controls:not([disabled])').waitFor();req.length=0;await pg.locator('#svc-q').fill('MENTAL_HEALTH_PRIVATE_SENTINEL_79');await pg.waitForTimeout(600);assert(!req.some(u=>u.includes('MENTAL_HEALTH_PRIVATE_SENTINEL_79')));assert.equal(req.filter(u=>!u.startsWith(BASE)).length,0);await ct.route('**/data/audit_operativo_v7_9.json',r=>r.fulfill({status:503,body:'unavailable'}));await pg.reload({waitUntil:'networkidle'});await pg.locator('#svc-controls:not([disabled])').waitFor();assert.equal(await pg.locator('#svc-load-status').isVisible(),true);assert.match(await pg.locator('#svc-load-status').innerText(),/V7.9/);await ct.close();
 });
"""
t=t.replace("  await test('No uncaught JavaScript errors in scenarios'",extra+"  await test('No uncaught JavaScript errors in scenarios'")
(R/'tools/test-ui-v7-9.mjs').write_text(t)
browser=Path('/tmp/v79-tests/report.json');report={'version':'7.9','baseline_commit':BASE,'checked_at':D,'data_checks':checks,'preserved_files':len(oldfiles)-len(allowed),'historical_mismatches':bad,'sources_scope':'per-field, not a complete operational certification','voiceover':'not executed: Linux environment; axe and keyboard tests are not a VoiceOver certification','production':'not implied by local tests; separately checked after merge'}
if browser.exists():report['browser']=json.loads(browser.read_text())
out('downloads/Verifiche_V7_9.json',report)
print(json.dumps({'data_checks':len(checks),'protected_files':report['preserved_files'],'geography':s,'operations':ops},ensure_ascii=False))
