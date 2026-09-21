/* Accessible static directory: one index, URL state, paged results and original-field details. */
(function(){
'use strict';
const A=window.LazioServices,$=id=>document.getElementById(id),pageSize=12;
if(!A||!$('svc-form'))return;
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={q:'Ricerca',tipo:'Tipo di servizio',sottotipo:'Tipo specifico',provincia:'Territorio',asl:'ASL',comune:'Comune',regime:'Modalità',origine:'Tipo di struttura',titolarita:'Gestione',ambito:'Area',autorizzazione:'Autorizzazione',accreditamento:'Accreditamento',ssn:'Rapporto SSN',riesame:'Aggiornamento',elenco:'Elenco precedente',mobilita:'Accesso territoriale',posti:'Capacità',percorso:'Percorso'};
const evidenceLabels={indicata:'rapporto con il SSN documentato',dichiarazione:'rapporto con il SSN dichiarato dalla struttura','da-verificare':'rapporto con il SSN da verificare','rete-asl':'servizio della rete pubblica'};
function originLabel(r){if(r.origin==='rete')return 'Servizio pubblico / SSN';if(r.origin==='privati')return 'Struttura privata';if(r.origin==='moduli'){if(r.ssn==='indicata')return 'Struttura convenzionata';if(r.ssn==='dichiarazione')return 'Convenzione dichiarata';return 'Struttura non ASL';}return 'Servizio';}
function ssnNote(r){if(r.origin==='rete')return 'Servizio della rete pubblica. Verifica modalità di accesso e competenza territoriale.';if(r.origin==='privati')return 'Prestazioni private: costi e modalità vanno confermati con la struttura.';return 'Rapporto con il SSN: '+evidenceLabels[r.ssn]+'. Verifica condizioni e periodo nelle fonti.';}
let D,rows=[],filtered=[],state={},notices=[],returnKey='',timer,lastTyping=0,openKey='';
const dialog=$('svc-dialog');
function mapURL(r){return '/mappa.html?presidio='+encodeURIComponent(r.key);}
function managementLabel(v){const text=String(v||'');return /^Rete ASL\s*[—–-]\s*dato ereditato V\d/i.test(text)?'Rete ASL: attribuzione precedente, gestione da confermare':text;}

function info(message){const target=dialog.open?$('svc-detail-feedback'):$('toast');if(target){target.textContent=message;target.hidden=false;}if(!dialog.open)setTimeout(()=>{$('toast').hidden=true;},6000);}
function field(label,value,wide){return '<div'+(wide?' class="wide"':'')+'><dt>'+esc(label)+'</dt><dd>'+esc(A.nd(value))+'</dd></div>';}
function sourceLinks(s){return s.length?'<ol class="svc-detail-sources">'+s.map(u=>'<li><a href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">'+esc(u)+'</a></li>').join('')+'</ol>':'<p>Nessuna fonte specifica è collegata a questo risultato. Consulta la pagina Metodo e fonti.</p>';}
function setNotice(messages){$('svc-url-notice').textContent=messages.join(' ');$('svc-url-notice').hidden=!messages.length;}
function serialize(s){const p=new URLSearchParams();A.filterKeys.concat(['ordine','pagina','scheda','tecnico']).forEach(k=>{if(s[k]&&!(k==='pagina'&&Number(s[k])===1)&&!(k==='ordine'&&s[k]==='nome'))p.set(k,s[k]);});return '/servizi.html'+(p.size?'?'+p.toString():'');}
function urlFor(r){return serialize({...state,scheda:r.key});}
function commit(next,push=true){state={...next};const u=serialize(state);if(location.pathname+location.search!==u){try{history[push?'pushState':'replaceState']({},'',u);}catch(e){info('La ricerca funziona, ma questo browser non consente di aggiornare il collegamento.');}}render();}
function updateForm(){A.filterKeys.forEach(k=>{const el=$('svc-'+k);if(el)el.value=state[k]||'';});$('svc-order').value=state.ordine||'nome';}
function populate(){
  const mapping={tipo:'type',sottotipo:'subtype',provincia:'territory',asl:'asl',comune:'town',regime:'regime',ambito:'domains'};
  const territory={RM:'Roma (RM)',FR:'Frosinone (FR)',LT:'Latina (LT)',RI:'Rieti (RI)',VT:'Viterbo (VT)',ND:'Non documentato'};
  for(const [key,prop] of Object.entries(mapping)){
    const values=[...new Set(rows.flatMap(r=>Array.isArray(r[prop])?r[prop]:[r[prop]]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'it'));
    values.forEach(value=>{const o=document.createElement('option');o.value=value;o.textContent=key==='provincia'?(territory[value]||value):value;$('svc-'+key).appendChild(o);});
  }
}
function stateFromURL(){
  notices=[];const p=new URLSearchParams(location.search),s=A.parse(location.search,D);
  if(p.get('view')&&!['summary','network','contracted','stpit','pending','extra','public','coverage','sources','quality','history','method'].includes(p.get('view')))notices.push('Il vecchio collegamento contiene una vista non riconosciuta: vengono mostrati i risultati disponibili.');
  const allowed=new Set(A.filterKeys.concat(['ordine','pagina','scheda','tecnico','view','id','indice','verifica']));
  for(const key of p.keys())if(!allowed.has(key))notices.push('Parametro ignorato: '+key.slice(0,70)+'.');
  for(const key of A.filterKeys){const el=$('svc-'+key);if(el&&el.tagName==='SELECT'&&s[key]&&![...el.options].some(o=>o.value===s[key])){
    notices.push('Filtro non riconosciuto: '+names[key]+'. Rimuovilo per ampliare la ricerca.');
    const o=document.createElement('option');o.value=s[key];o.textContent=s[key]+' (non riconosciuto)';el.appendChild(o);
  }}
  if(s.percorso&&!A.labels[s.percorso]){notices.push('Scorciatoia non riconosciuta.');delete s.percorso;}
  if(s.ordine&&!['nome','comune','tipo'].includes(s.ordine)){notices.push('Ordinamento non riconosciuto: usato Nome A–Z.');s.ordine='nome';}
  if(s.tecnico&&!['summary','coverage','sources','quality','history','method'].includes(s.tecnico)){notices.push('Strumento documentale non riconosciuto.');delete s.tecnico;}
  if(s.scheda){const r=rows.find(r=>r.key===s.scheda||r.id===s.scheda);if(r)s.scheda=r.key;else{notices.push('Il servizio richiesto non è presente tra i dati caricati. Nessun altro risultato è stato selezionato al suo posto.');delete s.scheda;}}
  return s;
}
function chipLabel(key,value){
  if(key==='percorso')return A.labels[value]||value;
  if(key==='elenco')return value==='convenzionate'?'Residenziali e semiresidenziali: verifica il rapporto SSN':value==='pending'?'Strutture da verificare':value;
  const el=$('svc-'+key);if(el&&el.tagName==='SELECT')return el.options[el.selectedIndex]?.textContent||value;
  return value;
}
function card(r){
  const privateStyle=r.origin==='rete'?'':' private';
  return '<article class="svc-card"><div class="svc-tags"><span class="svc-tag'+privateStyle+'">'+esc(originLabel(r))+'</span><span class="svc-tag plain">'+esc(r.regime==='Non distinto nel dataset'?'Modalità non specificata':r.regime)+'</span></div><h3><a href="'+esc(urlFor(r))+'" data-open="'+esc(r.key)+'">'+esc(r.name)+'</a></h3><p class="svc-module">'+esc(r.subtype)+'</p><p class="svc-location">'+esc(r.town)+' · '+esc(r.asl)+'</p><p class="svc-location">'+esc(r.address)+'</p><p class="svc-admin-note">'+esc(ssnNote(r))+'</p><div class="svc-card-footer"><a href="'+esc(mapURL(r))+'">Mappa</a>'+(r.phone?'<a href="tel:'+esc(r.phone)+'" aria-label="Chiama '+esc(r.name)+'">Telefono</a>':'')+'<a href="'+esc(urlFor(r))+'" data-open="'+esc(r.key)+'" data-section="accesso">Come si accede</a><a class="button secondary" href="'+esc(urlFor(r))+'" data-open="'+esc(r.key)+'">Dettagli e contatti <span aria-hidden="true">→</span></a></div><p class="svc-record-meta">Informazioni verificate: '+esc(r.date||'data non documentata')+'</p></article>';
}
function detail(r){
  const v=r.raw,isPrivate=r.origin==='privati';
  const serviceAnchor=({'CSM':'csm','SerD':'serd','DSM':'dsm','SPDC':'spdc','STPIT':'stpit','SRTR':'srtr','SRSR':'srsr','Centro diurno':'centro-diurno','TSMREE/NPIA':'tsmree-npia','DCA/DNA':'dca-dna'})[r.type];
  const intro='<div class="svc-tags"><span class="svc-tag">'+esc(originLabel(r))+'</span><span class="svc-tag plain">'+esc(r.regime==='Non distinto nel dataset'?'Modalità non specificata':r.regime)+'</span></div><h2 id="svc-detail-title" tabindex="-1">'+esc(r.name)+'</h2><p class="svc-subtitle">'+esc(r.subtype)+' · '+esc(r.town)+'</p>';
  const buttons='<div class="svc-detail-actions"><a class="button secondary" href="'+esc(mapURL(r))+'">Vedi sulla mappa</a>'+(r.phone?'<a class="button" href="tel:'+esc(r.phone)+'">Chiama</a>':'')+(r.email?'<a class="button secondary" href="mailto:'+esc(r.email)+'">Email</a>':'')+'<button class="text-button" data-detail-share type="button">Condividi</button><button class="text-button" data-detail-print type="button">Stampa</button><a class="text-button" href="/orientamento-servizi.html'+(serviceAnchor?'#'+serviceAnchor:'')+'">Che cos’è questo servizio? →</a></div><p id="svc-detail-feedback" role="status" class="micro" hidden></p>';
  const section=(name,content,id)=>'<section class="svc-detail-section"'+(id?' id="'+id+'" tabindex="-1"':'')+'><h3>'+name+'</h3><dl class="svc-detail-fields">'+content+'</dl></section>';
  let body=section('Dove si trova',field('Tipo di servizio',r.subtype,true)+field('Comune',r.town)+field('ASL / territorio',r.asl)+field('Indirizzo',r.address,true)+field('Gestione',managementLabel(v.gestore||v.gestione||v.natura),true));
  body+=section('Come si accede',field('Accesso / prenotazione',v.accesso||v.ammissione||v.prenotazione,true)+field('Requisiti o limitazioni',v.criteri_limitazioni,true)+field('Documenti richiesti',v.documenti_ingresso,true)+field('Durata indicata',v.durata_percorso,true)+field('Accesso da altri territori',v.mobilita_intraregionale||v.accesso_fuori_lazio_stato||v.accesso_extraregionale,true),'svc-accesso');
  body+=section('A chi è rivolto e cosa offre',field('Destinatari',v.destinatari,true)+field('Attività / servizi',r.services,true)+field('Professionisti indicati',v.equipe||v.equipe_professionisti,true)+field('Accessibilità',v.accessibilita,true));
  body+=section('Contatti e orari',field('Telefono',v.telefono||v.contatti,true)+field('Email',v.email||(isPrivate?r.email:''),true)+field('Orari',v.orari,true));
  const ssnRaw=v.rapporto_ssn||v.convenzione_ssn||v.contratto_ssn_stato;
  body+=section('Costi e rapporto con il SSN',field('Inquadramento',originLabel(r),true)+field('Rapporto con il SSN',ssnRaw||(r.origin==='rete'?'Servizio della rete pubblica; modalità e costi dipendono dal percorso di accesso.':'Da verificare con la struttura e nelle fonti.'),true)+field('Periodo / condizioni riportate',v.contratto_periodo||v.periodo_evidenza||v.condizioni_extraregionale,true)+field('Nota','Autorizzazione, accreditamento e convenzione non sono sinonimi. Se questa informazione è importante per il tuo accesso, chiedi conferma alla struttura.',true));
  body+=section('Aggiornamento e fonti',field('Ultimo controllo delle informazioni',r.date||'Non documentato')+field('Note utili',[v.nota_temporale_v7,v.note,v.note_modulo,v.note_v7_2,v.note_v6].filter(Boolean).join('\n'),true));
  body+=sourceLinks(r.sources);
  body+='<p class="micro">Queste informazioni servono per orientarsi e non indicano disponibilità in tempo reale. Contatti, costi e condizioni di accesso vanno confermati con il servizio.</p>';
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
  if(!$('svc-technical')||!$('svc-tech-view')||!$('svc-tech-content'))return;
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
  const mapLink=$('svc-map-results');if(mapLink){const p=new URLSearchParams();A.filterKeys.forEach(k=>{if(state[k])p.set(k,state[k]);});mapLink.href='/mappa.html'+(p.size?'?'+p:'');}

  updateForm();
  filtered=rows.filter(r=>A.matches(r,state));
  const prop=({comune:'town',tipo:'type'})[state.ordine]||'name';
  filtered.sort((a,b)=>a[prop].localeCompare(b[prop],'it')||a.name.localeCompare(b.name,'it')||a.key.localeCompare(b.key));
  const maxPage=Math.max(1,Math.ceil(filtered.length/pageSize));let page=Math.max(1,Math.min(maxPage,parseInt(state.pagina,10)||1));
  if(state.pagina&&String(page)!==String(state.pagina)){state.pagina=String(page);try{history.replaceState({},'',serialize(state));}catch(e){}}
  const start=(page-1)*pageSize;
  $('svc-count').textContent=filtered.length+' di '+rows.length+' risultati · ordinati alfabeticamente, senza classifiche.';
  $('svc-chips').innerHTML=A.filterKeys.filter(k=>state[k]).map(k=>'<button class="svc-chip" type="button" data-remove="'+esc(k)+'" aria-label="Rimuovi filtro '+esc(names[k])+': '+esc(chipLabel(k,state[k]))+'">'+esc(names[k])+': '+esc(chipLabel(k,state[k]))+' <span aria-hidden="true">×</span></button>').join('');
  $('svc-list').innerHTML=filtered.slice(start,start+pageSize).map(card).join('');
  $('svc-empty').hidden=filtered.length!==0;
  $('svc-page').textContent=filtered.length?(start+1)+'–'+Math.min(start+pageSize,filtered.length)+' di '+filtered.length+' · pagina '+page+'/'+maxPage:'0 risultati';
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
  $('svc-csv').addEventListener('click',()=>{const blob=new Blob([A.csv(filtered)],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(blob),link=document.createElement('a');link.href=u;link.download='Servizi_Lazio_risultati.csv';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);});
  if($('svc-tech-view'))$('svc-tech-view').addEventListener('change',()=>commit({...state,tecnico:$('svc-tech-view').value}));
  window.addEventListener('popstate',()=>{clearTimeout(timer);state=stateFromURL();render();});
}
async function getJSON(url){const controller=new AbortController(),t=setTimeout(()=>controller.abort(),18000);try{const r=await fetch(url,{signal:controller.signal});if(!r.ok)throw new Error('HTTP '+r.status);return await r.json();}finally{clearTimeout(t);}}
async function start(){
  const [base,extra,multisite]=await Promise.allSettled([
    getJSON('/data/portal_data_v7_3.json'),
    getJSON('/data/privati_v7_5.json'),
    getJSON('/data/multisede_v7_7_5.json')
  ]);
  if(base.status!=='fulfilled')throw new Error('I servizi non sono stati caricati. Riprova oppure usa i documenti disponibili.');
  D=JSON.parse(JSON.stringify(base.value));
  if(multisite.status==='fulfilled'&&Array.isArray(multisite.value.records)){
    const existing=new Set((D.moduli||[]).map(r=>String(r.id_modulo||r.id||'')));
    multisite.value.records.forEach(r=>{const id=String(r.id_modulo||r.id||'');if(id&&!existing.has(id)){D.moduli.push(r);existing.add(id);}});
  }
  rows=A.build(D,extra.status==='fulfilled'?extra.value:null);populate();wire();
  $('svc-total').textContent=rows.length+' risultati';
  $('svc-breakdown').textContent=rows.filter(r=>r.origin==='rete').length+' servizi pubblici / SSN · '+rows.filter(r=>r.origin==='moduli').length+' strutture non ASL · '+rows.filter(r=>r.origin==='privati').length+' strutture private.';
  if(extra.status==='fulfilled'&&multisite.status==='fulfilled')$('svc-load-status').hidden=true;
  else{
    const missing=[];
    if(extra.status!=='fulfilled')missing.push('le strutture private');
    if(multisite.status!=='fulfilled')missing.push('le integrazioni multisede');
    $('svc-load-status').textContent='Non sono state caricate '+missing.join(' e ')+': la ricerca resta disponibile sui dati caricati.';
  }
  $('svc-controls').disabled=false;state=stateFromURL();commit(state,false);
  if(state.tecnico&&$('svc-technical')){$('svc-technical').scrollIntoView({block:'start'});}
}
start().catch(e=>{$('svc-load-status').classList.add('error');$('svc-load-status').textContent=e.message;$('svc-total').textContent='Dati non caricati';$('svc-count').textContent='Nessun risultato disponibile: il caricamento non è riuscito.';$('risultati').setAttribute('aria-busy','false');});
})();
