import {element as el,renderText,humanDate,safeURL,isVisible} from './editorial-core-v7-18.mjs';
const $=id=>document.getElementById(id),closed=new Set();let items=[];
function linkURL(c){return c.kind==='link'?safeURL(c.url,true):'/notizia.html?id='+encodeURIComponent(c.id);}
function card(c){const a=el('article',null,{class:'ng-card'});if(c.image_id)a.append(el('img',null,{src:'/api/public/media/'+encodeURIComponent(c.image_id),alt:c.image_alt||'',loading:'lazy',decoding:'async',width:'480',height:'300'}));a.append(el('span',c.category||'Notizie',{class:'ng-kicker'}));const heading=el('h3');heading.append(el('a',c.title,{href:linkURL(c),...(c.kind==='link'?{target:'_blank',rel:'noopener noreferrer'}:{})}));a.append(heading);if(c.published_at)a.append(el('time',humanDate(c.published_at),{datetime:c.published_at}));a.append(el('p',c.summary||''));a.append(el('a',c.kind==='link'?'Apri il link ↗':'Leggi la notizia →',{href:linkURL(c),class:'button secondary',...(c.kind==='link'?{target:'_blank',rel:'noopener noreferrer'}:{})}));return a;}
function banner(){
 for(const host of document.querySelectorAll('[data-ng-banner]')){
 const placement=host.dataset.ngBanner,c=items.find(x=>x.kind==='banner'&&isVisible(x)&&!closed.has(x.id)&&(x.placement==='both'||x.placement===placement));host.replaceChildren();host.hidden=!c;if(!c)continue;
 const b=el('aside',null,{class:'ng-banner','aria-label':'In evidenza dal Network Giovani'});if(c.image_id)b.append(el('img',null,{src:'/api/public/media/'+encodeURIComponent(c.image_id),alt:c.image_alt||'',loading:'lazy',width:'100',height:'100'}));
 const copy=el('div');copy.append(el('span','In evidenza',{class:'ng-kicker'}),el('h2',c.title),el('p',c.summary));b.append(copy,el('a','Scopri e partecipa →',{href:safeURL(c.url,true),class:'button secondary',target:'_blank',rel:'noopener noreferrer'}));const close=el('button','×',{type:'button',class:'ng-dismiss','aria-label':'Chiudi il banner in evidenza'});close.addEventListener('click',()=>{closed.add(c.id);banner();});b.append(close);host.append(b);
 }
}
function renderFeeds(){const cat=$('ng-category')?.value||'';for(const host of document.querySelectorAll('[data-ng-feed]')){const home=host.dataset.ngFeed==='home',feed=items.filter(c=>c.kind!=='banner'&&isVisible(c)&&(!cat||home||c.category===cat));host.replaceChildren(...feed.slice(0,home?3:500).map(card));host.hidden=!feed.length;const empty=document.querySelector('[data-ng-empty="'+host.dataset.ngFeed+'"]');if(empty)empty.hidden=!!feed.length;}}
function article(){const target=$('ng-article');if(!target)return;const id=new URLSearchParams(location.search).get('id'),c=items.find(x=>x.id===id&&x.kind==='news'&&isVisible(x));target.replaceChildren();if(!c){target.append(el('h1','Notizia non disponibile'),el('p','Il contenuto non è pubblicato, è scaduto oppure il collegamento non è valido.'),el('a','Torna a Network Giovani',{href:'/network-giovani.html'}));return;}
 document.title=c.title+' | Network Giovani';target.append(el('p',c.category||'Notizie',{class:'ng-kicker'}),el('h1',c.title),el('time',humanDate(c.published_at),{datetime:c.published_at}),el('p',c.summary,{class:'lede'}));if(c.image_id)target.append(el('img',null,{src:'/api/public/media/'+encodeURIComponent(c.image_id),alt:c.image_alt||'',width:'900',height:'500'}));const body=el('div');renderText(body,c.body);target.append(body);if(c.url)target.append(el('a','Approfondisci sul sito esterno ↗',{href:safeURL(c.url,true),target:'_blank',rel:'noopener noreferrer',class:'button secondary'}));}
async function init(){
 const controller=new AbortController(),t=setTimeout(()=>controller.abort(),5000);
 try{const r=await fetch('/api/public/content',{signal:controller.signal,credentials:'omit',cache:'no-store'});if(!r.ok)throw Error('unavailable');const d=await r.json();items=Array.isArray(d.items)?d.items:[];
 if($('ng-category')){const select=$('ng-category');for(const c of [...new Set(items.filter(x=>x.kind!=='banner').map(x=>x.category))].sort())select.append(el('option',c,{value:c}));select.addEventListener('change',renderFeeds);}
 banner();renderFeeds();article();setInterval(()=>{banner();renderFeeds();},60000);
 }catch(_){const msg=$('ng-editorial-message');if(msg)msg.textContent='Le notizie non sono disponibili in questo momento. I servizi e la mappa restano consultabili.';article();}finally{clearTimeout(t);}
}
init();
