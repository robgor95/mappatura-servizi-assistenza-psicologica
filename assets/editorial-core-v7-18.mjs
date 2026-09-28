/* Shared validation and accessible rendering. No HTML supplied by authors is executed. */
export const ROLES = ['admin','editor','data_reviewer','specialist'];
export const FIELDS = Object.freeze({
 name:{label:'Nome',raw:'denominazione'},address:{label:'Indirizzo',raw:'indirizzo'},town:{label:'Comune',raw:'comune'},
 phone:{label:'Telefono',raw:'telefono'},email:{label:'Email',raw:'email'},website:{label:'Sito web',raw:'sito'},
 hours:{label:'Orari',raw:'orari'},access:{label:'Modalità di accesso',raw:'accesso'},accessibility:{label:'Accessibilità',raw:'accessibilita'},
 serviceState:{label:'Stato del servizio',raw:'stato_servizio'},
 type:{label:'Tipologia sanitaria',raw:'tipo',sensitive:true},subtype:{label:'Tipologia specifica',raw:'modulo',sensitive:true},
 ssn:{label:'Rapporto SSN',raw:'contratto_ssn_stato',sensitive:true},accreditation:{label:'Accreditamento',raw:'accreditamento_stato',sensitive:true},
 auth:{label:'Autorizzazione',raw:'autorizzazione_stato',sensitive:true},
 contractedBeds:{label:'Posti contrattualizzati',raw:'posti_contrattualizzati',sensitive:true},target:{label:'Destinatari',raw:'destinatari',sensitive:true}
});
export const text = (value,max=2000) => {if(typeof value!=='string'||value.length>max)throw Error('Testo non valido o troppo lungo.');return value.trim();};
export function safeURL(value,required=false){
 const s=text(value||'',2048);if(!s&&!required)return '';
 let u;try{u=new URL(s);}catch(_){throw Error('Inserisci un collegamento HTTPS completo.');}
 if(u.protocol!=='https:'||u.username||u.password||/[\u0000-\u0020]/.test(s))throw Error('Il collegamento deve usare HTTPS, senza credenziali.');
 return u.href;
}
export function validDay(value){const s=text(value,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s||s>'9999-12-31'||s< '2000-01-01'||s>new Date().toISOString().slice(0,10))throw Error('Data di verifica non valida o futura.');return s;}
export function cleanContent(input){
 if(!input||!['news','link','banner'].includes(input.kind))throw Error('Tipo di contenuto non valido.');
 const out={kind:input.kind,title:text(input.title||'',160),summary:text(input.summary||'',400),body:text(input.body||'',24000),
 category:text(input.category||'Notizie',60),url:safeURL(input.url||''),image_id:text(input.image_id||'',64),image_alt:text(input.image_alt||'',250),
 placement:input.placement==='network'?'network':input.placement==='home'?'home':'both',starts_at:input.starts_at||null,ends_at:input.ends_at||null,featured:input.featured===true};
 if(!out.title)throw Error('Il titolo è obbligatorio.');
 if(out.image_id&&!/^[0-9a-f-]{36}$/.test(out.image_id))throw Error('Immagine non valida.');
 if(out.image_id&&!out.image_alt)throw Error('Descrivi l’immagine nel testo alternativo.');
 for(const k of ['starts_at','ends_at'])if(out[k]){if(typeof out[k]!=='string'||!Number.isFinite(Date.parse(out[k])))throw Error('Data di pubblicazione non valida.');out[k]=new Date(out[k]).toISOString();}
 if(out.starts_at&&out.ends_at&&out.ends_at<=out.starts_at)throw Error('La scadenza deve essere successiva all’inizio.');
 return out;
}
export function readyToPublish(c){if(!c.summary&&!c.body)throw Error('Aggiungi una descrizione.');if((c.kind==='banner'||c.kind==='link')&&!c.url)throw Error('Aggiungi il link di destinazione prima di pubblicare.');return c;}
export function isVisible(c,now=new Date().toISOString()){return !!c&&(!c.starts_at||c.starts_at<=now)&&(!c.ends_at||c.ends_at>now);}
export const humanDate=value=>{if(!value)return '';const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleDateString('it-IT',{timeZone:'Europe/Rome'}):'';};
export function freshness(meta,legacyDate=''){
 const entries=Object.entries(meta||{}).filter(([k,v])=>FIELDS[k]&&v&&/^\d{4}-\d{2}-\d{2}$/.test(v.checked_at||''));
 if(!entries.length)return legacyDate?{icon:'calendar',label:'Ultimo controllo parziale: '+humanDate(legacyDate)}:null;
 const date=entries.map(([,v])=>v.checked_at).sort().at(-1),recent=entries.filter(([,v])=>v.checked_at===date);
 const uncertain=entries.some(([,v])=>v.uncertain),changed=recent.some(([,v])=>v.changed);
 const prefix=changed?'Dati aggiornati il ':'Dati verificati il ';
 return {icon:uncertain?'warning':changed?'refresh':'calendar',label:prefix+humanDate(date)+' · controllo parziale'+(uncertain?' · alcuni dati da confermare':'')};
}
export function element(tag,txt,attrs={}){const el=document.createElement(tag);if(txt!==null&&txt!==undefined)el.textContent=String(txt);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));return el;}
export function statusNode(value){if(!value)return document.createTextNode('');const p=element('p',null,{class:'ng-freshness'}),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',value.icon==='warning'?'M12 3 2 21h20ZM12 9v5m0 3v1':value.icon==='refresh'?'M20 8a8 8 0 1 0 0 8M20 3v5h-5':'M4 5h16v16H4ZM8 2v6m8-6v6M4 10h16');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.7');svg.append(path);p.append(svg,document.createTextNode(value.label));return p;}
/* Deliberately small Markdown subset, rendered with textContent and validated links. */
function inline(parent,s){
 const re=/(\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|\[([^\]\n]+)\]\((https:\/\/[^\s)]+)\))/g;let end=0,m;
 while((m=re.exec(s))){parent.append(document.createTextNode(s.slice(end,m.index)));if(m[2])parent.append(element('strong',m[2]));else if(m[3])parent.append(element('em',m[3]));else{try{parent.append(element('a',m[4],{href:safeURL(m[5],true),target:'_blank',rel:'noopener noreferrer'}));}catch(_){parent.append(document.createTextNode(m[0]));}}end=re.lastIndex;}
 parent.append(document.createTextNode(s.slice(end)));
}
export function renderText(root,body){root.replaceChildren();let list=null;for(const line of String(body||'').split(/\r?\n/)){if(!line.trim()){list=null;continue;}const h=line.match(/^(#{1,3})\s+(.+)$/),li=line.match(/^[-*]\s+(.+)$/);let node;if(li){if(!list){list=element('ul');root.append(list);}node=element('li');inline(node,li[1]);list.append(node);continue;}list=null;node=element(h?'h'+Math.min(4,h[1].length+1):'p');inline(node,h?h[2]:line);root.append(node);}}
