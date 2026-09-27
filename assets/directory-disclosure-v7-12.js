/* Progressive disclosure only: original fields remain in the DOM and searchable. */
(function(){
'use strict';
const grid=document.getElementById('directory-grid');if(!grid)return;
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[_-]+/g,' ').trim();
const essential=/^(gestore|comune|comune municipio|sede|indirizzo|destinatari|utenza|accesso|modalita accesso|criteri ammissione|contatti|telefono|email|prenotazione|telefono email link|costo|gratuita costo|rapporto ssn|stato servizio|stato del servizio)$/;
function linkSources(dd){const value=dd.textContent;if(!/https:\/\//.test(value))return;const matches=[...value.matchAll(/https:\/\/[^\s|<>]+/g)];if(!matches.length||matches.length>100)return;const fragment=document.createDocumentFragment();let from=0;for(const match of matches){fragment.append(document.createTextNode(value.slice(from,match.index)));const a=document.createElement('a');a.textContent=match[0];a.href=match[0];a.target='_blank';a.rel='noopener noreferrer';fragment.append(a);from=match.index+match[0].length;}fragment.append(document.createTextNode(value.slice(from)));dd.replaceChildren(fragment);}
function simplify(){for(const card of grid.querySelectorAll('.directory-card:not([data-ux-compact])')){
 const dl=card.querySelector(':scope > dl.card-fields');if(!dl)continue;
 const fields=[...dl.children];card.dataset.uxCompact='true';card.dataset.originalFields=String(fields.length);
 for(const dd of dl.querySelectorAll('dd'))linkSources(dd);
 if(fields.length<=7)continue;
 let preferred=fields.filter(f=>essential.test(norm(f.querySelector('dt')?.textContent)));
 // Service status and SSN caveats stay immediately visible even when other details collapse.
 const mandatory=fields.filter(f=>/^(stato servizio|stato del servizio|rapporto ssn)$/.test(norm(f.querySelector('dt')?.textContent)));
 if(preferred.length<3)preferred=[...new Set(preferred.concat(fields.slice(0,3)))];
 const visible=new Set([...mandatory,...preferred.slice(0,7)]);
 const details=document.createElement('details');details.className='ux-directory-more';
 const summary=document.createElement('summary');summary.textContent='Dettagli, fonti e aggiornamenti';summary.setAttribute('aria-label','Dettagli, fonti e aggiornamenti di '+(card.querySelector('h2')?.textContent||'questo servizio'));details.append(summary);
 const rest=document.createElement('dl');rest.className='card-fields';
 for(const f of fields)if(!visible.has(f))rest.append(f);
 if(rest.children.length){details.append(rest);dl.after(details);}
}}
new MutationObserver(simplify).observe(grid,{childList:true});simplify();
})();
