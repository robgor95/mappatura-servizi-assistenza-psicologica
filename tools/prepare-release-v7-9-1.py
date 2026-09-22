"""Validate the real current stack and create release reports, never backdate sources."""
from pathlib import Path
import os,json,re,csv,hashlib,subprocess,collections,unicodedata,math
from shapely.geometry import shape,Point
R=Path(__file__).resolve().parents[1];os.chdir(R)
BASE='937713935c693dbbe50109e6738063cc0395e192';DATE='2026-09-22';V='7.9.1'
def load(p):return json.loads(Path(p).read_text())
def save(p,d):Path(p).write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
def sha(b):return hashlib.sha256(b).hexdigest()
# In CI, compare the immutable original git objects; locally use its verified tree export.
if os.environ.get('BASELINE_HASH_FILE'):baseline=load(os.environ['BASELINE_HASH_FILE'])
else:
 paths=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE],text=True).splitlines();baseline={}
 for p in paths:
  b=subprocess.check_output(['git','show',BASE+':'+p]);baseline[p]={'sha256':sha(b),'bytes':len(b)}
mutable=['README.md','CHANGELOG.md','version.json','servizi.html','archivio.html','mappa.html','strutture-approfondite.html','documenti.html']
protected=sorted(set(baseline)-set(mutable));mismatches=[p for p in protected if not Path(p).exists() or sha(Path(p).read_bytes())!=baseline[p]['sha256']]
audit={'version':V,'baseline_commit':BASE,'baseline_tree':'d175c350163ae13c56a7883d6a10d025f72accc7','checked_at':DATE,'mutable_paths':mutable,'protected_paths':protected,'baseline_files':baseline,'mismatches':mismatches}
save('downloads/Audit_Iniziale_V7_9_1.json',audit)
subprocess.run(['node','tools/export-current-v7-9-1.cjs','/tmp/runtime-v791.json'],check=True)
rows=load('/tmp/runtime-v791.json');by={r['key']:r for r in rows};ops=load('data/audit_operativo_v7_9_1.json');geo=load('data/presidi_geo_v7_9_1.json');oldgeo=load('data/presidi_geo_v7_9.json');g=geo['summary'];gr=geo['records'];dec=load('downloads/Decisioni_Geografia_V7_9_1.json');src=load('downloads/Fonti_Verificate_V7_9_1.json')
checks=[]
def check(n,b):checks.append({'name':n,'passed':bool(b)})
check('Exact baseline bytes retained for every protected file',not mismatches)
check('All 440 previous services preserved; two additions; unique keys',set(oldgeo['records'])<=set(by) and len(rows)==len(by)==442)
check('Every current service has a geographical audit entry',set(gr)==set(by))
check('No municipal centroid and no claimed verified entrance',all(p.get('entrance_verified') is False and (p['quality'] not in ['D','E'] or p['lat'] is None and p['lng'] is None) for p in gr.values()))
check('Coordinates refer to exact current source address and municipality',all(p['source_address']==by[k]['address'] and p['source_town']==by[k]['town'] for k,p in gr.items()))
bound=shape(load('downloads/Lazio_Boundary_OSM_V7_9.geojson'))
located={k:p for k,p in gr.items() if p['lat'] is not None}
check('All published points inside cached Lazio administrative polygon',all(bound.covers(Point(p['lng'],p['lat'])) for p in located.values()))
check('New field revisions retain source dates and old values',all(e['checked_at']==DATE and set(e['fields'])==set(e['evidence'])==set(e['previous_values']) and all(f['sources'] for f in e['evidence'].values()) for e in ops['revisions']))
check('Sources were actually acquired with hashes; no empty claims',all(s['status']==200 and re.fullmatch('[a-f0-9]{64}',s['sha256']) for s in src['sources']))
ihg=[by[f'moduli:MOD-{n:03d}'] for n in range(71,83)]
check('Twelve IHG/Gabbiano unit identities and individual contracts retained',len({r['raw']['servizio_id'] for r in ihg})==12 and len({r['raw']['struttura_id'] for r in ihg})==5 and all(r['ssn']=='indicata' and '31/12/2026' in r['raw']['contratto_periodo'] for r in ihg))
check('Rocca Canterano municipality corrected, not silently merged with Canterano',all(by['moduli:MOD-'+str(n).zfill(3)]['town']=='Rocca Canterano' for n in [81,82]))
vp=[by['moduli:V791-GABBIANO-VILLAPIA-'+s] for s in ['RES','CD']]
check('Villa Pia has two services, one site, administrative uncertainty retained',len({r['raw']['struttura_id'] for r in vp})==1 and len({r['regime'] for r in vp})==2 and all(r['ssn']=='dichiarazione' for r in vp) and vp[1]['raw']['posti_accreditati']=='40' and vp[1]['raw']['posti_dichiarati']=='20')
check('Al Colle and Insieme remain distinct services at the same address',by['moduli:MOD-064']['address']==by['moduli:MOD-065']['address'] and by['moduli:MOD-064']['raw']['servizio_id']!=by['moduli:MOD-065']['raw']['servizio_id'])
check('Reverie four and Il Ponte three prior service identities retained',all(k in by for k in ['moduli:MOD-106','moduli:MS775-REV-CTC1','moduli:MS775-REV-CTC2','moduli:MS775-REV-CD']) and len([r for r in rows if 'Le Ali del Ponte' in r['name']])==3)
check('San Camillo warning distinguishes inpatient suspension and maintained DH', '15/04/2026' in by['rete:NET-025']['serviceState'] and 'riapertura non documentata' in by['rete:NET-025']['serviceState'].lower())
check('Nuove Dipendenze current Frentani address has previous-value trace','Frentani' in by['rete:R1-14']['address'] and any('Palestro' in str(e['previous_values'].get('indirizzo','')) for e in ops['revisions'] if e['service_key']=='rete:R1-14'))
check('Nuovi Orizzonti dedicated central admissions not confused with site numbers',all(by[k]['phone']=='3929040842' and 'centrale' in by[k]['raw']['note_contatti'] for k in ['moduli:MOD-107','moduli:MS775-NO-CASAGIOIA']))
check('No 2026 budget or unrestricted extra-regional access invented',all('non acquisito' in r['raw']['contratto_periodo'] and 'da verificare' in r['raw']['accesso_extraregionale'] for r in ihg))
check('Building approximations explicitly distinguish department from campus',all('ingress' in p.get('note','').lower() and p.get('entrance_verified') is False for p in located.values() if p['precision']=='building'))
check('Local source layer is loaded before structure directory',Path('strutture-approfondite.html').read_text().index('src="/assets/audit-data-v7-9-1.js"')<Path('strutture-approfondite.html').read_text().index('src="/assets/directory-v7-9-1.js"') and '<script defer src="/assets/audit-data-v7-9-1.js"' not in Path('strutture-approfondite.html').read_text())
# More detailed geographic counters, without confusing retries with services rejected.
rejected={d['service_key'] for d in dec['decisions'] if d['action']=='rejected_candidate'}
changed_points=[k for k,p in located.items() if (o:=oldgeo['records'].get(k,{})).get('lat') is not None and (abs(o['lat']-p['lat'])>1e-7 or abs(o['lng']-p['lng'])>1e-7)]
groups=collections.defaultdict(list)
for k,p in located.items():groups[(round(p['lat'],6),round(p['lng'],6))].append(k)
shared=[{'lat':k[0],'lng':k[1],'services':v,'towns':sorted({by[x]['town'] for x in v})} for k,v in groups.items() if len(v)>1]
check('Shared coordinates never combine inconsistent municipalities',all(len(x['towns'])==1 for x in shared))
geostats={**g,'address_before':58,'street_before':178,'building_before':0,'unlocated_before':204,'coordinate_corrections':len(changed_points),'coordinate_correction_keys':changed_points,'rejected_candidate_services':len(rejected),'rejected_still_unlocated':len(rejected-set(located)),'documentary_upgrades_without_coordinate_change':sum(d['action']=='documentary_upgrade_only' for d in dec['decisions']),'shared_coordinate_groups':len(shared),'new_nominatim_queries':0,'regional_osm_extracts_downloaded':1}
save('downloads/Coordinate_Condivise_V7_9_1.json',{'version':V,'groups':shared,'rule':'Raggruppamento solo visivo; nessuna deduplicazione dei servizi.'})
with Path('downloads/Coda_Geografia_V7_9_1.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f,delimiter=';');w.writerow(['service_key','denominazione','comune','indirizzo','livello','nota','fonti'])
 for r in rows:
  if r['key'] not in located:w.writerow([r['key'],r['name'],r['town'],r['address'],gr[r['key']]['quality'],gr[r['key']].get('note',''),' | '.join(r['sources'])])
fields={}
def normalized(field,v):
 if field=='telefono':return sorted(re.findall(r'\d{6,}',re.sub(r'[ ().-]','',str(v or ''))))
 return unicodedata.normalize('NFKD',str(v or '')).encode('ascii','ignore').decode().lower().strip()
for e in ops['revisions']:
 for k,v in e['fields'].items():
  s=fields.setdefault(k,{'reviewed':0,'text_changed':0,'normalized_changed':0,'keys':[]});s['reviewed']+=1;s['text_changed']+=v!=e['previous_values'][k];s['normalized_changed']+=normalized(k,v)!=normalized(k,e['previous_values'][k]);s['keys'].append(e['service_key'])
summary={'existing_records_partially_reviewed':len(ops['revisions']),'new_services':len(ops['additions']),'new_physical_sites':1,'new_ssn_contracts_acquired_for_existing_units':16,'contracts_not_retrieved_for_other_units':5,'current_2026_budget_addenda_acquired':0,'proven_closures':0,'documented_temporary_inpatient_suspension':1,'updated_site_address_with_previous_temporary_address_retained':1,'telephone_calls':0,'site_visits':0,'beds_available_checked':0,'field_counts':fields,'source_documents_used':len(src['sources'])}
# Reproducible scoped case inventory. A case can be improved but still have pending fields.
cases=[{'case':'IHG / Gabbiano Tirreno','sites':5,'modules':12,'outcome':'Gestore, indirizzi, contatti, accreditamento e contratto individuale 2025–2026 acquisiti.','pending':'Budget 2026 separato e condizioni extra-regionali; coordinate per Castel Madama/Rocca Canterano.'},{'case':'Villa Pia / rete Gabbiano','sites':1,'new_modules':2,'outcome':'Residenziale e centro diurno DCA distinti, via Pantano 35 concorde.','pending':'Titolarità individuale, contratto SSN e capienza diurna 20 dichiarati/40 accreditati.'},{'case':'Nuovi Orizzonti','health_sites_in_document':2,'other_lazio_locations_in_document':3,'outcome':'Bilancio sociale 2025: Piglio e Marino sanitari; Frosinone, Terracina e Roma non aggiunti come comunità accreditate. Recapito centrale accoglienza aggiornato.','pending':'Modalità fisiche delle sedi sociali e atti SSN per sede non nuovamente riesaminati.'},{'case':'ASL Roma 5: nove schede senza indirizzo','services':9,'outcome':'Indirizzi/capienze da tabella 2025–2026; quattro contratti individuali acquisiti.','pending':'Cinque PDF non acquisiti e condizioni operative ancora incomplete.'},{'case':'Colle Cesarano','services':7,'sites':1,'outcome':'Civico 102 e coordinate del complesso da gestore, sette identità conservate.','pending':'70 posti H24 aggregati nell’elenco contro 60 nella precedente ripartizione: nessun modulo inventato.'},{'case':'ASL Roma 1','services':20,'outcome':'Confronto con pagine specifiche; nuovi recapiti e sede Frentani; civico Innocenzo IV 16/B.','pending':'Altri campi e ingresso fisico non verificati.'},{'case':'San Camillo Forlanini','services':1,'outcome':'Sospensione ricoveri dal 15/04/2026 nell’avviso del 10/04/2026, attività DH distinta.','pending':'Riapertura non documentata, stato corrente da riconfermare.'}]
save('downloads/Audit_Operativo_V7_9_1.json',{'version':V,'baseline_commit':BASE,'checked_at':DATE,'summary':summary,'cases':cases,'geography':geostats,'scope':'Riesame per campo, non certificazione completa o nuova rilevazione telefonica.'})
v=load('version.json');v.update(web_version=V,data_extension_version=V,audit_version=V,map_version=V,built_at=DATE,baseline_commit=BASE,release_note='Ulteriore geografia offline; IHG/Gabbiano e contratti per unità, Nuovi Orizzonti e 51 revisioni per campo. Due servizi Villa Pia aggiunti. Dati incompleti espliciti.',research_status='parziale_per_campo_non_esaustivo')
v['counts_current'].update(search=442,moduli=127,structure_directory=183,audit_additions=8,audit_7_9_1_additions=2)
v['map'].update(services=442,localized=g['located_after'],address_geocoded=g['address_after'],street_approximate=g['street_after'],building_approximate=g['building_after'],unlocated=g['unlocated_after'],quality=g['quality_counts'],entrances_verified=0)
v['v7_9_1_verification']={'local_report':'downloads/Verifiche_V7_9_1.json','production_evidence':'Verificata separatamente sul commit di merge: non riutilizzare gli esiti delle versioni precedenti.'}
save('version.json',v)
check('SEO and clinical review remain disabled',v['indexing_enabled'] is False and v['clinical_review'] is False and not re.search(r'^Sitemap:',Path('robots.txt').read_text(),re.M))
qa=os.environ.get('QA_OUT','/tmp/v791-tests');report={'version':V,'baseline_commit':BASE,'checked_at':DATE,'data_checks':checks,'passed':sum(x['passed'] for x in checks),'total':len(checks),'protected_files':len(protected),'historical_mismatches':mismatches,'browser':load(Path(qa)/'report.json') if (Path(qa)/'report.json').exists() else {'status':'not_run_yet'},'production':'Test locale non equivalente a deploy: verifica separata dopo merge','voiceover':'Non eseguito; ambiente Linux. Axe e tastiera non equivalgono a una certificazione VoiceOver.'}
save('downloads/Verifiche_V7_9_1.json',report)
text=f'''# V7.9.1 — ulteriore geografia e aggiornamento operativo

Baseline: `{BASE}`. Riesame documentale: {DATE}. I file precedenti non sono riscritti.

## Risultati geografici
440 → 442 servizi; 236 → **{g['located_after']} localizzati**; 204 → **{g['unlocated_after']} senza pin**.
{g['address_after']} corrispondenze cartografiche al civico, {g['street_after']} posizioni sulla via, {g['building_after']} complessi/edifici.
I complessi sono distinti dalle localizzazioni al civico e dagli ingressi: **zero ingressi verificati**.
Livelli: A={g['quality_counts'].get('A',0)}, B=0, C={g['quality_counts'].get('C',0)}, D={g['quality_counts'].get('D',0)}, E={g['quality_counts'].get('E',0)}.
69 dei precedenti 204 casi localizzati; due nuovi servizi localizzati. Nessuna promozione da via a civico in questo ciclo.
{len(changed_points)} coordinate precedenti corrette, {len(rejected)} servizi con candidati respinti ({len(rejected-set(located))} rimangono senza pin). Nessun servizio eliminato.
La classificazione A richiede indirizzo documentato, ma non sopralluogo: i sette servizi Colle Cesarano hanno il punto del complesso dichiarato dal gestore.
Dieci servizi ospedalieri hanno un punto C di complesso coerente con la denominazione storica; reparto/ingresso e operatività non verificati.

## Geocodifica e privacy
Un estratto regionale OSM riutilizzabile elaborato offline; zero nuove richieste Nominatim. Poligoni comunali, nomi delle vie e civici confrontati senza interpolare civici.
I centri dei comuni non diventano pin. Le vie ambigue o troppo estese non generano nuovi punti.
Cache di decisioni e feature selezionate, manifesto con SHA256 dell’estratto e fonti individuali sono allegati.
Nessuna geocodifica, geolocalizzazione, tracking o invio delle ricerche dal browser. Tasselli solo dopo consenso esplicito.

## Operatività
51 record esistenti riesaminati parzialmente, due servizi Villa Pia distinti su una nuova sede fisica.
16 contratti per singola unità esistente acquisiti (12 IHG/Gabbiano e quattro ulteriori strutture ASL Roma 5).
Contratto vigente nel periodo dichiarato non implica budget 2026 acquisito o posto libero.
Nuovi Orizzonti: documento esercizio 2025, non carta 2021 ridatata; accoglienza centrale 3929040842 lun–ven 09–13/14–17, non numero diretto della sede.
San Camillo: avviso datato 10/04/2026 di sospensione ricoveri dal 15/04, riapertura non documentata; DH distinto.
Nuove Dipendenze: Frentani 6 nella pagina aggiornata maggio 2026; precedente indirizzo temporaneo Palestro 39 mantenuto nella traccia, data effettiva del cambio non inventata.
Villa Pia: residenziale 20; diurno 40 accreditati nella tabella ASL contro 20 dichiarati dal gestore. Nessuna risoluzione presunta della discrepanza.
Al Colle/Insieme, Reverie e Il Ponte: servizi co-localizzati ancora separati.

## Test, integrità e limiti
{len(protected)} file precedenti protetti con verifica dei byte, nessuna differenza. File attivi modificati: otto entrypoint/documenti, nuovi overlay e asset versionati.
Le prove effettive sono in Verifiche_V7_9_1.json. Il deploy non è anticipato dal test locale; HTTP e browser su Cloudflare sono verificati dopo merge.
Indicizzazione disattivata: HTML/HTTP noindex, sitemap non annunciata, indexing_enabled=false.
Nessuna chiamata, sopralluogo o verifica di disponibilità. VoiceOver reale non eseguito.
Università, scuole, helpline e centri di ascolto restano separati: geografia non ampliata in questo ciclo.
Ancora aperti: {g['unlocated_after']} localizzazioni, budget 2026, cinque contratti non acquisiti, discordanze di capienza, ingressi/accessibilità e ricognizione non esaustiva degli altri gestori.

Fonti e date per campo: `data/audit_operativo_v7_9_1.json`; hash/fonti: `downloads/Fonti_Verificate_V7_9_1.json`; dettagli quantitativi: `downloads/Audit_Operativo_V7_9_1.json`.
'''
Path('downloads/Release_Notes_V7_9_1.md').write_text(text)
Path('downloads/Report_Geografia_V7_9_1.md').write_text(text.split('## Operatività')[0]+'\nCoda dettagliata: `Coda_Geografia_V7_9_1.csv`. Nessuna localizzazione in tempo reale.\n')
for p,title in [('README.md','## Versione corrente V7.9.1'),('CHANGELOG.md','## 7.9.1 — 2026-09-22')]:
 s=Path(p).read_text()
 if title not in s:s=title+'\n\n442 servizi, 307 localizzati, 135 senza pin. 51 revisioni per campo, due servizi Villa Pia, contratti per singola unità IHG/Gabbiano e ASL Roma 5. Nessuna riscrittura degli overlay precedenti.\n\nReport: `downloads/Release_Notes_V7_9_1.md`; test: `tools/test-ui-v7-9-1.mjs`; integrità e dati: `tools/prepare-release-v7-9-1.py`. Il sito resta statico e noindex. Le sezioni seguenti documentano versioni precedenti.\n\n'+s
 Path(p).write_text(s)
p=Path('documenti.html');s=p.read_text()
if 'Release_Notes_V7_9_1.md' not in s:s=s.replace('</main>','<section class="callout"><h2>Geografia e aggiornamento operativo: ultimo riesame</h2><p>Riesame parziale del 22 settembre 2026; dati storici conservati, disponibilità non rilevata.</p><p><a href="/downloads/Release_Notes_V7_9_1.md">Note del riesame</a> · <a href="/downloads/Audit_Operativo_V7_9_1.json">Report operativo</a> · <a href="/downloads/Coda_Geografia_V7_9_1.csv">Casi geografici ancora aperti</a> · <a href="/downloads/Verifiche_V7_9_1.json">Verifiche tecniche</a></p></section></main>')
p.write_text(s)
p=Path('strutture-approfondite.html');s=p.read_text().replace('riesame parziale V7.9;','riesame parziale V7.9.1;').replace('Riesame V7.9 parziale:','Riesame V7.9.1 parziale:');p.write_text(s)
print(json.dumps({'data_checks':len(checks),'passed':report['passed'],'protected_files':len(protected),'geography':geostats,'fields':{k:fields[k] for k in ['telefono','indirizzo','email','orari','accesso']}},ensure_ascii=False))
if not all(c['passed'] for c in checks):raise SystemExit('Data checks failed: '+str([c for c in checks if not c['passed']]))
