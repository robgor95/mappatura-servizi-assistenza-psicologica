/* V7.14 hierarchy helpers. Presentation-only: no geocoding or clinical inference. */
(function(root){
'use strict';
const P=root.LazioProvinceCore;
const expected={VT:60,RI:73,RM:121,LT:33,FR:91};
const cleanAsl=v=>String(v||'').trim()||'Non documentata';
function municipality(row,index){
 const key=P.normalize(row.town),alias=index.aliases?.[key],entry=index.municipalities[key]||index.municipalities[alias?.municipality];
 return entry?{name:entry.name,istat:entry.istat,province:entry.province,basis:alias?'alias_esplicito':'comune_istat'}:null;
}
function validateMunicipalGeometry(data,province){
 if(!P.codes.includes(province)||data?.type!=='FeatureCollection'||data?.version!=='7.14'||data?.province!==province||data?.features?.length!==expected[province])throw Error('Confini comunali '+province+' non validi');
 const seen=new Set();
 for(const f of data.features){const p=f.properties;if(!p||p.province!==province||!p.istat||!p.name||seen.has(p.istat)||!['Polygon','MultiPolygon'].includes(f.geometry?.type))throw Error('Comune non valido in '+province);seen.add(p.istat);if(!Array.isArray(p.label)||p.label.length!==2||!p.label.every(Number.isFinite))throw Error('Etichetta comune non valida');}
 return data;
}
function without(state,...keys){const x={...state};keys.flat().forEach(k=>delete x[k]);return x;}
function byMunicipality(rows,state,matches,index,geo,position){
 const base=without(state,'comune');
 const eligible=rows.filter(r=>matches(r,base));
 const out=new Map();
 for(const r of eligible){const m=municipality(r,index);if(!m)continue;let x=out.get(m.name);if(!x){x={name:m.name,istat:m.istat,province:m.province,total:0,located:0,unlocated:0};out.set(m.name,x);}x.total++;if(geo&&position(r,geo))x.located++;else if(geo)x.unlocated++;}
 return [...out.values()].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'it'));
}
function byAsl(rows,state,matches){
 const base=without(state,'asl','comune'),eligible=rows.filter(r=>matches(r,base)),m=new Map();
 for(const r of eligible){const k=cleanAsl(r.asl);m.set(k,(m.get(k)||0)+1);}
 return [...m.entries()].map(([name,total])=>({name,total,documented:name!=='Non documentata'})).sort((a,b)=>{if(a.documented!==b.documented)return a.documented?-1:1;return a.name.localeCompare(b.name,'it');});
}
function breadcrumb(state,mode){
 const items=[{kind:'region',label:'Lazio'}];
 if(state.provincia)items.push({kind:'province',label:state.provincia==='RM'?'Roma · città metropolitana':P.names[state.provincia]});
 if(mode==='sanitaria'&&state.asl)items.push({kind:'asl',label:state.asl});
 if(state.comune)items.push({kind:'municipality',label:state.comune});
 return items;
}
const api={expected,municipality,validateMunicipalGeometry,without,byMunicipality,byAsl,breadcrumb,cleanAsl};
if(typeof module==='object'&&module.exports)module.exports=api;else root.LazioMapHierarchyCore=api;
})(typeof window==='object'?window:globalThis);
