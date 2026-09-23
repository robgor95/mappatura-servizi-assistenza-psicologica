from pathlib import Path
import json,csv,copy
from collections import Counter
R=Path(__file__).resolve().parents[1]
V='7.9.4'; DATE='2026-09-23'; BASE='2ad2126b5c972ce49956607e368fc45b3fc4f7e6'

def readj(p): return json.loads((R/p).read_text())
def writej(p,o): (R/p).write_text(json.dumps(o,ensure_ascii=False,indent=2)+'\n')
def ev(urls): return {'sources':urls,'checked_at':DATE}
def rev(key,fields,urls,note,scope='Riesame documentale dei soli campi indicati; nessuna telefonata, sopralluogo o verifica di disponibilità.'):
    return {'service_key':key,'checked_at':DATE,'fields':fields,'evidence':{k:ev(urls) for k in fields},
            'sources':urls,'note':note,'scope':scope}

asl5_list='https://www.aslroma5.it/wp-content/uploads/2026/07/Strutture-Private-Accreditate-2025-2026.pdf'
colle_budget='https://www.aslroma5.it/wp-content/uploads/2026/07/Delibera-n.-110-del-30.01.2025-BUDGET-PSICHIATRICHE.pdf'
colle_contract='https://www.aslroma5.it/wp-content/uploads/2026/07/Psichiatria-Colle-Cesarano.pdf'
colle_manager='https://www.korian.it/strutture/colle-cesarano/documenti/'
insieme='https://www.comunitainsieme.com/strutture/'
abaton='https://www.comunitainsieme.com/s-r-t-r-progetto-insieme-castelforte/'
abaton_region='https://www.regione.lazio.it/sites/default/files/decreti-commissario-ad-acta/SAN_DCA_U00166_15_05_2019.pdf'
ponte='https://www.alidelponte.com/servizi'
san_giovanni='https://www.aslroma2.it/index.php/dipartimenti-aziendali-ose/salute-mentale-ose/uoc-spdc-ose'
fr_spdc='https://www.asl.fr.it/strutture/dipartimenti/dipartimento-di-salute-mentale-e-delle-patologie-da-dipendenza/uoc-spdc-cassino-sora/'
fr_csm='https://www.asl.fr.it/strutture/dipartimenti/dipartimento-di-salute-mentale-e-delle-patologie-da-dipendenza/uoc-salute-mentale-frosinone-alatri-anagni-sora/'
latina='https://www.ausl.latina.it/dipartimenti/31-azienda/449-dsm'
rieti='https://www.asl.rieti.it/organizzazione-aziendale/dipartimenti/dipartimento-promozione-e-tutela-della-salute-mentale/csm-distretto-2'

revisions=[]
capacity_note='La capacità H24 complessiva di 70 posti è ora riconciliata: A1 20 + A2 20 + B4 20 + Il Colle/Nucleo 1 10. È capienza documentata, non disponibilità in tempo reale.'
for k in ['moduli:MOD-026','moduli:MOD-027','moduli:MOD-028']:
    revisions.append(rev(k,{'nota_posti':capacity_note},[asl5_list,colle_budget],
                         'Riconciliata la precedente discrepanza H24 senza fondere i quattro moduli.'))

revisions.append(rev('moduli:MOD-038',{
 'nota_indirizzo':'Conflitto documentale aperto sul civico di Castelforte: la pagina corrente del gestore indica Via De Gasperi 2; documentazione precedente riportava 36; il DCA regionale U00166/2019 identifica Via A. De Gasperi 48/50 (già civico 36). Il civico fisico corrente della struttura va riconfermato prima di modificare la sede o creare un nuovo pin.',
 'nota_multisede_v794':'Audit sistematico Comunità Insieme: le nove strutture sanitarie residenziali elencate dal gestore risultano rappresentate nel database attraverso moduli/sedi distinti; nessuna sede sanitaria aggiuntiva viene dedotta.'
},[abaton,abaton_region,insieme],'Conservate tutte le varianti documentali; nessuna scelta arbitraria del civico.'))

revisions.append(rev('moduli:MOD-109',{
 'nota_multisede_v794':'Audit multisede Le Ali del Ponte: le sedi residenziali sanitarie documentate risultano già rappresentate da servizi distinti. Via Isonzo 34/La Formica non viene promossa automaticamente a comunità sanitaria residenziale.',
 'accesso_extraregionale':'Il gestore dichiara convenzioni con Regione Lazio e regioni invianti per alcuni programmi; condizioni economiche e autorizzazione dell’invio extraregionale vanno confermate caso per caso con servizio inviante e struttura.'
},[ponte],'Dichiarazione del gestore distinta da un contratto unitario corrente con ogni regione.'))

revisions.append(rev('rete:NET-019',{
 'indirizzo':'Via Santo Stefano Rotondo, 5','sede_dettaglio':'Presso Azienda Ospedaliera San Giovanni Addolorata',
 'telefono':'06 7705 4311','email':'UOC.spdc.sg@aslroma2.it',
 'nota_indirizzo':'Coordinate V7.9.4 riferite al complesso ospedaliero San Giovanni/Addolorata; reparto e ingresso specifico non verificati.'
},[san_giovanni],'Sede e recapiti aggiornati dalla pagina ufficiale ASL Roma 2.'))
revisions.append(rev('rete:FR-03',{
 'indirizzo':'Ospedale San Benedetto, Località Chiappitto',
 'nota_indirizzo':'CSM Alatri presso il complesso dell’Ospedale San Benedetto. Coordinate V7.9.4 riferite al complesso ospedaliero; ingresso del CSM non verificato.'
},[fr_csm],'Normalizzata la sede ospedaliera documentata senza dedurre un ingresso.'))
revisions.append(rev('rete:NET-075',{
 'indirizzo':'Ospedale Santa Scolastica, Via San Pasquale, piano terra','telefono':'0776 3929217',
 'email':'spdc.hcaso@aslfrosinone.it',
 'nota_indirizzo':'Coordinate V7.9.4 riferite al complesso Ospedale Santa Scolastica; reparto al piano terra da fonte ASL, ingresso specifico non verificato.'
},[fr_spdc],'Sede Cassino e recapiti aggiornati dalla UOC SPDC Cassino-Sora.'))
revisions.append(rev('rete:NET-076',{
 'indirizzo':'Ospedale SS. Trinità, Località San Marciano','telefono':'0776 8294144',
 'email':'spdc.hcaso@aslfrosinone.it',
 'nota_indirizzo':'Coordinate V7.9.4 riferite al complesso Ospedale SS. Trinità; reparto e ingresso specifico non verificati.'
},[fr_spdc],'Sede Sora e recapiti aggiornati dalla UOC SPDC Cassino-Sora.'))
revisions.append(rev('rete:NET-085',{
 'indirizzo':'Ospedale Dono Svizzero, Via Appia lato Napoli','telefono':'0771 779090 / 0771 779085',
 'email':'spdc.formia@ausl.latina.it','orari':'H24',
 'nota_indirizzo':'Sede ospedaliera documentata; civico e ingresso del reparto non localizzati in modo univoco, quindi nessun nuovo pin V7.9.4.'
},[latina],'Sede e contatti aggiornati; geografia lasciata aperta per assenza di corrispondenza univoca.'))

new_record={
'id':'V794-CESARANO-ILCOLLE-H24','id_modulo':'V794-CESARANO-ILCOLLE-H24',
'denominazione':'Colle Cesarano – Il Colle – SRSR H24 Nucleo 1','gestore':'GERESS S.r.l.',
'ente_id':'GERESS-COLLE-CESARANO','struttura_id':'COLLE-CESARANO-MAREMMANA102',
'servizio_id':'V794-CESARANO-ILCOLLE-H24','comune':'Tivoli','provincia':'RM','asl':'Roma 5',
'asl_territoriale':'ASL Roma 5','indirizzo':'Via Maremmana Inferiore, 102','tipo':'SRSR',
'modulo':'SRSR H24','tipologia':'SRSR H24','ambito':'Psichiatria','regime':'Residenziale',
'telefono':'0774 50011','email':'accettazionesanitaria@collecesarano.com','sito_ufficiale':colle_manager,
'posti_accreditati':'10','posti_dichiarati':'10',
'nota_posti':'Nucleo 1 “Il Colle”: 10 posti H24 documentati nella tabella ASL Roma 5. La capacità H24 complessiva del complesso è così riconciliata a 70 posti; nessuna disponibilità attuale è stata rilevata.',
'autorizzazione_stato':'Unità ricondotta alla struttura Colle Cesarano/Geress negli atti ASL; atto unitario di autorizzazione non isolato in V7.9.4.',
'accreditamento_stato':'10 posti H24 documentati negli atti/elenco ASL Roma 5 riferiti al complesso Colle Cesarano.',
'contratto_ssn_stato':'Contratto 2025–2026 documentato per Colle Cesarano/Geress a livello struttura; non equivale a budget unitario 2026 del Nucleo 1.',
'contratto_periodo':'01/01/2025–31/12/2026; corrispettivo 2026 rinviato a specifico atto/budget.',
'ssn_evidence_v794':'indicata',
'rapporto_ssn':'Rapporto SSN documentato a livello della struttura Colle Cesarano; condizioni economiche 2026 della singola unità da consolidare.',
'budget_2026_stato':'Budget/corrispettivo unitario 2026 del Nucleo 1 non acquisito.',
'accesso_extraregionale':'Da verificare con servizio inviante, ASL e struttura.',
'nota_indirizzo':'Stesso complesso di Via Maremmana Inferiore 102 degli altri moduli Colle Cesarano. Il punto mappa rappresenta il complesso; ingresso specifico del Nucleo 1 non verificato.',
'ultima_verifica':DATE,'fonti':' | '.join([asl5_list,colle_budget,colle_contract,colle_manager])
}
addition={'service_key':'moduli:V794-CESARANO-ILCOLLE-H24','origin':'moduli','record':new_record,
'checked_at':DATE,'sources':[asl5_list,colle_budget,colle_contract,colle_manager],
'note':'Nuovo modulo distinto: 10 posti H24. Non è disponibilità in tempo reale.',
'scope':'Nuovo servizio documentato negli atti ASL; nessun sopralluogo o verifica dei posti liberi.'}

audit={'version':V,'baseline_commit':BASE,'checked_at':DATE,
'scope':'Overlay additivo successivo a V7.9.3; dati storici immutati.','revisions':revisions,'additions':[addition],
'summary':{'records_reexamined':len(revisions),'new_services':1,'new_colle_cesarano_h24_modules':1,
'colle_h24_capacity_reconciled':70,'multisite_managers_systematically_audited':2,
'new_health_sites_from_multisite_audit':0,'physical_entrances_verified':0,'telephone_calls':0,
'site_visits':0,'unit_2026_budgets_acquired':0}}
writej('data/audit_operativo_v7_9_4.json',audit)

geo=copy.deepcopy(readj('data/presidi_geo_v7_9_2.json'))
geo['version']=V;geo['baseline_commit']=BASE;geo['generated_at']=DATE
records=geo['records']
def building(key,lat,lng,address,town,osm,official,matched,note):
    records[key]={'service_key':key,'lat':lat,'lng':lng,'precision':'building','quality':'C',
    'source_address':address,'source_town':town,'comune':town,'matched_address':matched,'source_url':osm,
    'address_source_url':official,'checked_at':DATE,'coordinate_source_checked_at':DATE,
    'method':'Complesso sanitario nominativo: coerenza fra fonte sanitaria ufficiale e oggetto OpenStreetMap; nessun ingresso dedotto.',
    'note':note,'represents':'complesso sanitario/ospedaliero','entrance_verified':False}
building('rete:NET-019',41.8852718,12.4986193,'Via Santo Stefano Rotondo, 5','Roma',
'https://www.openstreetmap.org/way/1077377642',san_giovanni,
'Ospedale San Giovanni - Presidio Addolorata, Via di Santo Stefano Rotondo, Roma',
'Punto del complesso ospedaliero; SPDC e ingresso specifico non verificati.')
building('rete:FR-03',41.7376090,13.3344057,'Ospedale San Benedetto, Località Chiappitto','Alatri',
'https://www.openstreetmap.org/node/5222094765',fr_csm,'Ospedale San Benedetto / Pronto Soccorso, Alatri',
'Posizione indicativa nel complesso San Benedetto; ingresso CSM non verificato.')
building('rete:NET-075',41.5054451,13.8434294,'Ospedale Santa Scolastica, Via San Pasquale, piano terra','Cassino',
'https://www.openstreetmap.org/way/737719603',fr_spdc,'Ospedale Santa Scolastica, Cassino',
'Punto del complesso ospedaliero; reparto indicato al piano terra, ingresso specifico non verificato.')
building('rete:NET-076',41.7296991,13.6362634,'Ospedale SS. Trinità, Località San Marciano','Sora',
'https://www.openstreetmap.org/way/365118479',fr_spdc,'Ospedale Santissima Trinità, Sora',
'Punto del complesso ospedaliero; SPDC e ingresso specifico non verificati.')
building('rete:RI-12',42.3717564,12.4915573,'Vocabolo Filoni, 1 — 2° piano','Magliano Sabina',
'https://www.openstreetmap.org/way/219841186',rieti,'Presidio Marzio Marini, Magliano Sabina',
'Punto del presidio ospedaliero ospitante; piano/ingresso CSM non verificati.')

colle=records.get('moduli:MOD-022')
if not colle or colle.get('lat') is None: raise SystemExit('Colle Cesarano baseline coordinate missing')
records['moduli:V794-CESARANO-ILCOLLE-H24']={
'service_key':'moduli:V794-CESARANO-ILCOLLE-H24','lat':colle['lat'],'lng':colle['lng'],
'precision':'building','quality':'A','source_address':'Via Maremmana Inferiore, 102','source_town':'Tivoli',
'comune':'Tivoli','matched_address':colle.get('matched_address','Colle Cesarano, Tivoli'),
'source_url':colle.get('source_url',colle_manager),'address_source_url':colle_manager,'checked_at':DATE,
'coordinate_source_checked_at':DATE,'method':'Coordinate condivise del complesso Colle Cesarano già documentato; nuovo modulo distinto senza dedurre un ingresso.',
'note':'Stesso complesso degli altri moduli Colle Cesarano; punto condiviso, identità distinta, ingresso non verificato.',
'represents':'complesso Colle Cesarano','entrance_verified':False}

qualities=Counter(p.get('quality','E') for p in records.values())
localized=sum(p.get('lat') is not None and p.get('quality') in {'A','B','C'} for p in records.values())
summary={'services_before':442,'services_after':443,'located_before':309,'located_after':localized,
'address_after':sum(p.get('precision')=='address' for p in records.values()),
'street_after':sum(p.get('precision')=='street' for p in records.values()),
'building_after':sum(p.get('precision')=='building' for p in records.values()),
'unlocated_after':443-localized,'quality_counts':dict(qualities),
'newly_localized_existing':['rete:NET-019','rete:FR-03','rete:NET-075','rete:NET-076','rete:RI-12'],
'new_service_localized':['moduli:V794-CESARANO-ILCOLLE-H24'],'entrances_verified':0,
'nominatim_requests_targeted':18}
geo['summary']=summary
geo['method_note']='V7.9.4 aggiunge solo complessi sanitari nominativi coerenti con fonti ufficiali e un modulo co-localizzato documentato; nessun centroide, nessun ingresso verificato.'
geo['provider']='OpenStreetMap/Nominatim, ricerca preparatoria su elenco fisso'
writej('data/presidi_geo_v7_9_4.json',geo)

s=(R/'assets/audit-data-v7-9-3.js').read_text()
for a,b in [('V7.9.3','V7.9.4'),("'7.9.3'","'7.9.4'"),('v793','v794'),('LazioAudit793','LazioAudit794'),
('_riesame_v793','_riesame_v794'),('riesame_v793','riesame_v794'),('fonti_v793','fonti_v794'),
('note_v793','note_v794'),('ssn_evidence_v793','ssn_evidence_v794')]: s=s.replace(a,b)
(R/'assets/audit-data-v7-9-4.js').write_text(s)

s=(R/'assets/servizi-v7-9-3.js').read_text()
s=s.replace("const [base,extra,multisite,audit,current,current2,current3]=await Promise.allSettled([",
"const [base,extra,multisite,audit,current,current2,current3,current4]=await Promise.allSettled([")
s=s.replace("getJSON('/data/audit_operativo_v7_9_3.json')\n  ]);",
"getJSON('/data/audit_operativo_v7_9_3.json'),\n    getJSON('/data/audit_operativo_v7_9_4.json')\n  ]);")
s=s.replace("if(current3.status==='fulfilled')window.LazioAudit793.set(current3.value);",
"if(current3.status==='fulfilled')window.LazioAudit793.set(current3.value);\n  if(current4.status==='fulfilled')window.LazioAudit794.set(current4.value);")
s=s.replace("&&current3.status==='fulfilled')$('svc-load-status').hidden=true;",
"&&current3.status==='fulfilled'&&current4.status==='fulfilled')$('svc-load-status').hidden=true;")
s=s.replace("if(current3.status!=='fulfilled')missing.push('le correzioni operative V7.9.3 (dati precedenti da riconfermare)');",
"if(current3.status!=='fulfilled')missing.push('le correzioni operative V7.9.3 (dati precedenti da riconfermare)');\n    if(current4.status!=='fulfilled')missing.push('le correzioni operative V7.9.4 (dati precedenti da riconfermare)');")
needle="if(r.v793)body+=section('Riesame operativo V7.9.3',field('Campi riesaminati',r.v793.fields.join(', '),true)+field('Data del controllo documentale',r.v793.checked_at)+field('Ambito e limiti',r.v793.scope,true)+field('Note della verifica',r.v793.note,true));"
s=s.replace(needle,needle+"\n  if(r.v794)body+=section('Riesame operativo V7.9.4',field('Campi riesaminati',r.v794.fields.join(', '),true)+field('Data del controllo documentale',r.v794.checked_at)+field('Ambito e limiti',r.v794.scope,true)+field('Note della verifica',r.v794.note,true));")
s=s.replace("field('Nota indirizzo',v.nota_indirizzo,true));","field('Nota indirizzo',v.nota_indirizzo,true)+field('Audit multisede',v.nota_multisede_v794,true));")
(R/'assets/servizi-v7-9-4.js').write_text(s)

s=(R/'assets/map-data-v7-9-2.js').read_text().replace('/data/presidi_geo_v7_9_2.json','/data/presidi_geo_v7_9_4.json')
s=s.replace("'/data/audit_operativo_v7_9_2.json'].map(json)",
"'/data/audit_operativo_v7_9_2.json','/data/audit_operativo_v7_9_3.json','/data/audit_operativo_v7_9_4.json'].map(json)")
s=s.replace("if(result[6].status==='fulfilled')root.LazioAudit792.set(result[6].value);else missing.push('correzioni operative V7.9.2: dati precedenti da riconfermare');",
"if(result[6].status==='fulfilled')root.LazioAudit792.set(result[6].value);else missing.push('correzioni operative V7.9.2: dati precedenti da riconfermare');\n  if(result[7].status==='fulfilled')root.LazioAudit793.set(result[7].value);else missing.push('correzioni operative V7.9.3: dati precedenti da riconfermare');\n  if(result[8].status==='fulfilled')root.LazioAudit794.set(result[8].value);else missing.push('correzioni operative V7.9.4: dati precedenti da riconfermare');")
(R/'assets/map-data-v7-9-4.js').write_text(s)

s=(R/'assets/directory-v7-9-2.js').read_text()
s=s.replace("var extraSources=(cfg.additionalSources||[])", """var v793Source=fetch('/data/audit_operativo_v7_9_3.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Audit V7.9.3 non caricato');return r.json()});
var v794Source=fetch('/data/audit_operativo_v7_9_4.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Audit V7.9.4 non caricato');return r.json()});
var extraSources=(cfg.additionalSources||[])""")
s=s.replace(".concat([auditSource,currentSource,latestSource])).then(function(x){var c=cat(cfg.source),rows=x[0].records||[],R=x[1],audit=x[x.length-3],current=x[x.length-2],latest=x[x.length-1],additional=x.slice(2,-3)",
".concat([auditSource,currentSource,latestSource,v793Source,v794Source])).then(function(x){var c=cat(cfg.source),rows=x[0].records||[],R=x[1],audit=x[x.length-5],current=x[x.length-4],latest=x[x.length-3],v793=x[x.length-2],v794=x[x.length-1],additional=x.slice(2,-5)")
s=s.replace("rows=window.LazioAudit79.directory(c,rows,audit);rows=window.LazioAudit791.directory(c,rows,current);rows=window.LazioAudit792.directory(c,rows,latest);init(rows)",
"rows=window.LazioAudit79.directory(c,rows,audit);rows=window.LazioAudit791.directory(c,rows,current);rows=window.LazioAudit792.directory(c,rows,latest);rows=window.LazioAudit793.directory(c,rows,v793);rows=window.LazioAudit794.directory(c,rows,v794);init(rows)")
(R/'assets/directory-v7-9-4.js').write_text(s)

s=(R/'tools/export-current-v7-9-3.cjs').read_text()
s=s.replace("'audit-data-v7-9-3']","'audit-data-v7-9-3','audit-data-v7-9-4']")
s=s.replace("sandbox.LazioAudit793.set(read('data/audit_operativo_v7_9_3.json'));",
"sandbox.LazioAudit793.set(read('data/audit_operativo_v7_9_3.json'));sandbox.LazioAudit794.set(read('data/audit_operativo_v7_9_4.json'));")
s=s.replace('current-rows-v793.json','current-rows-v794.json')
(R/'tools/export-current-v7-9-4.cjs').write_text(s)

def rf(path,repls):
    p=R/path;s=p.read_text()
    for a,b in repls:
        if a not in s: raise SystemExit(path+' missing token '+a[:50])
        s=s.replace(a,b)
    p.write_text(s)

for p in ['servizi.html','archivio.html']:
    rf(p,[('/assets/audit-data-v7-9-3.js"></script>','/assets/audit-data-v7-9-3.js"></script><script defer src="/assets/audit-data-v7-9-4.js"></script>'),
          ('/assets/servizi-v7-9-3.js','/assets/servizi-v7-9-4.js')])
rf('mappa.html',[('/assets/audit-data-v7-9-2.js"></script>','/assets/audit-data-v7-9-2.js"></script><script defer src="/assets/audit-data-v7-9-3.js"></script><script defer src="/assets/audit-data-v7-9-4.js"></script>'),
                 ('/assets/map-data-v7-9-2.js','/assets/map-data-v7-9-4.js'),('/data/presidi_geo_v7_8.json','/data/presidi_geo_v7_9_4.json')])
rf('strutture-approfondite.html',[('/assets/audit-data-v7-9-2.js"></script>','/assets/audit-data-v7-9-2.js"></script><script src="/assets/audit-data-v7-9-3.js"></script><script src="/assets/audit-data-v7-9-4.js"></script>'),
                                   ('/assets/directory-v7-9-2.js','/assets/directory-v7-9-4.js'),
                                   ('Riesame V7.9.1 parziale: 22/09/2026','Riesame V7.9.4 parziale: 23/09/2026')])
p=R/'strutture-approfondite.html';hs=p.read_text()
hs=hs.replace('"riesame_v791","fonti_v791","note_v791","nota_posti"',
'"riesame_v791","fonti_v791","note_v791","riesame_v792","fonti_v792","note_v792","riesame_v793","fonti_v793","note_v793","riesame_v794","fonti_v794","note_v794","nota_posti","nota_multisede_v794","budget_2026_stato","nota_budget_2026"')
p.write_text(hs)

rows=[]
with (R/'downloads/Coda_Geografia_V7_9_2.csv').open(encoding='utf-8-sig') as f:
    rr=csv.DictReader(f,delimiter=';'); fields=rr.fieldnames
    for row in rr:
        if row['service_key'] not in {'rete:NET-019','rete:FR-03','rete:NET-075','rete:NET-076','rete:RI-12'}: rows.append(row)
with (R/'downloads/Coda_Geografia_V7_9_4.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields,delimiter=';');w.writeheader();w.writerows(rows)

multi={'version':V,'checked_at':DATE,'managers':[
{'manager':'Comunità Insieme','manager_declared_health_sites':9,'database_health_sites_represented':9,'new_sites_added':0,
'conclusion':'Le nove sedi sanitarie residenziali elencate dal gestore risultano già rappresentate; moduli distinti nella stessa sede restano separati.',
'open_issue':'Castelforte: civico 2 vs 36 vs 48/50 da riconfermare.','sources':[insieme,abaton,abaton_region]},
{'manager':'Le Ali del Ponte / Il Ponte','health_residential_addresses_represented':['Via Amba Aradam 25','Via Veneto 30/C'],
'new_sites_added':0,'conclusion':'I programmi residenziali sanitari censiti risultano coperti. Via Isonzo 34/La Formica non viene convertita automaticamente in comunità sanitaria.',
'sources':[ponte]}]}
writej('downloads/Audit_Multisede_V7_9_4.json',multi)
ops={'version':V,'baseline_commit':BASE,'checked_at':DATE,'summary':audit['summary'],
'findings':[
{'case':'Colle Cesarano','outcome':'Individuato e aggiunto Il Colle/Nucleo 1 SRSR H24 da 10 posti; totale H24 riconciliato a 70 senza fondere i moduli.','pending':'Budget/corrispettivo unitario 2026 del Nucleo 1 non acquisito.'},
{'case':'Abaton/Progetto Insieme Castelforte','outcome':'Esplicitato conflitto civico 2 / 36 / 48–50.','pending':'Civico fisico corrente da riconfermare.'},
{'case':'Comunità Insieme e Le Ali del Ponte','outcome':'Audit sistematico multisede completato senza nuove sedi sanitarie da aggiungere.','pending':'Contratti/perimetri amministrativi per singola unità restano separati.'},
{'case':'SPDC/CSM ospedalieri','outcome':'Aggiornate sedi/contatti e localizzati cinque servizi a livello di complesso ospedaliero.','pending':'Ingressi specifici non verificati; Formia resta senza pin.'}
],'geography':summary}
writej('downloads/Audit_Operativo_V7_9_4.json',ops)
(R/'downloads/Audit_Multisede_V7_9_4.md').write_text("""# Audit multisede V7.9.4

## Comunità Insieme
Le 9 sedi sanitarie residenziali elencate dal gestore risultano rappresentate nel database. Nessuna nuova sede viene aggiunta. Rimane aperto il conflitto sul civico di Castelforte (2 / 36 / 48–50).

## Le Ali del Ponte
Le sedi residenziali sanitarie già censite coprono Via Amba Aradam 25 e Via Veneto 30/C. Via Isonzo 34 / La Formica non viene trasformata automaticamente in comunità sanitaria.

Nessuna deduplicazione di servizi co-localizzati.
""")
(R/'downloads/Report_Geografia_V7_9_4.md').write_text(f"""# Geografia V7.9.4

- servizi: 443
- localizzati: {localized} (prima 309)
- senza pin: {443-localized} (prima 133)
- civico: {summary['address_after']}
- via: {summary['street_after']}
- complesso/edificio: {summary['building_after']}
- ingressi verificati: 0
- nuovi complessi per servizi esistenti: 5
- nuovo servizio co-localizzato: Colle Cesarano – Il Colle H24
- richieste Nominatim preparatorie: 18; nessuna richiesta dal browser.

I nuovi punti ospedalieri indicano il complesso, non l’ingresso del reparto.
""")
(R/'downloads/Release_Notes_V7_9_4.md').write_text("""# V7.9.4 — geografia mirata e audit multisede

## Novità
- nuovo modulo Colle Cesarano “Il Colle – SRSR H24 Nucleo 1”, 10 posti documentati;
- capacità H24 Colle Cesarano riconciliata a 70 posti (20+20+20+10);
- cinque servizi esistenti localizzati a livello di complesso ospedaliero;
- audit sistematico Comunità Insieme e Le Ali del Ponte senza promuovere sedi sociali a strutture sanitarie;
- conflitto civico Abaton Castelforte conservato (2 / 36 / 48–50);
- sede/contatti SPDC San Giovanni, Cassino, Sora e Formia aggiornati.

## Limiti
Nessun ingresso fisico verificato, nessun posto disponibile rilevato, nessuna telefonata o sopralluogo. Il contratto Colle Cesarano 2025–2026 è documentato a livello struttura; il corrispettivo/budget unitario 2026 del nuovo Nucleo 1 non è acquisito.
""")

v=readj('version.json')
v.update(web_version=V,data_extension_version=V,audit_version=V,map_version=V,built_at=DATE,baseline_commit=BASE)
v['counts_current'].update(moduli=128,search=443,structure_directory=184)
v['counts_current']['audit_7_9_4_additions']=1
v['map'].update(services=443,localized=localized,address_geocoded=summary['address_after'],
street_approximate=summary['street_after'],building_approximate=summary['building_after'],
unlocated=443-localized,quality=summary['quality_counts'],entrances_verified=0)
v['release_note']='V7.9.4: aggiunto Il Colle H24 a Colle Cesarano, riconciliati i 70 posti H24, localizzati cinque servizi a livello di complesso ospedaliero e completato un audit multisede mirato senza deduzioni amministrative.'
v['v7_9_3_verification']={'local_report':'downloads/Verifiche_V7_9_3.json',
'production_evidence':'Cloudflare e produzione verificati sul commit 2ad2126b5c972ce49956607e368fc45b3fc4f7e6; workflow 35794344771: HTTP 48/48, browser 28/28.'}
v['v7_9_4_verification']={'local_report':'downloads/Verifiche_V7_9_4.json','production_evidence':'da verificare separatamente dopo merge'}
writej('version.json',v)

for p,title in [('README.md','## Versione corrente V7.9.4'),('CHANGELOG.md','## 7.9.4 — 2026-09-23')]:
    q=R/p;s=q.read_text()
    if title not in s:s=title+'\n\n'+v['release_note']+'\n\n'+s
    q.write_text(s)

print(json.dumps({'version':V,'geo':summary,'audit':audit['summary']},ensure_ascii=False,indent=2))
