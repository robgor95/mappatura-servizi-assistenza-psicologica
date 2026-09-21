(function(){
"use strict";
var cfg=window.V75_CONFIG||{};
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m];});}
function norm(v){var s=String(v==null?"":v);if(s.normalize)s=s.normalize("NFD");return s.replace(/[\u0300-\u036f]/g,"").toLowerCase();}
function linkify(v){var s=String(v||""); if(/^https?:\/\//i.test(s.trim())) return '<a href="'+esc(s.trim())+'" target="_blank" rel="noopener noreferrer">Apri fonte ufficiale</a>'; return esc(s);}
function unique(rows,field){var o={};rows.forEach(function(r){var v=r[field];if(v)o[v]=1;});return Object.keys(o).sort(function(a,b){return a.localeCompare(b,"it");});}
function label(k){var m={
universita:"Università",servizio:"Servizio",tipologia:"Tipologia",destinatari:"Destinatari",utenza:"Utenza",gratuita_costo:"Gratuità / costo",limite_incontri:"Incontri",modalita:"Modalità",sede:"Sede",telefono:"Telefono",email:"Email",prenotazione:"Prenotazione",criteri_accesso:"Criteri di accesso",periodo_validita:"Periodo / validità",fonte_ufficiale:"Fonte ufficiale",ultima_verifica:"Ultima verifica",stato_verifica:"Stato verifica",
istituto:"Istituto",comune:"Comune",provincia:"Provincia",ordine_grado:"Ordine / grado",ammessi:"Ammessi",gratuito:"Gratuito",modalita_accesso:"Modalità di accesso",professionista_ente_gestore:"Professionista / gestore",telefono_email_link:"Contatti",collaborazione_pubblica:"Collaborazione pubblica",fonte:"Fonte",stato_dato:"Stato del dato",
nome:"Nome",ente:"Ente",natura:"Natura",categoria:"Categoria",numero:"Numero",costo_chiamata:"Costo chiamata",costo_servizio:"Costo servizio",orari:"Orari",funzione:"Funzione",cosa_non_e:"Cosa NON è",sito_ufficiale:"Sito ufficiale",
ente_titolare:"Ente titolare",comune_municipio:"Comune / Municipio",finalita:"Finalità",costo:"Costo / ticket",accesso:"Accesso",indirizzo:"Indirizzo",stato:"Stato",
denominazione:"Denominazione",contatti:"Contatti",servizi_dichiarati:"Servizi dichiarati",equipe_professionisti:"Équipe / professionisti",autorizzazione_sanitaria:"Autorizzazione sanitaria",accreditamento:"Accreditamento",convenzione_ssn:"Convenzione SSN",regime:"Regime",fonte_istituzionale:"Fonte istituzionale",data_verifica:"Data verifica",
struttura:"Struttura",gestore:"Gestore",asl_territoriale:"ASL territoriale",tipologia_modulo:"Tipologia modulo",ambito:"Ambito",criteri_ammissione:"Criteri di ammissione",criteri_esclusione_limitazioni:"Esclusioni / limitazioni",modalita_invio:"Modalità di invio",servizio_competente:"CSM / SerD / DSM competente",accesso_altre_asl:"Accesso da altre ASL",accesso_extraregionale:"Accesso extraregionale",condizioni_extraregionali:"Condizioni extraregionali",documenti_richiesti:"Documenti richiesti",equipe:"Équipe",presenza_medica:"Presenza medica",presenza_infermieristica:"Presenza infermieristica",presenza_riabilitativa:"Presenza riabilitativa",terp:"TeRP",attivita_principali:"Attività principali",programma_terapeutico_riabilitativo:"Programma terapeutico-riabilitativo",durata:"Durata",posti_autorizzati:"Posti autorizzati",posti_accreditati:"Posti accreditati",posti_contrattualizzati:"Posti contrattualizzati",posti_dichiarati:"Posti dichiarati",autorizzazione:"Autorizzazione",autorizzazione_fonte:"Fonte autorizzazione",accreditamento_fonte:"Fonte accreditamento",rapporto_ssn:"Rapporto SSN",contratto_ssn:"Contratto SSN",contratto_periodo:"Periodo contratto",orari_segreteria:"Orari / segreteria",sito_fonti:"Sito / fonti",fonti:"Fonti"
};return m[k]||k.replace(/_/g," ");}
function title(r){for(var i=0;i<(cfg.titleFields||[]).length;i++){var v=r[cfg.titleFields[i]];if(v)return v;}return "Scheda";}
function renderCard(r){
 var fields=cfg.fields||Object.keys(r), out='<article class="directory-card v75-card" data-card><div class="card-top">';
 (cfg.badgeFields||[]).forEach(function(k){if(r[k])out+='<span class="pill">'+esc(r[k])+'</span>';});
 out+='</div><h2>'+esc(title(r))+'</h2><dl class="card-fields">';
 fields.forEach(function(k){var v=r[k];if(v==null||v===""||k==="id")return;var html=(/fonte|sito/i.test(k)&&/^https?:\/\//i.test(String(v).trim()))?linkify(v):esc(Array.isArray(v)?v.join(" · "):v);out+='<div><dt>'+esc(label(k))+'</dt><dd>'+html+'</dd></div>';});
 return out+'</dl></article>';
}
function init(rows){
 var grid=document.getElementById("directory-grid"), q=document.getElementById("directory-search"), reset=document.querySelector("[data-reset]"), count=document.getElementById("result-count");
 var filters=(cfg.filters||[]).map(function(f){var el=document.getElementById(f.id);unique(rows,f.field).forEach(function(v){el.insertAdjacentHTML("beforeend",'<option value="'+esc(v)+'">'+esc(v)+'</option>');});return {el:el,field:f.field};});
 function update(){var query=norm(q.value.trim()),shown=0;grid.innerHTML=rows.filter(function(r){var blob=norm((cfg.searchFields||Object.keys(r)).map(function(k){return r[k]||"";}).join(" "));var ok=!query||blob.indexOf(query)>=0;filters.forEach(function(f){if(f.el.value&&r[f.field]!==f.el.value)ok=false;});return ok;}).map(function(r){shown++;return renderCard(r);}).join("");count.textContent=shown+" di "+rows.length+" schede mostrate.";document.getElementById("empty-result").hidden=shown!==0;}
 q.addEventListener("input",update);filters.forEach(function(f){f.el.addEventListener("change",update);});reset.addEventListener("click",function(){q.value="";filters.forEach(function(f){f.el.value="";});update();q.focus();});update();
}
fetch(cfg.source,{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json();}).then(function(d){init(d.records||[]);}).catch(function(e){document.getElementById("directory-grid").innerHTML='<div class="empty-result">Impossibile caricare il dataset: '+esc(e.message)+'</div>';});
})();