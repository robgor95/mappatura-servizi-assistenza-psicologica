/* V7.15 embedded hierarchical map: same hierarchy and visual grammar as mappa.html. */
(function(root){
'use strict';
const $=id=>document.getElementById(id),P=root.LazioProvinceCore,H=root.LazioMapHierarchyCore,G=root.LazioMapData,A=root.LazioServices;
if(!$('province-explorer')||!P||!H||!G||!A)return;
const colors={VT:'#c4ddbd',RI:'#dbd1e9',RM:'#bcded4',LT:'#f3ddaf',FR:'#f0cdbc'};
let host=null,snapshot=null,rows=[],filtered=[],state={},index=null,geo=null,region=null,map=null,provinceLayer=null,municipalityLayer=null,labelLayer=null,pointLayer=null,tiles=null;
let mode='territorio',tileErrors=0,renderSeq=0,started=false,pendingLocate='',municipalityCache=new Map(),municipalityFeatureLayers=new Map();
const el=(tag,text,attrs={})=>{const n=document.createElement(tag);if(text!==null&&text!==undefined)n.textContent=text;Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));return n;};
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
const narrow=()=>matchMedia('(max-width:650px)').matches;
const json=async url=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),18000);try{const r=await fetch(url,{signal:c.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json();}finally{clearTimeout(t);}};
const municipalURL=code=>'/data/comuni_'+code.toLowerCase()+'_istat2026_v7_14.geojson';
function say(t){$('search-map-feedback').textContent=t||'';}
function warn(t){$('search-map-error').textContent=t||'';$('search-map-error').hidden=!t;}
function serviceLink(row){return G.serviceLink(row,state);}
function visibleBase(){const s={...state};delete s.provincia;delete s.asl;delete s.comune;return s;}
function title(){return state.comune||((mode==='sanitaria'&&state.asl)?state.asl:(state.provincia?(state.provincia==='RM'?'Roma · città metropolitana':P.names[state.provincia]):'Tutto il Lazio'));}
function summary(){
 const s=P.summary(filtered,geo,G.position);
 $('search-map-level-title').textContent=title();
 $('search-map-total').textContent=s.total+' '+(s.total===1?'scheda':'schede')+' di servizio';
 $('search-map-coverage').textContent=geo?s.located+' localizzate · '+s.unlocated+' senza posizione univoca · '+s.indicative+' posizioni indicative.':'Coordinate non caricate.';
 const admin={public:0,non_asl:0,unknown:0};filtered.forEach(r=>admin[P.administration(r).ownership]++);
 const d=$('search-map-admin');d.replaceChildren();
 for(const [k,label] of Object.entries({public:'Rete pubblica / ASL',non_asl:'Privata / non ASL',unknown:'Gestione da verificare'})){const x=el('div');x.append(el('dt',label),el('dd',admin[k]));d.append(x);}
}
function breadcrumb(){
 const nav=$('search-map-breadcrumb');nav.replaceChildren();
 H.breadcrumb(state,mode).forEach((item,i,arr)=>{if(i)nav.append(el('span','›',{'aria-hidden':'true'}));if(i===arr.length-1)nav.append(el('span',item.label,{'aria-current':'page'}));else nav.append(el('button',item.label,{type:'button','data-search-crumb':item.kind}));});
}
function buttonList(root,items,kind,current){
 root.replaceChildren();items.forEach(x=>{const b=el('button',null,{type:'button',['data-search-'+kind]:x.value,'aria-pressed':String(current===x.value)});b.append(el('span',x.label),el('strong',x.total));root.append(b);});
}
function panels(){
 const provinceStats=P.byProvince(rows,visibleBase(),A.matches,geo,G.position);
 $('search-map-province-panel').hidden=!!state.provincia;
 if(!state.provincia)buttonList($('search-map-province-buttons'),P.codes.map(c=>({value:c,label:c==='RM'?'Roma · città metropolitana':P.names[c],total:provinceStats[c].total})),'province',state.provincia||'');
 const health=mode==='sanitaria'&&!!state.provincia;
 $('search-map-asl-panel').hidden=!health;
 if(health)buttonList($('search-map-asl-buttons'),H.byAsl(rows,state,A.matches).map(x=>({value:x.name,label:x.name,total:x.total})),'asl',state.asl||'');
 $('search-map-municipality-panel').hidden=!state.provincia;
 if(state.provincia){
  const towns=H.byMunicipality(rows,state,A.matches,index,geo,G.position);
  $('search-map-municipality-title').textContent=(health&&!state.asl)?'Comuni con risultati · puoi scegliere prima una ASL':'Comuni con risultati';
  buttonList($('search-map-municipality-buttons'),towns.map(x=>({value:x.name,label:x.name,total:x.total})),'municipality',state.comune||'');
  $('search-map-municipality-empty').hidden=towns.length!==0;
 }
 $('search-map-mode-territorio').setAttribute('aria-pressed',String(mode==='territorio'));
 $('search-map-mode-sanitaria').setAttribute('aria-pressed',String(mode==='sanitaria'));
 $('search-map-mode-help').textContent=mode==='territorio'?'Vista territoriale: Lazio → provincia → comune → servizi.':'Vista sanitaria: provincia → ASL indicata nei dati → comune → servizi.';
}
function choose(patch,message){
 pendingLocate='';$('search-map-selected').hidden=true;map?.closePopup();
 if(host?.selectMapFilters)host.selectMapFilters(patch);
 else if(Object.prototype.hasOwnProperty.call(patch,'provincia'))host?.selectProvince?.(patch.provincia||'');
 if(message)say(message);
}
function selectProvince(code){choose({provincia:code||'',asl:'',comune:''},(code?(code==='RM'?'Roma · città metropolitana':P.names[code]):'Lazio')+' selezionato.');}
function selectAsl(asl){choose({asl:asl||'',comune:''},(asl||'Tutte le ASL')+' selezionata.');}
function selectMunicipality(name){choose({comune:name||''},(name||'Tutti i comuni')+' selezionato.');}
function crumb(kind){if(kind==='region')choose({provincia:'',asl:'',comune:''});else if(kind==='province')choose({asl:'',comune:''});else if(kind==='asl')choose({comune:''});}
async function municipalityGeometry(code){
 if(municipalityCache.has(code))return municipalityCache.get(code);
 const p=json(municipalURL(code)).then(d=>H.validateMunicipalGeometry(d,code));municipalityCache.set(code,p);return p;
}
function clearLayers(){municipalityFeatureLayers.clear();provinceLayer?.clearLayers();municipalityLayer?.clearLayers();labelLayer?.clearLayers();pointLayer?.clearLayers();}
function bindPath(layer,label,action,attrs={}){
 layer.on('add',()=>{const p=layer.getElement();if(!p)return;p.setAttribute('role','button');p.setAttribute('tabindex','0');p.setAttribute('aria-label',label);Object.entries(attrs).forEach(([k,v])=>p.setAttribute(k,v));p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}});});layer.on('click',action);
}
function popup(group){
 const box=el('div',null,{class:'map-popup hierarchy-popup'});
 if(group.length>1)box.append(el('h2',group.length+' servizi raggruppati'),el('p','Il gruppo dipende dalla scala o da coordinate condivise/indicative: non certifica una stessa sede.'));
 group.forEach(({row,p})=>{const part=el('section'),a=P.administration(row);part.append(el(group.length>1?'h3':'h2',row.name),el('p',row.subtype+' · '+row.town),el('p',a.label+' · '+a.ssnLabel),el('p',row.address),el('p',G.quality(p),{class:'micro'}),el('a','Dettagli e contatti',{href:serviceLink(row),'data-open':row.key}));box.append(part);});
 return box;
}
function drawProvince(){
 const stats=P.byProvince(rows,visibleBase(),A.matches,geo,G.position);
 const layer=L.geoJSON(region,{style:f=>({color:'#6d8778',weight:1.5,fillColor:colors[f.properties.code],fillOpacity:tiles?.2:.76}),onEachFeature:(f,l)=>{const c=f.properties.code;bindPath(l,'Apri '+P.names[c]+', '+stats[c].total+' schede',()=>selectProvince(c),{'data-search-map-province':c});}}).addTo(provinceLayer);
 region.features.forEach(f=>{const c=f.properties.code,s=stats[c],label=el('span');label.append(el('span',narrow()?c:P.names[c]),el('b',s.total));const w=narrow()?54:78;L.marker(f.properties.label,{icon:L.divIcon({className:'hierarchy-balloon',html:label,iconSize:[w,46],iconAnchor:[w/2,23]}),keyboard:true,title:P.names[c]+': '+s.total+' schede'}).on('click',()=>selectProvince(c)).addTo(labelLayer);});
 map.fitBounds(layer.getBounds(),{padding:narrow()?[25,20]:[45,28],maxZoom:8,animate:false});
}
async function drawMunicipalities(seq){
 const geometry=await municipalityGeometry(state.provincia);if(seq!==renderSeq)return;
 const stats=new Map(H.byMunicipality(rows,state,A.matches,index,geo,G.position).map(x=>[x.name,x]));
 const layer=L.geoJSON(geometry,{style:f=>{const active=state.comune===f.properties.name,s=stats.get(f.properties.name);return {color:active?'#245b48':'#7b9384',weight:active?3:1,fillColor:active?'#8fc3a6':s?.total?'#dcebdd':'#f1f1eb',fillOpacity:active?.74:s?.total?.58:.22};},onEachFeature:(f,l)=>{const name=f.properties.name,s=stats.get(name);municipalityFeatureLayers.set(name,l);l.bindTooltip(name+(s?' · '+s.total:' · 0'),{sticky:true});bindPath(l,'Apri '+name+(s?', '+s.total+' schede':', nessun risultato con questi filtri'),()=>{if(s?.total)selectMunicipality(name);},{'data-search-map-municipality':f.properties.istat});}}).addTo(municipalityLayer);
 if(state.comune&&municipalityFeatureLayers.has(state.comune))map.fitBounds(municipalityFeatureLayers.get(state.comune).getBounds(),{padding:[35,28],maxZoom:13,animate:false});else map.fitBounds(layer.getBounds(),{padding:narrow()?[22,18]:[40,25],maxZoom:10,animate:false});
 if(state.comune)drawPoints();if(pendingLocate)focusPending();
}
function drawPoints(){
 if(!state.comune||!geo)return;
 const groups=G.group(filtered,geo,p=>map.project([p.lat,p.lng],map.getZoom()),map.getZoom()>=17?0:52);
 groups.forEach(group=>{const first=group[0],a=P.administration(first.row),n=group.length,center=[group.reduce((s,x)=>s+x.p.lat,0)/n,group.reduce((s,x)=>s+x.p.lng,0)/n],text=n>1?String(n):a.symbol,cls=n>1?'group':a.ownership==='non_asl'?'non-asl':a.ownership;const marker=L.marker(center,{icon:L.divIcon({className:'hierarchy-pin '+cls+(group.every(x=>x.p.quality==='C')?' indicative':''),html:'<span>'+text+'</span>',iconSize:[38,38],iconAnchor:[19,19]}),keyboard:true,title:n>1?n+' servizi raggruppati':first.row.name}).addTo(pointLayer);marker.on('click',()=>{if(n>1&&map.getZoom()<17&&group.some(x=>Math.abs(x.p.lat-first.p.lat)+Math.abs(x.p.lng-first.p.lng)>.00002))map.fitBounds(group.map(x=>[x.p.lat,x.p.lng]),{maxZoom:17,padding:[35,35],animate:!reduced()});else marker.bindPopup(popup(group),{maxWidth:narrow()?275:350,maxHeight:narrow()?260:350,autoPanPadding:[20,20]}).openPopup();});});
}
async function renderMap(){
 if(!map)return;const seq=++renderSeq;clearLayers();warn('');
 try{if(!state.provincia){drawProvince();say('Vista regionale. Seleziona una provincia sulla mappa o dai pulsanti.');return;}await drawMunicipalities(seq);if(seq!==renderSeq)return;say(state.comune?'Comune selezionato: i punti mostrano i servizi localizzati.':'Provincia selezionata: scegli un comune'+(mode==='sanitaria'?' o prima una ASL.':'.'));}
 catch(e){warn('Il livello comunale non è disponibile: '+e.message+'. Filtri, elenco e province restano utilizzabili.');}
}
function renderAll(){if(!snapshot)return;summary();breadcrumb();panels();renderMap();}
function createMap(){
 map=L.map('search-map-canvas',{scrollWheelZoom:false,zoomAnimation:!reduced(),fadeAnimation:!reduced(),markerZoomAnimation:!reduced(),minZoom:6,maxZoom:18,zoomSnap:.1,attributionControl:true}).setView([41.98,12.68],8);
 map.attributionControl.setPrefix(false);map.attributionControl.addAttribution('Confini © <a href="https://www.istat.it/notizia/confini-delle-unita-amministrative-a-fini-statistici-al-1-gennaio-2018-2/" target="_blank" rel="noopener noreferrer">ISTAT 2026</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>');
 provinceLayer=L.layerGroup().addTo(map);municipalityLayer=L.layerGroup().addTo(map);labelLayer=L.layerGroup().addTo(map);pointLayer=L.layerGroup().addTo(map);
 map.zoomControl._zoomInButton.setAttribute('aria-label','Ingrandisci');map.zoomControl._zoomOutButton.setAttribute('aria-label','Riduci');map.on('zoomend',()=>{if(state.comune){pointLayer.clearLayers();drawPoints();}});
 renderMap();
}
function toggleTiles(){
 if(tiles){map.removeLayer(tiles);tiles=null;$('search-map-tiles').textContent='Attiva sfondo stradale';$('search-map-tiles').setAttribute('aria-pressed','false');$('search-map-tile-warning').hidden=true;say('Sfondo stradale disattivato. Confini e servizi restano visibili.');renderMap();return;}
 tileErrors=0;tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{minZoom:6,maxZoom:18,keepBuffer:1,updateWhenIdle:true,referrerPolicy:'origin',attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'});tiles.on('tileerror',()=>{if(++tileErrors>=3)$('search-map-tile-warning').hidden=false;});tiles.addTo(map);$('search-map-tiles').textContent='Disattiva sfondo stradale';$('search-map-tiles').setAttribute('aria-pressed','true');say('Sfondo stradale attivato: il browser contatta OpenStreetMap. Nessuna geolocalizzazione del dispositivo.');renderMap();
}
function focusPending(){
 const key=pendingLocate;if(!key||!geo)return;pendingLocate='';const row=rows.find(r=>r.key===key);if(!row)return;const p=G.position(row,geo),box=$('search-map-selected');box.replaceChildren(el('strong',row.name),el('p',row.address+' · '+row.town),el('p',G.quality(p||geo.records[row.key])));box.append(el('a','Dettagli e contatti',{href:serviceLink(row),'data-open':row.key}));box.hidden=false;if(!p){say('Servizio selezionato senza pin: resta disponibile la scheda con sede e fonti.');return;}map.setView([p.lat,p.lng],p.quality==='C'?15:17,{animate:false});pointLayer.clearLayers();drawPoints();const same=filtered.filter(r=>{const q=G.position(r,geo);return q&&q.lat===p.lat&&q.lng===p.lng;}).map(r=>({row:r,p:G.position(r,geo)}));if(!same.some(x=>x.row.key===row.key))same.push({row,p});L.popup({maxWidth:narrow()?275:350,maxHeight:narrow()?260:350}).setLatLng([p.lat,p.lng]).setContent(popup(same)).openOn(map);say('Servizio selezionato. '+G.quality(p));
}
function locate(key){
 if(!host||!index)return false;const row=rows.find(r=>r.key===key);if(!row)return false;const m=H.municipality(row,index);if(!m)return false;pendingLocate=key;const patch={provincia:m.province,comune:m.name};if(mode==='sanitaria'&&row.asl&&row.asl!=='Non documentata')patch.asl=row.asl;else patch.asl='';host.selectMapFilters?.(patch);$('province-explorer').scrollIntoView({block:'start',behavior:'auto'});return true;
}
function update(s){snapshot=s;rows=s.rows||[];filtered=s.filtered||[];state={...(s.state||{})};if(state.asl)mode='sanitaria';if(index)renderAll();}
async function connect(api){
 if(started)return;started=true;host=api;snapshot=api.snapshot();rows=snapshot.rows||[];filtered=snapshot.filtered||[];state={...(snapshot.state||{})};if(state.asl)mode='sanitaria';
 $('search-map-mode-territorio').addEventListener('click',()=>{if(mode==='territorio')return;mode='territorio';if(state.asl)choose({asl:'',comune:''},'Vista territoriale attiva.');else{renderAll();say('Vista territoriale attiva.');}});
 $('search-map-mode-sanitaria').addEventListener('click',()=>{if(mode==='sanitaria')return;mode='sanitaria';renderAll();say('Vista rete sanitaria attiva. Seleziona una provincia e poi una ASL.');});
 $('search-map-breadcrumb').addEventListener('click',e=>{const b=e.target.closest('[data-search-crumb]');if(b)crumb(b.dataset.searchCrumb);});
 $('search-map-province-buttons').addEventListener('click',e=>{const b=e.target.closest('[data-search-province]');if(b)selectProvince(b.dataset.searchProvince);});
 $('search-map-asl-buttons').addEventListener('click',e=>{const b=e.target.closest('[data-search-asl]');if(b)selectAsl(b.dataset.searchAsl);});
 $('search-map-municipality-buttons').addEventListener('click',e=>{const b=e.target.closest('[data-search-municipality]');if(b)selectMunicipality(b.dataset.searchMunicipality);});
 $('search-map-tiles').addEventListener('click',toggleTiles);$('search-map-fit').addEventListener('click',renderMap);
 $('search-map-toggle').addEventListener('click',()=>{const hide=!$('search-map-layout').hidden;$('search-map-layout').hidden=hide;$('search-map-toggle').textContent=hide?'Mostra mappa':'Nascondi mappa';$('search-map-toggle').setAttribute('aria-expanded',String(!hide));if(hide&&tiles)toggleTiles();if(!hide){map?.invalidateSize();renderMap();}});
 if(!api.territoriesReady){$('search-map-loading').hidden=true;warn('La gerarchia territoriale non è disponibile. Ricerca e filtri restano utilizzabili.');return;}
 const results=await Promise.allSettled([json('/data/comuni_province_istat2026_v7_13.json'),json('/data/province_lazio_istat2026_v7_13.geojson'),json('/data/presidi_geo_v7_11_7.json')]);
 if(results[0].status!=='fulfilled'||results[1].status!=='fulfilled'){$('search-map-loading').hidden=true;warn('Confini o indice territoriale non caricati. Ricerca ed elenco restano disponibili.');return;}
 try{index=P.validateIndex(results[0].value);region=P.validateGeometry(results[1].value);geo=results[2].status==='fulfilled'?results[2].value:null;$('search-map-loading').hidden=true;$('search-map-toolbar').hidden=false;$('search-map-layout').hidden=false;createMap();renderAll();$('province-explorer').dataset.ready='true';if(!geo)warn('Coordinate dei servizi non caricate: confini e conteggi restano disponibili, ma non vengono mostrati i pin.');}
 catch(e){$('search-map-loading').hidden=true;warn(e.message+'. Ricerca ed elenco restano disponibili.');}
}
root.LazioProvinceMap={connect,update,locate};
})(window);
