/* Interactive map is optional. Only explicitly enabled tiles use an external host. */
(function(){
'use strict';
const $=id=>document.getElementById(id),A=window.LazioServices,G=window.LazioMapData;
if(!$('map-form')||!A||!G)return;
let rows=[],geo={records:{}},state={},filtered=[],shown=24,map,layer,tiles,selected='',loaded=false,renderQueued=false,tileErrors=0;
const params=new URLSearchParams(location.search),initial=params.get('presidio')||params.get('scheda');
const labels={q:'Ricerca',tipo:'Tipo',comune:'Comune',provincia:'Provincia',asl:'ASL',origine:'Gestione',regime:'Modalità',percorso:'Percorso',ambito:'Ambito'};
function element(tag,text,attrs){const e=document.createElement(tag);if(text)e.textContent=text;Object.entries(attrs||{}).forEach(([k,v])=>e.setAttribute(k,v));return e;}
function link(text,href,external=false){return element('a',text,{href,...(external?{target:'_blank',rel:'noopener noreferrer'}:{})});}
function tell(text){$('map-feedback').textContent=text;}
function mobile(){return matchMedia('(max-width:650px)').matches;}
function prefersReduced(){return matchMedia('(prefers-reduced-motion:reduce)').matches;}
function queryState(){const s={...state};['q','tipo','provincia'].forEach(k=>{const v=$('map-'+k).value.trim();if(v)s[k]=v;else delete s[k];});delete s.scheda;delete s.pagina;return s;}
function listURL(){const p=new URLSearchParams();A.filterKeys.forEach(k=>{if(state[k])p.set(k,state[k]);});return '/servizi.html'+(p.size?'?'+p:'');}
function update(){
  if(!selected)$('map-selected').hidden=true;
  filtered=rows.filter(r=>A.matches(r,state)).sort((a,b)=>a.name.localeCompare(b.name,'it'));
  const points=filtered.filter(r=>G.position(r,geo)),street=points.filter(r=>G.position(r,geo).precision==='street');
  $('map-count').textContent=filtered.length+' servizi: '+points.length+' localizzati ('+street.length+' indicativi sulla via), '+(filtered.length-points.length)+' senza posizione univoca.';
  $('map-to-list').href=listURL();$('map-empty').hidden=filtered.length!==0;
  $('map-chips').replaceChildren();Object.entries(state).filter(([k])=>A.filterKeys.includes(k)).forEach(([k,v])=>{
    const b=element('button',(labels[k]||'Filtro')+': '+(A.labels[v]||v)+' ×',{type:'button','aria-label':'Rimuovi filtro '+(labels[k]||k)});
    b.addEventListener('click',()=>{delete state[k];if($('map-'+k))$('map-'+k).value='';shown=24;update();fit();});$('map-chips').append(b);
  });
  drawList();drawMarkers();
}
function drawList(){
  const fragment=document.createDocumentFragment();filtered.slice(0,shown).forEach(row=>{
    const p=G.position(row,geo),li=element('li',null,{'data-service-key':row.key}),heading=element('h3');heading.append(link(row.name,G.serviceLink(row,state)));
    li.append(heading,element('p',row.subtype+' · '+row.town),element('p',row.address),element('p',G.quality(p),{class:'map-quality '+(p&&p.precision==='street'?'approx':'')}));
    const actions=element('div',null,{class:'map-item-actions'});
    if(p){const b=element('button','Mostra sulla mappa',{type:'button','data-map-locate':row.key});b.addEventListener('click',()=>select(row));actions.append(b);}
    if(G.addressAvailable(row))actions.append(link('Apri indirizzo ↗',G.external(row),true));
    actions.append(link('Dettagli e contatti',G.serviceLink(row,state)));li.append(actions);fragment.append(li);
  });
  $('map-list').replaceChildren(fragment);$('map-more').hidden=shown>=filtered.length;
  $('map-list-progress').textContent='Mostrati '+Math.min(shown,filtered.length)+' di '+filtered.length+' servizi. I non localizzati rimangono nell’elenco.';
}
function popup(group){
  const box=element('div',null,{class:'map-popup'});
  box.append(element('h2',group.length>1?group.length+' servizi in questa posizione':'Servizio'));
  if(group.length>1)box.append(element('p','Sedi vicine o servizi nello stesso edificio: ogni servizio resta distinto.'));
  group.forEach(({row,p})=>{const section=element('div',null,{class:'map-popup-item'});
    section.append(element('h3',row.name),element('p',row.subtype),element('p',row.address+' · '+row.town),element('p',G.quality(p)));
    section.append(link('Dettagli e contatti',G.serviceLink(row,state)),document.createTextNode(' · '),link('Apri indirizzo ↗',G.external(row),true));
    section.append(element('p',null,{class:'micro'}));section.lastChild.append(link('Fonte della posizione',p.source_url,true));box.append(section);
  });return box;
}
function drawMarkers(){
  if(!map||!layer)return;layer.clearLayers();
  const selectedRow=rows.find(r=>r.key===selected),display=selectedRow&&!filtered.includes(selectedRow)?filtered.concat(selectedRow):filtered;
  const groups=G.group(display,geo,p=>map.project([p.lat,p.lng],map.getZoom()),map.getZoom()>=17?0:52);
  groups.forEach(group=>{
    const count=group.length,p=group[0].p,approx=group.every(x=>x.p.precision==='street');
    const center=[group.reduce((n,x)=>n+x.p.lat,0)/count,group.reduce((n,x)=>n+x.p.lng,0)/count];
    const text=count>1?String(count):'•',icon=L.divIcon({className:'presidio-marker'+(approx?' approximate':''),html:'<span>'+text+'</span>',iconSize:[38,38],iconAnchor:[19,19]});
    const marker=L.marker(center,{icon,keyboard:true,title:count>1?count+' servizi: ingrandisci o apri':group[0].row.name,alt:count>1?count+' servizi':group[0].row.name});
    marker.on('click',()=>{
      if(count>1&&map.getZoom()<17&&group.some(x=>Math.abs(x.p.lat-p.lat)+Math.abs(x.p.lng-p.lng)>0.00002)){
        map.fitBounds(group.map(x=>[x.p.lat,x.p.lng]),{maxZoom:17,padding:[28,28],animate:!prefersReduced()});
      }else marker.bindPopup(popup(group),{maxWidth:Math.min(330,Math.max(200,window.innerWidth-100)),maxHeight:mobile()?220:310,autoPanPadding:[24,24]}).openPopup();
    });marker.addTo(layer);
  });
}
function fit(){if(!map)return;const pts=filtered.map(r=>G.position(r,geo)).filter(Boolean);if(pts.length)map.fitBounds(pts.map(p=>[p.lat,p.lng]),{padding:[26,26],maxZoom:14,animate:false});else map.setView([41.98,12.68],8,{animate:false});}
function select(row){
  selected=row.key;const p=G.position(row,geo);$('map-selected').replaceChildren(element('strong',row.name),element('p',row.address+' · '+row.town),element('p',G.quality(p)));
  if(!p){tell('Questo servizio non ha ancora una posizione univoca: puoi aprire l’indirizzo in una mappa esterna.');}
  if(G.addressAvailable(row))$('map-selected').append(link('Apri indirizzo in una mappa esterna ↗',G.external(row),true));
  $('map-selected').hidden=false;
  if(map&&p){map.setView([p.lat,p.lng],p.precision==='street'?15:17,{animate:false});drawMarkers();const same=rows.filter(r=>{const q=G.position(r,geo);return q&&q.lat.toFixed(6)===p.lat.toFixed(6)&&q.lng.toFixed(6)===p.lng.toFixed(6);}).map(r=>({row:r,p:G.position(r,geo)}));
    L.popup({maxWidth:Math.min(330,Math.max(200,window.innerWidth-100)),maxHeight:mobile()?220:310,autoPanPadding:[24,24]}).setLatLng([p.lat,p.lng]).setContent(popup(same)).openOn(map);$('map-canvas').focus({preventScroll:true});
  }else if(p)tell('Apri la mappa per vedere il servizio selezionato. L’indirizzo è già disponibile qui sotto.');
  $('map-area').scrollIntoView({block:'start',behavior:'auto'});
}
function activate(){
  if(map||!loaded)return;
  if(!window.L){tell('La libreria della mappa non è disponibile. Usa l’elenco o riprova ricaricando la pagina.');return;}
  try{
    $('map-canvas').hidden=false;map=L.map('map-canvas',{scrollWheelZoom:false,zoomAnimation:!prefersReduced(),fadeAnimation:!prefersReduced(),markerZoomAnimation:!prefersReduced(),attributionControl:true}).setView([41.98,12.68],8);
    map.attributionControl.setPrefix(false);map.zoomControl.setPosition('bottomleft');layer=L.layerGroup().addTo(map);
    tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{minZoom:6,maxZoom:18,keepBuffer:1,updateWhenIdle:true,referrerPolicy:'origin',attribution:'© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'});
    tiles.on('tileerror',()=>{if(++tileErrors>=3){$('map-tile-warning').hidden=false;}});tiles.on('tileload',()=>{tileErrors=0;});tiles.addTo(map);
    map.zoomControl._zoomInButton.setAttribute('aria-label','Ingrandisci la mappa');map.zoomControl._zoomOutButton.setAttribute('aria-label','Riduci la mappa');
    map.on('zoomend',()=>{if(!renderQueued){renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;drawMarkers();});}});
    $('map-consent').hidden=true;$('map-toolbar').hidden=false;map.invalidateSize();fit();
    if(selected){const r=rows.find(x=>x.key===selected);if(r)select(r);}
    tell('Mappa aperta. Usa + e − o due dita per ingrandire; i servizi sono disponibili anche nell’elenco.');
  }catch(_){if(map){map.remove();map=null;}$('map-canvas').hidden=true;tell('Non è stato possibile aprire la mappa. L’elenco e gli indirizzi restano disponibili.');}
}
function deactivate(){if(map){map.remove();map=null;layer=null;tiles=null;}$('map-canvas').hidden=true;$('map-consent').hidden=false;$('map-toolbar').hidden=true;tell('Mappa chiusa: non vengono richieste altre immagini a OpenStreetMap.');$('map-activate').focus();}
$('map-activate').addEventListener('click',activate);$('map-stop').addEventListener('click',deactivate);$('map-fit').addEventListener('click',()=>{selected='';$('map-selected').hidden=true;fit();});
$('map-form').addEventListener('submit',e=>{e.preventDefault();state=queryState();shown=24;selected='';update();fit();});
['tipo','provincia'].forEach(k=>$('map-'+k).addEventListener('change',()=>{state=queryState();shown=24;selected='';update();fit();}));
$('map-reset').addEventListener('click',()=>{state={};['q','tipo','provincia'].forEach(k=>$('map-'+k).value='');shown=24;selected='';update();fit();});
$('map-more').addEventListener('click',()=>{shown+=24;drawList();});
$('map-retry').addEventListener('click',()=>location.reload());
G.load().then(result=>{
  rows=result.rows;geo=result.geo;state=A.parse(location.search,result.data);delete state.scheda;delete state.pagina;delete state.tecnico;
  for(const [k,prop] of [['tipo','type'],['provincia','territory']]){
    [...new Set(rows.map(r=>r[prop]))].sort((a,b)=>a.localeCompare(b,'it')).forEach(value=>{const text=k==='provincia'?({RM:'Roma (RM)',VT:'Viterbo (VT)',FR:'Frosinone (FR)',RI:'Rieti (RI)',LT:'Latina (LT)',ND:'Non indicata'}[value]||value):value;$('map-'+k).append(element('option',text,{value}));});
  }
  ['q','tipo','provincia'].forEach(k=>{if(state[k]&&k!=='q'&&![...$('map-'+k).options].some(x=>x.value===state[k]))$('map-'+k).append(element('option',state[k]+' (da verificare)',{value:state[k]}));$('map-'+k).value=state[k]||'';});
  if(result.missing.length){$('map-partial').hidden=false;$('map-partial').textContent='Caricamento parziale: mancano '+result.missing.join(', ')+'. I servizi caricati restano consultabili.';}
  loaded=true;$('map-controls').disabled=false;$('map-activate').disabled=false;$('map-loading').hidden=true;update();
  if(initial){const r=rows.find(r=>r.key===initial||r.id===initial);if(r)select(r);else tell('Il servizio richiesto non è stato trovato. Nessun altro servizio è stato selezionato al suo posto.');}
}).catch(()=>{$('map-loading').hidden=true;$('map-error').hidden=false;$('map-count').textContent='Caricamento dei servizi non riuscito.';});
})();
