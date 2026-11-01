import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const BASE='https://mappamenta.altervista.org';
const OUT='/tmp/sml-staging-browser';
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
async function check(label,fun) {
  try {await fun();results.push({label,passed:true});console.log('PASS',label);}
  catch(e){results.push({label,passed:false,error:String(e.message)});console.log('FAIL',label,String(e.message).slice(0,700));}
}
async function context(width){
  const c=await browser.newContext({viewport:{width,height:960},reducedMotion:'reduce'});
  await c.route('**/*', r=>{
    const url=r.request().url();
    if (url.startsWith(BASE+'/') || url.startsWith('data:') || url.startsWith('blob:')) return r.continue();
    return r.abort(); // No optional external OSM tile requests, trackers or third-party dependencies.
  });
  const p=await c.newPage();
  p.setDefaultTimeout(25000);
  const errors=[];
  p.on('pageerror',e=>errors.push(String(e.message)));
  return {c,p,errors};
}
const audits=[];
try {
  for (const width of [390,1366]) {
    const {c,p,errors}=await context(width);
    for (const [path,id] of [['/','main'],['/servizi.html','svc-form'],['/mappa.html','map-controls'],['/orientati.html','menta-query']]) {
      await check(width+' browser page '+path,async()=>{
        const r=await p.goto(BASE+path,{waitUntil:'domcontentloaded',timeout:45000});
        assert.equal(r?.status(),200);
        assert.match(String(r.headers()['x-robots-tag']||''),/noindex/i);
        await p.locator('#'+id).waitFor({state:'attached'});
        if(path==='/servizi.html')await p.locator('#svc-controls:not([disabled])').waitFor({timeout:35000});
        if(path==='/mappa.html')await p.locator('#map-controls:not([disabled])').waitFor({timeout:35000});
        await p.waitForTimeout(1200);
        const pageWidth=await p.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth}));
        assert(pageWidth.scrollWidth<=pageWidth.innerWidth+2,JSON.stringify(pageWidth));
        const title=await p.title();assert(title.length>5);
        await p.screenshot({path:OUT+'/'+width+'-'+path.replaceAll('/','_')+'.png',fullPage:false});
      });
    }
    await check(width+' search and service card interaction',async()=>{
      await p.goto(BASE+'/servizi.html',{waitUntil:'domcontentloaded'});
      await p.locator('#svc-controls:not([disabled])').waitFor({timeout:35000});
      assert.match(await p.locator('#svc-count').innerText(),/443/);
      await p.selectOption('#svc-tipo','CSM');
      await p.waitForTimeout(500);
      assert((await p.locator('.svc-card').count())>0,'no CSM results');
      assert.equal(new URL(p.url()).searchParams.get('tipo'),'CSM');
      await p.locator('#svc-reset').click();
      await p.waitForTimeout(300);
      assert.match(await p.locator('#svc-count').innerText(),/443/);
    });
    await check(width+' Menta orientation (local interaction)',async()=>{
      await p.goto(BASE+'/orientati.html',{waitUntil:'domcontentloaded'});
      await p.locator('#menta-query:not([disabled])').waitFor({timeout:25000});
      await p.locator('#menta-query').fill('università');
      await p.locator('#menta-submit').click();
      await p.locator('#menta-results:not([hidden])').waitFor({timeout:15000});
      assert((await p.locator('#menta-options a[href="/universita.html"]').count())>0,'university orientation link missing');
    });
    await check(width+' map service counters',async()=>{
      await p.goto(BASE+'/mappa.html',{waitUntil:'domcontentloaded'});
      await p.locator('#map-controls:not([disabled])').waitFor({timeout:35000});
      const count=await p.locator('#map-count').innerText();
      assert.match(count,/443/);
      assert.match(count,/379/);
      assert((await p.locator('#map-canvas').count())===1);
    });
    await check(width+' no uncaught JavaScript errors',()=>{
      assert.deepEqual(errors,[]);
    });
    audits.push({width,errorCount:errors.length});
    await c.close();
  }
}finally{
  await browser.close();
}
await fs.writeFile(OUT+'/report.json',JSON.stringify({tests:results,audits},null,2));
console.log('SUMMARY',JSON.stringify({passed:results.filter(x=>x.passed).length,failed:results.filter(x=>!x.passed).length}));
if(results.some(x=>!x.passed))process.exitCode=1;
