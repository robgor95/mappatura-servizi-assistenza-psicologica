/* V7.14 main hierarchical map. Local administrative geometry first; OSM tiles are opt-in. */
(function(){
'use strict';
const $=id=>document.getElementById(id),A=window.LazioServices,G=window.LazioMapData,P=window.LazioProvinceCore,H=window.LazioMapHierarchyCore;
if(!$('map-hierarchy')||!A||!G||!P||!H)return;
const provinceColors={VT:'#c4ddbd',RI:'#dbd1e9',RM:'#bcded4',LT:'#f3ddaf',FR:'#f0cdbc'};
let rows=[],data=null,index=null,geo=null,region=null,map=null,provinceLayer=null,municipalityLayer=null,labelLayer=null,pointLayer=null,tiles=null;
let state={},filtered=[],mode='territorio',shown=24,selected='',tileErrors=0,renderSeq=0,municipalityCache=new Map(),provinceFeatureLayers=new Map(),municipalityFeatureLayers=new Map();
const params0=new URLSearchParams(location.search),initial=params0.get('presidio')||params0.get('scheda')||'';
const el=(tag,text,attrs={})=>{const n=document.createElement(tag);if(text!==null&&text!==undefined)n.textContent=text;Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));return n;};
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
const narrow=()=>matchMedia('(max-width:650px)').matches;
const json=async url=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),18000);try{const r=await fetch(url,{signal:c.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json();}finally{clearTimeout(t);}};
function say(t){$('map-feedback').textContent=t||'';}
function warn(t){$('map-warning').textContent=t||'';$('map-warning').hidden=!t;}
function serviceLink(row){return G.serviceLink(row,state);}
function listURL(){const p=new URLSearchParams();A.filterKeys.forEach(k=>{if(state[k])p.set(k,state[k]);});return '/servizi.html'+(p.size?'?'+p:'');}
function supportedMode(v){return v==='sanitaria'?'sanitaria':'territorio';}
function stateFromURL(){const s=A.parse(location.search,data);delete s.scheda;delete s.pagina;delete s.tecnico;return s;}
function urlFor(replace=false){
 const p=new URLSearchParams();A.filterKeys.forEach(k=>{if(state[k])p.set(k,state[k]);});if(mode==='sanitaria')p.set('vista','sanitaria');
 const u='/mappa.html'+(p.size?'?'+p:'');history[replace?'replaceState':'pushState']({map:true},'',u);
}
function sanitizeHierarchy(){
 if(!state.provincia){delete state.asl;delete state.comune;return;}
 if(mode!=='sanitaria')delete state.asl;
 if(state.comune){
   const m=index&&index.municipalities[P.normalize(state.comune)];
   const alias=index?.aliases?.[P.normalize(state.comune)];
   const resolved=m||index?.municipalities[alias?.municipality];
   if(!resolved||resolved.province!==state.provincia)delete state.comune;
 }
}
function apply(push=false,announce=''){
 sanitizeHierarchy();filtered=rows.filter(r=>A.matches(r,state)).sort((a,b)=>a.name.localeCompare(b.name,'it'));shown=24;
 if(push)urlFor(false);
 syncControls();renderSummary();renderBreadcrumb();renderPanels();drawList();renderMap();
 $('map-to-list').href=listURL();$('map-count').textContent=filtered.length+' '+(filtered.length===1?'scheda di servizio':'schede di servizio')+' con i filtri attuali.';
 if(announce)say(announce);
}
function visibleBase(){
 const s={...state};delete s.provincia;delete s.asl;delete s.comune;return s;
}
function populateStatic(){
 [...new Set(rows.map(r=>r.type).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it')).forEach(v=>$('map-tipo').append(el('option',v,{value:v})));
 P.codes.forEach(c=>$('map-provincia').append(el('option',c==='RM'?'Roma · città metropolitana':P.names[c],{value:c})));
}
function syncSelect(select,items,value,placeholder){
 const old=value||'';select.replaceChildren(el('option',placeholder,{value:''}));
 items.forEach(x=>select.append(el('option',x.label,{value:x.value})));if(old&&![...select.options].some(o=>o.value===old))select.append(el('option',old+' · da verificare',{value:old}));select.value=old;
}
function syncControls(){
 $('map-q').value=state.q||'';$('map-tipo').value=state.tipo||'';$('map-provincia').value=state.provincia||'';
 $('map-mode-territorio').setAttribute('aria-pressed',String(mode==='territorio'));$('map-mode-sanitaria').setAttribute('aria-pressed',String(mode==='sanitaria'));
 $('map-mode-help').textContent=mode==='territorio'?'Vista territoriale: Lazio → provincia → comune → servizi. I confini indicano dove si trova la sede, non chi può accedere al servizio.':'Vista sanitaria: provincia → ASL indicata nei dati → comune → servizi. L’ASL non implica gestione, convenzione o diritto di accesso.';
 const health=mode==='sanitaria'&&!!state.provincia;$('map-asl-wrap').hidden=!health;
 if(health){
   const asls=H.byAsl(rows,state,A.matches).map(x=>({value:x.name,label:x.name+' · '+x.total}));
   syncSelect($('map-asl'),asls,state.asl,'Tutte le ASL indicate');
 }else{$('map-asl').replaceChildren(el('option','Tutte le ASL indicate',{value:''}));}
 const towns=state.provincia?H.byMunicipality(rows,state,A.matches,index,geo,G.position).map(x=>({value:x.name,label:x.name+' · '+x.total})):[];
 $('map-comune-wrap').hidden=!state.provincia;syncSelect($('map-comune'),towns,state.comune,'Tutti i comuni con risultati');
}
function takeForm(){
 const s={...state};for(const k of ['q','tipo','provincia','asl','comune']){const node=$('map-'+k);if(!node||node.closest('[hidden]')){if(k==='asl'&&mode!=='sanitaria')delete s[k];continue;}const v=node.value.trim();if(v)s[k]=v;else delete s[k];}
 if(!s.provincia){delete s.asl;delete s.comune;}if(mode!=='sanitaria')delete s.asl;return s;
}
function renderSummary(){
 const s=P.summary(filtered,geo,G.position),title=state.comune||((mode==='sanitaria'&&state.asl)?state.asl:(state.provincia?(state.provincia==='RM'?'Roma · città metropolitana':P.names[state.provincia]):'Tutto il Lazio'));
 $('map-level-title').textContent=title;$('map-level-total').textContent=s.total+' '+(s.total===1?'scheda':'schede')+' di servizio';
 $('map-level-coverage').textContent=geo?s.located+' localizzate · '+s.unlocated+' senza posizione univoca · '+s.indicative+' posizioni indicative.':'Coordinate non caricate.';
 const admin={public:0,non_asl:0,unknown:0};filtered.forEach(r=>admin[P.administration(r).ownership]++);
 $('map-level-admin').replaceChildren();
 for(const [k,label] of Object.entries({public:'Rete pubblica / ASL',non_asl:'Privata / non ASL',unknown:'Gestione da verificare'})){const d=el('div');d.append(el('dt',label),el('dd',admin[k]));$('map-level-admin').append(d);}
}
function renderBreadcrumb(){
 const nav=$('map-breadcrumb');nav.replaceChildren();H.breadcrumb(state,mode).forEach((item,i,arr)=>{
  if(i)nav.append(el('span','›',{'aria-hidden':'true'}));
  if(i===arr.length-1)nav.append(el('span',item.label,{'aria-current':'page'}));
  else{const b=el('button',item.label,{type:'button','data-crumb':item.kind});nav.append(b);}
 });
}
function buttonList(root,items,kind,current){
 root.replaceChildren();items.forEach(x=>{const b=el('button',null,{type:'button',['data-'+kind]:x.value,'aria-pressed':String(current===x.value)});b.append(el('span',x.label),el('strong',x.total));root.append(b);});
}
function renderPanels(){
 const base=visibleBase(),provinceStats=P.byProvince(rows,base,A.matches,geo,G.position);
 $('map-province-panel').hidden=!!state.provincia;
 if(!state.provincia){
  buttonList($('map-province-buttons'),P.codes.map(c=>({value:c,label:c==='RM'?'Roma · città metropolitana':P.names[c],total:provinceStats[c].total})),'province',state.provincia||'');
 }
 const health=mode==='sanitaria'&&!!state.provincia;$('map-asl-panel').hidden=!health;
 if(health){buttonList($('map-asl-buttons'),H.byAsl(rows,state,A.matches).map(x=>({value:x.name,label:x.name,total:x.total})),'asl',state.asl||'');}
 $('map-municipality-panel').hidden=!state.provincia;
 if(state.provincia){
  const towns=H.byMunicipality(rows,state,A.matches,index,geo,G.position);
  $('map-municipality-title').textContent=(health&&!state.asl)?'Comuni con risultati · puoi scegliere prima una ASL':'Comuni con risultati';
  buttonList($('map-municipality-buttons'),towns.map(x=>({value:x.name,label:x.name,total:x.total})),'municipality',state.comune||'');
  $('map-municipality-empty').hidden=towns.length!==0;
 }
}
function drawList(){
 const frag=document.createDocumentFragment();filtered.slice(0,shown).forEach(row=>{
  const p=G.position(row,geo),li=el('li',null,{'data-service-key':row.key}),h=el('h3');h.append(el('a',row.name,{href:serviceLink(row)}));li.append(h,el('p',row.subtype+' · '+row.town),el('p',row.address),el('p',G.quality(p||geo.records[row.key]),{class:'map-quality '+(p&&p.quality==='C'?'approx':'')}));
  const a=P.administration(row);li.append(el('p',a.label+' · '+a.ssnLabel,{class:'micro'}));if(row.serviceState)li.append(el('p','Stato: '+row.serviceState,{class:'micro'}));
  const acts=el('div',null,{class:'map-item-actions'});if(state.comune){const b=el('button','Mostra sulla mappa',{type:'button','data-locate':row.key});b.addEventListener('click',()=>locate(row));acts.append(b);}acts.append(el('a','Dettagli e contatti',{href:serviceLink(row)}));li.append(acts);frag.append(li);
 });
 $('map-list').replaceChildren(frag);$('map-more').hidden=shown>=filtered.length;$('map-list-progress').textContent='Mostrati '+Math.min(shown,filtered.length)+' di '+filtered.length+'. I servizi senza coordinate restano nell’elenco.';$('map-empty').hidden=filtered.length!==0;
}
function popup(group){
 const box=el('div',null,{class:'map-popup hierarchy-popup'});if(group.length>1)box.append(el('h2',group.length+' servizi raggruppati'),el('p','Il gruppo dipende dalla scala o da coordinate condivise/indicative: non certifica una stessa sede.'));
 group.forEach(({row,p})=>{const part=el('section'),a=P.administration(row);part.append(el(group.length>1?'h3':'h2',row.name),el('p',row.subtype+' · '+row.town),el('p',a.label+' · '+a.ssnLabel),el('p',row.address),el('p',G.quality(p),{class:'micro'}),el('a','Dettagli e contatti',{href:serviceLink(row)}));box.append(part);});return box;
}
async function municipalityGeometry(code){
 if(municipalityCache.has(code))return municipalityCache.get(code);
 const promise=json('/data/comuni_'+code.toLowerCase()+'_istat2026_v7_14.geojson').then(d=>H.validateMunicipalGeometry(d,code));municipalityCache.set(code,promise);return promise;
}
function clearMapLayers(){provinceFeatureLayers.clear();municipalityFeatureLayers.clear();provinceLayer?.clearLayers();municipalityLayer?.clearLayers();labelLayer?.clearLayers();pointLayer?.clearLayers();}
function provinceStyle(code){return {color:state.provincia===code?'#245b48':'#6d8778',weight:state.provincia===code?3:1.5,fillColor:provinceColors[code],fillOpacity:tiles ? .2 : .76};}
function bindPath(layer,label,action,attrs={}){
 layer.on('add',()=>{const p=layer.getElement();if(!p)return;p.setAttribute('role','button');p.setAttribute('tabindex','0');p.setAttribute('aria-label',label);Object.entries(attrs).forEach(([k,v])=>p.setAttribute(k,v));p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}});});layer.on('click',action);
}
function drawProvinceOverview(){
 const stats=P.byProvince(rows,visibleBase(),A.matches,geo,G.position);
 provinceLayer=L.geoJSON(region,{style:f=>provinceStyle(f.properties.code),onEachFeature:(f,l)=>{const c=f.properties.code;provinceFeatureLayers.set(c,l);bindPath(l,'Apri '+P.names[c]+', '+stats[c].total+' schede',()=>selectProvince(c),{'data-map-province':c});}}).addTo(map);
 region.features.forEach(f=>{const c=f.properties.code,s=stats[c],label=el('span');label.append(el('span',narrow()?c:P.names[c]),el('b',s.total));const w=narrow()?54:78;L.marker(f.properties.label,{icon:L.divIcon({className:'hierarchy-balloon',html:label,iconSize:[w,46],iconAnchor:[w/2,23]}),keyboard:true,title:P.names[c]+': '+s.total+' schede'}).on('click',()=>selectProvince(c)).addTo(labelLayer);});
 map.fitBounds(provinceLayer.getBounds(),{padding:narrow()?[25,20]:[45,28],maxZoom:8,animate:false});
}
async function drawMunicipalityOverview(seq){
 const code=state.provincia,geometry=await municipalityGeometry(code);if(seq!==renderSeq)return;
 const stats=new Map(H.byMunicipality(rows,state,A.matches,index,geo,G.position).map(x=>[x.name,x]));
 municipalityLayer=L.geoJSON(geometry,{style:f=>{const active=state.comune===f.properties.name,s=stats.get(f.properties.name);return {color:active?'#245b48':'#7b9384',weight:active?3:1,fillColor:active?'#8fc3a6':s?.total?'#dcebdd':'#f1f1eb',fillOpacity:active?.74:s?.total?.58:.22};},onEachFeature:(f,l)=>{const name=f.properties.name,s=stats.get(name);municipalityFeatureLayers.set(name,l);l.bindTooltip(name+(s?' · '+s.total:' · 0'),{sticky:true});bindPath(l,'Apri '+name+(s?', '+s.total+' schede':', nessun risultato con questi filtri'),()=>{if(s?.total)selectMunicipality(name);},{'data-map-municipality':f.properties.istat});}}).addTo(map);
 if(state.comune&&municipalityFeatureLayers.has(state.comune))map.fitBounds(municipalityFeatureLayers.get(state.comune).getBounds(),{padding:[35,28],maxZoom:13,animate:false});
 else map.fitBounds(municipalityLayer.getBounds(),{padding:narrow()?[22,18]:[40,25],maxZoom:10,animate:false});
 if(state.comune)drawServicePoints();
}
function drawServicePoints(){
 if(!state.comune||!geo)return;const groups=G.group(filtered,geo,p=>map.project([p.lat,p.lng],map.getZoom()),map.getZoom()>=17?0:52);
 groups.forEach(group=>{const first=group[0],a=P.administration(first.row),n=group.length,center=[group.reduce((s,x)=>s+x.p.lat,0)/n,group.reduce((s,x)=>s+x.p.lng,0)/n];const text=n>1?String(n):a.symbol,cls=n>1?'group':a.ownership==='non_asl'?'non-asl':a.ownership;const marker=L.marker(center,{icon:L.divIcon({className:'hierarchy-pin '+cls+(group.every(x=>x.p.quality==='C')?' indicative':''),html:'<span>'+text+'</span>',iconSize:[38,38],iconAnchor:[19,19]}),keyboard:true,title:n>1?n+' servizi raggruppati':first.row.name}).addTo(pointLayer);
  marker.on('click',()=>{if(n>1&&map.getZoom()<17&&group.some(x=>Math.abs(x.p.lat-first.p.lat)+Math.abs(x.p.lng-first.p.lng)>.00002))map.fitBounds(group.map(x=>[x.p.lat,x.p.lng]),{maxZoom:17,padding:[35,35],animate:!reduced()});else marker.bindPopup(popup(group),{maxWidth:narrow()?275:350,maxHeight:narrow()?260:350,autoPanPadding:[20,20]}).openPopup();});});
}
async function renderMap(){
 if(!map)return;const seq=++renderSeq;clearMapLayers();warn('');try{if(!state.provincia){drawProvinceOverview();say('Vista regionale. Seleziona una provincia sulla mappa o dai pulsanti.');return;}await drawMunicipalityOverview(seq);if(seq!==renderSeq)return;say(state.comune?'Comune selezionato: i punti mostrano i servizi localizzati.':'Provincia selezionata: scegli un comune'+(mode==='sanitaria'?' o prima una ASL.':'.'));}catch(e){warn('Il livello comunale non è disponibile: '+e.message+'. Filtri, elenco e province restano utilizzabili.');}
}
function createMap(){
 map=L.map('map-canvas',{scrollWheelZoom:false,zoomAnimation:!reduced(),fadeAnimation:!reduced(),markerZoomAnimation:!reduced(),minZoom:6,maxZoom:18,zoomSnap:.1,attributionControl:true}).setView([41.98,12.68],8);map.attributionControl.setPrefix(false);map.attributionControl.addAttribution('Confini © <a href="https://www.istat.it/notizia/confini-delle-unita-amministrative-a-fini-statistici-al-1-gennaio-2018-2/" target="_blank" rel="noopener noreferrer">ISTAT 2026</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>');
 provinceLayer=L.layerGroup().addTo(map);municipalityLayer=L.layerGroup().addTo(map);labelLayer=L.layerGroup().addTo(map);pointLayer=L.layerGroup().addTo(map);map.zoomControl._zoomInButton.setAttribute('aria-label','Ingrandisci');map.zoomControl._zoomOutButton.setAttribute('aria-label','Riduci');map.on('zoomend',()=>{if(state.comune){pointLayer.clearLayers();drawServicePoints();}});renderMap();
}
function selectProvince(code){state.provincia=code;delete state.asl;delete state.comune;selected='';apply(true,(code==='RM'?'Roma · città metropolitana':P.names[code])+' selezionata.');}
function selectAsl(asl){if(asl)state.asl=asl;else delete state.asl;delete state.comune;selected='';apply(true,(asl||'Tutte le ASL')+' selezionata.');}
function selectMunicipality(name){state.comune=name;selected='';apply(true,name+' selezionato.');}
function crumb(kind){if(kind==='region'){delete state.provincia;delete state.asl;delete state.comune;}else if(kind==='province'){delete state.asl;delete state.comune;}else if(kind==='asl'){delete state.comune;}apply(true);}
function locate(row){
 selected=row.key;const m=H.municipality(row,index);if(m){state.provincia=m.province;state.comune=m.name;if(mode==='sanitaria'&&row.asl&&row.asl!=='Non documentata')state.asl=row.asl;}apply(true);
 const p=G.position(row,geo),box=$('map-selected');box.replaceChildren(el('strong',row.name),el('p',row.address+' · '+row.town),el('p',G.quality(p||geo.records[row.key])));box.append(el('a','Apri dettagli e contatti',{href:serviceLink(row)}));box.hidden=false;
 if(p){map.setView([p.lat,p.lng],p.quality==='C'?15:17,{animate:false});pointLayer.clearLayers();drawServicePoints();const same=filtered.filter(r=>{const q=G.position(r,geo);return q&&q.lat===p.lat&&q.lng===p.lng;}).map(r=>({row:r,p:G.position(r,geo)}));if(!same.some(x=>x.row.key===row.key))same.push({row,p});L.popup({maxWidth:narrow()?275:350,maxHeight:narrow()?260:350}).setLatLng([p.lat,p.lng]).setContent(popup(same)).openOn(map);say('Servizio selezionato. '+G.quality(p));}else say('Servizio selezionato senza pin: resta disponibile la scheda con sede e fonti.');
 $('map-area').scrollIntoView({block:'start',behavior:'auto'});
}
function toggleTiles(){
 if(tiles){map.removeLayer(tiles);tiles=null;$('map-tiles').textContent='Attiva sfondo stradale';$('map-tiles').setAttribute('aria-pressed','false');$('map-tile-warning').hidden=true;say('Sfondo stradale disattivato. Confini e servizi restano visibili.');return;}
 tileErrors=0;tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{minZoom:6,maxZoom:18,keepBuffer:1,updateWhenIdle:true,referrerPolicy:'origin',attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'});tiles.on('tileerror',()=>{if(++tileErrors>=3)$('map-tile-warning').hidden=false;});tiles.addTo(map);$('map-tiles').textContent='Disattiva sfondo stradale';$('map-tiles').setAttribute('aria-pressed','true');say('Sfondo stradale attivato: il browser contatta OpenStreetMap. Nessuna geolocalizzazione del dispositivo.');
}
function reset(){state={};selected='';$('map-selected').hidden=true;apply(true,'Filtri azzerati.');}
$('map-mode-territorio').addEventListener('click',()=>{if(mode==='territorio')return;mode='territorio';delete state.asl;apply(true,'Vista territoriale attiva.');});
$('map-mode-sanitaria').addEventListener('click',()=>{if(mode==='sanitaria')return;mode='sanitaria';delete state.comune;apply(true,'Vista rete sanitaria attiva. Seleziona provincia e ASL.');});
$('map-form').addEventListener('submit',e=>{e.preventDefault();state=takeForm();selected='';apply(true,'Ricerca aggiornata.');});
$('map-tipo').addEventListener('change',()=>{state=takeForm();selected='';apply(true);});$('map-provincia').addEventListener('change',()=>{state=takeForm();delete state.asl;delete state.comune;selected='';apply(true);});
$('map-asl').addEventListener('change',()=>{state=takeForm();delete state.comune;selected='';apply(true);});$('map-comune').addEventListener('change',()=>{state=takeForm();selected='';apply(true);});
$('map-reset').addEventListener('click',reset);$('map-tiles').addEventListener('click',toggleTiles);$('map-more').addEventListener('click',()=>{shown+=24;drawList();});
$('map-toggle').addEventListener('click',()=>{const hide=!$('map-layout').hidden;$('map-layout').hidden=hide;$('map-toggle').textContent=hide?'Mostra mappa':'Nascondi mappa';$('map-toggle').setAttribute('aria-expanded',String(!hide));if(hide&&tiles)toggleTiles();if(!hide){map.invalidateSize();renderMap();}});
$('map-fit').addEventListener('click',renderMap);
$('map-breadcrumb').addEventListener('click',e=>{const b=e.target.closest('[data-crumb]');if(b)crumb(b.dataset.crumb);});
$('map-province-buttons').addEventListener('click',e=>{const b=e.target.closest('[data-province]');if(b)selectProvince(b.dataset.province);});
$('map-asl-buttons').addEventListener('click',e=>{const b=e.target.closest('[data-asl]');if(b)selectAsl(b.dataset.asl);});
$('map-municipality-buttons').addEventListener('click',e=>{const b=e.target.closest('[data-municipality]');if(b)selectMunicipality(b.dataset.municipality);});
window.addEventListener('popstate',()=>{state=stateFromURL();mode=supportedMode(new URLSearchParams(location.search).get('vista'));selected='';apply(false);});
Promise.allSettled([G.load(),json('/data/comuni_province_istat2026_v7_13.json'),json('/data/province_lazio_istat2026_v7_13.geojson')]).then(async results=>{
 if(results[0].status!=='fulfilled')throw results[0].reason||Error('Servizi non caricati');const loaded=results[0].value;data=loaded.data;geo=loaded.geo;
 if(results[1].status!=='fulfilled'||results[2].status!=='fulfilled')throw Error('Indice territoriale o confini regionali non caricati');
 index=P.validateIndex(results[1].value);region=P.validateGeometry(results[2].value);rows=P.assign(loaded.rows,index);populateStatic();state=stateFromURL();mode=supportedMode(new URLSearchParams(location.search).get('vista'));sanitizeHierarchy();
 $('map-controls').disabled=false;$('map-loading').hidden=true;$('map-layout').hidden=false;createMap();apply(false);
 if(loaded.missing.length){warn('Caricamento parziale: mancano '+loaded.missing.join(', ')+'. I dati disponibili restano consultabili.');}
 if(initial){const row=rows.find(r=>r.key===initial||r.id===initial);if(row)locate(row);else say('Il servizio richiesto non è stato trovato.');}
}).catch(e=>{$('map-loading').hidden=true;$('map-error').hidden=false;$('map-error-text').textContent=e.message||'Caricamento non riuscito.';});
})();