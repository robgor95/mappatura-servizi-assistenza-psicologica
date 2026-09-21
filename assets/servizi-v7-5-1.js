/* Accessible static directory: one index, URL state, paged results and original-field details. */
(function(){
'use strict';
const A=window.LazioServices,$=id=>document.getElementById(id),pageSize=12;
if(!A||!$('svc-form'))return;
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={q:'Ricerca',tipo:'Tipo',sottotipo:'Tipo originale',provincia:'Territorio',asl:'ASL',comune:'Comune',regime:'Regime',origine:'Origine',titolarita:'Titolarità',ambito:'Ambito',autorizzazione:'Autorizzazione',accreditamento:'Accreditamento',ssn:'Rapporto SSN',riesame:'Verifica',elenco:'Elenco precedente',mobilita:'Mobilità',posti:'Posti',percorso:'Scorciatoia'};
const origins={rete:'Rete ASL',moduli:'Modulo di struttura non ASL',privati:'Attività privata'};
const evidenceLabels={indicata:'Evidenza indicata nel dataset',dichiarazione:'Dichiarazione del gestore','da-verificare':'Da verificare / non documentato','rete-asl':'Rete ASL'};
let D,rows=[],filtered=[],state={},notices=[],returnKey='',timer,lastTyping=0,openKey='';
const dialog=$('svc-dialog');
function info(message){const target=dialog.open?$('svc-detail-feedback'):$('toast');if(target){target.textContent=message;target.hidden=false;}if(!dialog.open)setTimeout(()=>{$('toast').hidden=true;},6000);}
function field(label,value,wide){return '<div'+(wide?' class="wide"':'')+'><dt>'+esc(label)+'</dt><dd>'+esc(A.nd(value))+'</dd></div>';}
function sourceLinks(s){return s.length?'<ol class="svc-detail-sources">'+s.map(u=>'<li><a href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">'+esc(u)+'</a></li>').join('')+'</ol>':'<p>Nessun collegamento specifico registrato. Consulta i campi e il dataset di origine.</p>';}
function setNotice(messages){$('svc-url-notice').textContent=messages.join(' ');$('svc-url-notice').hidden=!messages.length;}
function serialize(s){const p=new URLSearchParams();A.filterKeys.concat(['ordine','pagina','scheda','tecnico']).forEach(k=>{if(s[k]&&!(k==='pagina'&&Number(s[k])===1)&&!(k==='ordine'&&s[k]==='nome'))p.set(k,s[k]);});return '/servizi.html'+(p.size?'?'+p.toString():'');}
function urlFor(r){return serialize({...state,scheda:r.key});}
function commit(next,push=true){state={...next};const u=serialize(state);if(location.pathname+location.search!==u){try{history[push?'pushState':'replaceState']({},'',u);}catch(e){info('La ricerca funziona, ma questo browser non consente di aggiornare il collegamento.');}}render();}
function updateForm(){A.filterKeys.forEach(k=>{const el=$('svc-'+k);if(el)el.value=state[k]||'';});$('svc-order').value=state.ordine||'nome';}
function populate(){
  const mapping={tipo:'type',sottotipo:'subtype',provincia:'territory',asl:'asl',comune:'town',regime:'regime',ambito:'domains'};
  const territory={RM:'Roma / territorio ASL (RM)',FR:'Frosinone (FR)',LT:'Latina (LT)',RI:'Rieti (RI)',VT:'Viterbo (VT)',ND:'Non documentato'};
  for(const [key,prop] of Object.entries(mapping)){
    const values=[...new Set(rows.flatMap(r=>Array.isArray(r[prop])?r[prop]:[r[prop]]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it'));
    values.forEach(value=>{const o=document.createElement('option');o.value=value;o.textContent=key==='provincia'?(territory[value]||value):value;$('svc-'+key).appendChild(o);});
  }
}
function stateFromURL(){
  notices=[];const p=new URLSearchParams(location.search),s=A.parse(location.search,D);
  if(p.get('view')&&!['summary','network','contracted','stpit','pending','extra','public','coverage','sources','quality','history','method'].includes(p.get('view')))notices.push('Vista precedente non riconosciuta. Sono mostrate le schede senza quel filtro.');
  const allowed=new Set(A.filterKeys.concat(['ordine','pagina','scheda','tecnico','view','id','indice','verifica']));
  for(const key of p.keys())if(!allowed.has(key))notices.push('Parametro ignorato: '+key.slice(0,70)+'.');
  for(const key of A.filterKeys){const el=$('svc-'+key);if(el&&el.tagName==='SELECT'&&s[key]&&![...el.options].some(o=>o.value===s[key])){
    notices.push('Filtro non riconosciuto: '+names[key]+'. Rimuovilo per ampliare la ricerca.');
    const o=document.createElement('option');o.value=s[key];o.textContent=s[key]+' (non riconosciuto)';el.appendChild(o);
  }}
  if(s.percorso&&!A.labels[s.percorso]){notices.push('Scorciatoia non riconosciuta.');delete s.percorso;}
  if(s.ordine&&!['nome','comune','tipo'].includes(s.ordine)){notices.push('Ordinamento non riconosciuto: usato Nome A–Z.');s.ordine='nome';}
  if(s.tecnico&&!['summary','coverage','sources','quality','history','method'].includes(s.tecnico)){notices.push('Strumento documentale non riconosciuto.');delete s.tecnico;}
  if(s.scheda){const r=rows.find(r=>r.key===s.scheda||r.id===s.scheda);if(r)s.scheda=r.key;else{notices.push('La scheda richiesta non è presente tra i dati caricati. Nessun servizio è stato selezionato al suo posto.');delete s.scheda;}}
  return s;
}
function chipLabel(key,value){
  if(key==='percorso')return A.labels[value]||value;
  if(key==='elenco')return value==='convenzionate'?'Res/semi V7.3 · leggere gli stati SSN':value==='pending'?'Moduli da verificare V7.3':value;
  const el=$('svc-'+key);if(el&&el.tagName==='SELECT')return el.options[el.selectedIndex]?.textContent||value;
  return value;
}
function card(r){
  const sourceOrigin=origins[r.origin],privateStyle=r.origin==='rete'?'':' private';
  const aNote=r.origin==='rete'?(r.ownership==='Da verificare'?'Titolarità da verificare nel dataset.':'Verifica e attribuzione del servizio riportate nella scheda.'):'Rapporto SSN: '+evidenceLabels[r.ssn]+'. Consulta fonte e periodo.';
  return '<article class="svc-card"><div class="svc-tags"><span class="svc-tag'+privateStyle+'">'+esc(sourceOrigin)+'</span><span class="svc-tag plain">'+esc(r.regime)+'</span></div><h3><a href="'+esc(urlFor(r))+'" data-open="'+esc(r.key)+'">'+esc(r.name)+'</a></h3><p class="svc-module">'+esc(r.origin==='moduli'?'Modulo: '+r.subtype:r.subtype)+'</p><p class="svc-location">'+esc(r.town)+' · '+esc(r.asl)+'</p><p class="svc-location">'+esc(r.address)+'</p><p class="svc-admin-note">'+esc(aNote)+'</p><div class="svc-card-footer">'+(r.phone?'<a href="tel:'+esc(r.phone)+'" aria-label="Chiama '+esc(r.name)+'">Telefono</a>':'')+'<a href="'+esc(urlFor(r))+'" data-open="'+esc(r.key)+'" data-section="accesso">Accesso</a><a class="button secondary" href="'+esc(urlFor(r))+'" data-open="'+esc(r.key)+'">Apri scheda <span aria-hidden="true">→</span></a></div><p class="svc-record-meta">'+esc(r.id)+' · Verifica registrata: '+esc(r.date||'non documentata')+'</p></article>';
}
function rawFields(r,title){return '<details class="svc-raw"><summary>'+esc(title)+' ('+Object.keys(r).length+' campi)</summary><dl>'+Object.entries(r).map(([k,v])=>'<dt>'+esc(k)+'</dt><dd>'+esc(v===null?'Non documentato':typeof v==='object'?JSON.stringify(v):A.nd(v))+'</dd>').join('')+'</dl></details>';}
function detail(r){
  const v=r.raw,isModule=r.origin==='moduli',isPrivate=r.origin==='privati';
  const serviceAnchor=({'CSM':'csm','SerD':'serd','DSM':'dsm','SPDC':'spdc','STPIT':'stpit','SRTR':'srtr','SRSR':'srsr','Centro diurno':'centro-diurno','TSMREE/NPIA':'tsmree-npia','DCA/DNA':'dca-dna'})[r.type];
  const intro='<div class="svc-tags"><span class="svc-tag">'+esc(origins[r.origin])+'</span><span class="svc-tag plain">'+esc(r.regime)+'</span></div><h2 id="svc-detail-title" tabindex="-1">'+esc(r.name)+'</h2><p class="svc-subtitle">'+esc(r.subtype)+' · '+esc(r.town)+' · '+esc(r.id)+'</p>';
  const buttons='<div class="svc-detail-actions">'+(r.phone?'<a class="button" href="tel:'+esc(r.phone)+'">Chiama</a>':'')+(r.email?'<a class="button secondary" href="mailto:'+esc(r.email)+'">Email</a>':'')+'<button class="text-button" data-detail-share type="button">Condividi scheda</button><button class="text-button" data-detail-print type="button">Stampa scheda</button><a class="text-button" href="/orientamento-servizi.html'+(serviceAnchor?'#'+serviceAnchor:'')+'">Come funziona il servizio →</a></div><p id="svc-detail-feedback" role="status" class="micro" hidden></p>';
  const section=(name,content,id)=>'<section class="svc-detail-section"'+(id?' id="'+id+'" tabindex="-1"':'')+'><h3>'+name+'</h3><dl class="svc-detail-fields">'+content+'</dl></section>';
  let body=section('Informazioni principali',field('Denominazione',r.name,true)+field('Identificativo scheda',r.id)+field('Struttura / sede (ID distinto dal modulo)',v.id_sede||(isModule?'Non documentato':'Identificativo del nodo: '+r.id))+field('Tipologia originale',r.subtype)+field('Regime originale',v.regime||'Non distinto nel dataset della rete ASL')+field('Comune',r.town)+field('Territorio di ricerca',r.territory+' · per i nodi ASL senza provincia esplicita è raggruppato dalla ASL')+field('ASL indicata',r.asl)+field('Gestore / titolarità registrata',v.gestore||v.gestione||v.natura)+field('Indirizzo',r.address,true));
  body+=section('Come si accede',field('Accesso / ammissione',v.accesso||v.ammissione||v.prenotazione,true)+field('Criteri e limitazioni',v.criteri_limitazioni,true)+field('Documenti per l’ingresso',v.documenti_ingresso,true)+field('Durata del percorso',v.durata_percorso,true)+field('Altre ASL',v.mobilita_intraregionale)+field('Accesso extraregionale',v.accesso_fuori_lazio_stato||v.accesso_extraregionale)+field('Condizioni / prova di mobilità', [v.condizioni_extraregionale,v.accesso_fuori_lazio_prova].filter(Boolean).join('\n'),true),'svc-accesso');
  body+=section('Destinatari, servizi ed équipe',field('Destinatari',v.destinatari,true)+field('Servizi dichiarati',r.services,true)+field('Attribuzione / evidenza dei servizi',v.attribuzione_servizi||v.evidenza_servizi,true)+field('Équipe dichiarata',v.equipe||v.equipe_professionisti,true)+field('Accessibilità',v.accessibilita,true));
  body+=section('Contatti e orari',field('Telefono registrato',v.telefono||v.contatti,true)+field('Email registrata',v.email||(isPrivate?r.email:''),true)+field('Orari registrati',v.orari,true));
  body+=section('Rapporto con SSN e documentazione amministrativa',field('Autorizzazione',r.admin.autorizzazione,true)+field('Accreditamento',r.admin.accreditamento,true)+field('Rapporto SSN',v.rapporto_ssn||v.convenzione_ssn||(r.origin==='rete'?'Nodo censito nella rete ASL; leggere la titolarità registrata.':''),true)+field('Stato del contratto SSN',v.contratto_ssn_stato,true)+field('Periodo del contratto / evidenza',v.contratto_periodo||v.periodo_evidenza,true)+field('Validità 2026 registrata',v.validita_2026,true)+field('Budget 2026 registrato',v.budget_2026_stato,true)+field('Posti autorizzati',v.posti_autorizzati)+field('Posti accreditati',v.posti_accreditati)+field('Posti contrattualizzati',v.posti_contrattualizzati)+field('Posti dichiarati / natura del dato',[v.posti_dichiarati||v.posti,v.natura_posti].filter(Boolean).join(' · '))+field('Limite sui posti','La capacità registrata non indica posti liberi. Una dichiarazione del gestore non equivale a un contratto SSN corrente.',true));
  body+=section('Fonti e stato della verifica',field('Data di verifica registrata',r.date)+field('Stato nel dataset',r.status)+field('Note temporali / limitazioni',[v.nota_temporale_v7,v.note,v.note_modulo,v.note_v7_2,v.note_v6].filter(Boolean).join('\n'),true));
  body+=sourceLinks(r.sources);
  if(r.checked)body+=rawFields(r.checked,'Verifica ASL aggiuntiva dello stesso nodo (non un nuovo servizio)');
  body+=rawFields(v,'Tutti i campi originali: nessun dato nascosto o sostituito');
  body+='<p class="micro">I raggruppamenti e i filtri sono strumenti di consultazione. Autorizzazione, accreditamento e contratto non sono sinonimi. Il restyling non è una nuova verifica sanitaria dei dati.</p>';
  $('svc-detail').innerHTML=intro+buttons+body;
}
function renderDialog(){
  const r=rows.find(r=>r.key===state.scheda);
  if(!r){if(dialog.open){dialog.close();const target=[...document.querySelectorAll('[data-open]')].find(el=>el.dataset.open===returnKey);(target||$('svc-results-title')).focus({preventScroll:true});}openKey='';return;}
  if(openKey!==r.key){detail(r);openKey=r.key;if(!dialog.open)dialog.showModal();$('svc-detail-title').focus({preventScroll:true});dialog.scrollTop=0;}
}
function table(data,cols){
  return '<div class="svc-table-wrap" tabindex="0" role="region" aria-label="Tabella scorrevole"><table class="svc-table"><thead><tr>'+cols.map(c=>'<th scope="col">'+esc(c[1])+'</th>').join('')+'</tr></thead><tbody>'+data.map(r=>'<tr>'+cols.map(c=>'<td>'+(c[0]==='url'&&A.urls(r[c[0]]).length?'<a href="'+esc(A.urls(r[c[0]])[0])+'" rel="noopener noreferrer" target="_blank">'+esc(r[c[0]])+'</a>':esc(A.nd(c[0]==='id_fonte_v7_2'?(r.id_fonte_v7_2||r.id_fonte_v7):r[c[0]])))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
function renderTechnical(){
  const key=state.tecnico||'summary';$('svc-tech-view').value=key;
  if(state.tecnico)$('svc-technical').open=true;
  let h='';
  if(key==='coverage')h='<h3>Copertura registrata V7.3</h3>'+table(D.coverage||[],[['asl','ASL / territorio'],['ambito','Ambito'],['moduli','Moduli'],['convenzionate','Elenco convenzionate'],['stpit','STPIT'],['da_verificare','Da verificare']]);
  else if(key==='sources')h='<h3>Fonti master</h3>'+table(D.fonti_master||[],[['id_fonte_v7_2','ID'],['dominio','Dominio'],['url','Fonte'],['territori_collegati','Territori'],['moduli_collegati','Moduli'],['origini_nel_dataset','Origini']]);
  else if(key==='quality')h='<h3>Completezza documentale, non qualità sanitaria</h3>'+table((D.quality||[]).map(r=>({...r,percentuale:Number(r.totale)?(100*Number(r.compilati)/Number(r.totale)).toFixed(1)+'%':'—'})),[['campo','Campo'],['totale','Totale'],['compilati','Compilati'],['vuoti','Vuoti'],['percentuale','Completezza %']]);
  else if(key==='history')h='<h3>Storico delle revisioni V5–V7</h3>'+table(D.moduli,[['id_modulo','ID modulo'],['denominazione','Struttura'],['modulo','Modulo'],['presente_v5','Presente V5'],['variazione_v5_v6','V5 → V6'],['sezione_v5','Sezione V5'],['sezione','Classificazione grezza'],['sezione_canonica_v7','Classificazione V7'],['nota_v7_strutturale','Nota di revisione']]);
  else if(key==='method')h='<h3>Metodo e dataset originali</h3><p>La ricerca unifica la consultazione, non i regimi amministrativi. I file sorgente V7.3 e V7.5 restano separati e non vengono riscritti. Nessun accreditamento, invio o posto libero è dedotto dal nome della struttura.</p><div class="actions"><a class="button secondary" href="/downloads/Mappatura_Lazio_V7_3.xlsx">Excel V7.3</a><a class="button secondary" href="/downloads/Dataset_Lazio_V7_3.json">JSON completo V7.3</a><a class="button secondary" href="/downloads/Tutti_Moduli_V7_3.csv">Tutti i moduli CSV</a><a class="button secondary" href="/downloads/Rete_ASL_V7_3.csv">Rete ASL CSV</a><a class="button secondary" href="/offline/Portale_Lazio_V7_3_Offline.html">Versione offline V7.3</a><a class="button secondary" href="/metodo.html">Metodo e fonti</a></div>';
  else{const stats=[[D.rete_asl.length,'Nodi della rete ASL'],[D.moduli.length,'Moduli non ASL'],[rows.filter(r=>r.origin==='privati').length,'Schede di attività privata'],[D.moduli.filter(r=>r._categoria_portale==='convenzionate').length,'Elenco res/semi V7.3 · stati SSN distinti'],[D.moduli.filter(r=>r._categoria_portale==='stpit').length,'Moduli STPIT'],[D.moduli.filter(r=>r._categoria_portale==='pending').length,'Moduli da verificare'],[(D.pubbliche_ricontrollate||[]).length,'Nodi ASL ricontrollati (già inclusi)'],[(D.fonti_master||[]).length,'Fonti master']];h='<h3>Quadro dei dati</h3><div class="svc-tech-stats">'+stats.map(x=>'<div><b>'+x[0]+'</b><span>'+esc(x[1])+'</span></div>').join('')+'</div><p>'+esc(D.meta&&D.meta.nota||'')+'</p><div class="actions"><a class="button secondary" href="/servizi.html?origine=moduli&amp;elenco=convenzionate">Elenco res/semi precedente</a><a class="button secondary" href="/servizi.html?origine=moduli&amp;elenco=pending">Moduli da verificare</a><a class="button secondary" href="/servizi.html?origine=rete&amp;riesame=ricontrollate">ASL ricontrollate</a><a class="button secondary" href="/servizi.html?origine=moduli&amp;mobilita=informazioni">Mobilità territoriale</a></div>';}
  $('svc-tech-content').innerHTML=h;
}
function render(){
  updateForm();
  filtered=rows.filter(r=>A.matches(r,state));
  const prop=({comune:'town',tipo:'type'})[state.ordine]||'name';
  filtered.sort((a,b)=>a[prop].localeCompare(b[prop],'it')||a.name.localeCompare(b.name,'it')||a.key.localeCompare(b.key));
  const maxPage=Math.max(1,Math.ceil(filtered.length/pageSize));let page=Math.max(1,Math.min(maxPage,parseInt(state.pagina,10)||1));
  if(state.pagina&&String(page)!==String(state.pagina)){state.pagina=String(page);try{history.replaceState({},'',serialize(state));}catch(e){}}
  const start=(page-1)*pageSize;
  $('svc-count').textContent=filtered.length+' di '+rows.length+' schede · risultati ordinati alfabeticamente, senza classifiche.';
  $('svc-chips').innerHTML=A.filterKeys.filter(k=>state[k]).map(k=>'<button class="svc-chip" type="button" data-remove="'+esc(k)+'" aria-label="Rimuovi filtro '+esc(names[k])+': '+esc(chipLabel(k,state[k]))+'">'+esc(names[k])+': '+esc(chipLabel(k,state[k]))+' <span aria-hidden="true">×</span></button>').join('');
  $('svc-list').innerHTML=filtered.slice(start,start+pageSize).map(card).join('');
  $('svc-empty').hidden=filtered.length!==0;
  $('svc-page').textContent=filtered.length?(start+1)+'–'+Math.min(start+pageSize,filtered.length)+' di '+filtered.length+' · pagina '+page+'/'+maxPage:'0 schede';
  $('svc-prev').disabled=page===1;$('svc-next').disabled=page===maxPage;$('svc-csv').disabled=!filtered.length;
  const advanced=A.filterKeys.filter(k=>!['q','tipo','provincia','regime','percorso'].includes(k)&&state[k]).length;
  $('svc-advanced-count').textContent=advanced?'('+advanced+' attivi)':'';
  document.querySelectorAll('.svc-path').forEach(el=>{if(el.dataset.preset==='percorso='+state.percorso)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current');});
  setNotice(notices);renderDialog();renderTechnical();$('risultati').setAttribute('aria-busy','false');
}
function takeForm(){const next={...state};A.filterKeys.forEach(k=>{const el=$('svc-'+k);if(el){if(el.value)next[k]=el.value;else delete next[k];}});delete next.scheda;delete next.pagina;return next;}
function reset(){clearTimeout(timer);notices=[];commit({});$('svc-q').focus({preventScroll:true});}
async function share(url){
  const full=new URL(url,document.baseURI).href;
  if(navigator.share){try{await navigator.share({title:document.title,url:full});return;}catch(e){if(e.name==='AbortError')return;}}
  try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(full);}else{const area=document.createElement('textarea');area.value=full;area.setAttribute('readonly','');(dialog.open?dialog:document.body).appendChild(area);area.select();const ok=document.execCommand('copy');area.remove();if(!ok)throw new Error('copy');}info('Collegamento copiato.');}catch(e){info('Copia il collegamento dalla barra degli indirizzi.');}
}
function closeDetail(){const s={...state};delete s.scheda;commit(s);}
function wire(){
  $('svc-form').addEventListener('submit',e=>{e.preventDefault();clearTimeout(timer);notices=[];commit(takeForm());$('risultati').scrollIntoView({block:'start'});});
  $('svc-q').addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>{const now=Date.now();notices=[];commit(takeForm(),now-lastTyping>900);lastTyping=now;},200);});
  $('svc-form').querySelectorAll('select').forEach(el=>el.addEventListener('change',()=>{clearTimeout(timer);notices=[];commit(takeForm());}));
  $('svc-order').addEventListener('change',()=>{const s={...state,ordine:$('svc-order').value};delete s.pagina;commit(s);});
  $('svc-reset').addEventListener('click',reset);$('svc-reset-empty').addEventListener('click',reset);
  $('svc-chips').addEventListener('click',e=>{const b=e.target.closest('[data-remove]');if(b){const s={...state};delete s[b.dataset.remove];delete s.scheda;delete s.pagina;notices=[];commit(s);}});
  $('svc-share-search').addEventListener('click',()=>{const s={...state};delete s.scheda;share(serialize(s));});
  document.addEventListener('click',e=>{
    if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;
    const preset=e.target.closest('[data-preset]');if(preset){e.preventDefault();clearTimeout(timer);notices=[];commit(Object.fromEntries(new URLSearchParams(preset.dataset.preset)));$('ricerca').scrollIntoView({block:'start'});return;}
    const target=e.target.closest('[data-open]');if(target){e.preventDefault();returnKey=target.dataset.open;commit({...state,scheda:returnKey});if(target.dataset.section==='accesso'){$('svc-accesso').scrollIntoView({block:'start'});$('svc-accesso').focus({preventScroll:true});}}
    if(e.target.closest('[data-detail-share]'))share(serialize(state));
    if(e.target.closest('[data-detail-print]'))window.print();
  });
  dialog.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    const controls=[...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),summary,[tabindex="0"]')].filter(el=>el.getClientRects().length);
    const first=controls[0],last=controls[controls.length-1];
    if(!first){e.preventDefault();$('svc-detail-title').focus();return;}
    if(e.shiftKey&&(document.activeElement===first||!controls.includes(document.activeElement))){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
  $('svc-close').addEventListener('click',closeDetail);dialog.addEventListener('cancel',e=>{e.preventDefault();closeDetail();});
  dialog.addEventListener('click',e=>{const b=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom))closeDetail();});
  for(const [id,delta] of [['svc-prev',-1],['svc-next',1]])$(id).addEventListener('click',()=>{commit({...state,pagina:String((parseInt(state.pagina,10)||1)+delta)});$('svc-results-title').focus({preventScroll:true});$('risultati').scrollIntoView({block:'start'});});
  $('svc-csv').addEventListener('click',()=>{const blob=new Blob([A.csv(filtered)],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(blob),link=document.createElement('a');link.href=u;link.download='Servizi_Lazio_risultati_V7_5_1.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);});
  $('svc-tech-view').addEventListener('change',()=>commit({...state,tecnico:$('svc-tech-view').value}));
  window.addEventListener('popstate',()=>{clearTimeout(timer);state=stateFromURL();render();});
}
async function getJSON(url){const controller=new AbortController(),t=setTimeout(()=>controller.abort(),18000);try{const r=await fetch(url,{signal:controller.signal});if(!r.ok)throw new Error('HTTP '+r.status);return await r.json();}finally{clearTimeout(t);}}
async function start(){
  const [base,extra]=await Promise.allSettled([getJSON('/data/portal_data_v7_3.json'),getJSON('/data/privati_v7_5.json')]);
  if(base.status!=='fulfilled')throw new Error('Database principale non caricabile. Riprova o usa i download originali.');
  D=base.value;rows=A.build(D,extra.status==='fulfilled'?extra.value:null);populate();wire();
  $('svc-total').textContent=rows.length+' schede';
  $('svc-breakdown').textContent=rows.filter(r=>r.origin==='rete').length+' nodi rete ASL · '+rows.filter(r=>r.origin==='moduli').length+' moduli non ASL · '+rows.filter(r=>r.origin==='privati').length+' schede di attività privata.';
  if(extra.status==='fulfilled')$('svc-load-status').hidden=true;else{$('svc-load-status').textContent='Il dataset dei centri con attività privata non è stato caricato: stai consultando solo i '+rows.length+' record del database principale.';}
  $('svc-controls').disabled=false;state=stateFromURL();commit(state,false);
  if(state.tecnico){$('svc-technical').scrollIntoView({block:'start'});}
}
start().catch(e=>{$('svc-load-status').classList.add('error');$('svc-load-status').textContent=e.message;$('svc-total').textContent='Dati non caricati';$('svc-count').textContent='Nessun risultato disponibile: il caricamento non è riuscito.';$('risultati').setAttribute('aria-busy','false');});
})();
