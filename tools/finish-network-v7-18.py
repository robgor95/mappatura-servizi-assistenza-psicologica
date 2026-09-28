#!/usr/bin/env python3
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def patch(path,old,new):
 p=ROOT/path;s=p.read_text()
 if old not in s:
  if new in s:return
  raise ValueError('Anchor missing: '+path+' '+old[:65])
 p.write_text(s.replace(old,new))
# Ignore both real dependency folders and temporary dependency symlinks.
p=ROOT/'.gitignore';p.write_text(p.read_text()+'\n/node_modules\n')
# Human-readable choices; no collaborator has to know an internal enum value.
patch('assets/admin-v7-18.mjs',"const val=field(g,'Nuovo valore / valore controllato','textarea',value,true);val.readOnly=mode.value==='confirm';", "const enumField=['ssn','auth','accreditation'].includes(key),opts=[['da-verificare','Da verificare'],['indicata','Documentato da fonte istituzionale'],['dichiarazione','Dichiarato dal gestore'],...(rec.origin==='rete'?[['rete-asl','Rete pubblica / ASL']]:[])];const val=enumField?select(g,'Nuovo valore / valore controllato',opts,value||'da-verificare',true):field(g,'Nuovo valore / valore controllato',key==='contractedBeds'?'number':'textarea',value,true);val.readOnly=mode.value==='confirm';if(enumField)val.disabled=mode.value==='confirm';")
patch('assets/admin-v7-18.mjs',"c.val.readOnly=mode.value==='confirm';if(c.val.readOnly)","c.val.readOnly=mode.value==='confirm';if(c.val.tagName==='SELECT')c.val.disabled=mode.value==='confirm';if(c.val.readOnly)")
# Keep field-specific sources available without showing internal audit details.
patch('assets/supporto-v7-18.js',"function card(r){", "function extraSources(r){const urls=[...new Set(r.source_urls||[])].filter(u=>u!==r.source_url&&/^https:\/\//.test(u));return urls.length?'<details class=\"ng-public-sources\"><summary>Altre fonti delle informazioni</summary>'+urls.map(u=>'<p><a href=\"'+esc(u)+'\" rel=\"noopener noreferrer\" target=\"_blank\">'+esc(u)+'</a></p>').join('')+'</details>':'';}\nfunction card(r){")
patch('assets/supporto-v7-18.js',"+(window.LazioEditorial?.freshnessHTML(r)||'')+'</article>'", "+(window.LazioEditorial?.freshnessHTML(r)||'')+extraSources(r)+'</article>'")
patch('assets/supporto-v7-18.js',">Chiama</a>",">'+(r.phone?'Chiama':'Chiama per informazioni')+'</a>")
patch('assets/directory-v7-18.js',"return out+(window.LazioEditorial?.freshnessHTML(r)||'')+\"</article>\"", "const addedSources=[...new Set(Object.values(r._editorial_meta||{}).flatMap(m=>m.sources||[]))];if(addedSources.length)out+='<details class=\"ng-public-sources\"><summary>Fonti degli aggiornamenti</summary>'+addedSources.map(u=>'<p><a href=\"'+esc(u)+'\" rel=\"noopener noreferrer\" target=\"_blank\">'+esc(u)+'</a></p>').join('')+'</details>';return out+(window.LazioEditorial?.freshnessHTML(r)||'')+\"</article>\"")
# Runtime check of approved overlays, not just unit checks of the private API.
p=ROOT/'tools/test-network-v7-18.mjs';s=p.read_text();anchor="await test('Editor panel composes drafts and has no data administration controls',"
assert anchor in s
extra=r'''
await test('Approved field corrections reach both public directories and invalidate old map pins',async()=>{
 browserEnv.EDITORIAL_ENABLED='true';const clinical=records.records.find(r=>r.key==='rete:R1-01'),support=records.records.find(r=>r.key==='support:PUA-001'),day='2026-09-28',source='https://www.aslroma1.it/test-documentale';
 const add=(record,values)=>{const meta=Object.fromEntries(Object.keys(values).map(k=>[k,{checked_at:day,changed:true,uncertain:false,sources:[source],author:'PRIVATE_REVIEWER_SENTINEL',approver:'PRIVATE_APPROVER_SENTINEL'}])),base=Object.fromEntries(Object.keys(values).map(k=>[k,record.fields[k]||'']));browserDB.sql.prepare('INSERT INTO cms_overrides(target,entity,values_json,meta_json,base_values,published_at) VALUES(?,?,?,?,?,?)').run(record.key,record.entity,JSON.stringify(values),JSON.stringify(meta),JSON.stringify(base),new Date().toISOString());};
 add(clinical,{phone:'06 12345678',address:'Via di prova del collaudo 99, Roma'});add(support,{phone:'06 99887766'});
 const {c,p}=await context(1440);await p.goto(BASE+'/servizi.html?scheda=rete%3AR1-01',{waitUntil:'networkidle'});await p.locator('#svc-dialog[open]').waitFor();assert.match(await p.locator('#svc-dialog').innerText(),/Via di prova del collaudo/);assert.match(await p.locator('#svc-dialog .ng-freshness').innerText(),/Dati aggiornati/);assert.equal(await p.locator('#svc-dialog a[href="tel:0612345678"]').count()>0,true);
 await p.goto(BASE+'/mappa.html',{waitUntil:'networkidle'});await p.locator('#map-level-coverage').filter({hasText:/378 localizzate/}).waitFor();assert.match(await p.locator('#map-level-coverage').innerText(),/65 senza/);
 await p.goto(BASE+'/supporto-territoriale.html?q=Eroi&categoria=PUA',{waitUntil:'networkidle'});await p.locator('#support-controls:not([hidden])').waitFor();assert.equal(await p.locator('#support-grid a[href="tel:0699887766"]').count(),1);assert.equal(await p.locator('#support-grid a[href="'+source+'"]').count(),1);
 const publicRevision=await p.request.get(BASE+'/api/public/revisions'),json=await publicRevision.text();assert(!json.includes('PRIVATE_REVIEWER_SENTINEL'));assert(!json.includes('PRIVATE_APPROVER_SENTINEL'));await c.close();browserDB.sql.exec('DELETE FROM cms_overrides');
});
'''
s=s.replace(anchor,extra+'\n'+anchor);p.write_text(s)
print('Interfaccia dei campi, fonti pubbliche e test proiezione dati completati.')
