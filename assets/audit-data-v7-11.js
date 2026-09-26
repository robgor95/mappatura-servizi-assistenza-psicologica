/* V7.11: strictly scoped, additive operational overlay. No network or storage. */
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
