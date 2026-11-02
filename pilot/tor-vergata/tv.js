/* Menta Campus — pilot Tor Vergata. No search telemetry, no stored inputs. */
(function(){
'use strict';
const $=id=>document.getElementById(id), VERSION="0.1";
const state={clinical:[],university:[],center:null, map:null, markers:null, radius:null, tiles:null};
const safeUrl=x=>{try{let u=new URL(x);return u.protocol==="https:"&&!u.username&&!u.password?u.href:"";}catch{return ""}};
const textNode=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=String(value??"");if(cls)e.className=cls;return e;};
const link=(label,target,external=true)=>{
  const a=document.createElement('a');a.textContent=label;
  const u=safeUrl(target);
  if(!u)return null;
  a.href=u;if(external){a.target='_blank';a.rel='noopener noreferrer';}return a;
};
const blank=()=>document.createDocumentFragment();
function phoneLink(number){
 const n=String(number||"").replace(/[^0-9+]/g,"");
 if(n.length<6)return null;
 const a=document.createElement("a");a.href="tel:"+n;a.textContent="Chiama";return a;
}
function emailLink(address){
 if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(address||"")))return null;
 const a=document.createElement("a");a.href="mailto:"+address;a.textContent="Email";return a;
}
function links(parent,arr){
 const d=textNode("div","", "tv-card-links");
 arr.filter(Boolean).forEach(x=>d.append(x));
 if(d.childNodes.length)parent.append(d);
}
function uniCard(r){
 const article=textNode("article","","tv-card");
 article.append(textNode("span",r.price==="Gratuito"?"Gratuito · Ateneo":"Risorsa dell'Ateneo","tv-tag"));
 article.append(textNode("h3",r.title));
 article.append(textNode("p",r.summary));
 article.append(textNode("p","Per chi: "+r.audience));
 if(r.place) article.append(textNode("p","Sede: "+r.place));
 if(r.access) article.append(textNode("p","Accesso: "+r.access));
 links(article,[emailLink(r.email),phoneLink(r.phone),link("Pagina ufficiale",r.source)]);
 return article;
}
function clinicCard(r){
 const a=textNode("article","","tv-card");
 a.append(textNode("span",r.type||"Servizio sanitario","tv-tag"));
 a.append(textNode("h3",r.name));
 a.append(textNode("p",[r.address,r.town].filter(Boolean).join(" · ")));
 if(r.asl)a.append(textNode("p","Rete indicata: "+r.asl));
 a.append(textNode("p",r.distance_km.toFixed(1)+" km in linea d'aria dal Rettorato · Posizione "+(r.quality==="A"?"documentata all'indirizzo":"indicativa")+"; ingresso non verificato."));
 if(r.access) a.append(textNode("p","Modalità di accesso: "+r.access));
 const d=textNode("details","");
 d.append(textNode("summary","Contatti e fonti"));
 if(r.hours)d.append(textNode("p","Orari indicati nelle fonti: "+r.hours));
 links(d, [phoneLink(r.phone),emailLink(r.email),link("Sito del servizio",r.website),...(r.sources||[]).slice(0,2).map((x,i)=>link("Fonte "+(i+1),x))]);
 a.append(d);
 return a;
}
function getFilters(){
 return {q:($("tv-q").value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("it").trim(),
  radius:Number($("tv-radius").value)||8,type:$("tv-type").value};
}
function filtered(){
 const f=getFilters();
 return state.clinical.filter(r=>{
   if(!Number.isFinite(r.distance_km)||r.distance_km>f.radius)return false;
   if(f.type&&r.type!==f.type)return false;
   const corpus=[r.name,r.type,r.subtype,r.address,r.asl,r.town].join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("it");
   return !f.q||corpus.includes(f.q);
 }).sort((a,b)=>a.distance_km-b.distance_km);
}
function drawMap(rows,radius){
 if(!state.map)return;
 const L=window.L;
 if(state.markers)state.map.removeLayer(state.markers);
 if(state.radius)state.map.removeLayer(state.radius);
 const [lat,lon]=[state.center.lat,state.center.lon];
 state.radius=L.circle([lat,lon],{radius:radius*1000,color:"#146c5d",fillColor:"#c0eadc",fillOpacity:.12,weight:2}).addTo(state.map);
 state.markers=L.featureGroup().addTo(state.map);
 const campus=L.circleMarker([lat,lon],{radius:10,color:"#0e5a4d",weight:3,fillColor:"#35b5a3",fillOpacity:1});
 campus.bindPopup("Rettorato — punto di riferimento. Non indica il centro geografico di tutte le sedi universitarie.");
 state.markers.addLayer(campus);
 for(const r of rows){
   if(!Number.isFinite(r.latitude)||!Number.isFinite(r.longitude))continue;
   const p=L.circleMarker([r.latitude,r.longitude],{radius:6,color:r.quality==="A"?"#1f6f9b":"#8a5c18",weight:2,fillColor:r.quality==="A"?"#7bbedd":"#f4d18d",fillOpacity:.88});
   const popup=document.createElement("div");
   popup.append(textNode("strong",r.name));
   popup.append(textNode("p",[r.type,r.address].filter(Boolean).join(" · ")));
   popup.append(textNode("small","Posizione "+(r.quality==="A"?"documentata":"indicativa")+"; ingresso non verificato."));
   p.bindPopup(popup);
   state.markers.addLayer(p);
 }
 // Keep the viewport focused around the campus; radius is *not* a walking or driving route.
 state.map.fitBounds(state.radius.getBounds(),{padding:[24,24],maxZoom:13,animate:false});
}
function render(){
 const f=getFilters(),rows=filtered();
 $("tv-count").textContent=rows.length+" "+(rows.length===1?"servizio":"servizi")+" localizzati entro "+f.radius+" km dal Rettorato. Raggio in linea d'aria, non percorso stradale.";
 const host=$("tv-results");host.replaceChildren();
 if(!rows.length)host.append(textNode("p","Non sono presenti schede localizzate con questi filtri. Prova un raggio più ampio o azzera i filtri.","tv-empty"));
 else rows.forEach(r=>host.append(clinicCard(r)));
 drawMap(rows,f.radius);
}
function applyApproved(raw){
 if(!raw||raw.active!==true||!Array.isArray(raw.items))return;
 const map=new Map(state.clinical.map(r=>[r.key,r]));
 const fields={name:"name",type:"type",subtype:"subtype",phone:"phone",email:"email",website:"website",hours:"hours",access:"access"};
 for(const approved of raw.items){
   if(approved.entity!=="clinical")continue;
   const row=map.get(approved.key);if(!row)continue;
   const values=approved.values||{};
   // Old pin must not be reused for an altered address.
   if(Object.prototype.hasOwnProperty.call(values,"address")||Object.prototype.hasOwnProperty.call(values,"town")){
     row.distance_km=null;row.latitude=null;row.longitude=null;
   }
   for(const [k,v] of Object.entries(fields))if(typeof values[k]==="string")row[v]=values[k];
 }
}
async function load(){
 try {
   const r=await fetch("/tor-vergata/servizi.json",{credentials:"omit",cache:"no-store"});
   if(!r.ok)throw Error("Dati locali temporaneamente non disponibili ("+r.status+").");
   const data=await r.json();
   if(data.pilot!=="tor-vergata"||data.source_version!=="7.18"||!Array.isArray(data.clinical)||data.count_8km!==19)throw Error("Catalogo pilota non coerente.");
   state.center=data.center;state.clinical=data.clinical;state.university=data.university;
   try{
     const ap=await fetch("/wp-json/sml/v1/revisions",{credentials:"omit",cache:"no-store",signal:AbortSignal.timeout(5000)});
     if(ap.ok)applyApproved(await ap.json());
   }catch(_){} // Approved WordPress overrides are optional; static baseline remains usable.
   const uni=$("tv-university");uni.replaceChildren();state.university.forEach(x=>uni.append(uniCard(x)));
   const types=[...new Set(state.clinical.map(r=>r.type).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"it"));
   for(const type of types){const o=document.createElement("option");o.value=type;o.textContent=type;$("tv-type").append(o);}
   if(window.L){
     state.map=window.L.map("tv-map",{zoomControl:true,scrollWheelZoom:false,attributionControl:false});
     state.map.setView([state.center.lat,state.center.lon],12);
   }else $("tv-map").textContent="Mappa non disponibile: consulta l'elenco dei servizi.";
   render();
 }catch(err){
   const host=$("tv-results");host.replaceChildren(textNode("p","Caricamento non riuscito. I servizi di Ateneo restano consultabili dai loro siti ufficiali. "+String(err.message||err),"tv-error"));
   $("tv-count").textContent="Catalogo locale non disponibile";
   const u=$("tv-university");u.replaceChildren(textNode("p","Consulta lo sportello ufficiale: "));
   const official=link("Sportello PTV per studenti","https://web.uniroma2.it/contenuto/sportello-ptv-per-studenti-e-studentesse");
   if(official)u.append(official);
 }
}
$("tv-filter").addEventListener("submit",e=>{e.preventDefault();render();});
["tv-q","tv-radius","tv-type"].forEach(id=>$(id).addEventListener(id==="tv-q"?"input":"change",()=>render()));
$("tv-reset").addEventListener("click",()=>{$("tv-q").value="";$("tv-radius").value="8";$("tv-type").value="";render();});
$("tv-tiles").addEventListener("click",()=>{
 if(!state.map||!window.L)return;
 if(state.tiles){state.map.removeLayer(state.tiles);state.tiles=null;$("tv-tiles").textContent="Carica sfondo OpenStreetMap";return;}
 // External tiles are requested only following this explicit click.
 state.tiles=window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
   attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',maxZoom:18
 }).addTo(state.map);
 $("tv-tiles").textContent="Nascondi lo sfondo OpenStreetMap";
});
load();
})();
