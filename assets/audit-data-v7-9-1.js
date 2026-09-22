/* Current additive field overlay; all preceding snapshots remain immutable. */
(function(root){
'use strict';
const A=root.LazioServices,copy=x=>JSON.parse(JSON.stringify(x));let overlay=null;
function validate(d){
 if(!d||d.version!=='7.9.1'||!Array.isArray(d.revisions)||!Array.isArray(d.additions))throw Error('Overlay corrente non valido');
 const seen=new Set();for(const e of d.revisions.concat(d.additions)){
  if(!/^(rete|moduli|privati):[A-Za-z0-9_-]+$/.test(e.service_key||'')||seen.has(e.service_key))throw Error('Identificativo corrente non valido');seen.add(e.service_key);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(e.checked_at||'')||!Array.isArray(e.sources)||!e.sources.length||e.sources.some(u=>!/^https:\/\//.test(u)))throw Error('Provenienza corrente incompleta');
  if(Object.keys(e.fields||e.record||{}).some(k=>['__proto__','constructor','prototype'].includes(k)))throw Error('Campo non ammesso');
  if(e.fields&&(!e.evidence||Object.keys(e.fields).some(k=>!e.evidence[k]||!e.evidence[k].sources?.length)))throw Error('Fonte per campo mancante');
 }return d;
}
function set(d){overlay=validate(copy(d));}
function raw(r,e){const v=copy(r);Object.assign(v,copy(e.fields||{}));v._riesame_v791={checked_at:e.checked_at,fields:Object.keys(e.fields||e.record||{}),sources:e.sources,note:e.note,scope:e.scope};return v;}
function annotate(r,e){
 const v=r.raw;r.v791={checked_at:e.checked_at,fields:Object.keys(e.fields||e.record||{}),sources:e.sources,note:e.note||'',scope:e.scope};r.auditDate=e.checked_at;r.sources=[...new Set(r.sources.concat(e.sources))];
 r.name=A.nd(v.denominazione||v.nome);r.address=A.nd(v.indirizzo||v.sede);r.town=A.nd(v.comune)||r.town;
 r.type=A.typeOf(v,r.origin);r.subtype=String(v.tipo||v.modulo||v.tipologia||'');r.asl=A.asl(v.asl||v.asl_territoriale);r.territory=A.territory(v,r.asl);r.regime=A.regimeOf(v,r.origin,r.type);
 r.phone=A.phone(v.telefono||v.contatti);r.email=A.email(v.email);r.access=A.nd(v.accesso||v.ammissione||v.prenotazione);r.services=A.nd(v.servizi||v.servizi_dichiarati);
 r.admin={autorizzazione:v.autorizzazione_stato||v.autorizzazione_sanitaria,accreditamento:v.accreditamento_stato||v.accreditamento,ssn:v.contratto_ssn_stato||v.convenzione_ssn};
 if(r.origin!=='rete'){r.auth=A.evidence(r.admin.autorizzazione);r.accreditation=A.evidence(r.admin.accreditamento);r.ssn=['indicata','dichiarazione','da-verificare'].includes(v.ssn_evidence_v791)?v.ssn_evidence_v791:r.ssn;}
 r.mobility=A.hasInfo(v.accesso_fuori_lazio_stato)||A.hasInfo(v.accesso_extraregionale)||A.hasInfo(v.mobilita_intraregionale)||!!String(v.condizioni_extraregionale||'');
 r.extra=A.hasInfo(v.accesso_fuori_lazio_stato)||A.hasInfo(v.accesso_extraregionale);r.beds=['posti_autorizzati','posti_accreditati','posti_contrattualizzati','posti_dichiarati','posti'].some(k=>/\d/.test(String(v[k]||'')));
 r.serviceState=v.stato_servizio||r.serviceState||'';
 r.search=A.norm([r.name,r.type,r.subtype,r.town,r.address,r.asl,r.regime,r.services,JSON.stringify(v)].join(' '));return r;
}
if(A){const previous=A.build;A.build=function(data,privateData){
 const rows=previous(data,privateData).map(copy);if(!overlay)return rows;
 const rev=new Map(overlay.revisions.map(e=>[e.service_key,e])),known=new Set(rows.map(r=>r.key));
 for(const r of rows){const e=rev.get(r.key);if(e){r.raw=raw(r.raw,e);annotate(r,e);}}
 for(const e of overlay.additions){if(known.has(e.service_key))throw Error('Servizio aggiunto già presente');
  const d={rete_asl:[],moduli:[]},p={records:[]};if(e.origin==='rete')d.rete_asl.push(copy(e.record));else if(e.origin==='moduli')d.moduli.push(copy(e.record));else p.records.push(copy(e.record));
  const added=previous(d,p).find(r=>r.key===e.service_key);if(!added)throw Error('Servizio aggiunto non normalizzato');rows.push(annotate(added,e));known.add(e.service_key);
 }return rows;
};}
function directory(category,rows,d){
 validate(d);if(category!=='strutture')return rows;
 const rev=new Map(d.revisions.map(e=>[e.service_key,e]));const out=rows.map(r=>{
  const id=r.id_modulo||r.id,e=rev.get('moduli:'+id)||rev.get('rete:'+id);if(!e)return r;const v=raw(r,e),f=e.fields;
  const aliases={denominazione:'struttura',indirizzo:'sede',telefono:'contatti',orari:'orari_segreteria',tipo:'tipologia_modulo',modulo:'tipologia_modulo',autorizzazione_stato:'autorizzazione',accreditamento_stato:'accreditamento',contratto_ssn_stato:'contratto_ssn'};
  for(const [k,a] of Object.entries(aliases))if(k in f)v[a]=f[k];
  v.riesame_v791='Parziale: '+e.checked_at;v.fonti_v791=e.sources.join(' | ');v.note_v791=e.note;
  return v;
 });const known=new Set(out.map(r=>String(r.id_modulo||r.id)));
 for(const e of d.additions){if(e.origin==='privati')continue;const id=e.service_key.split(':')[1];if(known.has(id))throw Error('Duplicazione nella directory');const v=copy(e.record);v.struttura=v.denominazione||v.nome;v.tipologia_modulo=v.tipo||v.modulo;v.sede=v.indirizzo;v.riesame_v791='Nuovo servizio: '+e.checked_at;v.fonti_v791=e.sources.join(' | ');v.note_v791=e.note;out.push(v);known.add(id);}return out;
}
root.LazioAudit791={set,validate,directory};
})(typeof window==='object'?window:globalThis);
