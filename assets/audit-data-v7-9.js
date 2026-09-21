/* Additive current overlay. Historical data and previous adapters are never mutated. */
(function(root){
'use strict';
const A=root.LazioServices,clone=x=>JSON.parse(JSON.stringify(x));let overlay=null;
const invalid=k=>['__proto__','constructor','prototype'].includes(k);
function validate(data){
 if(!data||data.version!=='7.9'||!Array.isArray(data.revisions)||!Array.isArray(data.additions))throw Error('Overlay operativo non valido');
 const seen=new Set();for(const x of data.revisions.concat(data.additions)){
  if(!/^(rete|moduli|privati):[A-Za-z0-9_-]+$/.test(x.service_key||'')||seen.has(x.service_key))throw Error('Identificativo operativo non valido o duplicato');
  seen.add(x.service_key);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(x.checked_at||'')||!Array.isArray(x.sources)||!x.sources.length||x.sources.some(u=>!/^https:\/\//.test(u)))throw Error('Provenienza operativa incompleta');
  if(Object.keys(x.fields||x.record||{}).some(invalid))throw Error('Campo operativo non valido');
 }return data;
}
function set(data){overlay=validate(clone(data));}
function changes(key){return overlay&&overlay.revisions.find(x=>x.service_key===key);}
function applyRaw(raw,revision){const v=clone(raw);Object.assign(v,clone(revision.fields));v._riesame_v79={checked_at:revision.checked_at,fields:Object.keys(revision.fields),sources:revision.sources,note:revision.note,scope:revision.scope};return v;}
function phone(v){const cleaned=String(v||'').replace(/\([^)]*\)/g,'');const m=cleaned.match(/(?:\+39[\s.]*)?(?:0\d|3\d)[\d\s.\-]{5,}\d/);return m?m[0].replace(/[^+\d]/g,''):'';}
function email(v){return (String(v||'').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)||[])[0]||'';}
function annotate(row,ev){
 const v=row.raw;row.v79={checked_at:ev.checked_at,fields:Object.keys(ev.fields||ev.record||{}),sources:ev.sources,note:ev.note||'',scope:ev.scope};row.auditDate=ev.checked_at;row.sources=[...new Set(row.sources.concat(ev.sources))];
 if(ev.fields){const f=ev.fields;
  if('denominazione' in f||'nome' in f)row.name=A.nd(v.denominazione||v.nome);
  if('indirizzo' in f||'sede' in f)row.address=A.nd(v.indirizzo||v.sede);
  if('comune' in f)row.town=A.nd(v.comune);
  if('telefono' in f||'contatti' in f)row.phone=phone(v.telefono||v.contatti);
  if('email' in f)row.email=email(v.email);
  if('accesso' in f||'ammissione' in f)row.access=A.nd(v.accesso||v.ammissione||v.prenotazione);
  if('servizi' in f)row.services=A.nd(v.servizi);
 }
 if('autorizzazione_stato' in (ev.fields||{}))row.auth=A.evidence(v.autorizzazione_stato);
 if('accreditamento_stato' in (ev.fields||{}))row.accreditation=A.evidence(v.accreditamento_stato);
 if(['indicata','dichiarazione','da-verificare','rete-asl'].includes(v.ssn_evidence_v79))row.ssn=v.ssn_evidence_v79;
 row.serviceState=v.stato_servizio||'';row.search=A.norm([row.name,row.type,row.subtype,row.town,row.address,row.asl,row.regime,row.services,JSON.stringify(v)].join(' '));return row;
}
if(A){const base=A.build;A.build=function(data,privateData){
 const rows=base(data,privateData).map(r=>clone(r));if(!overlay)return rows;
 const known=new Set(rows.map(r=>r.key));for(const r of rows){const ev=changes(r.key);if(ev){r.raw=applyRaw(r.raw,ev);annotate(r,ev);}}
 const newData={rete_asl:[],moduli:[]},newPrivate={records:[]};
 for(const e of overlay.additions){if(known.has(e.service_key))throw Error('Nuova unità già presente');const raw=clone(e.record);if(e.origin==='rete')newData.rete_asl.push(raw);else if(e.origin==='moduli')newData.moduli.push(raw);else newPrivate.records.push(raw);}
 const wanted=new Map(overlay.additions.map(e=>[e.service_key,e]));const added=base(newData,newPrivate).filter(r=>wanted.has(r.key)).map(r=>annotate(r,wanted.get(r.key)));
 if(added.length!==overlay.additions.length)throw Error('Overlay operativo non interamente normalizzato');return rows.concat(added);
};}
function directory(category,rows,data){
 validate(data);if(category!=='strutture')return rows;
 const revisions=new Map(data.revisions.map(x=>[x.service_key,x]));const result=rows.map(r=>{
  const id=String(r.id_modulo||r.id||''),ev=revisions.get('moduli:'+id)||revisions.get('rete:'+id);if(!ev)return r;
  const v=applyRaw(r,ev);if(ev.fields.denominazione)v.struttura=ev.fields.denominazione;if(ev.fields.indirizzo)v.sede=ev.fields.indirizzo;
  const aliases={telefono:'contatti',orari:'orari_segreteria',autorizzazione_stato:'autorizzazione',accreditamento_stato:'accreditamento',contratto_ssn_stato:'contratto_ssn'};
  Object.entries(aliases).forEach(([k,a])=>{if(k in ev.fields)v[a]=ev.fields[k];});
  if(ev.fields.ssn_evidence_v79==='da-verificare')v.rapporto_ssn=ev.fields.nota_rapporto_ssn||'Da verificare per questa unità';
  v.riesame_v79='Parziale: '+ev.checked_at;v.fonti_v79=ev.sources.join(' | ');v.note_v79=ev.note;return v;
 });
 const known=new Set(result.map(r=>String(r.id_modulo||r.id)));
 for(const e of data.additions){if(e.origin==='privati')continue;const id=e.service_key.split(':')[1];if(known.has(id))continue;const v=clone(e.record);v.riesame_v79='Nuovo servizio: '+e.checked_at;v.note_v79=e.scope;result.push(v);known.add(id);}return result;
}
root.LazioAudit79={set,validate,applyRaw,directory};
})(typeof window==='object'?window:globalThis);
