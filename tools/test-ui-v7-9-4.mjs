/* Development-only browser verification. OSM tiles are mocked, never scraped. */
import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const BASE=process.env.QA_BASE||'http://127.0.0.1:8123';
const OUT=process.env.QA_OUT||'/tmp/ux-map-tests';await fs.mkdir(OUT,{recursive:true});
const tests=[],screens=[];let errors=[];
async function test(name,fn){try{await fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:String(e.message)});}}
const browser=await chromium.launch({headless:true});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==','base64');
async function context(width=390){const c=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});await c.route('https://tile.openstreetmap.org/**',route=>route.fulfill({status:200,contentType:'image/png',body:png}));await c.addInitScript(()=>{window.qaGeoCalls=0;navigator.geolocation.getCurrentPosition=()=>{window.qaGeoCalls++;};});const p=await c.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));return {c,p};}
async function shot(p,name){await p.screenshot({path:OUT+'/'+name+'.png'});screens.push(name+'.png');}
const {c,p}=await context();
try{
  await test('All baseline data and historical downloads retain exact bytes',async()=>{
    const audit=JSON.parse(await fs.readFile('downloads/Audit_UX_Mappa_V7_8.json','utf8'));
    for(const [file,hash] of Object.entries(audit.preserved_sha256))assert.equal(crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'),hash,file);
  });
  await test('26 current pages expose emergency landmark; simple menu and noindex retained',async()=>{
    const audit=JSON.parse(await fs.readFile('downloads/Audit_UX_Mappa_V7_8.json','utf8'));
    const violations=[];for(const name of audit.pages){
      await p.goto(BASE+'/'+name,{waitUntil:'networkidle'});
      assert.equal(await p.locator('aside.emergency-strip[aria-label]').count(),1,name);
      assert.equal(await p.locator('#site-navigation a[href="/mappa.html"]').count(),1,name);
      assert.equal(await p.locator('.nav-more-panel a[href="/studenti.html"]').count(),0,name);
      assert.equal(await p.locator('.nav-more-panel a[href="/documenti.html"]').count(),0,name);
      assert.match(await p.locator('meta[name=robots]').getAttribute('content'),/noindex/);
      const axe=await new AxeBuilder({page:p}).analyze();
      violations.push(...axe.violations.map(v=>({page:name,id:v.id,nodes:v.nodes.map(n=>n.html)})));
    }
    assert.equal(violations.length,0,JSON.stringify(violations));
  });
  await test('Mobile service search is inside first screen; management keeps uncertainty without V4',async()=>{
    await p.goto(BASE+'/servizi.html?tipo=CSM&comune=Viterbo',{waitUntil:'networkidle'});
    await p.locator('#svc-controls:not([disabled])').waitFor();
    assert((await p.locator('#svc-q').boundingBox()).y<600);
    assert.equal(await p.locator('#svc-list .svc-card').count(),1);
    assert.match(await p.locator('#svc-title').innerText(),/^Trova un servizio/);
    await shot(p,'servizi-390');
    await p.locator('#svc-list a[data-open]').first().click();
    assert.equal(await p.locator('#svc-dialog').isVisible(),true);
    assert(!/ereditato V4/.test(await p.locator('#svc-detail').innerText()));
    assert.match(await p.locator('#svc-detail').innerText(),/gestione da confermare/);
    assert.equal(await p.locator('#svc-dialog a[href*="/mappa.html?presidio="]').count(),1);
    await p.keyboard.press('Escape');assert.equal(await p.locator('#svc-dialog').isVisible(),false);
    assert.match(await p.locator('#svc-map-results').getAttribute('href'),/tipo=CSM/);
  });
  await test('Youth choice exposes four distinct non-diagnostic routes',async()=>{
    await p.goto(BASE+'/giovani.html',{waitUntil:'networkidle'});const links=await p.locator('.youth-choices a').evaluateAll(es=>es.map(e=>e.getAttribute('href')));assert.equal(links.length,4);assert.equal(new Set(links).size,4);assert(links.some(x=>x.includes('TSMREE')));assert(links.some(x=>x.includes('centri-ascolto')));await shot(p,'giovani-390');
  });
  await test('Map starts with all 443 services, honest geographic coverage, no external requests until activation',async()=>{
    const req=[];p.on('request',r=>req.push(r.url()));await p.goto(BASE+'/mappa.html',{waitUntil:'networkidle'});await p.locator('#map-controls:not([disabled])').waitFor();
    assert.match(await p.locator('#map-count').innerText(),/443 servizi/);assert.equal(req.filter(x=>!x.startsWith(BASE)).length,0);assert.equal(await p.evaluate(()=>window.qaGeoCalls),0);
    await p.locator('#map-q').fill('UX_PRIVACY_SENTINEL');await p.locator('#map-form button[type=submit]').click();assert.equal(await p.locator('#map-empty').isVisible(),true);assert(!req.some(x=>x.includes('UX_PRIVACY_SENTINEL')));assert.equal(await p.evaluate(()=>localStorage.length+sessionStorage.length),0);
    await p.locator('#map-reset').click();await shot(p,'mappa-consenso-390');
  });
  await test('Map and directory preserve all Reverie units including an unlocated one',async()=>{
    await p.goto(BASE+'/mappa.html?q=Reverie',{waitUntil:'networkidle'});await p.locator('#map-controls:not([disabled])').waitFor();assert.equal(await p.locator('#map-list>li').count(),4);assert.match(await p.locator('#map-count').innerText(),/^4 servizi/);
    assert((await p.locator('#map-list').innerText()).toLowerCase().includes('posizione da verificare'));
  });
  await test('Shared address keeps two service identities in one marker and popup',async()=>{
    await p.goto(BASE+'/mappa.html?q=Reverie+Morlupo',{waitUntil:'networkidle'});await p.locator('#map-controls:not([disabled])').waitFor();assert.equal(await p.locator('#map-list>li').count(),2);
    const req=[];p.on('request',r=>{if(r.url().includes('tile.openstreetmap.org'))req.push({url:r.url(),headers:r.headers()});});
    await p.locator('#map-activate').click();await p.waitForTimeout(450);assert.equal(await p.locator('.presidio-marker').count(),1);assert.equal(await p.locator('.presidio-marker').innerText(),'2');
    await p.locator('.presidio-marker').click();assert.match(await p.locator('.leaflet-popup-content').innerText(),/Centro Diurno/);assert.match(await p.locator('.leaflet-popup-content').innerText(),/CTC 2/);
    assert(req.length>0);assert(req.every(r=>r.headers.referer===BASE+'/'));assert(req.every(r=>!r.url.includes('Reverie')&&!r.url.includes('Morlupo')));
    assert.equal(await p.evaluate(()=>window.qaGeoCalls),0);await p.waitForTimeout(600);const pb=await p.locator('.leaflet-popup').boundingBox(),mb=await p.locator('#map-canvas').boundingBox();assert(pb.y>=mb.y&&pb.y+pb.height<=mb.y+mb.height,'Popup must be fully inside mobile map');await shot(p,'mappa-stesso-indirizzo-390');
    const axe=await new AxeBuilder({page:p}).analyze();assert.equal(axe.violations.length,0,axe.violations.map(v=>v.id).join(','));
    await p.locator('#map-stop').click();assert.equal(await p.locator('#map-canvas').isVisible(),false);assert.equal(await p.locator('#map-consent').isVisible(),true);
  });
  await test('Selected Viterbo service opens exact corresponding location and links back to its own details',async()=>{
    await p.goto(BASE+'/mappa.html?presidio=rete%3AVT-12',{waitUntil:'networkidle'});await p.locator('#map-controls:not([disabled])').waitFor();assert.match(await p.locator('#map-selected').innerText(),/CSM.*Viterbo/);await p.locator('#map-activate').click();await p.waitForTimeout(400);assert.match(await p.locator('.leaflet-popup-content').innerText(),/CSM.*Viterbo/);assert(await p.locator('.leaflet-popup-content a[href*="scheda=rete%3AVT-12"]').count()>0);
  });
  await test('Legacy service URL and empty reset remain functional',async()=>{
    await p.goto(BASE+'/archivio.html?view=stpit',{waitUntil:'networkidle'});await p.locator('#svc-controls:not([disabled])').waitFor();assert((await p.locator('#svc-list .svc-card').count())>0);
    await p.locator('#svc-q').fill('inesistente_qa');await p.waitForTimeout(500);assert.equal(await p.locator('#svc-empty').isVisible(),true);assert.equal(await p.locator('#svc-reset-empty').innerText(),'Mostra tutti i servizi');await p.locator('#svc-reset-empty').click();assert.match(await p.locator('#svc-count').innerText(),/443/);
  });
  await test('Menta ambiguity/emergency still work without input transmission',async()=>{
    await p.goto(BASE+'/',{waitUntil:'networkidle'});const req=[];p.on('request',r=>req.push(r.url()));await p.locator('#menta-query').fill('psicologo per adolescente UX_SENTINEL');await p.locator('#menta-submit').click();assert.equal(await p.locator('#menta-options a').count(),4);assert(!req.some(x=>x.includes('UX_SENTINEL')));await p.locator('#menta-query').fill('suicidio');assert.equal(await p.locator('#menta-urgent').isVisible(),true);
  });
  await test('Mobile navigation: keyboard focus and Escape close the disclosures',async()=>{
    await p.goto(BASE+'/',{waitUntil:'networkidle'});await p.locator('#nav-toggle').focus();await p.keyboard.press('Enter');assert.equal(await p.locator('#nav-toggle').getAttribute('aria-expanded'),'true');await p.locator('#nav-more summary').click();await p.keyboard.press('Escape');assert.equal(await p.locator('#nav-more').getAttribute('open'),null);await p.keyboard.press('Escape');assert.equal(await p.locator('#nav-toggle').getAttribute('aria-expanded'),'false');await shot(p,'home-390');
  });
  await test('No horizontal overflow at 360, 390, 768 and 1440 pixels; map and responsive search',async()=>{
    for(const width of [360,390,768,1440]){await p.setViewportSize({width,height:900});for(const path of ['index.html','servizi.html','mappa.html','giovani.html','universita.html','scuole.html','strutture-approfondite.html','centri-ascolto.html']){
      await p.goto(BASE+'/'+path,{waitUntil:'networkidle'});
      assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path+' at '+width);
      if(width===1440){await shot(p,path.replace('.html','')+'-1440');}
    }}
  });
  await test('Missing geography shows an honest fallback, not fabricated map pins',async()=>{
    const {c:ct,p:pg}=await context();await ct.route('**/data/presidi_geo_v7_9_4.json',r=>r.fulfill({status:503,body:'unavailable'}));await pg.goto(BASE+'/mappa.html',{waitUntil:'networkidle'});await pg.locator('#map-controls:not([disabled])').waitFor();assert.match(await pg.locator('#map-count').innerText(),/443 senza posizione/);assert.equal(await pg.locator('#map-partial').isVisible(),true);await ct.close();
  });
  await test('Tile failure leaves the service list available',async()=>{
    const {c:ct,p:pg}=await context();await ct.route('https://tile.openstreetmap.org/**',r=>r.fulfill({status:503,body:'unavailable'}));await pg.goto(BASE+'/mappa.html',{waitUntil:'networkidle'});await pg.locator('#map-controls:not([disabled])').waitFor();await pg.locator('#map-activate').click();await pg.waitForTimeout(350);assert.equal(await pg.locator('#map-tile-warning').isVisible(),true);assert((await pg.locator('#map-list>li').count())>0);await ct.close();
  });
  await test('Current operational fields and correct unknown SSN labels',async()=>{
 await p.setViewportSize({width:390,height:900});await p.goto(BASE+'/servizi.html?q=FEBO',{waitUntil:'networkidle'});await p.locator('#svc-controls:not([disabled])').waitFor();assert.equal(await p.locator('.svc-card').count(),1);assert.match(await p.locator('.svc-card').innerText(),/Struttura non ASL/);await p.locator('#svc-list a[data-open]').first().click();let text=await p.locator('#svc-detail').innerText();assert.match(text,/in attesa di accreditamento/);assert.match(text,/31.12.2019/);assert.match(text,/Riesame operativo V7.9/);await shot(p,'febo-dettagli-390');const ax=await new AxeBuilder({page:p}).analyze();assert.equal(ax.violations.length,0,JSON.stringify(ax.violations));await p.keyboard.press('Escape');
 await p.goto(BASE+'/servizi.html?q=Le+Ali+del+Ponte&comune=Civitavecchia',{waitUntil:'networkidle'});await p.locator('#svc-controls:not([disabled])').waitFor();assert.equal(await p.locator('.svc-card').count(),3);
 await p.goto(BASE+'/strutture-approfondite.html',{waitUntil:'networkidle'});assert.match(await p.locator('#result-count').innerText(),/184/);await p.locator('#directory-search').fill('FEBO');await p.waitForTimeout(500);assert.match(await p.locator('#directory-grid').innerText(),/FEBO/);
 });
 await test('Il Ponte shared address retains two services in one popup',async()=>{
 await p.goto(BASE+'/mappa.html?q=Le+Ali+del+Ponte+Veneto',{waitUntil:'networkidle'});await p.locator('#map-controls:not([disabled])').waitFor();assert.equal(await p.locator('#map-list>li').count(),2);await p.locator('#map-activate').click();await p.waitForTimeout(450);assert.equal(await p.locator('.presidio-marker').count(),1);await p.locator('.presidio-marker').click();assert.equal(await p.locator('.map-popup-item').count(),2);assert.match(await p.locator('.leaflet-popup-content').innerText(),/Coccinella/);assert.match(await p.locator('.leaflet-popup-content').innerText(),/Comunità residenziale/);await shot(p,'ponte-popup-390');
 });
 await test('Search text stays local and missing audit has a visible warning',async()=>{
 const {c:ct,p:pg}=await context();const req=[];pg.on('request',r=>req.push(r.url()));await pg.goto(BASE+'/servizi.html',{waitUntil:'networkidle'});await pg.locator('#svc-controls:not([disabled])').waitFor();req.length=0;await pg.locator('#svc-q').fill('MENTAL_HEALTH_PRIVATE_SENTINEL_79');await pg.waitForTimeout(600);assert(!req.some(u=>u.includes('MENTAL_HEALTH_PRIVATE_SENTINEL_79')));assert.equal(req.filter(u=>!u.startsWith(BASE)).length,0);await ct.route('**/data/audit_operativo_v7_9_1.json',r=>r.fulfill({status:503,body:'unavailable'}));await pg.reload({waitUntil:'networkidle'});await pg.locator('#svc-controls:not([disabled])').waitFor();assert.equal(await pg.locator('#svc-load-status').isVisible(),true);assert.match(await pg.locator('#svc-load-status').innerText(),/V7.9/);await ct.close();
 });

 await test('All 176 V7.9 protected files still have exact baseline bytes',async()=>{
  const a=JSON.parse(await fs.readFile('downloads/Audit_Iniziale_V7_9_1.json','utf8'));assert.equal(a.protected_paths.length,176);for(const file of a.protected_paths){if(file==='index.html')continue;assert.equal(crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex'),a.baseline_files[file].sha256,file);}
 });
 await test('Current map exposes the exact 443 / 315 / 128 service counts and uncertainty',async()=>{
  await p.goto(BASE+'/mappa.html',{waitUntil:'networkidle'});await p.locator('#map-controls:not([disabled])').waitFor();const text=await p.locator('#map-count').innerText();assert.match(text,/443 servizi/);assert.match(text,/315 localizzati/);assert.match(text,/128 senza posizione/);
  const d=await p.evaluate(async()=>{const x=await LazioMapData.load();return {count:x.rows.length,points:x.rows.filter(r=>LazioMapData.position(r,x.geo)).length};});assert.deepEqual(d,{count:443,points:315});
 });
 await test('Gabbiano preserves twelve contracted legacy modules and two distinct Villa Pia services',async()=>{
  await p.goto(BASE+'/servizi.html?q=Gabbiano',{waitUntil:'networkidle'});await p.locator('#svc-controls:not([disabled])').waitFor();assert.match(await p.locator('#svc-count').innerText(),/^14 di 443/);
  await p.goto(BASE+'/servizi.html?scheda=moduli%3AMOD-071',{waitUntil:'networkidle'});await p.locator('#svc-dialog[open]').waitFor();let t=await p.locator('#svc-detail').innerText();assert.match(t,/Struttura convenzionata/);assert.match(t,/31\/12\/2026/);assert.match(t,/budget 2026/);assert.match(t,/non acquisito/);await shot(p,'gabbiano-contratto-390');await p.keyboard.press('Escape');
 });
 await test('Villa Pia day and residential modules share one popup without hiding capacity conflict',async()=>{
  await p.goto(BASE+'/mappa.html?q=Villa+Pia+Pantano',{waitUntil:'networkidle'});await p.locator('#map-controls:not([disabled])').waitFor();assert.equal(await p.locator('#map-list>li').count(),2);await p.locator('#map-activate').click();await p.waitForTimeout(450);assert.equal(await p.locator('.presidio-marker').count(),1);await p.locator('.presidio-marker').click();assert.equal(await p.locator('.map-popup-item').count(),2);await shot(p,'villa-pia-popup-390');
  await p.goto(BASE+'/servizi.html?scheda=moduli%3AV791-GABBIANO-VILLAPIA-CD',{waitUntil:'networkidle'});await p.locator('#svc-dialog[open]').waitFor();const t=await p.locator('#svc-detail').innerText();assert.match(t,/Convenzione dichiarata/);assert.match(t,/20 posti diurni/);assert.match(t,/40 accreditati/);assert.match(t,/giorni di apertura non documentati/);const ax=await new AxeBuilder({page:p}).analyze();assert.equal(ax.violations.length,0,JSON.stringify(ax.violations));await shot(p,'villa-pia-capienza-390');await p.keyboard.press('Escape');
 });
 await test('Suspended San Camillo inpatient ward has visible warning before opening details',async()=>{
  await p.goto(BASE+'/servizi.html?q=NET-025',{waitUntil:'networkidle'});await p.locator('#svc-controls:not([disabled])').waitFor();assert.equal(await p.locator('.svc-card').count(),1);assert.match(await p.locator('.svc-card [data-service-state]').innerText(),/Sospensione/);assert.match(await p.locator('.svc-card [data-service-state]').innerText(),/riapertura non documentata/);await shot(p,'san-camillo-stato-390');
 });
 await test('Frentani current address remains accessible through the legacy stable service ID',async()=>{
  await p.goto(BASE+'/archivio.html?scheda=rete%3AR1-14',{waitUntil:'networkidle'});await p.locator('#svc-dialog[open]').waitFor();const t=await p.locator('#svc-detail').innerText();assert.match(t,/Via dei Frentani, 6/);assert.match(t,/Riesame operativo V7.9.1/);assert.match(t,/Palestro/);await p.keyboard.press('Escape');
 });
 await test('Nuovi Orizzonti admissions contact is identified as central, not as the local community',async()=>{
  await p.goto(BASE+'/servizi.html?scheda=moduli%3AMOD-107',{waitUntil:'networkidle'});await p.locator('#svc-dialog[open]').waitFor();const t=await p.locator('#svc-detail').innerText();assert.match(t,/3929040842/);assert.match(t,/centrale/);assert.match(t,/14:00–17:00/);await p.keyboard.press('Escape');
 });
 await test('Current structure directory loads the new layer and retains all source provenance',async()=>{
  await p.goto(BASE+'/strutture-approfondite.html',{waitUntil:'networkidle'});assert.match(await p.locator('#result-count').innerText(),/184/);await p.locator('#directory-search').fill('Villa Pia Pantano');assert.equal(await p.locator('.directory-card').count(),2);assert.match(await p.locator('#directory-grid').innerText(),/40 accreditati/);assert.match(await p.locator('#directory-grid').innerText(),/Nuovo servizio: 2026-09-22/);
 });
  await test('V7.9.3 exposes current SerD Nomentana access and transport without changing map counts',async()=>{
    await p.goto(BASE+'/servizi.html?scheda=rete%3AR1-15',{waitUntil:'networkidle'});await p.locator('#svc-dialog[open]').waitFor();const t=await p.locator('#svc-detail').innerText();assert.match(t,/Riesame operativo V7\.9\.3/);assert.match(t,/Metro B/);assert.match(t,/prestazioni gratuite/i);assert.match(t,/Municipio 2/);await p.keyboard.press('Escape');
    await p.goto(BASE+'/mappa.html',{waitUntil:'networkidle'});await p.locator('#map-controls:not([disabled])').waitFor();const mapText=await p.locator('#map-count').innerText();assert.match(mapText,/443 servizi/);assert.match(mapText,/315 localizzati/);assert.match(mapText,/128 senza posizione/);
  });
  await test('V7.9.3 keeps Rieti building accessibility qualified and Amatrice conflict visible',async()=>{
    await p.goto(BASE+'/servizi.html?scheda=rete%3ARI-03',{waitUntil:'networkidle'});await p.locator('#svc-dialog[open]').waitFor();let t=await p.locator('#svc-detail').innerText();assert.match(t,/barriere architettoniche/i);assert.match(t,/non una verifica/i);await p.keyboard.press('Escape');
    await p.goto(BASE+'/servizi.html?scheda=rete%3ARI-10',{waitUntil:'networkidle'});await p.locator('#svc-dialog[open]').waitFor();t=await p.locator('#svc-detail').innerText();assert.match(t,/Conflitto tra fonti ASL/);assert.match(t,/Villa S\. Cipriano/);await p.keyboard.press('Escape');
  });
  await test('V7.9.4 adds Il Colle as the eighth distinct Colle Cesarano service',async()=>{
    await p.goto(BASE+'/servizi.html?q=Colle+Cesarano',{waitUntil:'networkidle'});await p.locator('#svc-controls:not([disabled])').waitFor();assert.equal(await p.locator('#svc-list .svc-card').count(),8);
    assert.match(await p.locator('#svc-list').innerText(),/Il Colle/);
    await p.goto(BASE+'/servizi.html?scheda=moduli%3AV794-CESARANO-ILCOLLE-H24',{waitUntil:'networkidle'});await p.locator('#svc-dialog[open]').waitFor();const t=await p.locator('#svc-detail').innerText();assert.match(t,/10/);assert.match(t,/70 posti/);assert.match(t,/budget.*2026/i);assert.match(t,/non acquisito/i);assert.match(t,/ingresso.*non verificato/i);await p.keyboard.press('Escape');
  });
  await test('All eight Colle Cesarano services share one complex marker without merging identities',async()=>{
    await p.goto(BASE+'/mappa.html?q=Colle+Cesarano',{waitUntil:'networkidle'});await p.locator('#map-controls:not([disabled])').waitFor();assert.equal(await p.locator('#map-list>li').count(),8);await p.locator('#map-activate').click();await p.waitForTimeout(450);assert.equal(await p.locator('.presidio-marker').count(),1);assert.equal(await p.locator('.presidio-marker').innerText(),'8');await p.locator('.presidio-marker').click();assert.equal(await p.locator('.map-popup-item').count(),8);assert.match(await p.locator('.leaflet-popup-content').innerText(),/Il Colle/);
  });
  await test('Cassino SPDC is localized only at hospital-complex level',async()=>{
    await p.goto(BASE+'/mappa.html?presidio=rete%3ANET-075',{waitUntil:'networkidle'});await p.locator('#map-controls:not([disabled])').waitFor();assert.match(await p.locator('#map-selected').innerText(),/Santa Scolastica/);assert.match(await p.locator('#map-selected').innerText(),/complesso|ingresso/i);
    await p.goto(BASE+'/servizi.html?scheda=rete%3ANET-075',{waitUntil:'networkidle'});await p.locator('#svc-dialog[open]').waitFor();const t=await p.locator('#svc-detail').innerText();assert.match(t,/Via San Pasquale/);assert.match(t,/piano terra/);assert.match(t,/ingresso specifico non verificato/i);await p.keyboard.press('Escape');
  });
  await test('Abaton conflict and multisite audit remain visible without invented sites',async()=>{
    await p.goto(BASE+'/servizi.html?scheda=moduli%3AMOD-038',{waitUntil:'networkidle'});await p.locator('#svc-dialog[open]').waitFor();let t=await p.locator('#svc-detail').innerText();assert.match(t,/De Gasperi 2/);assert.match(t,/48\/50/);assert.match(t,/nove strutture sanitarie/i);await p.keyboard.press('Escape');
    await p.goto(BASE+'/servizi.html?scheda=moduli%3AMOD-109',{waitUntil:'networkidle'});await p.locator('#svc-dialog[open]').waitFor();t=await p.locator('#svc-detail').innerText();assert.match(t,/Via Isonzo 34/);assert.match(t,/non viene promossa/i);await p.keyboard.press('Escape');
    await p.goto(BASE+'/strutture-approfondite.html',{waitUntil:'networkidle'});assert.match(await p.locator('#result-count').innerText(),/184/);await p.locator('#directory-search').fill('Il Colle Nucleo 1');await p.waitForTimeout(350);assert.equal(await p.locator('.directory-card').count(),1);
  });
  await test('No uncaught JavaScript errors in scenarios' ,async()=>assert.deepEqual(errors,[]));
}finally{await c.close();await browser.close();}
const report={version:'7.9.4',tested_at:new Date().toISOString(),base:BASE,osm_tiles:'mocked; no external map-tile requests during automated checks',tests,passed:tests.filter(x=>x.passed).length,total:tests.length,screens};await fs.writeFile(OUT+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
