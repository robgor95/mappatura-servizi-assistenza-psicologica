import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const BASE=(process.env.QA_BASE||'https://mappatura-servizi-assistenza-psicologica.pages.dev').replace(/\/$/,''),OUT=process.env.QA_OUT||'/tmp/network-v718-production',SHA=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(new URL(BASE).protocol!=='https:')throw Error('Production must use HTTPS');
fs.mkdirSync(OUT,{recursive:true});const tests=[];
async function test(name,fn){try{const extra=await fn();tests.push({name,passed:true,...extra});console.log('PASS '+name);}catch(e){tests.push({name,passed:false,error:e.stack||e.message});console.error('FAIL '+name+' '+e.message);}}
const sha=b=>createHash('sha256').update(b).digest('hex'),get=async p=>fetch(BASE+p,{headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(25000)});
let ready=false;
for(let i=0;i<45;i++){try{const r=await get('/version.json?release='+SHA),b=Buffer.from(await r.arrayBuffer());if(r.ok&&sha(b)===sha(fs.readFileSync('version.json'))){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,5000));}
await test('Production serves the exact tested release manifest',()=>{assert(ready,'Production has not served the candidate manifest');return {commit:SHA};});
if(ready){
 const indexablePaths=new Set([...fs.readFileSync('sitemap.xml','utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>{const url=new URL(m[1]);return url.pathname==='/'?'index.html':url.pathname.slice(1)}));
 const changed=execFileSync('git',['diff','--name-only','712ba70a5cce0b65243c500451fa25536544c1ae','HEAD'],{encoding:'utf8'}).trim().split('\n');
 const paths=[...new Set(changed.filter(p=>(p.endsWith('.html')&&!p.startsWith('admin/'))||p.startsWith('assets/')).concat(['version.json','data/presidi_geo_v7_16.json','data/supporto_territoriale_v7_17.json','downloads/Configurazione_Redazione_V7_18.md']))].filter(p=>fs.existsSync(p));
 for(const p of paths)await test('Production bytes '+p,async()=>{const r=await get('/'+p+'?release='+SHA);assert(r.ok,'HTTP '+r.status);const b=Buffer.from(await r.arrayBuffer());assert.equal(sha(b),sha(fs.readFileSync(p)),'Published bytes differ');if(p.endsWith('.html')){const hdr=(r.headers.get('X-Robots-Tag')||'').toLowerCase();if(indexablePaths.has(p)){assert(!hdr.includes('noindex'),p+' remains HTTP noindex');}else{const meta=b.toString('utf8').match(/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i)?.[0]||'';assert.match(meta,/noindex/i,p+' missing HTML noindex');}}return {sha256:sha(b),bytes:b.length};});
 await test('SEO policy, technical crawl exclusions and canonical sitemap in production',async()=>{
  const robots=await get('/robots.txt');assert(robots.ok);const robotsText=await robots.text();assert(robotsText.includes('Sitemap: '+BASE+'/sitemap.xml'));
  for(const dir of ['/admin/','/api/','/data/','/downloads/','/offline/','/tools/','/research/','/lib/','/migrations/'])
    assert(robotsText.includes('Disallow: '+dir),'Technical crawl exclusion missing: '+dir);
  const sitemap=await get('/sitemap.xml');assert(sitemap.ok);const liveSitemap=await sitemap.text();assert.equal(liveSitemap,fs.readFileSync('sitemap.xml','utf8'));
  for(const page of ['index.html','servizi.html','mappa.html','aiuto-adesso.html','orientati.html','supporto-territoriale.html']){
    const r=await get('/'+page);assert(r.ok);assert(!/noindex/i.test(r.headers.get('X-Robots-Tag')||''),page+' is blocked by HTTP');
    const html=await r.text();assert.match(html,/<meta[^>]*index,follow/);
  }
  for(const page of ['redazione.html','network-giovani.html','sezioni.html','documenti.html','privacy.html','notizia.html']){
    const r=await get('/'+page);assert(r.ok);
    const html=await r.text();
    const meta=html.match(/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i)?.[0]||'';
    assert.match(meta,/noindex/i,page+' unexpectedly indexable in HTML');
  }
  const data=await get('/data/portal_data_v7_3.json');assert(data.ok);
  if(!/noindex/i.test(data.headers.get('X-Robots-Tag')||''))
    console.log('INFO: Technical /data/ HTTP noindex absent; robots.txt Disallow /data/ enforced');
 });
 await test('Public APIs are safely disabled until explicit activation',async()=>{for(const p of ['/api/public/content','/api/public/revisions']){const r=await get(p);assert.equal(r.status,200);const d=await r.json();assert.equal(d.active,false);assert.deepEqual(d.items,[]);}});
 await test('Unconfigured administration refuses anonymous access including static aliases',async()=>{for(const p of ['/admin','/admin/','/admin/index.html','/admin/index','/api/admin/me','/api/admin/users']){const r=await get(p);assert([401,403,503].includes(r.status),p+' HTTP '+r.status);assert.match(r.headers.get('Cache-Control')||'',/no-store/);const text=await r.text();assert(!text.includes('id="admin-identity"'),p+' exposed admin interface');assert(!/@gmail\.com/.test(text));}});
 const browser=await chromium.launch({headless:true}),errors=[],unexpected=[];
 try{const c=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'});await c.route('**/*',r=>{const u=r.request().url();if(u.startsWith(BASE)||u.startsWith('data:'))r.continue();else{unexpected.push(u);r.abort();}});const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(20000);
 for(const page of ['index.html','servizi.html','mappa.html','network-giovani.html','supporto-territoriale.html'])await test('Live browser '+page,async()=>{
 const response=await p.goto(BASE+'/'+page,{waitUntil:'networkidle'});assert.equal(response.status(),200);assert(await p.locator('body').innerText().then(s=>s.includes('Un progetto del Network Giovani')));
 if(page==='servizi.html'){await p.locator('#svc-count').filter({hasText:/443/}).waitFor();await p.locator('#search-map-coverage').filter({hasText:/379 localizzate/}).waitFor();assert.equal(await p.locator('#ng-overlay-warning').count(),0);}
 if(page==='mappa.html'){await p.locator('#map-level-total').filter({hasText:/443/}).waitFor();await p.locator('#map-level-coverage').filter({hasText:/64 senza/}).waitFor();}
 if(page==='supporto-territoriale.html'){await p.locator('#support-count').filter({hasText:/237 schede/}).waitFor();}
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile overflow');const ax=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();assert.equal(ax.violations.length,0,JSON.stringify(ax.violations.map(v=>v.id)));await p.screenshot({path:path.join(OUT,page+'.png'),fullPage:page==='index.html'||page==='network-giovani.html'});
 });
 await test('Live mobile navigation and Menta',async()=>{await p.goto(BASE+'/orientati.html',{waitUntil:'networkidle'});await p.locator('#nav-toggle').click();assert.equal(await p.locator('#nav-toggle').getAttribute('aria-expanded'),'true');await p.locator('#nav-toggle').click();await p.locator('#orientation-custom > summary').click();await p.locator('#menta-query:not([disabled])').waitFor();await p.locator('#menta-query').fill('cerco un consultorio');await p.locator('#menta-submit').click();await p.locator('#menta-results:not([hidden])').waitFor();assert((await p.locator('#menta-options a').count())>0);});
 await test('No live JavaScript errors or third-party requests',()=>{assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);});await c.close();
 }finally{await browser.close();}
}
const report={version:'7.18',checked_at:new Date().toISOString(),commit:SHA,base:BASE,editorial_activation:'disabled',real_editor_accounts_tested:false,tests,passed:tests.filter(t=>t.passed).length,total:tests.length};fs.writeFileSync(path.join(OUT,'production-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
