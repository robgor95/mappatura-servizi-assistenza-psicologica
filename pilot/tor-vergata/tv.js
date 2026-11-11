/* Menta Campus — pilot Tor Vergata. No search telemetry, no stored inputs. */
(function(){
'use strict';
const $=id=>document.getElementById(id), VERSION="0.2";
const state={clinical:[],university:[],campuses:[],center:null, campus:null,lang:location.pathname.includes("/en/")?"en":"it",audience:"all",map:null,markers:null,radius:null,tiles:null};
const safeUrl=x=>{try{let u=new URL(x);return u.protocol==="https:"&&!u.username&&!u.password?u.href:"";}catch{return ""}};
const textNode=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=String(value??"");if(cls)e.className=cls;return e;};
const link=(label,target,external=true)=>{
  const a=document.createElement('a');a.textContent=label;
  const u=safeUrl(target);
  if(!u)return null;
  a.href=u;if(external){a.target='_blank';a.rel='noopener noreferrer';}return a;
};
const blank=()=>document.createDocumentFragment();
const translations={
 it:{
  subtitle:"Tor Vergata e dintorni",location:"Sede universitaria",students:"Sono uno studente",staff:"Lavoro in Ateneo",
  territorial:"Cerco un servizio vicino",all:"Mostra tutte le risorse",contact:"Email",phone:"Chiama",
  source:"Apri la pagina ufficiale",eligible:"Per chi",place:"Sede",access:"Come si accede",
  range:"Entro",approx:"Distanza indicativa in linea d'aria dalla sede selezionata",
  count:"servizi localizzati",noresults:"Nessuna scheda con questi filtri. Prova un altro raggio o sede.",
  origin:"Sede selezionata (riferimento indicativo; non è un ingresso certificato)",
  accessNote:"Verifica sempre modalità e bacino territoriale con il servizio.",
  dataNote:"Informazioni approvate dal progetto: verificare sempre presso il servizio.",
  verify:"Ultimo controllo documentale",emailCopy:"Copia email",copied:"Indirizzo copiato",
  mapTitle:"Mappa dei presidi", servicesTitle:"I servizi nei dintorni",
  campusHelp:"Le distanze sono in linea d'aria, non tempi o percorsi stradali."
 },
 en:{
  subtitle:"Tor Vergata and nearby services",location:"University campus",students:"I am a student",
  staff:"I work at the University",territorial:"Find a nearby service",
  all:"Show all resources",contact:"Email",phone:"Call",source:"Official service page",
  eligible:"Who can use this",place:"Location",access:"How to access",
  range:"Within",approx:"Approximate straight-line distance from selected campus",
  count:"located services",noresults:"No results for these filters. Try another campus or radius.",
  origin:"Selected campus (approximate point; not a verified entrance)",
  accessNote:"Confirm service eligibility and catchment requirements directly.",
  dataNote:"Information documented by the project: always confirm with the service.",
  verify:"Document last checked",emailCopy:"Copy email",copied:"Email copied",
  mapTitle:"Service map",servicesTitle:"Nearby services",
  campusHelp:"Distances are straight-line estimates, not travel times or directions."
 }
};
const T=(key)=>translations[state.lang][key]||key;
function distanceKm(a,b,c,d){const k=Math.PI/180;const z=Math.sin((c-a)*k/2)**2+Math.cos(a*k)*Math.cos(c*k)*Math.sin((d-b)*k/2)**2;return 12742*Math.asin(Math.min(1,Math.sqrt(z)));}
function campusSelected(){return state.campus||state.center;}
function displayField(r,key){const name=key+(state.lang==="en"?"_en":"");return r[name]||r[key]||"";}
function renderStaticTexts(){
 document.documentElement.lang=state.lang;
 document.querySelectorAll("[data-tv-it][data-tv-en]").forEach(el=>{
  el.textContent=el.getAttribute(state.lang==="en"?"data-tv-en":"data-tv-it");
 });
 document.querySelectorAll("[data-tv-placeholder-it][data-tv-placeholder-en]").forEach(el=>{
  el.placeholder=el.getAttribute(state.lang==="en"?"data-tv-placeholder-en":"data-tv-placeholder-it");
 });
 for(const [value,id] of [["it","tv-lang-it"],["en","tv-lang-en"]]){
   const el=$(id);if(el)el.setAttribute("aria-pressed",String(value===state.lang));
 }
 document.querySelectorAll("[data-tv-role]").forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.tvRole===state.audience)));
}
function copyText(text){if(navigator.clipboard && window.isSecureContext)navigator.clipboard.writeText(text).then(()=>{
 const msg=$("tv-copy-status");if(msg)msg.textContent=T("copied");
 }).catch(()=>{});}

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
 const audience=r.id==="UNI-005"?"staff":r.id==="TV-FIRSTPOINT"?"all":"student";
 const badge=audience==="staff"?T("staff"):audience==="student"?T("students"):T("all");
 article.append(textNode("span",badge+(r.price==="Gratuito"&&state.lang==="it"?" · Gratuito":""),"tv-tag"));
 article.append(textNode("h3",displayField(r,"title")));
 article.append(textNode("p",displayField(r,"summary")));
 article.append(textNode("p",T("eligible")+": "+displayField(r,"audience")));
 if(displayField(r,"place"))article.append(textNode("p",T("place")+": "+displayField(r,"place")));
 if(displayField(r,"access"))article.append(textNode("p",T("access")+": "+displayField(r,"access")));
 if(r.checked_at)article.append(textNode("small",T("verify")+": "+r.checked_at));
 if(r.email){
   article.append(textNode("p",T("contact")+": "+r.email,"tv-contact"));
   const b=document.createElement("button");b.type="button";b.className="tv-button subtle";
   b.textContent=T("emailCopy");b.addEventListener("click",()=>copyText(r.email));article.append(b);
 }
 links(article,[emailLink(r.email),phoneLink(r.phone),link(T("source"),r.source)]);
 return article;
}

function clinicCard(r,campus){
 const a=textNode("article","","tv-card");
 const distance=distanceKm(campus.lat,campus.lon,r.latitude,r.longitude);
 a.append(textNode("span",r.type||"Servizio sanitario","tv-tag"));
 a.append(textNode("h3",r.name));
 a.append(textNode("p",[r.address,r.town].filter(Boolean).join(" · ")));
 if(r.asl)a.append(textNode("p",r.asl));
 a.append(textNode("p",distance.toFixed(1)+" km · "+T("approx")+
    " · "+(r.quality==="A"?"A":"C")+"."));
 if(r.access)a.append(textNode("p",T("access")+": "+r.access));
 a.append(textNode("p",T("accessNote"),"tv-note"));
 const d=textNode("details","");
 d.append(textNode("summary",state.lang==="en"?"Contacts and sources":"Contatti e fonti"));
 if(r.hours)d.append(textNode("p",(state.lang==="en"?"Published hours: ":"Orari nelle fonti: ")+r.hours));
 if(r.email)d.append(textNode("p",r.email,"tv-contact"));
 links(d,[phoneLink(r.phone),emailLink(r.email),link(T("source"),r.website),
    ...(r.sources||[]).slice(0,2).map((x,i)=>link((state.lang==="en"?"Source ":"Fonte ")+(i+1),x))]);
 a.append(d);
 return a;
}

function getFilters(){
 return {q:($("tv-q").value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("it").trim(),
 radius:Number($("tv-radius").value)||8,type:$("tv-type").value};
}
function filtered(){
 const f=getFilters(),campus=campusSelected();
 return state.clinical.filter(r=>{
   if(!Number.isFinite(r.latitude)||!Number.isFinite(r.longitude))return false;
   if(distanceKm(campus.lat,campus.lon,r.latitude,r.longitude)>f.radius)return false;
   if(f.type&&r.type!==f.type)return false;
   const corpus=[r.name,r.type,r.subtype,r.address,r.asl,r.town].join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("it");
   return !f.q||corpus.includes(f.q);
 }).sort((a,b)=>distanceKm(campus.lat,campus.lon,a.latitude,a.longitude)-distanceKm(campus.lat,campus.lon,b.latitude,b.longitude));
}

function drawMap(rows,radius){
 if(!state.map)return;
 const L=window.L;
 if(state.markers)state.map.removeLayer(state.markers);
 if(state.radius)state.map.removeLayer(state.radius);
 const [lat,lon]=[campusSelected().lat,campusSelected().lon];
 state.radius=L.circle([lat,lon],{radius:radius*1000,color:"#146c5d",fillColor:"#c0eadc",fillOpacity:.12,weight:2}).addTo(state.map);
 state.markers=L.featureGroup().addTo(state.map);
 const campus=L.circleMarker([lat,lon],{radius:10,color:"#0e5a4d",weight:3,fillColor:"#35b5a3",fillOpacity:1});
 campus.bindPopup(T("origin")+" — "+(campusSelected().name||"Tor Vergata"));
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
 const f=getFilters(),rows=filtered(),campus=campusSelected();
 const localLabel=state.lang==="en"?(campus.name_en||campus.name):campus.name;
 $("tv-count").textContent=rows.length+" "+T("count")+" · "+T("range")+" "+f.radius+" km · "+localLabel+". "+T("campusHelp");
 const host=$("tv-results");host.replaceChildren();
 if(!rows.length)host.append(textNode("p",T("noresults"),"tv-empty"));
 else rows.forEach(r=>host.append(clinicCard(r,campus)));
 const uni=$("tv-university");uni.replaceChildren();
 const selection=state.university.filter(r=>state.audience==="all"||
    (state.audience==="student"&&r.id!=="UNI-005")||
    (state.audience==="staff"&&(r.id==="UNI-005"||r.id==="TV-FIRSTPOINT"))||
    state.audience==="territorial");
 if(state.audience!=="territorial") selection.forEach(x=>uni.append(uniCard(x)));
 if(!selection.length||state.audience==="territorial")uni.append(textNode("p",
   state.lang==="en"?"Choose student or staff resources above, or explore nearby services below.":"Seleziona un percorso studenti o personale, oppure consulta i servizi territoriali qui sotto.","tv-note"));
 renderStaticTexts();
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
   state.campuses=Array.isArray(data.campuses)?data.campuses:[{...data.center,id:"rettorato",name:"Rettorato / Giurisprudenza"}];
   state.campus=state.campuses[0];
   const campusSelect=$("tv-campus");
   if(campusSelect)for(const c of state.campuses){
     const o=document.createElement("option");o.value=c.id;o.textContent=c.name;campusSelect.append(o);
   }
   try{
     const published=await fetch("/wp-json/mentacampus/v1/university",{credentials:"omit",cache:"no-store",signal:AbortSignal.timeout(5000)});
     if(published.ok){
       const d=await published.json();
       if(d.active===true&&Array.isArray(d.items)&&d.items.length)state.university=d.items;
     }
   }catch(_){} // Safe fallback to versioned, approved public university data.

   try{
     const ap=await fetch("/wp-json/sml/v1/revisions",{credentials:"omit",cache:"no-store",signal:AbortSignal.timeout(5000)});
     if(ap.ok)applyApproved(await ap.json());
   }catch(_){} // Approved WordPress overrides are optional; static baseline remains usable.

   const types=[...new Set(state.clinical.map(r=>r.type).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"it"));
   for(const type of types){const o=document.createElement("option");o.value=type;o.textContent=type;$("tv-type").append(o);}
   if(window.L){
     state.map=window.L.map("tv-map",{zoomControl:true,scrollWheelZoom:false,attributionControl:true});
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
const campusSelect=$("tv-campus");
if(campusSelect)campusSelect.addEventListener("change",()=>{
  state.campus=state.campuses.find(c=>c.id===campusSelect.value)||state.center;
  render();
});
for(const lang of ["it","en"]){
  const b=$("tv-lang-"+lang);
  if(b)b.addEventListener("click",()=>{
    state.lang=lang;
    const select=$("tv-campus");
    if(select)for(const o of select.options){
      const c=state.campuses.find(c=>c.id===o.value);if(c)o.textContent=lang==="en"?(c.name_en||c.name):c.name;
    }
    render();
  });
}
document.querySelectorAll("[data-tv-role]").forEach(b=>b.addEventListener("click",()=>{
  state.audience=b.dataset.tvRole;
  render();
  const target=state.audience==="territorial"?"vicino":"ascolto";
  document.getElementById(target)?.scrollIntoView({behavior:"smooth",block:"start"});
}));

$("tv-tiles").addEventListener("click",()=>{
 if(!state.map||!window.L)return;
 const message=$("tv-map-alert");
 if(message){message.hidden=true;message.textContent="";}
 if(state.tiles){state.map.removeLayer(state.tiles);state.tiles=null;$("tv-tiles").textContent="Carica sfondo OpenStreetMap";return;}
 // Respect OSMF tile usage policy: correct single hostname, origin-only
 // cross-site referrer, visible attribution, and no prefetch/cache bypass.
 // Request only after a deliberate user click. Browser HTTP cache is kept.
 let errors=0;
 const layer=window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
   attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
   referrerPolicy:"strict-origin-when-cross-origin",
   maxZoom:18,
   updateWhenIdle:true
 });
 layer.on("tileerror",()=>{
   if(++errors<3||state.tiles!==layer)return;
   state.map.removeLayer(layer);
   state.tiles=null;
   $("tv-tiles").textContent="Riprova sfondo OpenStreetMap";
   if(message){
     message.textContent="Lo sfondo non è disponibile. I punti restano visibili. Puoi aprire il collegamento OpenStreetMap qui sotto.";
     message.hidden=false;
   }
 });
 state.tiles=layer.addTo(state.map);
 $("tv-tiles").textContent="Nascondi lo sfondo OpenStreetMap";
});
load();
})();
