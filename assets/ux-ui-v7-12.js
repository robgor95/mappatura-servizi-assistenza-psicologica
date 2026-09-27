/* V7.12 progressive navigation and local section discovery. No storage, analytics or network calls. */
(function(){
'use strict';
const $=id=>document.getElementById(id),header=document.querySelector('.ux-header'),nav=$('site-navigation'),button=$('nav-toggle'),more=$('nav-more');
if(header&&nav&&button&&more){
 const mobile=matchMedia('(max-width:820px)');
 function menu(open,restore=false){nav.dataset.open=String(open);button.setAttribute('aria-expanded',String(open));if(!open){more.open=false;if(restore)button.focus();}}
 function sync(){const lost=nav.contains(document.activeElement);button.hidden=!mobile.matches;menu(!mobile.matches,mobile.matches&&lost);document.querySelectorAll('.toc details').forEach(d=>{d.open=!mobile.matches;});}
 button.addEventListener('click',()=>menu(nav.dataset.open!=='true'));
 more.addEventListener('toggle',()=>more.querySelector('summary').setAttribute('aria-expanded',String(more.open)));
 header.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(more.open){more.open=false;more.querySelector('summary').focus();e.preventDefault();}else if(mobile.matches&&nav.dataset.open==='true'){menu(false,true);e.preventDefault();}});
 document.addEventListener('click',e=>{if(!header.contains(e.target)){more.open=false;if(mobile.matches)menu(false);}});
 header.addEventListener('focusout',()=>{setTimeout(()=>{if(!header.contains(document.activeElement)){more.open=false;if(mobile.matches)menu(false);}},0);});
 if(mobile.addEventListener)mobile.addEventListener('change',sync);else mobile.addListener(sync);
 document.documentElement.classList.add('nav-enhanced');sync();
}
function reveal(hash,focus){let id;try{id=decodeURIComponent(hash.slice(1));}catch(_){return;}if(!id)return;const target=$(id);if(!target)return;let p=target;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}if(focus){if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}requestAnimationFrame(()=>target.scrollIntoView({block:'start',behavior:'auto'}));}
const home=location.pathname==='/'||location.pathname==='/index.html';
const movedAnchors=new Set(['menta','menta-results','menta-query','ricerca-rapida','esplora','risorse','download-home','student-entry-title','supporto-v710-title']);
let currentHash='';try{currentHash=decodeURIComponent(location.hash.slice(1));}catch(_){}
// Only known old homepage fragments are redirected; no search string or user-entered text is forwarded.
if(home&&movedAnchors.has(currentHash)){location.replace('/orientati.html#'+encodeURIComponent(currentHash));return;}
window.addEventListener('hashchange',()=>reveal(location.hash,false));
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(a&&a.getAttribute('href')!=='#')reveal(a.getAttribute('href'),true);});
if(location.hash)reveal(location.hash,false);
const typeLabels={'CSM':'CSM · Centri di salute mentale','SerD':'SerD · Servizi per le dipendenze','SPDC':'SPDC · Reparti ospedalieri di psichiatria','STPIT':'STPIT · Trattamenti psichiatrici intensivi territoriali','SRTR':'SRTR · Residenze terapeutico-riabilitative','SRSR':'SRSR · Residenze socio-riabilitative','TSMREE/NPIA':'TSMREE / NPIA · Bambini e adolescenti','DCA/DNA':'DCA / DNA · Nutrizione e alimentazione'};
for(const id of ['svc-tipo','map-tipo']){const el=$(id);if(!el)continue;const label=()=>{for(const o of el.options){const name=typeLabels[o.value];if(name&&o.textContent!==name)o.textContent=name;}};new MutationObserver(label).observe(el,{childList:true});label();}
for(const table of document.querySelectorAll('.article-body table,.standalone table')){if(table.parentElement.classList.contains('ux-table-scroll'))continue;const wrap=document.createElement('div');wrap.className='ux-table-scroll';wrap.setAttribute('tabindex','0');wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Tabella: scorri orizzontalmente per leggere tutte le colonne');table.before(wrap);wrap.appendChild(table);}
const form=$('ux-discovery-form'),query=$('ux-discovery-query'),count=$('ux-discovery-count'),empty=$('ux-discovery-empty');
if(form&&query&&count&&empty){
 const cards=[...document.querySelectorAll('[data-ux-section]')],groups=[...document.querySelectorAll('[data-ux-group]')],chips=[...document.querySelectorAll('[data-ux-filter]')];let category='all',timer;
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 function update(){const terms=norm(query.value).split(/\s+/).filter(Boolean);let visible=0;for(const c of cards){const text=norm(c.textContent+' '+c.dataset.uxSearch),show=(category==='all'||c.dataset.uxCategory===category)&&terms.every(t=>text.includes(t));c.hidden=!show;if(show)visible++;}for(const g of groups)g.hidden=![...g.querySelectorAll('[data-ux-section]')].some(c=>!c.hidden);empty.hidden=visible!==0;count.textContent=visible+' di '+cards.length+' sezioni'+(terms.length||category!=='all'?' corrispondenti alla ricerca.':' disponibili.');for(const c of chips)c.setAttribute('aria-pressed',String(c.dataset.uxFilter===category));}
 function reset(){clearTimeout(timer);category='all';query.value='';update();query.focus();}
 query.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(update,130);});
 form.addEventListener('submit',e=>{e.preventDefault();clearTimeout(timer);update();});
 for(const c of chips)c.addEventListener('click',()=>{category=c.dataset.uxFilter;clearTimeout(timer);update();});
 for(const b of document.querySelectorAll('[data-ux-reset]'))b.addEventListener('click',reset);
 $('ux-discovery-tools').hidden=false;update();
}
window.LazioUX={version:'7.12',localDiscovery:true};
})();
