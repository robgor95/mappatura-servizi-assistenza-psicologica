/* Disclosure navigation only. No query access, network, tracking or persistence. */
(function(){
'use strict';
const header=document.querySelector('.nav-shell'),nav=document.getElementById('site-navigation'),button=document.getElementById('nav-toggle'),more=document.getElementById('nav-more');
if(!header||!nav||!button||!more)return;
const mobile=window.matchMedia('(max-width: 820px)');
function mainMenu(open,restore){nav.dataset.open=String(open);button.setAttribute('aria-expanded',String(open));if(!open){more.open=false;if(restore)button.focus();}}
function sync(){const lostFocus=nav.contains(document.activeElement);button.hidden=!mobile.matches;mainMenu(!mobile.matches,mobile.matches&&lostFocus);document.querySelectorAll('.toc details').forEach(d=>{d.open=!mobile.matches;});}
button.addEventListener('click',()=>mainMenu(nav.dataset.open!=='true',false));
more.addEventListener('toggle',()=>more.querySelector('summary').setAttribute('aria-expanded',String(more.open)));
header.addEventListener('keydown',event=>{if(event.key!=='Escape')return;if(more.open){more.open=false;more.querySelector('summary').focus();event.preventDefault();}else if(mobile.matches&&nav.dataset.open==='true'){mainMenu(false,true);event.preventDefault();}});
document.addEventListener('click',event=>{if(!header.contains(event.target)){more.open=false;if(mobile.matches)mainMenu(false,false);}});
header.addEventListener('focusout',()=>{setTimeout(()=>{if(!header.contains(document.activeElement)){more.open=false;if(mobile.matches)mainMenu(false,false);}},0);});
if(mobile.addEventListener)mobile.addEventListener('change',sync);else mobile.addListener(sync);
document.documentElement.classList.add('nav-enhanced');sync();
function reveal(hash,moveFocus){let id;try{id=decodeURIComponent(hash.slice(1));}catch(_){return;}const target=document.getElementById(id);if(!target)return;let p=target;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement;}if(moveFocus){if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}
window.addEventListener('hashchange',()=>reveal(location.hash,false));
document.addEventListener('click',event=>{const link=event.target.closest('a[href^="#"]');if(!link||link.getAttribute('href')==='#')return;reveal(link.getAttribute('href'),true);});
if(location.hash)reveal(location.hash,false);
})();
