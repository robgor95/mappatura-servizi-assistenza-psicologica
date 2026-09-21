/* View adapter only: source datasets and verification dates are never modified. */
(function(root){
'use strict';
const norm = v => String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const text = v => String(v == null ? '' : v).trim();
const nd = v => text(v) || 'Non documentato';
function urls(value){
  const candidates = text(value).match(/https?:\/\/[^\s|<>"']+/g) || [];
  return [...new Set(candidates.map(s=>s.replace(/[),.;]+$/,'')).filter(s=>{try{return ['http:','https:'].includes(new URL(s).protocol);}catch(e){return false;}}))];
}
function sources(r){return [...new Set(Object.keys(r).filter(k=>/font|source|sito/i.test(k)).flatMap(k=>urls(r[k])))];}
function asl(value){
  let s=text(value).replace(/^ASL\s*/i,'');
  if(/^R[1-6]$/i.test(s)) s='Roma '+s.slice(1);
  s=({FR:'Frosinone',LT:'Latina',RI:'Rieti',VT:'Viterbo'})[s] || s;
  return s ? 'ASL '+s : 'Non documentata';
}
function territory(r,a){
  if(r.provincia) return r.provincia;
  if(/Roma [1-6]/.test(a))return 'RM';
  for(const [name,code] of Object.entries({Frosinone:'FR',Latina:'LT',Rieti:'RI',Viterbo:'VT'}))if(a.includes(name))return code;
  if(/\bRoma\b/.test(r.sede||''))return 'RM';
  return 'ND';
}
function typeOf(r,origin){
  if(origin==='privati')return 'Centro privato';
  const t=norm(r.tipo||r.modulo);
  if(/csm/.test(t))return 'CSM';
  if(/^serd/.test(t))return 'SerD';
  if(/^srtr/.test(t))return 'SRTR';
  if(/^srsr/.test(t))return 'SRSR';
  if(t.includes('centro diurno'))return 'Centro diurno';
  if(/tsmree|npia/.test(t))return 'TSMREE/NPIA';
  if(/dna|dca/.test(t))return 'DCA/DNA';
  if(t.includes('comunita')||t.includes('pedagogico')||t.includes('terapeutico-riabilitativa'))return 'Comunità';
  return text(r.tipo||r.modulo)||'Non documentato';
}
function regimeOf(r,origin,t){
  if(origin==='privati')return 'Ambulatoriale';
  if(origin==='moduli')return r.regime==='Intensivo territoriale STPIT'?'Residenziale':nd(r.regime);
  if(t==='SPDC')return 'Ospedaliero';
  if(t==='Centro diurno')return 'Semiresidenziale';
  if(['SRTR','SRSR','Residenziale'].includes(t))return 'Residenziale';
  if(['CSM','SerD','TSMREE/NPIA','DCA/DNA','Alcologia','Ambulatorio specialistico'].includes(t))return 'Ambulatoriale';
  if(t==='DSM')return 'Organizzazione della rete';
  return 'Non distinto nel dataset';
}
function evidence(value,source){
  const v=norm(value);
  if(!v||/non document|da distinguere|da acquisire|da comprovar|da riconferm|non acquisit|da verificar|non equiparato|non dedott|percorso di accreditamento/.test(v))return 'da-verificare';
  if(/secondo gestore|dichiar|dichiara/.test(v))return 'dichiarazione';
  if(/documentat|autorizzat|accreditat|contratt|accordo|deliberaz|dca |dgr |rapporto pubblico/.test(v))return 'indicata';
  return 'da-verificare';
}
function hasInfo(v){return !!text(v)&&!(/non document|da verificar|non rilevat|non consolidat|da distinguere|^nd\b/.test(norm(v)));}
function phone(value){
  // Only a dedicated contact field is parsed; never addresses, service descriptions or IDs.
  for(const part of text(value).split(/[\/;|]/)){
    const m=part.match(/(?:\+39\s*)?[03]\d[\d ().-]{4,17}\d/);
    if(m){const p=m[0].replace(/[^\d+]/g,'');if(p.replace(/\D/g,'').length>=6&&p.replace(/\D/g,'').length<=13)return p;}
  }
  return '';
}
function email(value){return (text(value).match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)||[])[0]||'';}
function build(data,privateData){
  if(!data||!Array.isArray(data.rete_asl)||!Array.isArray(data.moduli))throw new Error('Formato del database non riconosciuto.');
  const checked=new Map((data.pubbliche_ricontrollate||[]).map(r=>[r.id,r]));
  const rows=[];
  function add(r,origin){
    const a=asl(r.asl||r.asl_territoriale), t=typeOf(r,origin), isNetwork=origin==='rete';
    const rawType=text(r.tipo||r.modulo||r.tipologia);
    const serviceText=norm([r.servizi,r.servizi_dichiarati,r.ambito,r.ambiti_secondari,rawType].join(' '));
    const domains=new Set(r.ambito?[r.ambito]:[]);
    if(!r.ambito){
    if(/dipenden|serd|alcolog/.test(serviceText))domains.add('Dipendenze');
    if(/psichiat|csm|srtr|srsr|spdc|stpit|salute mentale/.test(serviceText))domains.add('Psichiatria');
    if(/doppia diagnosi/.test(serviceText))domains.add('Doppia diagnosi');
    if(/\bdca\b|\bdna\b|alimentar|nutrizione/.test(serviceText))domains.add('DCA/DNA');
    if(/tsmree|npia|evolutiv|neuropsichiat/.test(serviceText))domains.add('Età evolutiva');
    }
    const rId=text(r.id_modulo||r.id), place=text(r.comune)||(/\bRoma\b/.test(r.sede||'')?'Roma':'Non documentato');
    const admin={autorizzazione:r.autorizzazione_stato||r.autorizzazione_sanitaria,accreditamento:r.accreditamento_stato||r.accreditamento,ssn:r.contratto_ssn_stato||r.convenzione_ssn};
    const ownership=isNetwork?(/titolarita non/.test(norm(r.gestione))?'Da verificare':'Rete ASL'):'Privata / non ASL';
    const row={key:origin+':'+rId,id:rId,origin,raw:r,checked:checked.get(rId)||null,name:nd(r.denominazione||r.nome),type:t,subtype:rawType,asl:a,territory:territory(r,a),town:place,address:nd(r.indirizzo||r.sede),regime:regimeOf(r,origin,t),ownership,domains:[...domains],admin,
      auth:isNetwork?'rete-asl':evidence(admin.autorizzazione,r.autorizzazione_fonte),accreditation:isNetwork?'rete-asl':evidence(admin.accreditamento,r.accreditamento_fonte),ssn:isNetwork?'rete-asl':evidence(admin.ssn,r.contratto_fonte),
      phone:phone(r.telefono||(origin==='privati'?r.contatti:'')),email:email(r.email||(origin==='privati'?r.contatti:'')),
      services:nd(r.servizi||r.servizi_dichiarati),access:nd(r.accesso||r.ammissione),
      date:text(r.verifica_documentale||r.data_verifica_v7_2||r.ultima_verifica||r.data_verifica),
      status:nd(r.stato_verifica_v7_2||r.stato_v7_3||r.stato_catalogo||r.verifica||r.stato),sources:sources(r),
      legacyCategory:r._categoria_portale||'',notReviewed:/non riesamin/.test(norm([r.verifica,r.stato_riesame_v7].join(' '))),
      mobility:hasInfo(r.accesso_fuori_lazio_stato)||hasInfo(r.accesso_extraregionale)||hasInfo(r.mobilita_intraregionale)||!!text(r.condizioni_extraregionale),
      extra:hasInfo(r.accesso_fuori_lazio_stato)||hasInfo(r.accesso_extraregionale),
      beds:['posti_autorizzati','posti_accreditati','posti_contrattualizzati','posti_dichiarati','posti'].some(k=>/\d/.test(text(r[k])))
    };
    row.search=norm([row.name,row.town,row.address,row.type,row.subtype,row.asl,row.services,r.gestore,r.destinatari,r.ambiti_secondari,row.domains.join(' '),r.regime].join(' '));
    rows.push(row);
  }
  data.rete_asl.forEach(r=>add(r,'rete'));data.moduli.forEach(r=>add(r,'moduli'));
  (privateData&&privateData.records||[]).forEach(r=>add(r,'privati'));
  if(new Set(rows.map(r=>r.key)).size!==rows.length)throw new Error('Identificativi duplicati: controllare i dati.');
  return rows;
}
const labels={territoriali:'Servizi territoriali',ricovero:'Ricovero e trattamenti intensivi',riabilitazione:'Riabilitazione',dipendenze:'Dipendenze e doppia diagnosi',alimentazione:'Alimentazione',strutture:'Strutture e centri privati'};
function matches(r,s){
  if(s.q&&!norm(s.q).trim().split(/\s+/).every(w=>r.search.includes(w)))return false;
  for(const [field,key] of Object.entries({tipo:'type',sottotipo:'subtype',provincia:'territory',asl:'asl',comune:'town',regime:'regime',origine:'origin',titolarita:'ownership',autorizzazione:'auth',accreditamento:'accreditation',ssn:'ssn'}))if(s[field]&&r[key]!==s[field])return false;
  if(s.ambito&&!r.domains.includes(s.ambito))return false;
  if(s.riesame==='ricontrollate'&&!r.checked)return false;
  if(s.riesame==='nonriesaminato'&&!r.notReviewed)return false;
  if(s.riesame==='da-verificare'&&!(r.notReviewed||r.legacyCategory==='pending'||/da verificar|da completar|da comprovar|da confermar/.test(norm(r.status))))return false;
  if(s.elenco&&r.legacyCategory!==s.elenco)return false;
  if(s.mobilita==='extra'&&!r.extra)return false;
  if(s.mobilita==='informazioni'&&!r.mobility)return false;
  if(s.posti==='informazioni'&&!r.beds)return false;
  const p=s.percorso;
  if(p==='territoriali'&&(!['CSM','SerD','TSMREE/NPIA','DCA/DNA','DSM','Ascolto / orientamento','Interventi precoci / giovani','Presidio salute mentale'].includes(r.type)||r.origin!=='rete'))return false;
  if(p==='ricovero'&&!['SPDC','STPIT'].includes(r.type))return false;
  if(p==='riabilitazione'&&!['SRTR','SRSR','Centro diurno','Comunità','Residenziale','Residenziale / semiresidenziale'].includes(r.type))return false;
  if(p==='dipendenze'&&!r.domains.some(d=>['Dipendenze','Doppia diagnosi'].includes(d))&&r.type!=='SerD')return false;
  if(p==='alimentazione'&&!r.domains.includes('DCA/DNA'))return false;
  if(p==='strutture'&&r.origin==='rete'&&!['SRTR','SRSR','Centro diurno','Residenziale','Residenziale / semiresidenziale'].includes(r.type))return false;
  return true;
}
const filterKeys=['q','tipo','sottotipo','provincia','asl','comune','regime','origine','titolarita','ambito','autorizzazione','accreditamento','ssn','riesame','elenco','mobilita','posti','percorso'];
function parse(search,data){
  const p=new URLSearchParams(search),s={};filterKeys.concat(['ordine','pagina','scheda','tecnico']).forEach(k=>{if(p.get(k))s[k]=p.get(k).slice(0,300);});
  const view=p.get('view');
  if(view==='network'){s.origine='rete';if(p.get('tipo')){s.sottotipo=p.get('tipo');delete s.tipo;}}
  if(view==='contracted'){s.origine='moduli';s.elenco='convenzionate';}
  if(view==='stpit'){s.origine='moduli';s.tipo='STPIT';}
  if(view==='pending'){s.origine='moduli';s.elenco='pending';}
  if(view==='extra'){s.origine='moduli';s.mobilita='informazioni';}
  if(view==='public'){s.origine='rete';s.riesame='ricontrollate';}
  if(['coverage','sources','quality','history','method'].includes(view))s.tecnico=view;
  if(p.get('verifica')==='nonriesaminato')s.riesame='nonriesaminato';
  if(s.asl)s.asl=asl(s.asl);
  if(!s.scheda&&p.get('id'))s.scheda=p.get('id');
  if(!s.scheda&&view==='public'&&/^\d+$/.test(p.get('indice')||'')){
    const r=(data.pubbliche_ricontrollate||[])[Number(p.get('indice'))];s.scheda=r?'rete:'+r.id:'__indice_non_valido__';
  }
  return s;
}
function csvCell(value){let v=text(value);if(/^[=+\-@\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';}
function csv(rows){
  const fields=['id','origin','name','subtype','town','territory','asl','address','regime','ownership','services','access','date','status','sources'];
  const header=['ID','Origine dataset','Servizio o struttura','Tipo o modulo','Comune','Territorio','ASL','Indirizzo','Regime di ricerca','Titolarità nel dataset','Servizi dichiarati','Accesso documentato','Data della fonte nel dataset','Stato nel dataset','Fonti'];
  return '\ufeff'+header.map(csvCell).join(';')+'\r\n'+rows.map(r=>fields.map(k=>csvCell(Array.isArray(r[k])?r[k].join(' | '):r[k])).join(';')).join('\r\n')+'\r\n';
}
const api={norm,nd,urls,sources,asl,territory,typeOf,regimeOf,evidence,hasInfo,phone,email,build,matches,filterKeys,parse,csv,labels};
if(typeof module==='object'&&module.exports)module.exports=api;else root.LazioServices=api;
})(typeof window==='object'?window:globalThis);
