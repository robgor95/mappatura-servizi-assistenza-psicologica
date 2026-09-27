/* Local province overview, synchronized with the directory. OSM tiles require an explicit action. */
(function(root){
'use strict';
const $=id=>document.getElementById(id),C=root.LazioProvinceCore,G=root.LazioMapData,A=root.LazioServices;
if(!$('province-explorer')||!C||!G||!A)return;
const colors={VT:'#c4ddbd',RI:'#dbd1e9',RM:'#bcded4',LT:'#f3ddaf',FR:'#f0cdbc'};
let host=null,snapshot=null,geo=null,geometry=null,map=null,areas=null,balloons=null,points=null,tiles=null,selected='',lastScope=null,lastKeys='',tileErrors=0,started=false;
const provinceLayers=new Map();
const el=(tag,text,attrs={})=>{const n=document.createElement(tag);if(text!==null&&text!==undefined)n.textContent=text;Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));return n;};
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
const narrow=()=>matchMedia('(max-width:620px)').matches;
function say(text){$('province-feedback').textContent=text;}
function warning(text){$('province-error').textContent=text;$('province-error').hidden=!text;$('province-retry').hidden=!text;}
async function json(url){const controller=new AbortController(),t=setTimeout(()=>controller.abort(),18000);try{const r=await fetch(url,{signal:controller.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json();}finally{clearTimeout(t);}}
function aLink(row,label){const a=el('a',label,{href:G.serviceLink(row,snapshot.state),'data-open':row.key});return a;}
function statsTable(id,stats,labels){const d=$(id);d.replaceChildren();Object.keys(labels).forEach(k=>{const line=el('div');line.append(el('dt',labels[k]),el('dd',stats[k]));d.append(line);});}
function drawSummary(){
 if(!snapshot)return;
 const s=C.summary(snapshot.filtered,geo,G.position),scope=snapshot.state.provincia;
 $('province-active').textContent=scope?(scope==='RM'?'Roma · città metropolitana':C.names[scope]||'Territorio selezionato'):'Tutto il Lazio';
 $('province-total').textContent=s.total+' '+(s.total===1?'scheda di servizio':'schede di servizio');
 $('province-coverage').textContent=geo?s.located+' localizzate · '+s.unlocated+' senza posizione univoca. '+s.indicative+' posizioni sono indicative.':'Conteggi disponibili; posizioni geografiche non caricate.';
 statsTable('province-ownership',s.ownership,{public:'Rete pubblica / ASL',non_asl:'Privati / non ASL',unknown:'Gestione da verificare'});
 statsTable('province-ssn',s.ssn,{network:'Servizi della rete ASL',sourced:'SSN indicato nelle fonti',declared:'SSN dichiarato dal gestore',unknown:'SSN da verificare'});
 const counts=C.byProvince(snapshot.rows,snapshot.state,A.matches,geo,G.position);
 const activeButton=document.activeElement?.dataset?.provinceCode;
 $('province-buttons').replaceChildren();
 C.codes.concat(counts.ND.total?['ND']:[]).forEach(code=>{
  const button=el('button',null,{type:'button',class:'province-button','data-province-code':code,'aria-pressed':scope===code,'aria-label':'Seleziona '+C.names[code]+': '+counts[code].total+' schede con gli altri filtri'});
  const label=el('span',null,{class:'province-label'}),swatch=el('span',null,{class:'province-swatch','aria-hidden':'true'});swatch.style.backgroundColor=colors[code]||'#e0e3dc';label.append(swatch,el('span',C.names[code]));
  button.append(label,el('small',counts[code].total+' schede'));button.addEventListener('click',()=>choose(code));$('province-buttons').append(button);
 });
 if(activeButton)$('province-buttons').querySelector('[data-province-code="'+activeButton+'"]')?.focus({preventScroll:true});
 const missing=geo?snapshot.filtered.filter(r=>!G.position(r,geo)):[];
 $('province-missing').hidden=!geo||!missing.length;$('province-missing-title').textContent=missing.length+' servizi senza posizione univoca: consulta le schede';
 $('province-missing-list').replaceChildren();missing.forEach(r=>{const li=el('li');li.append(aLink(r,r.name),el('small',r.town+' · '+r.address));if(r.serviceState)li.append(el('small',r.serviceState));$('province-missing-list').append(li);});
 $('province-empty').hidden=s.total!==0;
}
function choose(code){
 if(!host||!C.codes.concat('ND','').includes(code))return;
 selected='';$('province-selected').hidden=true;map?.closePopup();host.selectProvince(code);fitArea(code);drawMarkers();
 say((code?C.names[code]:'Tutto il Lazio')+' selezionato. Mappa ed elenco usano gli stessi filtri.');
 (code?$('province-buttons').querySelector('[data-province-code="'+code+'"]'):$('province-all'))?.focus({preventScroll:true});
}
function fitArea(code){
 if(!map||!areas)return;
 const layer=provinceLayers.get(code);map.fitBounds((layer||areas).getBounds(),{padding:narrow()?[30,26]:[48,28],maxZoom:code?10:8,animate:false});
}
function styleAreas(){
 provinceLayers.forEach((layer,code)=>{const active=snapshot?.state.provincia;
  layer.setStyle({color:active===code?'#245b48':'#748d7b',weight:active===code?3:1.5,fillColor:colors[code],fillOpacity:tiles ? (active && active!==code ? .08 : .14) : (active && active!==code ? .22 : .8)});
 });
}
function makePopup(group){
 const box=el('div',null,{class:'province-popup'});
 if(group.length>1){box.append(el('h3',group.length+' servizi raggruppati'),el('p','Il gruppo dipende dalla scala o da coordinate condivise/indicative: non significa necessariamente stessa sede.'));
 }
 group.forEach(({row,p})=>{const part=el('section'),admin=C.administration(row);
  part.append(el(group.length>1?'h4':'h3',row.name),el('p',row.subtype+' · '+row.town),el('p',admin.label+' · '+admin.ssnLabel),el('p',row.address));
  part.append(el('p',G.quality(p),{class:'province-popup-quality'}));
  if(admin.ssn!=='network')part.append(el('p','SSN: indicazione documentale, non garanzia di convenzione attuale. Verifica periodo e condizioni nella scheda.',{class:'province-popup-quality'}));
  if(row.serviceState)part.append(el('p',row.serviceState,{class:'province-popup-state'}));
  if(row.raw?.contratto_periodo||row.raw?.periodo_evidenza)part.append(el('p','Periodo nelle fonti: '+(row.raw.contratto_periodo||row.raw.periodo_evidenza),{class:'province-popup-quality'}));
  part.append(aLink(row,'Apri dettagli e contatti'));box.append(part);
 });return box;
}
function showPopup(group,at){
 L.popup({maxWidth:narrow()?260:335,minWidth:190,maxHeight:narrow()?260:340,autoPanPadding:[18,24],closeButton:true})
  .setLatLng(at).setContent(makePopup(group)).openOn(map);
}
function drawMarkers(){
 if(!map||!snapshot||!balloons||!points)return;
 balloons.clearLayers();points.clearLayers();styleAreas();
 const scope=snapshot.state.provincia,overview=!scope&&!selected&&map.getZoom()<9;
 const counts=C.byProvince(snapshot.rows,snapshot.state,A.matches,geo,G.position);
 if(overview){
  geometry.features.forEach(f=>{const code=f.properties.code,count=counts[code].total;
   const label=el('span');label.append(el('span',narrow()?code:C.names[code]),el('b',count));
   const icon=L.divIcon({className:'province-balloon',html:label,iconSize:narrow()?[52,42]:[72,44],iconAnchor:narrow()?[26,21]:[36,22]});
   const marker=L.marker(f.properties.label,{icon,keyboard:true,title:C.names[code]+': '+count+' schede di servizio. Seleziona provincia.',alt:C.names[code]+': '+count+' schede'}).on('click',()=>choose(code)).addTo(balloons);
   marker.getElement()?.setAttribute('data-province-balloon',code);
  });
  return;
 }
 if(!geo)return;
 let display=snapshot.filtered;
 const chosen=snapshot.rows.find(r=>r.key===selected);
 if(chosen&&!display.includes(chosen))display=display.concat(chosen);
 const groups=G.group(display,geo,p=>map.project([p.lat,p.lng],map.getZoom()),map.getZoom()>=17?0:52);
 groups.forEach(group=>{
  const first=group[0],admin=C.administration(first.row),count=group.length;
  const center=[group.reduce((s,x)=>s+x.p.lat,0)/count,group.reduce((s,x)=>s+x.p.lng,0)/count];
  const span=el('span',count>1?count:admin.symbol),css=count>1?'group':admin.ownership==='non_asl'?'non-asl':admin.ownership;
  const icon=L.divIcon({className:'province-pin '+css+(group.every(x=>x.p.quality==='C')?' indicative':''),html:span,iconSize:[36,36],iconAnchor:[18,18]});
  const title=count>1?count+' servizi raggruppati. Apri o ingrandisci.':first.row.name+' · '+admin.label;
  const marker=L.marker(center,{icon,keyboard:true,title,alt:title}).addTo(points);
  marker.getElement()?.setAttribute('data-service-group',group.map(x=>x.row.key).join('|'));
  marker.on('click',()=>{
   if(count>1&&map.getZoom()<17&&group.some(x=>Math.abs(x.p.lat-first.p.lat)+Math.abs(x.p.lng-first.p.lng)>.00002)){
    map.fitBounds(group.map(x=>[x.p.lat,x.p.lng]),{maxZoom:17,padding:[45,40],animate:!reduced()});
   }else showPopup(group,center);
  });
 });
}
function createMap(){
 if(!root.L)throw Error('Libreria cartografica non caricata');
 map=L.map('province-canvas',{scrollWheelZoom:false,zoomAnimation:!reduced(),fadeAnimation:!reduced(),markerZoomAnimation:!reduced(),minZoom:6,maxZoom:18,zoomSnap:.1,attributionControl:true});
 map.attributionControl.setPrefix(false);map.attributionControl.addAttribution('Confini © <a href="https://www.istat.it/notizia/confini-delle-unita-amministrative-a-fini-statistici-al-1-gennaio-2018-2/" target="_blank" rel="noopener noreferrer">ISTAT 2026</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> · elaborazione Lazio');
 areas=L.geoJSON(geometry,{style:f=>({color:'#748d7b',weight:1.5,fillColor:colors[f.properties.code],fillOpacity:.8}),onEachFeature:(f,layer)=>{
  const code=f.properties.code;provinceLayers.set(code,layer);layer.on('click',()=>choose(code));
  layer.on('add',()=>{const path=layer.getElement();if(!path)return;path.setAttribute('role','button');path.setAttribute('tabindex','0');path.setAttribute('aria-label','Seleziona '+C.names[code]);path.setAttribute('data-province-area',code);path.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();choose(code);}});});
 }}).addTo(map);
 balloons=L.layerGroup().addTo(map);points=L.layerGroup().addTo(map);
 map.zoomControl._zoomInButton.setAttribute('aria-label','Ingrandisci la mappa');map.zoomControl._zoomOutButton.setAttribute('aria-label','Riduci la mappa');
 map.on('zoomend',drawMarkers);map.on('resize',drawMarkers);
 fitArea(snapshot.state.provincia);drawMarkers();
}
function tileToggle(){
 if(!map)return;
 if(tiles){map.removeLayer(tiles);tiles=null;$('province-tiles').textContent='Attiva sfondo stradale';$('province-tiles').setAttribute('aria-pressed','false');$('province-tile-warning').hidden=true;say('Sfondo stradale disattivato. La mappa delle province e i servizi restano disponibili.');}
 else{
  tileErrors=0;
  tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{minZoom:6,maxZoom:18,keepBuffer:1,updateWhenIdle:true,referrerPolicy:'origin',attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'});
  tiles.on('tileerror',()=>{tileErrors++;if(tileErrors>=3)$('province-tile-warning').hidden=false;});
  tiles.addTo(map);$('province-tiles').textContent='Disattiva sfondo stradale';$('province-tiles').setAttribute('aria-pressed','true');
  say('Sfondo stradale attivato: il browser contatta OpenStreetMap. Nessuna geolocalizzazione del dispositivo.');
 }
 styleAreas();
}
function locate(key){
 if(!map||!snapshot||!geo)return false;
 const row=snapshot.rows.find(r=>r.key===key);if(!row)return false;
 selected=key;const p=G.position(row,geo),box=$('province-selected');box.replaceChildren(el('h3',row.name),el('p',row.address+' · '+row.town),el('p',G.quality(p)));
 if(!snapshot.filtered.some(r=>r.key===key))box.append(el('p','Servizio selezionato fuori dai filtri attuali: il riepilogo continua a contare solo i risultati filtrati.'));
 if(row.serviceState)box.append(el('p',row.serviceState));box.append(aLink(row,'Apri dettagli e contatti'));box.hidden=false;
 if($('province-layout').hidden){$('province-layout').hidden=false;$('province-toggle').textContent='Nascondi mappa';$('province-toggle').setAttribute('aria-expanded','true');map.invalidateSize();}
 if(p){map.setView([p.lat,p.lng],p.quality==='C'?15:17,{animate:false});drawMarkers();const exact=snapshot.filtered.filter(r=>{const q=G.position(r,geo);return q&&q.lat===p.lat&&q.lng===p.lng;}).map(r=>({row:r,p:G.position(r,geo)}));if(!exact.some(x=>x.row.key===row.key))exact.push({row,p});showPopup(exact,[p.lat,p.lng]);say('Servizio selezionato. '+G.quality(p));}
 else{map.closePopup();drawMarkers();say('Questo servizio resta nella ricerca, ma non ha un pin: consulta la scheda e conferma la sede con il servizio.');}
 $('province-explorer').scrollIntoView({block:'start',behavior:'auto'});$('province-active').focus({preventScroll:true});return true;
}
function update(s){
 snapshot=s;drawSummary();
 if(!map)return;
 const keys=s.filtered.map(r=>r.key).join('|'),scope=s.state.provincia||'';
 if(keys!==lastKeys||scope!==lastScope){selected='';$('province-selected').hidden=true;map.closePopup();if(scope!==lastScope)fitArea(scope);lastKeys=keys;lastScope=scope;drawMarkers();}
}
async function connect(api){
 if(started)return;started=true;host=api;snapshot=host.snapshot();
 $('province-retry').addEventListener('click',()=>location.reload());
 if(!api.territoriesReady){$('province-loading').hidden=true;warning('La mappa per province non è disponibile: corrispondenza comuni/province non caricata. La ricerca e i filtri precedenti restano disponibili.');return;}
 $('province-all').addEventListener('click',()=>choose(''));
 $('province-tiles').addEventListener('click',tileToggle);
 $('province-expand').addEventListener('click',()=>{const expanded=$('province-explorer').classList.toggle('is-expanded');$('province-expand').setAttribute('aria-pressed',String(expanded));$('province-expand').textContent=expanded?'Riduci mappa':'Espandi mappa';map?.invalidateSize();});
 $('province-toggle').addEventListener('click',()=>{const hide=!$('province-layout').hidden;$('province-layout').hidden=hide;$('province-toggle').textContent=hide?'Mostra mappa':'Nascondi mappa';$('province-toggle').setAttribute('aria-expanded',String(!hide));if(hide&&tiles)tileToggle();if(!hide){map?.invalidateSize();drawMarkers();}});
 try{
  const results=await Promise.allSettled([json('/data/province_lazio_istat2026_v7_13.geojson'),json('/data/presidi_geo_v7_11_7.json')]);
  if(results[1].status==='fulfilled'&&results[1].value.records)geo=results[1].value;
  if(results[0].status!=='fulfilled')throw Error('Confini delle province non caricati');
  geometry=C.validateGeometry(results[0].value);$('province-layout').hidden=false;
  createMap();$('province-loading').hidden=true;$('province-head-actions').hidden=false;drawSummary();lastScope=snapshot.state.provincia||'';lastKeys=snapshot.filtered.map(r=>r.key).join('|');
  if(!geo)warning('Le posizioni dei servizi non sono state caricate. Province e conteggi restano disponibili, ma non vengono mostrati pin né conteggi di localizzazione.');
  $('province-explorer').dataset.ready='true';
 }catch(error){if(map){map.remove();map=null;}$('province-layout').hidden=true;$('province-loading').hidden=true;warning(error.message+'. Puoi continuare con i filtri e l’elenco dei servizi.');}
}
root.LazioProvinceMap={connect,update,locate};
})(window);
