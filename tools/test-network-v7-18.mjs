import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import https from 'node:https';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {generateKeyPair,SignJWT,createLocalJWKSet,exportJWK} from 'jose';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {createAPI,inspectWebP,digest} from '../lib/editorial-api.mjs';
import {verifyToken,authenticate,protectWrite} from '../lib/editorial-auth.mjs';
import {freshness,cleanContent,readyToPublish} from '../assets/editorial-core-v7-18.mjs';
import worker from '../worker/editorial-entry.mjs';
const ROOT=process.cwd(),OUT=process.env.QA_OUT||'/tmp/network-v718-qa';fs.mkdirSync(OUT,{recursive:true});
const awaitToken='invalid.test.token';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),results=[];
async function test(name,fn){try{await fn();results.push({name,passed:true});console.log('PASS '+name);}catch(e){results.push({name,passed:false,error:e.stack||e.message});console.error('FAIL '+name+' '+e.message);}}
class DB{
 constructor(){this.sql=new DatabaseSync(':memory:');this.sql.exec(fs.readFileSync('migrations/0001_editorial.sql','utf8'));}
 withSession(){return this;}
 prepare(query){const db=this;let args=[];return {bind(...v){args=v;return this;},async first(){return db.sql.prepare(query).get(...args)||null;},async all(){return {results:db.sql.prepare(query).all(...args)};},async run(){const r=db.sql.prepare(query).run(...args);return {success:true,meta:{changes:r.changes,last_row_id:Number(r.lastInsertRowid)}};}};}
 async batch(statements){this.sql.exec('BEGIN IMMEDIATE');try{const rows=[];for(const s of statements)rows.push(await s.run());this.sql.exec('COMMIT');return rows;}catch(e){this.sql.exec('ROLLBACK');throw e;}}
}
const records=read('data/editorial-catalog-v7-18.json'),assetFetch=async request=>{let p=new URL(request.url).pathname;if(p.endsWith('/'))p+='index.html';const f=path.resolve(ROOT,'.'+p);if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile())return new Response('not found',{status:404});return new Response(fs.readFileSync(f));};
const makeEnv=(db,origin='https://network.example')=>({EDITORIAL_ENABLED:'true',EDITORIAL_DB:db,ADMIN_ORIGIN:origin,ACCESS_TEAM_DOMAIN:'https://network-test.cloudflareaccess.com',ACCESS_AUD:'test-audience',ASSETS:{fetch:assetFetch}});
const resolver=async request=>({email:request.headers.get('X-Test-User')||'anonymous@example.test',sub:'test'}),api=createAPI(resolver);
function user(db,email,roles,scopes=[]){db.sql.prepare('INSERT INTO cms_users(email,name,roles,scopes,created_at) VALUES(?,?,?,?,?)').run(email,'Collaboratore',JSON.stringify(roles),JSON.stringify(scopes),new Date().toISOString());}
const admin='admin@example.test',author='editor@example.test',reviewer='reviewer@example.test',expert='expert@example.test',second='second-admin@example.test';
const db=new DB(),env=makeEnv(db);for(const [email,roles] of [[admin,['admin']],[author,['editor']],[reviewer,['data_reviewer']],[expert,['specialist']],[second,['admin']]])user(db,email,roles);
const call=async(url,who=admin,method='GET',data,custom={})=>{const request=new Request(env.ADMIN_ORIGIN+url,{method,headers:{'X-Test-User':who,'Origin':env.ADMIN_ORIGIN,'X-Editorial-Request':'1',...(data!==undefined?{'Content-Type':'application/json'}:{}),...custom},body:data===undefined?undefined:JSON.stringify(data)});const r=await api(request,env);let body;try{body=await r.json();}catch{body=null;}return {status:r.status,body,headers:r.headers};};
const catalog=async(key,who=reviewer)=>{const r=await call('/api/admin/catalog?key='+encodeURIComponent(key),who);assert.equal(r.status,200,JSON.stringify(r.body));return r.body;};
const proposalBody=(c,patch,mode='update')=>({target:c.record.key,mode,base_hash:c.base_hash,patch,checked_at:'2026-09-28',evidence:Object.fromEntries(Object.keys(patch).map(k=>[k,{urls:['https://www.aslroma1.it/'],kind:'institutional'}])),note:'Nota interna riservata'});
await test('Immutable clinical and territorial baseline',()=>{
 const v=read('version.json');assert.equal(v.web_version,'7.18');assert.equal(records.clinical,443);assert.equal(records.support,237);assert.equal(records.records.length,680);assert.equal(v.map.localized,379);assert.equal(v.map.unlocated,64);assert.equal(v.indexing_enabled,true);assert.equal(v.clinical_review,false);
 const names=execFileSync('git',['ls-tree','-r','--name-only','712ba70a5cce0b65243c500451fa25536544c1ae'],{encoding:'utf8'}).trim().split('\n').filter(p=>p.startsWith('data/')||p.startsWith('downloads/')||p.startsWith('offline/'));
 for(const p of names)assert(fs.readFileSync(p).equals(execFileSync('git',['show','712ba70a5cce0b65243c500451fa25536544c1ae:'+p],{maxBuffer:10000000})),p+' altered');
});
await test('Access JWT validates signature, audience, issuer, expiry and token type',async()=>{
 const {publicKey,privateKey}=await generateKeyPair('RS256'),jwk=await exportJWK(publicKey);jwk.kid='test';const keys=createLocalJWKSet({keys:[jwk]}),cfg={issuer:env.ACCESS_TEAM_DOMAIN,audience:env.ACCESS_AUD};
 const token=async extra=>new SignJWT({type:'app',email:admin,...extra}).setProtectedHeader({alg:'RS256',kid:'test'}).setIssuer(cfg.issuer).setAudience(cfg.audience).setSubject('test-subject').setIssuedAt().setExpirationTime('5m').sign(privateKey);
 assert.equal((await verifyToken(await token({}),cfg,keys)).email,admin);
 await assert.rejects(()=>verifyToken(awaitToken,{...cfg,audience:'wrong'},keys));
 async function invalid(){for(const t of ['',(await token({type:'org'})),(await token({email:'invalid'}))])await assert.rejects(()=>verifyToken(t,cfg,keys));}
 await invalid();await assert.rejects(()=>verifyToken(awaitToken,cfg,keys));
 const expired=await new SignJWT({type:'app',email:admin}).setProtectedHeader({alg:'RS256',kid:'test'}).setIssuer(cfg.issuer).setAudience(cfg.audience).setSubject('test').setIssuedAt(1).setExpirationTime(2).sign(privateKey);await assert.rejects(()=>verifyToken(expired,cfg,keys));
 const good=await token({});await assert.rejects(()=>verifyToken(good,{...cfg,issuer:'https://wrong.example'},keys));await assert.rejects(()=>verifyToken(good,{...cfg,audience:'wrong'},keys));
});
await test('Disabled backend and anonymous users fail closed',async()=>{
 for(const p of ['/admin/','/api/admin/me']){const r=await worker.fetch(new Request('https://network.example'+p),{ASSETS:{fetch:assetFetch}});assert.equal(r.status,503);}
 assert.equal((await call('/api/admin/me','unknown@example.test')).status,403);
 await assert.rejects(()=>authenticate(new Request('https://network.example/api/admin/me',{headers:{'Cf-Access-Authenticated-User-Email':admin}}),env));
 const r=await createAPI()(new Request('https://network.example/api/admin/me'),env);assert.equal(r.status,401);
});
await test('One-time admin bootstrap requires the configured verified identity',async()=>{
 const b=new DB(),e={...makeEnv(b),BOOTSTRAP_ADMIN_EMAIL:admin};assert.equal((await api(new Request('https://network.example/api/admin/me',{headers:{'X-Test-User':author}}),e)).status,403);
 for(let i=0;i<2;i++)assert.equal((await api(new Request('https://network.example/api/admin/me',{headers:{'X-Test-User':admin}}),e)).status,200);
 assert.equal(b.sql.prepare('SELECT COUNT(*) n FROM cms_users').get().n,1);b.sql.prepare('UPDATE cms_users SET disabled=1').run();assert.equal((await api(new Request('https://network.example/api/admin/me',{headers:{'X-Test-User':admin}}),e)).status,403);b.sql.close();
});
await test('Roles, territorial scopes and cross-site protection',async()=>{
 assert.equal((await call('/api/admin/catalog',author)).status,403);assert.equal((await call('/api/admin/content',reviewer)).status,403);assert.equal((await call('/api/admin/users',author)).status,403);
 user(db,'scoped@example.test',['data_reviewer'],['ASL Viterbo']);assert.equal((await call('/api/admin/catalog?key=rete%3AR1-01','scoped@example.test')).status,403);
 assert.equal((await call('/api/admin/content',author,'POST',{kind:'news',title:'Test'},{Origin:'https://attacker.example'})).status,403);
 assert.equal((await call('/api/admin/users',admin,'POST',{email:admin,roles:['editor']})).status,400);
});
let contentId,version;
await test('Drafts, approval and optimistic version checks',async()=>{
 let r=await call('/api/admin/content',author,'POST',{kind:'news',title:'Iniziativa del Network',summary:'Descrizione di prova',body:'Testo'});assert.equal(r.status,201,JSON.stringify(r.body));contentId=r.body.id;version=1;
 assert.equal((await call('/api/public/content')).body.items.length,0);
 r=await call('/api/admin/content/'+contentId+'/publish',author,'POST',{version});assert.equal(r.status,403);
 r=await call('/api/admin/content/'+contentId+'/submit',author,'POST',{version});assert.equal(r.status,200);version=r.body.version;
 r=await call('/api/admin/content/'+contentId+'/publish',admin,'POST',{version});assert.equal(r.status,200);version=r.body.version;
 let feed=(await call('/api/public/content')).body;assert.equal(feed.items[0].title,'Iniziativa del Network');assert(!JSON.stringify(feed).includes(author));
 r=await call('/api/admin/content/'+contentId,author,'PUT',{kind:'news',title:'Bozza segreta',summary:'Non ancora pubblicata',version});assert.equal(r.status,200);version=r.body.version;
 feed=(await call('/api/public/content')).body;assert.equal(feed.items[0].title,'Iniziativa del Network');assert(!JSON.stringify(feed).includes('Bozza segreta'));
 r=await call('/api/admin/content/'+contentId,author,'PUT',{kind:'news',title:'concorrenza',version:1});assert.equal(r.status,409);
 r=await call('/api/admin/content',author,'POST',{kind:'link',title:'Unsafe',url:'javascript:alert(1)'});assert.equal(r.status,400);
});
await test('Private images and published-only media',async()=>{
 const image=fs.readFileSync('assets/network-logo-v7-18.webp');assert(inspectWebP(image).width>0);assert.throws(()=>inspectWebP(Buffer.from('<svg onload=alert(1)>')));
 const objects=new Map();env.EDITORIAL_MEDIA={put:async(k,v)=>objects.set(k,v),get:async k=>objects.has(k)?{body:objects.get(k)}:null,delete:async k=>objects.delete(k)};
 const r=await api(new Request(env.ADMIN_ORIGIN+'/api/admin/media',{method:'POST',headers:{'X-Test-User':author,Origin:env.ADMIN_ORIGIN,'X-Editorial-Request':'1','Content-Type':'image/webp','X-Image-Alt':'Logo%20di%20prova'},body:image}),env);assert.equal(r.status,201,await r.clone().text());const m=await r.json();assert.equal((await call('/api/public/media/'+m.id)).status,404);
 const privateMedia=await api(new Request(env.ADMIN_ORIGIN+'/api/admin/media/'+m.id,{headers:{'X-Test-User':author}}),env);assert.equal(privateMedia.status,200);
});
let approvedId,approvedTarget='rete:R1-01';
await test('Field proposal requires sources and distinct approval; public audit redacted',async()=>{
 let c=await catalog(approvedTarget),body=proposalBody(c,{phone:'06 12345678'});let r=await call('/api/admin/proposals',reviewer,'POST',{...body,evidence:{}});assert.equal(r.status,400);
 r=await call('/api/admin/proposals',reviewer,'POST',body);assert.equal(r.status,201,JSON.stringify(r.body));approvedId=r.body.id;
 r=await call('/api/admin/proposals/'+approvedId+'/submit',reviewer,'POST',{version:1});assert.equal(r.status,200);
 assert.equal((await call('/api/admin/proposals/'+approvedId+'/approve',reviewer,'POST',{version:2})).status,403);
 r=await call('/api/admin/proposals/'+approvedId+'/approve',admin,'POST',{version:2});assert.equal(r.status,200,JSON.stringify(r.body));
 const publicData=(await call('/api/public/revisions')).body;assert.equal(publicData.items[0].values.phone,'06 12345678');for(const s of [reviewer,admin,'Nota interna riservata','author','approver'])assert(!JSON.stringify(publicData).includes(s),s);
 c=await catalog(approvedTarget);assert.equal(c.record.fields.phone,'06 12345678');
 r=await call('/api/admin/proposals',admin,'POST',proposalBody(c,{hours:'Test'}));assert.equal(r.status,201);let id=r.body.id;await call('/api/admin/proposals/'+id+'/submit',admin,'POST',{version:1});assert.equal((await call('/api/admin/proposals/'+id+'/approve',admin,'POST',{version:2})).status,403);
});
await test('Sensitive fields require a specialist and retain uncertainty',async()=>{
 const c=await catalog('rete:R1-01');let r=await call('/api/admin/proposals',reviewer,'POST',proposalBody(c,{ssn:'da-verificare'}));assert.equal(r.status,201);const id=r.body.id;
 await call('/api/admin/proposals/'+id+'/submit',reviewer,'POST',{version:1});assert.equal((await call('/api/admin/proposals/'+id+'/approve',admin,'POST',{version:2})).status,403);
 r=await call('/api/admin/proposals/'+id+'/specialist',expert,'POST',{version:2});assert.equal(r.status,200);r=await call('/api/admin/proposals/'+id+'/approve',admin,'POST',{version:3});assert.equal(r.status,200);
 assert.equal((await call('/api/public/revisions')).body.items.find(x=>x.key==='rete:R1-01').values.ssn,'da-verificare');
});
await test('New support records, protected sites, confirmation and conflicts',async()=>{
 const base={mode:'add',entity:'support',category:'PUA',asl:'ASL Roma 1',patch:{name:'PUA test',town:'Roma'},checked_at:'2026-09-28',evidence:{name:{urls:['https://www.aslroma1.it/'],kind:'institutional'},town:{urls:['https://www.aslroma1.it/'],kind:'institutional'}}};
 assert.equal((await call('/api/admin/proposals',reviewer,'POST',{...base,patch:{...base.patch,name:'Casa Rifugio segreta'}})).status,400);
 let r=await call('/api/admin/proposals',reviewer,'POST',base);assert.equal(r.status,201);const id=r.body.id;
 await call('/api/admin/proposals/'+id+'/submit',reviewer,'POST',{version:1});assert.equal((await call('/api/admin/proposals/'+id+'/approve',admin,'POST',{version:2})).status,403);
 await call('/api/admin/proposals/'+id+'/specialist',expert,'POST',{version:2});assert.equal((await call('/api/admin/proposals/'+id+'/approve',admin,'POST',{version:3})).status,200);
 const c=await catalog(approvedTarget),confirm=proposalBody(c,{phone:c.record.fields.phone},'confirm');assert.equal((await call('/api/admin/proposals',reviewer,'POST',{...confirm,patch:{phone:'different'}})).status,400);
 r=await call('/api/admin/proposals',reviewer,'POST',confirm);assert.equal(r.status,201);const k=r.body.id;await call('/api/admin/proposals/'+k+'/submit',reviewer,'POST',{version:1});assert.equal((await call('/api/admin/proposals/'+k+'/approve',admin,'POST',{version:2})).status,200);
 assert.equal((await call('/api/public/revisions')).body.items.find(x=>x.key===approvedTarget).meta.phone.changed,false);
});
await test('Audit is append-only, rollback has history, revoked users cannot act',async()=>{
 assert.throws(()=>db.sql.exec('DELETE FROM cms_audit'));assert.throws(()=>db.sql.exec('UPDATE cms_data_history SET actor=\'nobody\''));
 const c=await catalog(approvedTarget,admin),hist=await call('/api/admin/history?target='+encodeURIComponent(approvedTarget),admin);assert(hist.body.length>=2);
 const r=await call('/api/admin/history?target='+encodeURIComponent(approvedTarget),admin,'POST',{history_id:hist.body[0].id,version:c.override_version,reason:'Ripristino di prova'});assert.equal(r.status,200,JSON.stringify(r.body));
 db.sql.prepare('UPDATE cms_users SET disabled=1 WHERE email=?').run(author);assert.equal((await call('/api/admin/me',author)).status,403);
});
await test('Public status wording never implies complete clinical certification',()=>{
 assert.match(freshness({phone:{checked_at:'2026-09-28',changed:true}}).label,/aggiornati.*controllo parziale/);
 assert.match(freshness({phone:{checked_at:'2026-09-28',changed:false,uncertain:true}}).label,/alcuni dati da confermare/);
 assert.throws(()=>readyToPublish(cleanContent({kind:'banner',title:'Questionario',summary:'Partecipa'})));
});

// Browser harness: isolated TLS origin, local SQLite and synthetic users only. No production bypass.
const tls=fs.mkdtempSync(path.join(os.tmpdir(),'ng-tls-'));execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',tls+'/key.pem','-out',tls+'/cert.pem','-days','1','-subj','/CN=localhost'],{stdio:'ignore'});
const browserDB=new DB(),BASE='https://127.0.0.1:8123',browserEnv={...makeEnv(browserDB,BASE),EDITORIAL_ENABLED:'false'};user(browserDB,admin,['admin']);user(browserDB,author,['editor']);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.geojson':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.md':'text/plain'};
const server=https.createServer({key:fs.readFileSync(tls+'/key.pem'),cert:fs.readFileSync(tls+'/cert.pem')},async(req,res)=>{
 try{const u=new URL(req.url,BASE);let response;if(u.pathname.startsWith('/api/')){const chunks=[];for await(const x of req)chunks.push(x);const body=Buffer.concat(chunks);response=await api(new Request(u,{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:body}),browserEnv);}else{let p=decodeURIComponent(u.pathname);if(p.endsWith('/'))p+='index.html';if(!path.extname(p))p+='.html';const f=path.resolve(ROOT,'.'+p);if(!f.startsWith(ROOT+path.sep)||!fs.existsSync(f))response=new Response('not found',{status:404});else response=new Response(fs.readFileSync(f),{headers:{'Content-Type':mime[path.extname(f)]||'application/octet-stream'}});}res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch(e){res.writeHead(500);res.end(String(e));}
});await new Promise(r=>server.listen(8123,'127.0.0.1',r));const browser=await chromium.launch({headless:true}),errors=[],external=[];
async function context(width=390,who=null){const c=await browser.newContext({viewport:{width,height:900},ignoreHTTPSErrors:true,reducedMotion:'reduce',extraHTTPHeaders:who?{'X-Test-User':who}:{}});await c.route('**/*',r=>{const u=r.request().url();if(u.startsWith(BASE)||u.startsWith('data:'))r.continue();else if(u.startsWith('https://tile.openstreetmap.org/'))r.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/UAAAAABJRU5ErkJggg==','base64')});else{external.push(u);r.abort();}});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(12000);return {c,p};}
try{
await test('Public pages, mobile, navigation, WCAG and original counts',async()=>{
 for(const width of [390,1440]){const {c,p}=await context(width);for(const page of ['index.html','servizi.html','mappa.html','network-giovani.html','supporto-territoriale.html','strutture-approfondite.html','privati.html','redazione.html']){
 await test('Public page '+page+' at '+width+'px',async()=>{await p.goto(BASE+'/'+page,{waitUntil:'networkidle'});if(page==='servizi.html'){await p.locator('#svc-count').filter({hasText:/443/}).waitFor();assert.match(await p.locator('#search-map-coverage').innerText(),/379 localizzate/);}if(page==='mappa.html'){await p.locator('#map-level-total').filter({hasText:/443/}).waitFor();assert.match(await p.locator('#map-level-coverage').innerText(),/64 senza/);}if(page==='supporto-territoriale.html'){await p.locator('#support-controls:not([hidden])').waitFor();assert.match(await p.locator('#support-count').innerText(),/237 schede/);}if(page==='strutture-approfondite.html'||page==='privati.html'){await p.locator('.directory-card').first().waitFor();}
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),page+' overflow '+width);assert.equal(await p.locator('h1').count(),1,page);assert(await p.locator('body').innerText().then(t=>t.includes('Un progetto del Network Giovani')),page);
 const axe=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();fs.writeFileSync(path.join(OUT,page+'-'+width+'-axe.json'),JSON.stringify(axe.violations,null,2));assert.equal(axe.violations.length,0,JSON.stringify(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))));
 await p.screenshot({path:path.join(OUT,page+'-'+width+'.png'),fullPage:page==='index.html'||page==='network-giovani.html'});
 });}await c.close();}
});
await test('Both maps synchronize province, ASL and municipality',async()=>{
 const {c,p}=await context(1440);await p.goto(BASE+'/servizi.html',{waitUntil:'networkidle'});await p.locator('#search-map-province-buttons [data-search-province="VT"]').click();await p.locator('[data-search-map-municipality]').first().waitFor();assert.equal(await p.locator('#svc-provincia').inputValue(),'VT');await p.locator('#search-map-municipality-buttons [data-search-municipality="Viterbo"]').click();await p.locator('.hierarchy-pin').first().waitFor();assert.equal(await p.locator('#svc-comune').inputValue(),'Viterbo');await c.close();
});
await test('Public detail is compact with date and retained sources; Menta remains useful',async()=>{
 const {c,p}=await context();await p.goto(BASE+'/servizi.html?scheda=rete%3AR1-01',{waitUntil:'networkidle'});await p.locator('#svc-dialog[open]').waitFor();assert.match(await p.locator('#svc-dialog').innerText(),/Pad\. 26/);assert(await p.locator('#svc-dialog .ng-freshness').count());assert(!/Proposto da:|Approvato da:/.test(await p.locator('#svc-dialog').innerText()));await p.goto(BASE+'/orientati.html',{waitUntil:'networkidle'});await p.locator('#orientation-custom > summary').click();await p.locator('#menta-query:not([disabled])').waitFor();await p.locator('#menta-query').fill('cerco un consultorio');await p.locator('#menta-submit').click();await p.locator('#menta-results:not([hidden])').waitFor();assert((await p.locator('#menta-options a').count())>0);await c.close();
});

await test('Approved field corrections reach both public directories and invalidate old map pins',async()=>{
 browserEnv.EDITORIAL_ENABLED='true';const clinical=records.records.find(r=>r.key==='rete:R1-01'),support=records.records.find(r=>r.key==='support:PUA-001'),day='2026-09-28',source='https://www.aslroma1.it/test-documentale';
 const add=(record,values)=>{const meta=Object.fromEntries(Object.keys(values).map(k=>[k,{checked_at:day,changed:true,uncertain:false,sources:[source],author:'PRIVATE_REVIEWER_SENTINEL',approver:'PRIVATE_APPROVER_SENTINEL'}])),base=Object.fromEntries(Object.keys(values).map(k=>[k,record.fields[k]||'']));browserDB.sql.prepare('INSERT INTO cms_overrides(target,entity,values_json,meta_json,base_values,published_at) VALUES(?,?,?,?,?,?)').run(record.key,record.entity,JSON.stringify(values),JSON.stringify(meta),JSON.stringify(base),new Date().toISOString());};
 add(clinical,{phone:'06 12345678',address:'Via di prova del collaudo 99, Roma'});add(support,{phone:'06 99887766'});
 const {c,p}=await context(1440);await p.goto(BASE+'/servizi.html?scheda=rete%3AR1-01',{waitUntil:'networkidle'});await p.locator('#svc-dialog[open]').waitFor();assert.match(await p.locator('#svc-dialog').innerText(),/Via di prova del collaudo/);assert.match(await p.locator('#svc-dialog .ng-freshness').innerText(),/Dati aggiornati/);assert.equal(await p.locator('#svc-dialog a[href="tel:0612345678"]').count()>0,true);
 await p.goto(BASE+'/mappa.html',{waitUntil:'networkidle'});await p.locator('#map-level-coverage').filter({hasText:/378 localizzate/}).waitFor();assert.match(await p.locator('#map-level-coverage').innerText(),/65 senza/);
 await p.goto(BASE+'/supporto-territoriale.html?q=Eroi&categoria=PUA',{waitUntil:'networkidle'});await p.locator('#support-controls:not([hidden])').waitFor();assert.equal(await p.locator('#support-grid a[href="tel:0699887766"]').count(),1);assert.equal(await p.locator('#support-grid a[href="'+source+'"]').count(),1);
 const publicRevision=await p.request.get(BASE+'/api/public/revisions'),json=await publicRevision.text();assert(!json.includes('PRIVATE_REVIEWER_SENTINEL'));assert(!json.includes('PRIVATE_APPROVER_SENTINEL'));await c.close();browserDB.sql.exec('DELETE FROM cms_overrides');
});

await test('Editor panel composes drafts and has no data administration controls',async()=>{
 browserEnv.EDITORIAL_ENABLED='true';const {c,p}=await context(390,author);await p.goto(BASE+'/admin/',{waitUntil:'networkidle'});await p.locator('#admin-identity').filter({hasText:'Editor'}).waitFor();assert.equal(await p.getByRole('button',{name:'Schede dei servizi',exact:true}).count(),0);await p.getByRole('button',{name:'Scrivi una notizia',exact:true}).click();await p.getByLabel('Titolo',{exact:true}).fill('Notizia redazionale di prova');await p.getByLabel('Breve descrizione',{exact:true}).fill('Un testo di prova non pubblico');await p.getByRole('button',{name:'Salva bozza',exact:true}).click();await p.locator('#admin-message').filter({hasText:/bozza|salvat/i}).waitFor();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.screenshot({path:path.join(OUT,'admin-editor-mobile.png'),fullPage:true});await c.close();
});
await test('Network feeds and non-invasive banner publish only approved content',async()=>{
 const content={kind:'banner',title:'Questionario di prova',summary:'Contenuto di collaudo',body:'',url:'https://example.org/questionario',category:'Eventi',image_id:'',image_alt:'',placement:'both',featured:true,starts_at:null,ends_at:null};browserDB.sql.prepare('INSERT INTO cms_content(id,kind,owner,draft,live,status,updated_at,published_at) VALUES(?,?,?,?,?,?,?,?)').run('test-banner','banner',admin,JSON.stringify(content),JSON.stringify(content),'published',new Date().toISOString(),new Date().toISOString());const {c,p}=await context();await p.goto(BASE+'/index.html',{waitUntil:'networkidle'});await p.locator('.ng-banner').waitFor();assert.match(await p.locator('.ng-banner').innerText(),/Questionario di prova/);await p.getByRole('button',{name:'Chiudi il banner in evidenza'}).click();assert.equal(await p.locator('.ng-banner').count(),0);await c.close();
});
await test('No uncaught browser errors or unrelated external requests',()=>{assert.deepEqual(errors,[]);assert.deepEqual(external,[]);});
}finally{await browser.close();await new Promise(r=>server.close(r));browserDB.sql.close();db.sql.close();fs.rmSync(tls,{recursive:true,force:true});}
await test('SEO whitelist, canonical pages, sitemap and non-indexed technical paths',()=>{
 const base='https://mappatura-servizi-assistenza-psicologica.pages.dev/';
 const publicPages=['index.html','servizi.html','mappa.html','orientati.html','aiuto-adesso.html','supporto-territoriale.html','giovani.html','guide/index.html','guide/primo-percorso.html','guide/pubblico.html','guide/privato.html','guide/ricovero.html','guide/riabilitazione.html','ascolto.html','helpline.html','centri-ascolto.html','universita.html','scuole.html','privati.html','strutture-approfondite.html','studenti.html','orientamento-servizi.html','glossario.html','metodo.html'];
 const version=read('version.json');assert.equal(version.indexing_enabled,true);assert.equal(version.indexable_public_pages,publicPages.length);
 const sitemap=fs.readFileSync('sitemap.xml','utf8'),urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
 assert.equal(urls.length,publicPages.length);assert.equal(new Set(urls).size,publicPages.length);assert(!sitemap.includes('<lastmod>'),'Unverified lastmod values');
 for(const name of publicPages){
  const html=fs.readFileSync(name,'utf8');
  const robot=html.match(/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i)?.[0]||'';
  assert.match(robot,/index,follow/);assert.doesNotMatch(robot,/noindex/);
  const canonical=html.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i)?.[0]||'';
  const expected=base+(name==='index.html'?'':name);
  assert(canonical.includes('href="'+expected+'"'),name+' canonical missing or incorrect');
  assert(urls.includes(expected),name+' absent from sitemap');
 }
 for(const name of ['network-giovani.html','sezioni.html','documenti.html','qualita-dati.html','privacy.html','redazione.html','notizia.html','archivio.html','interfaccia-precedente.html','404.html']){
  const html=fs.readFileSync(name,'utf8');const robots=html.match(/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i)?.[0]||'';
  assert.match(robots,/noindex/,name+' unexpectedly indexable');
 }
 const headers=fs.readFileSync('_headers','utf8');
 const global=headers.split('\n/assets/*')[0];assert.doesNotMatch(global,/^\s+X-Robots-Tag:/im);
 for(const route of ['/data/*','/downloads/*','/offline/*','/admin/*','/redazione.html','/notizia.html','/network-giovani.html','/sezioni.html','/tools/*','/research/*'])
  assert(headers.includes('\n'+route+'\n'),route+' missing scoped robots policy');
 assert(headers.includes('https://:preview.mappatura-servizi-assistenza-psicologica.pages.dev/*'));
 const robots=fs.readFileSync('robots.txt','utf8');assert(robots.includes('Sitemap: '+base+'sitemap.xml'));for(const route of ['/admin/','/api/','/data/','/downloads/','/offline/','/tools/','/research/','/lib/','/migrations/','/version.json'])assert(robots.includes('Disallow: '+route),route+' missing robots crawl guard');
 assert(!sitemap.includes('fondazione-di-liegro'));
});
await test('Cloudflare analytics integration is transparent and never hardcoded',()=>{
 const home=fs.readFileSync('index.html','utf8');
 const privacy=fs.readFileSync('privacy.html','utf8');
 const headers=fs.readFileSync('_headers','utf8');
 const version=read('version.json');
 assert.equal(version.analytics_provider,'cloudflare_web_analytics');
 assert.equal(version.analytics_mode,'cloudflare_pages_auto_injection');
 assert.equal(version.analytics_beacon_in_repository,false);
 assert(home.includes('<meta name="robots" content="index,follow'));
 assert(!home.includes('static.cloudflareinsights.com/beacon.min.js'),'Do not duplicate the edge injected beacon');
 assert(privacy.includes('id="statistiche-privacy"'),'Analytics privacy section missing');
 assert(privacy.includes('Cloudflare Web Analytics'),'Cloudflare disclosure missing');
 assert(privacy.includes('L’identità giuridica del titolare'),'Unresolved legal controller must be disclosed');
 assert(headers.includes('script-src')&&headers.includes('https://static.cloudflareinsights.com/beacon.min.js'));
 assert(headers.includes("connect-src 'self'"));
 assert(!headers.includes('https://www.googletagmanager.com'),'Unrequested Google Analytics permission');
});
const report={version:'7.18',checked_at:new Date().toISOString(),scope:'isolated local database and browser; not a live Access/OTP acceptance test',tests:results,passed:results.filter(t=>t.passed).length,total:results.length};fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
