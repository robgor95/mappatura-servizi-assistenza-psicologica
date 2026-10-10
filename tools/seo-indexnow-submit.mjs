import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

// Solo URL pubbliche e statiche: nessun dato personale o ricerca dell'utente.
const base='https://mappatura-servizi-assistenza-psicologica.pages.dev';
const host=new URL(base).hostname;
const key='d8ceb357f604b51f51a8e5c4c9026d65';
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const raw=fs.readFileSync('sitemap.xml','utf8');
const all=[...raw.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
assert.equal(all.length,36,'Il manifest e cambiato: aggiornare la procedura SEO');
assert.equal(all.length,new Set(all).size,'Sitemap duplicata');
assert.equal(fs.readFileSync(key+'.txt','utf8').trim(),key);
for(const url of all)assert.equal(new URL(url).hostname,host);
const known=new Set(all);
const before=process.env.GITHUB_EVENT_BEFORE||'';
let changed=[];
if(/^[0-9a-f]{40}$/.test(before)&&!/^[0]+$/.test(before)) {
 changed=execFileSync('git',['diff','--name-only',before,'HEAD'],{encoding:'utf8'}).trim().split('\n');
}
const initial=changed.includes(key+'.txt')||process.env.GITHUB_EVENT_NAME==='workflow_dispatch';
const initialPaths=['index.html','servizi.html','metodo.html','supporto-territoriale.html','esplora-servizi.html','territori/roma.html','territori/frosinone.html','territori/latina.html','territori/rieti.html','territori/viterbo.html','tipi-servizi/csm.html','tipi-servizi/serd.html','tipi-servizi/spdc.html','tipi-servizi/stpit.html','tipi-servizi/consultori.html','tipi-servizi/centri-diurni.html'];
const pages=[...new Set((initial?initialPaths:changed).filter(p=>p.endsWith('.html')))];
const urls=pages.map(p=>p==='index.html'?base+'/':base+'/'+p).filter(u=>known.has(u));
if(!urls.length){console.log('Nessuna URL pubblica nuova o modificata da inviare.');process.exit(0);}
for(const url of urls)assert(fs.existsSync(url===base+'/'?'index.html':url.slice(base.length+1)),'File locale URL non presente '+url);
const read=async url=>fetch(url,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)});
const beacon=/<script\b(?=[^>]*static\.cloudflareinsights\.com\/beacon\.min\.js)[^>]*>[\s\S]*?<\/script>/gi;
const matchesPublished=(html,expected)=>{
 if(html===expected)return true;
 if([...html.matchAll(beacon)].length!==1)return false;
 let prefix=0;
 while(prefix<expected.length&&prefix<html.length&&expected[prefix]===html[prefix])prefix++;
 let suffix=0;
 while(suffix<expected.length-prefix&&expected[expected.length-1-suffix]===html[html.length-1-suffix])suffix++;
 const injected=html.slice(prefix,html.length-suffix);
 return injected.includes('static.cloudflareinsights.com/beacon.min.js')&&injected.length<5000&&html.slice(0,prefix)+html.slice(html.length-suffix)===expected;
};
async function checkLive(){
 const sitemap=await read(base+'/sitemap.xml?seo='+commit);
 if(!sitemap.ok||(await sitemap.text())!==raw)return false;
 const verification=await read(base+'/'+key+'.txt?seo='+commit);
 if(!verification.ok||(await verification.text()).trim()!==key)return false;
 for(const u of urls){
  const r=await read(u+(u.includes('?')?'&':'?')+'seo='+commit);
  if(!r.ok||(r.headers.get('X-Robots-Tag')||'').toLowerCase().includes('noindex'))return false;
  const live=await r.text();
  const page=u===base+'/'?'index.html':u.slice(base.length+1);
  if(!matchesPublished(live,fs.readFileSync(page,'utf8')))return false;
  if(!/<meta\b[^>]*index,follow/i.test(live))return false;
  const canonical=live.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i)?.[0]||'';
  if(!canonical.includes('href="'+u+'"'))return false;
 }
 return true;
}
let ready=false;
for(let n=0;n<40;n++){
 try{if(await checkLive()){ready=true;break;}}catch(e){console.log('Cloudflare: verifica transitoria, '+e.message);}
 if(n!==39)await new Promise(done=>setTimeout(done,6000));
}
assert(ready,'Cloudflare non serve ancora sitemap, file chiave o tutte le pagine della release. Notifica non inviata.');
console.log('Sitemap, key file e '+urls.length+' URL nuove/modificate verificati in produzione.');
const result=await fetch('https://api.indexnow.org/indexnow',{method:'POST',
 headers:{'Content-Type':'application/json; charset=utf-8'},
 body:JSON.stringify({host,key,keyLocation:base+'/'+key+'.txt',urlList:urls}),
 signal:AbortSignal.timeout(25000)
});
const ok=[200,202].includes(result.status);
const responseText=(await result.text()).slice(0,250);
console.log('IndexNow HTTP '+result.status+': '+urls.length+' URL; '+(ok?'richiesta ricevuta':'richiesta non accettata')+(responseText?' ('+responseText+')':''));
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
 '### IndexNow / SEO\n\n- Produzione verificata: sitemap, chiave, URL pubbliche e metadati coerenti.\n- URL nuove/aggiornate notificate: '+urls.length+'\n- Risposta IndexNow: HTTP '+result.status+'\n- La ricezione non garantisce crawling o indicizzazione.\n');
assert(ok,'IndexNow non ha accettato la notifica. Nessun successo dichiarabile.');
