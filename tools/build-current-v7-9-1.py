"""Generate current entrypoints; leave every preceding overlay/asset untouched."""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def read(p):return (R/p).read_text()
def write(p,t):(R/p).write_text('\n'.join(x.rstrip() for x in t.splitlines())+'\n',encoding='utf-8')
# Map: exact same previous data layers, followed by the new field overlay.
s=read('assets/map-data-v7-9.js').replace("'/data/presidi_geo_v7_9.json'","'/data/presidi_geo_v7_9_1.json'").replace("'/data/audit_operativo_v7_9.json'].map(json)","'/data/audit_operativo_v7_9.json','/data/audit_operativo_v7_9_1.json'].map(json)")
s=s.replace('  return {data,rows:A.build',"  if(result[5].status==='fulfilled')root.LazioAudit791.set(result[5].value);else missing.push('correzioni operative V7.9.1: dati precedenti da riconfermare');\n  return {data,rows:A.build")
s=s.replace("if(p.quality==='A')return 'A · Indirizzo/civico documentato da fonte ufficiale; ingresso non verificato';", "if(p.quality==='A')return p.precision==='building'?'A · Complesso/edificio e indirizzo documentati; ingresso non verificato':'A · Indirizzo/civico documentato da fonte ufficiale; ingresso non verificato';")
s=s.replace("if(p.quality==='C')return p.precision==='street'?","if(p.quality==='C'&&p.precision==='building')return 'C · Complesso ospedaliero indicativo; reparto e ingresso non verificati';\n if(p.quality==='C')return p.precision==='street'?")
write('assets/map-data-v7-9-1.js',s)
# Search: retain old warnings and show additional per-field review separately.
s=read('assets/servizi-v7-9.js').replace('[base,extra,multisite,audit]','[base,extra,multisite,audit,current]').replace("getJSON('/data/audit_operativo_v7_9.json')","getJSON('/data/audit_operativo_v7_9.json'),\n    getJSON('/data/audit_operativo_v7_9_1.json')")
s=s.replace("  rows=A.build(D", "  if(current.status==='fulfilled')window.LazioAudit791.set(current.value);\n  rows=A.build(D")
s=s.replace("&&audit.status==='fulfilled')$('svc-load-status')","&&audit.status==='fulfilled'&&current.status==='fulfilled')$('svc-load-status')")
s=s.replace("    $('svc-load-status').textContent=", "    if(current.status!=='fulfilled')missing.push('le correzioni operative V7.9.1 (dati precedenti da riconfermare)');\n    $('svc-load-status').textContent=")
# Prevent the navigation's data-open flag from being interpreted as a service key.
s=s.replace("e.target.closest('[data-open]')","e.target.closest('a[data-open]')")
s=s.replace("  body+=sourceLinks(r.sources);", "  if(r.v791)body+=section('Riesame operativo V7.9.1',field('Campi riesaminati',r.v791.fields.join(', '),true)+field('Data del controllo documentale',r.v791.checked_at)+field('Ambito e limiti',r.v791.scope,true)+field('Note della verifica',r.v791.note,true));\n  body+=sourceLinks(r.sources);")
s=s.replace("field('Orari',v.orari,true)","field('Orari',v.orari,true)+field('Recapito: tipo e limiti',v.note_contatti||v.nota_contatti,true)+field('Sito ufficiale',v.sito_ufficiale,true)")
s=s.replace("field('Indirizzo',r.address,true)","field('Indirizzo',r.address,true)+field('Precisazioni sulla sede',v.nota_indirizzo||v.sede_dettaglio,true)")
s=s.replace("field('Posti dichiarati',v.posti_dichiarati)","field('Posti dichiarati',v.posti_dichiarati)+field('Precisazioni e discordanze',v.nota_posti,true)")
s=s.replace("+'</p><div class=\"svc-card-footer\">","+'</p>'+(r.serviceState?'<p class=\"svc-admin-note\" data-service-state><strong>Stato del servizio:</strong> '+esc(r.serviceState)+'</p>':'')+'<div class=\"svc-card-footer\">")
write('assets/servizi-v7-9-1.js',s)
# Structure directory consumes the same overlays in the same order.
s=read('assets/directory-v7-9.js')
s=s.replace('var extraSources=',"var currentSource=fetch('/data/audit_operativo_v7_9_1.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Audit corrente non caricato');return r.json()});\nvar extraSources=")
s=s.replace('.concat([auditSource])','.concat([auditSource,currentSource])').replace('audit=x[x.length-1],additional=x.slice(2,-1)','audit=x[x.length-2],current=x[x.length-1],additional=x.slice(2,-2)')
s=s.replace('rows=window.LazioAudit79.directory(c,rows,audit);init(rows)','rows=window.LazioAudit79.directory(c,rows,audit);rows=window.LazioAudit791.directory(c,rows,current);init(rows)')
write('assets/directory-v7-9-1.js',s)
# Keep map interaction code local; show coordinate notes and checking date in every popup.
s=read('assets/map-v7-9.js')
s=s.replace("    if(p.address_source_url)","    if(p.note)section.append(element('p',p.note,{class:'micro'}));\n    if(p.checked_at)section.append(element('p','Controllo geografico: '+p.checked_at,{class:'micro'}));\n    if(p.address_source_url)")
s=s.replace("    const actions=element('div'","    if(row.serviceState)li.append(element('p','Stato: '+row.serviceState,{class:'micro','data-service-state':''}));\n    const actions=element('div'")
write('assets/map-v7-9-1.js',s)
for file in ['servizi.html','archivio.html','mappa.html','strutture-approfondite.html']:
 s=read(file)
 if 'audit-data-v7-9-1.js' not in s:s=s.replace('<script src="/assets/audit-data-v7-9.js" defer></script>','<script src="/assets/audit-data-v7-9.js" defer></script>\n<script src="/assets/audit-data-v7-9-1.js" defer></script>')
 # Handle actual attribute ordering without guessing: check below.
 if 'audit-data-v7-9-1.js' not in s:
  import re
  s=re.sub(r'(<script[^>]+src="/?assets/audit-data-v7-9\.js"[^>]*></script>)',r'\1\n<script defer src="/assets/audit-data-v7-9-1.js"></script>',s)
 for name in ['map-data','map','servizi','directory']:s=s.replace(name+'-v7-9.js',name+'-v7-9-1.js')
 if file=='strutture-approfondite.html':
  s=s.replace('<script defer src="/assets/audit-data-v7-9-1.js"></script>','<script src="/assets/audit-data-v7-9-1.js"></script>').replace('<script src="/assets/audit-data-v7-9-1.js" defer></script>','<script src="/assets/audit-data-v7-9-1.js"></script>')
  if '"riesame_v791"' not in s:s=s.replace('"note_v79"]','"note_v79","riesame_v791","fonti_v791","note_v791","nota_posti","nota_indirizzo","sito_ufficiale","pec_amministrativa"]')
 assert 'audit-data-v7-9-1.js' in s,file
 write(file,s)
print('Current assets and four entrypoints generated; previous assets unchanged.')
