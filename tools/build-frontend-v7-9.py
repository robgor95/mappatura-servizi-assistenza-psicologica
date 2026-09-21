"""Generate current assets next to immutable previous releases."""
from pathlib import Path
import re,json
R=Path(__file__).resolve().parents[1]
def load(p):return (R/p).read_text()
def write(p,s):(R/p).write_text(s)
s=load('assets/servizi-v7-5-1.js')
s=s.replace('const [base,extra,multisite]=await Promise.allSettled([','const [base,extra,multisite,audit]=await Promise.allSettled([').replace("getJSON('/data/multisede_v7_7_5.json')","getJSON('/data/multisede_v7_7_5.json'),\n    getJSON('/data/audit_operativo_v7_9.json')")
s=s.replace('rows=A.build(D,extra.status',"if(audit.status==='fulfilled')window.LazioAudit79.set(audit.value);\n  rows=A.build(D,extra.status")
s=s.replace("if(extra.status==='fulfilled'&&multisite.status==='fulfilled')","if(extra.status==='fulfilled'&&multisite.status==='fulfilled'&&audit.status==='fulfilled')")
s=s.replace("if(multisite.status!=='fulfilled')missing.push('le integrazioni multisede');","if(multisite.status!=='fulfilled')missing.push('le integrazioni multisede');\n    if(audit.status!=='fulfilled')missing.push('le correzioni operative V7.9 (dati precedenti da riconfermare)');")
s=s.replace("Informazioni verificate: '+'esc", "Informazioni verificate: '+'esc")
s=s.replace("Informazioni verificate: '+esc(r.date||'data non documentata')", "'+(r.auditDate?'Riesame parziale: '+esc(r.auditDate):'Data documentale precedente: '+esc(r.date||'non documentata'))")
s=s.replace("field('Gestione',managementLabel(v.gestore||v.gestione||v.natura),true)","field('Gestione',managementLabel(v.gestore||v.gestione||v.natura),true)+field('Sede / dettaglio',v.sede_dettaglio||v.struttura_id,true)+field('Stato del servizio',v.stato_servizio,true)+field('Nota indirizzo',v.nota_indirizzo,true)")
s=s.replace("field('Requisiti o limitazioni',v.criteri_limitazioni,true)","field('Requisiti o limitazioni',v.criteri_ammissione||v.criteri_limitazioni,true)+field('Invio del servizio territoriale',v.modalita_invio,true)")
s=s.replace("field('Accesso da altri territori',v.mobilita_intraregionale||v.accesso_fuori_lazio_stato||v.accesso_extraregionale,true)","field('Mobilità nel Lazio',v.mobilita_intraregionale||v.accesso_altre_asl,true)+field('Accesso da altre regioni',v.accesso_extraregionale||v.accesso_fuori_lazio_stato,true)")
s=s.replace("field('Orari',v.orari,true)","field('Orari',v.orari,true)+field('Nota sui recapiti',v.note_contatti||v.nota_contatti,true)+field('Recapito di sede in documento precedente',v.telefono_sede_documentato,true)+field('Email di sede documentata',v.email_sede_documentata,true)")
s=s.replace("const ssnRaw=v.rapporto_ssn||v.convenzione_ssn||v.contratto_ssn_stato;","const ssnRaw=v.ssn_evidence_v79==='da-verificare'?(v.contratto_ssn_stato||'Da verificare per questa unità'):(v.rapporto_ssn||v.convenzione_ssn||v.contratto_ssn_stato);")
s=s.replace("field('Periodo / condizioni riportate',", "field('Autorizzazione',v.autorizzazione_stato||v.autorizzazione_sanitaria,true)+field('Accreditamento',v.accreditamento_stato||v.accreditamento,true)+field('Contratto / convenzione',v.contratto_ssn_stato||v.convenzione_ssn,true)+field('Costi',v.costi,true)+field('Gratuità',v.gratuita,true)+field('Precisazione sul rapporto SSN',v.nota_rapporto_ssn,true)+field('Periodo / condizioni riportate',")
s=s.replace("body+=section('Aggiornamento e fonti',", "body+=section('Capienza documentata',field('Posti autorizzati',v.posti_autorizzati)+field('Posti accreditati',v.posti_accreditati)+field('Posti contrattualizzati',v.posti_contrattualizzati)+field('Posti dichiarati',v.posti_dichiarati)+field('Disponibilità attuale','Non rilevata: capienza e posti liberi non sono la stessa cosa.',true));\n  if(r.v79)body+=section('Riesame operativo V7.9',field('Data del riesame parziale',r.v79.checked_at)+field('Campi riesaminati',r.v79.fields.join(', '),true)+field('Limiti / note',r.v79.note||r.v79.scope,true));\n  body+=section('Aggiornamento e fonti',")
s=s.replace("field('Ultimo controllo delle informazioni',r.date", "field('Data documentale originaria (non aggiorna i campi non riesaminati)',r.date")
s=s.replace("'<h3>Quadro dei dati</h3>","'<h3>Quadro dei dataset di base, prima degli overlay correnti</h3>")
write('assets/servizi-v7-9.js',s)
s=load('assets/map-data-v7-8.js').replace("'/data/presidi_geo_v7_8.json'","'/data/presidi_geo_v7_9.json','/data/audit_operativo_v7_9.json'")
s=s.replace("if(result[3].status!=='fulfilled')missing.push('posizioni geografiche');","if(result[3].status!=='fulfilled')missing.push('posizioni geografiche');\n  if(result[4].status==='fulfilled')root.LazioAudit79.set(result[4].value);else missing.push('correzioni operative V7.9: dati precedenti da riconfermare');")
s=s.replace("if(!['address','street','verified'].includes(p.precision)","if(!['A','B','C'].includes(p.quality)||!['address','street','building','approximate'].includes(p.precision)")
start=s.index('function quality(');end=s.index('function addressAvailable',start)
s=s[:start]+'''function quality(p){
 if(!p)return 'Servizio non localizzato: posizione da verificare';
 if(p.quality==='A')return 'A · Indirizzo/civico documentato da fonte ufficiale; ingresso non verificato';
 if(p.quality==='B')return 'B · Indirizzo/civico coerente fra fonti; ingresso non verificato';
 if(p.quality==='C')return p.precision==='street'?'C · Posizione indicativa sulla via; civico non verificato':'C · Posizione cartografica indicativa; civico non verificato nella fonte del servizio';
 if(p.quality==='D')return 'D · Solo comune/località: nessun pin; posizione da verificare';
 return 'E · Servizio non localizzato';
}
''' +s[end:]
s=s.replace("const query=[row.address,row.town,'Italia'].join(', ');return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query);","return serviceLink(row,{});")
write('assets/map-data-v7-9.js',s)
s=load('assets/map-v7-8.js')
s=s.replace("street=points.filter(r=>G.position(r,geo).precision==='street')","street=points.filter(r=>G.position(r,geo).quality==='C')")
s=s.replace("' indicativi sulla via), '","' con posizione indicativa), '")
s=s.replace("G.quality(p),{class:'map-quality '+(p&&p.precision==='street'?'approx':'')}","G.quality(p||geo.records[row.key]),{class:'map-quality '+(p&&p.quality==='C'?'approx':'')}")
s=s.replace("if(G.addressAvailable(row))actions.append(link('Apri indirizzo ↗',G.external(row),true));","")
s=s.replace("section.append(link('Dettagli e contatti',G.serviceLink(row,state)),document.createTextNode(' · '),link('Apri indirizzo ↗',G.external(row),true));","section.append(link('Dettagli e contatti',G.serviceLink(row,state)));\n    if(p.address_source_url){const sourceLine=element('p');sourceLine.append(link('Fonte dell’indirizzo',p.address_source_url,true));section.append(sourceLine);}\n    section.append(element('p','Controllo cartografico: '+p.checked_at.slice(0,10)+'. '+(p.note||''),{class:'micro'}));")
s=s.replace("approx=group.every(x=>x.p.precision==='street')","approx=group.every(x=>x.p.quality==='C')").replace("const text=count>1?String(count):'•'","const text=count>1?String(count):(p.quality==='C'?'~':p.quality)")
s=s.replace("G.quality(p)));","G.quality(p||geo.records[row.key])));")
s=s.replace("Questo servizio non ha ancora una posizione univoca: puoi aprire l’indirizzo in una mappa esterna.","Questo servizio non ha ancora una posizione univoca. Consulta indirizzo, fonti e recapiti nella scheda; nessun pin viene inventato.")
s=s.replace("if(G.addressAvailable(row))$('map-selected').append(link('Apri indirizzo in una mappa esterna ↗',G.external(row),true));","$('map-selected').append(link('Apri scheda e contatti',G.serviceLink(row,state)));")
s=s.replace("p.precision==='street'?15:17","p.quality==='C'?15:17")
write('assets/map-v7-9.js',s)
s=load('assets/directory-v7-5.js')
s=s.replace('var extraSources=',"var auditSource=fetch('/data/audit_operativo_v7_9.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Audit non caricato');return r.json()});\nvar extraSources=")
s=s.replace('].concat(extraSources)).then(function(x)','].concat(extraSources).concat([auditSource])).then(function(x)')
s=s.replace('additional=x.slice(2).flatMap','audit=x[x.length-1],additional=x.slice(2,-1).flatMap')
s=s.replace('init(rows)}).catch',"rows=window.LazioAudit79.directory(c,rows,audit);init(rows)}).catch")
write('assets/directory-v7-9.js',s)
s=load('assets/audit-data-v7-9.js').replace("if(ev.fields.ssn_evidence_v79==='da-verificare')v.rapporto_ssn=ev.fields.nota_rapporto_ssn||'Da verificare per questa unità';", "if(ev.fields.ssn_evidence_v79==='da-verificare'){v.rapporto_ssn=ev.fields.nota_rapporto_ssn||'Da verificare per questa unità';v.stato='Rapporto SSN da verificare per questa unità';}")
write('assets/audit-data-v7-9.js',s)
for p in ['servizi.html','archivio.html','mappa.html']:
 s=load(p)
 if 'audit-data-v7-9.js' not in s:s=s.replace('<script defer="" src="/assets/servizi-data-v7-5-1.js"></script>','<script defer="" src="/assets/servizi-data-v7-5-1.js"></script><script defer="" src="/assets/audit-data-v7-9.js"></script>')
 s=s.replace('/assets/servizi-v7-5-1.js?v=7.8','/assets/servizi-v7-9.js').replace('/assets/map-data-v7-8.js','/assets/map-data-v7-9.js').replace('/assets/map-v7-8.js','/assets/map-v7-9.js').replace('data-ui-version="7.8"','data-ui-version="7.9"')
 if p=='mappa.html':
  s=re.sub(r'<p class="map-legend">.*?</p>','<p class="map-legend"><strong>A / B</strong>: indirizzo/civico documentato. <strong>~ C</strong>: posizione indicativa, non un ingresso verificato. <strong>D / E</strong>: nessun pin, servizio comunque in elenco. I numeri raggruppano servizi distinti.</p>',s)
  s=s.replace('apri l’indirizzo in una mappa esterna','consulta l’indirizzo e i recapiti nella scheda')
 write(p,s)
p='strutture-approfondite.html';s=load(p).replace('Informazioni verificate il 21/09/2026','Riesame V7.9 parziale: 22/09/2026').replace('Questa pagina espone in forma uniforme i campi già documentati nel baseline.','Questa pagina integra i dati precedenti con un riesame parziale V7.9; le date e i campi controllati sono indicati nelle singole schede.')
s=s.replace('<script src="/assets/directory-v7-5.js?v=7.7.5"></script>','<script src="/assets/audit-data-v7-9.js"></script><script src="/assets/directory-v7-9.js"></script>')
m=re.search(r'window.V75_CONFIG=(.*?);</script>',s);cfg=json.loads(m[1]);cfg['fields']+=['telefono','email','orari','accesso','autorizzazione_stato','accreditamento_stato','contratto_ssn_stato','costi','stato_servizio','riesame_v79','fonti_v79','note_v79']
cfg['fields']=list(dict.fromkeys(cfg['fields']));s=s[:m.start(1)]+json.dumps(cfg,ensure_ascii=False,separators=(',',':'))+s[m.end(1):];write(p,s)
print('Current frontends generated; historical assets preserved.')
