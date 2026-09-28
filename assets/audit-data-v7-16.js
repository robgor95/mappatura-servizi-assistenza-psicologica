/* V7.16: conservative geographic follow-up. No network or storage. */
(function(root){
'use strict';
const A=root.LazioServices,copy=x=>JSON.parse(JSON.stringify(x));let overlay=null;
const fields=new Set(['indirizzo','comune','stato_servizio','nota_geografia_v716']);
function validate(d){
 if(!d||d.version!=='7.16'||!Array.isArray(d.revisions)||!Array.isArray(d.additions)||d.additions.length)throw Error('Overlay V7.16 non valido');
 const seen=new Set();for(const e of d.revisions){
  if(!/^(rete|moduli|privati):[A-Za-z0-9_-]+$/.test(e.service_key||'')||seen.has(e.service_key))throw Error('Identificativo V7.16 non valido');seen.add(e.service_key);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(e.checked_at||'')||!Array.isArray(e.sources)||!e.sources.length||e.sources.some(u=>!/^https:\/\//.test(u)))throw Error('Provenienza V7.16 incompleta');
  if(!e.fields||!Object.keys(e.fields).length||Object.keys(e.fields).some(k=>!fields.has(k)||typeof e.fields[k]!=='string'||!e.evidence?.[k]?.sources?.length))throw Error('Campo V7.16 non ammesso o privo di fonte');
 }return d;
}
function set(d){overlay=validate(copy(d));}
function raw(r,e){const v=copy(r);Object.assign(v,copy(e.fields));v._riesame_v716={checked_at:e.checked_at,fields:Object.keys(e.fields),sources:e.sources,note:e.note,scope:e.scope,status:e.status};return v;}
if(A){const previous=A.build;A.build=function(data,privateData){
 const rows=previous(data,privateData).map(copy);if(!overlay)return rows;
 const rev=new Map(overlay.revisions.map(e=>[e.service_key,e]));
 for(const r of rows){const e=rev.get(r.key);if(!e)continue;
  const v=r.raw=raw(r.raw,e);r.v716=copy(v._riesame_v716);r.auditDate=e.checked_at;r.sources=[...new Set(r.sources.concat(e.sources))];
  if('indirizzo' in e.fields)r.address=A.nd(e.fields.indirizzo);
  if('comune' in e.fields)r.town=A.nd(e.fields.comune);
  if('stato_servizio' in e.fields)r.serviceState=A.nd(e.fields.stato_servizio);
  r.search=A.norm([r.search,r.address,r.town,r.serviceState||'',JSON.stringify(e.fields)].join(' '));
 }return rows;
};}
function directory(category,rows,d){
 validate(d);if(!['strutture','privati'].includes(category))return rows;
 const rev=new Map(d.revisions.map(e=>[e.service_key,e]));return rows.map(r=>{
  const id=r.id_modulo||r.id;const e=category==='privati'?rev.get('privati:'+id):(rev.get('moduli:'+id)||rev.get('rete:'+id));
  if(!e)return r;const v=raw(r,e);if('indirizzo' in e.fields)v.sede=e.fields.indirizzo;if('comune' in e.fields)v.comune=e.fields.comune;if('stato_servizio' in e.fields)v.stato_servizio=e.fields.stato_servizio;
  v.riesame_v716='Documentale, per campo: '+e.checked_at;v.fonti_v716=e.sources.join(' | ');v.note_v716=e.note;return v;
 });
}
root.LazioAudit716={set,validate,directory};
})(typeof window==='object'?window:globalThis);
