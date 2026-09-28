/* Public projection only. Contributor identities, drafts and approval notes never enter this adapter. */
(function(root){'use strict';
const api=root.LazioEditorial={items:[],active:false,unavailable:false,conflicts:[]};let core;
const copy=x=>JSON.parse(JSON.stringify(x)),firstPhone=s=>{const raw=String(s||'').split(/\s*[\/;|]\s*|\s+\b(?:int\.?|interno|tasto|centralino)\b/i)[0],n=raw.replace(/[^+\d]/g,'');return /^\+?\d{6,15}$/.test(n)?n:'';};api.firstPhone=firstPhone;
api.ready=(async()=>{
 try{core=await import('/assets/editorial-core-v7-18.mjs');const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),3500);try{const r=await fetch('/api/public/revisions',{signal:ctrl.signal,credentials:'omit',cache:'no-store'});if(!r.ok)throw Error('overlay');const d=await r.json();api.active=d.active===true;api.items=Array.isArray(d.items)?d.items:[];api.conflicts=Array.isArray(d.conflicts)?d.conflicts:[];}finally{clearTimeout(t);}}
 catch(_){api.unavailable=true;api.items=[];}
 return api;
})();
function patchRow(row,p){
 const r={...row,raw:{...(row.raw||{})}},v=p.values||{},meta=p.meta||{};
 for(const [k,val] of Object.entries(v)){const field=core?.FIELDS[k];if(!field)continue;r.raw[field.raw]=val;
 if(['name','address','town','access','type','subtype','ssn','accreditation','auth','serviceState','services'].includes(k))r[k]=val||'Non documentato';
 if(k==='name'){r.raw.nome=val;r.raw.denominazione=val;}
 if(k==='phone')r.phone=firstPhone(val);if(k==='email')r.email=val;
 if(k==='contractedBeds')r.beds=/\d/.test(val);
 }
 r.editorialMeta=meta;r.raw._editorial_meta=meta;r.sources=[...new Set((r.sources||[]).concat(Object.values(meta).flatMap(x=>x.sources||[])))];
 r.search=String([r.name,r.town,r.address,r.type,r.subtype,r.asl,r.services,r.raw.gestore,r.raw.destinatari,(r.domains||[]).join(' '),r.regime,r.raw.orari,r.raw.telefono].join(' ')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return r;
}
function newClinical(p){const v=p.values||{},id=p.key.split(':').slice(1).join(':');const base={key:p.key,id,origin:v.origin||p.key.split(':')[0],raw:{},checked:null,name:'Non documentato',type:'Presidio salute mentale',subtype:'Non documentato',asl:v.asl||'Non documentata',territory:'ND',town:'Non documentato',address:'Non documentato',regime:'Non distinto nel dataset',ownership:'Da verificare',domains:[],admin:{},auth:'da-verificare',accreditation:'da-verificare',ssn:'da-verificare',phone:'',email:'',services:'Non documentato',access:'Non documentato',date:'',status:'Nuova scheda documentale; verifica per campo',sources:[],legacyCategory:'pending',notReviewed:true,mobility:false,extra:false,beds:false};return patchRow(base,p);}
api.applyClinical=function(rows){
 if(!core)return rows;const patches=new Map(api.items.filter(p=>p.entity==='clinical').map(p=>[p.key,p])),ids=new Set(rows.map(r=>r.key));const result=rows.map(r=>patches.has(r.key)?patchRow(r,patches.get(r.key)):r);
 for(const p of patches.values())if(p.addition&&!ids.has(p.key))result.push(newClinical(p));return result;
};
api.applySupport=function(data){
 const d=copy(data),lists=['consultori_master','pua_sites','pis_services'],seen=new Set();
 for(const name of lists)d[name]=(d[name]||[]).map(r=>{const key='support:'+r.id;seen.add(key);const p=api.items.find(x=>x.entity==='support'&&x.key===key);if(!p)return r;const out={...r,_editorial_meta:p.meta};for(const [k,v] of Object.entries(p.values)){if(['name','address','phone','email','hours','access','accessibility','website'].includes(k))out[k]=v;if(k==='town')out.territory=v;if(k==='serviceState')out.status=v;}const source=Object.values(p.meta||{}).flatMap(x=>x.sources||[]);out.source_urls=[...new Set((r.source_urls||[r.source_url]).concat(source))];return out;});
 for(const p of api.items)if(p.entity==='support'&&p.addition&&!seen.has(p.key)){const v=p.values||{},category=v.category||'PUA',list=category==='Consultorio'?'consultori_master':category==='PUA'?'pua_sites':'pis_services';d[list].push({id:p.key.replace(/^support:/,''),category,name:v.name,asl:v.asl||null,territory:v.town,address:v.address||null,phone:v.phone||null,email:v.email||null,hours:v.hours||null,access:v.access||'',status:v.serviceState||'Scheda documentale: informazioni da confermare',source_url:Object.values(p.meta).flatMap(x=>x.sources||[])[0]||'',checked_at:Object.values(p.meta).map(x=>x.checked_at).sort().at(-1),_editorial_meta:p.meta});}
 return d;
};
api.applyDirectory=function(category,rows){
 if(!['strutture','privati'].includes(category)||!core)return rows;
 const map=new Map(api.items.filter(x=>x.entity==='clinical').map(x=>[x.key,x])),seen=new Set();
 const result=rows.map(r=>{const id=String(r.id_modulo||r.id||''),key=(category==='privati'?'privati:':'moduli:')+id,p=map.get(key)||map.get('rete:'+id);if(!p)return r;seen.add(p.key);const out={...r,_editorial_meta:p.meta};for(const [k,v] of Object.entries(p.values)){if(!core.FIELDS[k])continue;out[core.FIELDS[k].raw]=v;if(k==='name'){out.nome=v;out.denominazione=v;out.struttura=v;}if(k==='address')out.sede=v;if(k==='type'||k==='subtype')out.tipologia_modulo=v;}return out;});
 for(const p of map.values())if(p.addition&&!seen.has(p.key)&&((category==='privati'&&p.key.startsWith('privati:'))||(category==='strutture'&&p.key.startsWith('moduli:')))){const v=p.values,r={id:p.key.split(':')[1],struttura:v.name,nome:v.name,denominazione:v.name,sede:v.address,comune:v.town,_editorial_meta:p.meta};for(const [k,x] of Object.entries(v))if(core.FIELDS[k])r[core.FIELDS[k].raw]=x;result.push(r);}
 return result;
};
api.freshnessHTML=function(row){
 if(!core)return '';
 const meta=row.editorialMeta||row._editorial_meta||row.raw?._editorial_meta;
 const legacy=row.auditDate||row.checked_at||row._riesame_v76?.data||'';
 let state=core.freshness(meta,legacy);
 if(!state&&row.date)state={icon:'calendar',label:'Fonte documentale: '+core.humanDate(row.date)};
 if(api.conflicts.includes(row.key))state={icon:'warning',label:'Una correzione richiede un nuovo controllo; sono mostrati i dati di base.'};
 return state?core.statusNode(state).outerHTML:'';
};
api.notice=function(){if(!api.unavailable)return;const host=document.querySelector('#risultati,#support-grid,#directory-grid,#map-count');if(host&&!document.getElementById('ng-overlay-warning')){const p=document.createElement('p');p.id='ng-overlay-warning';p.className='ng-note';p.textContent='Gli aggiornamenti redazionali non sono disponibili in questo momento: vengono mostrati i dati di base del portale.';host.before(p);}};
const A=root.LazioServices;if(A){const previous=A.build;A.build=function(data,privateData){return api.applyClinical(previous(data,privateData));};}
})(window);
