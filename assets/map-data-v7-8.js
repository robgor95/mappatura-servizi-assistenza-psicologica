/* Static service data and geography. No live geocoding, location lookup or storage. */
(function(root){
'use strict';
const A=root.LazioServices;
async function json(url){const c=new AbortController(),t=setTimeout(()=>c.abort(),18000);try{const r=await fetch(url,{signal:c.signal});if(!r.ok)throw new Error('Caricamento non riuscito');return await r.json();}finally{clearTimeout(t);}}
async function load(){
  const result=await Promise.allSettled(['/data/portal_data_v7_3.json','/data/privati_v7_5.json','/data/multisede_v7_7_5.json','/data/presidi_geo_v7_8.json'].map(json));
  if(result[0].status!=='fulfilled')throw new Error('I servizi non sono stati caricati.');
  const data=result[0].value, missing=[];
  if(result[2].status==='fulfilled'){
    const seen=new Set(data.moduli.map(r=>String(r.id_modulo||r.id)));
    (result[2].value.records||[]).forEach(r=>{const id=String(r.id_modulo||r.id);if(id&&!seen.has(id)){data.moduli.push(r);seen.add(id);}});
  }else missing.push('integrazioni multisede');
  if(result[1].status!=='fulfilled')missing.push('servizi privati');
  if(result[3].status!=='fulfilled')missing.push('posizioni geografiche');
  return {data,rows:A.build(data,result[1].status==='fulfilled'?result[1].value:null),geo:result[3].status==='fulfilled'?result[3].value:{records:{}},missing};
}
function position(row,geo){const p=(geo.records||{})[row.key];
  if(!p||!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||p.lat<40.7||p.lat>42.95||p.lng<11.3||p.lng>14.1)return null;
  if(!['address','street','verified'].includes(p.precision)||p.source_address!==row.address||p.source_town!==row.town||!/^https:\/\//.test(p.source_url||''))return null;
  return p;
}
function quality(p){return !p?'Posizione da verificare':p.precision==='street'?'Posizione indicativa sulla via':p.precision==='verified'?'Posizione verificata su fonte':'Indirizzo localizzato automaticamente';}
function addressAvailable(row){return !!row.address&&!/non document|da verificar|^nd\b/i.test(row.address);}
function external(row){const query=[row.address,row.town,'Italia'].join(', ');return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query);}
function mapLink(row){return '/mappa.html?presidio='+encodeURIComponent(row.key);}
function serviceLink(row,state){const p=new URLSearchParams();A.filterKeys.forEach(k=>{if(state&&state[k])p.set(k,state[k]);});p.set('scheda',row.key);return '/servizi.html?'+p;}
function group(rows,geo,project,cell=52){const groups=new Map();rows.forEach(row=>{const p=position(row,geo);if(!p)return;const xy=project(p),key=cell?Math.floor(xy.x/cell)+':'+Math.floor(xy.y/cell):p.lat.toFixed(6)+':'+p.lng.toFixed(6);if(!groups.has(key))groups.set(key,[]);groups.get(key).push({row,p});});return [...groups.values()];}
const api={load,position,quality,addressAvailable,external,mapLink,serviceLink,group};
if(typeof module==='object'&&module.exports)module.exports=api;else root.LazioMapData=api;
})(typeof window==='object'?window:globalThis);
