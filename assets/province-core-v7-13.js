/* Province attribution and summaries, separate from service and administrative evidence. */
(function(root){
'use strict';
const codes=['VT','RI','RM','LT','FR'];
const names={VT:'Viterbo',RI:'Rieti',RM:'Roma',LT:'Latina',FR:'Frosinone',ND:'Territorio da verificare'};
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function validateIndex(index){
 if(!index||index.version!=='7.13'||!index.municipalities||!index.source||index.source.reference_date!=='2026-01-01')throw Error('Indice territoriale non valido');
 if(Object.keys(index.municipalities).length!==378||Object.values(index.municipalities).some(x=>!codes.includes(x.province)))throw Error('Comuni/province non validi');
 return index;
}
function province(row,index){
 const key=normalize(row.town),alias=index.aliases?.[key];
 const municipality=index.municipalities[key]||index.municipalities[alias?.municipality];
 return municipality?{code:municipality.province,basis:alias?'comune_esplicito_con_localita':'comune_istat',municipality:municipality.name}:{code:'ND',basis:'comune_non_riconciliato',municipality:null};
}
function assign(rows,index){validateIndex(index);return rows.map(r=>{const p=province(r,index);return {...r,territory:p.code,provinceEvidence:p};});}
function administration(row){
 const ownership=row.ownership==='Da verificare'?'unknown':row.origin==='rete'?'public':'non_asl';
 const ssn=row.origin==='rete'?'network':row.ssn==='indicata'?'sourced':row.ssn==='dichiarazione'?'declared':'unknown';
 const labels={public:'Rete pubblica / ASL',non_asl:'Privata / non ASL',unknown:'Gestione da verificare'};
 const ssnLabels={network:'Servizio della rete ASL',sourced:'Rapporto SSN indicato nelle fonti',declared:'Rapporto SSN dichiarato dal gestore',unknown:'Rapporto SSN da verificare'};
 return {ownership,ssn,label:labels[ownership],ssnLabel:ssnLabels[ssn],symbol:{public:'ASL',non_asl:'P',unknown:'?'}[ownership]};
}
function summary(rows,geo,position){
 const s={total:rows.length,located:geo?0:null,unlocated:geo?0:null,indicative:geo?0:null,ownership:{public:0,non_asl:0,unknown:0},ssn:{network:0,sourced:0,declared:0,unknown:0}};
 rows.forEach(r=>{const a=administration(r);s.ownership[a.ownership]++;s.ssn[a.ssn]++;if(geo){const p=position(r,geo);if(p){s.located++;if(p.quality==='C')s.indicative++;}else s.unlocated++;}});
 return s;
}
function byProvince(rows,state,matches,geo,position){
 const withoutProvince={...state};delete withoutProvince.provincia;
 const eligible=rows.filter(r=>matches(r,withoutProvince));
 return Object.fromEntries(codes.concat('ND').map(code=>[code,summary(eligible.filter(r=>r.territory===code),geo,position)]));
}
function validateGeometry(data){
 if(data?.type!=='FeatureCollection'||data.features?.length!==5)throw Error('Confini delle province non validi');
 const seen=new Set();
 data.features.forEach(f=>{const p=f.properties;if(!codes.includes(p?.code)||seen.has(p.code)||!['Polygon','MultiPolygon'].includes(f.geometry?.type))throw Error('Provincia non valida');seen.add(p.code);
 if(!Array.isArray(p.label)||p.label.length!==2||!p.label.every(Number.isFinite))throw Error('Etichetta territoriale non valida');});
 return data;
}
const api={codes,names,normalize,validateIndex,province,assign,administration,summary,byProvince,validateGeometry};
if(typeof module==='object'&&module.exports)module.exports=api;else root.LazioProvinceCore=api;
})(typeof window==='object'?window:globalThis);
