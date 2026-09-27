/* Regression for decorative pseudo-elements escaping a static mascot box. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
const BASE=(process.env.QA_BASE||'http://127.0.0.1:8123').replace(/\/$/,'');
const OUT=process.env.QA_OUT||'/tmp/ux-v7121-verification/browser';
await fs.mkdir(OUT,{recursive:true});
const tests=[];
const browser=await chromium.launch({headless:true});
try {
 for(const width of [1440,1100,390]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  const external=[],errors=[];
  await context.route('**/*',route=>{
   const url=route.request().url();
   if(url.startsWith(BASE)||url.startsWith('data:'))route.continue();
   else{external.push(url);route.abort();}
  });
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(BASE+'/orientati.html',{waitUntil:'networkidle'});
   if(width>1000){
    const mascot=page.locator('.menta-home > .menta-welcome');
    const dimensions=await mascot.evaluate(e=>{
     const s=getComputedStyle(e),p=getComputedStyle(e,'::before'),r=e.getBoundingClientRect();
     return {position:s.position,width:r.width,height:r.height,pseudoWidth:parseFloat(p.width),pseudoHeight:parseFloat(p.height),pointerEvents:p.pointerEvents};
    });
    assert.equal(dimensions.position,'relative','The pseudo-element must be positioned relative to the mascot');
    assert(dimensions.width>0&&dimensions.width<=155);
    assert(dimensions.pseudoWidth>0&&dimensions.pseudoWidth<=dimensions.width+2,JSON.stringify(dimensions));
    assert(dimensions.pseudoHeight>0&&dimensions.pseudoHeight<=dimensions.height+2,JSON.stringify(dimensions));
    assert.equal(dimensions.pointerEvents,'none');
   }
   for(const id of ['percorso-ascolto','percorso-studenti','percorso-servizi']){
    const card=page.locator('#'+id),summary=card.locator('summary');
    await summary.scrollIntoViewIfNeeded();
    assert(await summary.evaluate(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return hit===e||e.contains(hit);}),id+' is obscured by another layer');
    await summary.click();assert(await card.locator('.ux-need-body a').isVisible());await summary.click();
   }
   await page.locator('#orientation-custom > summary').click();
   assert(await page.locator('#menta-query').isVisible());
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
   await page.locator('#orientation-custom > summary').click();
   await page.screenshot({path:OUT+'/'+width+'-orientation-layer-verified.png',fullPage:true});
   tests.push({name:'Mascot decoration contained and topics actionable at '+width,passed:true});
  }catch(e){tests.push({name:'Mascot decoration contained and topics actionable at '+width,passed:false,error:e.message});}
  finally{await context.close();}
 }
}finally{await browser.close();}
const report={version:'7.12.1',base:BASE,tested_at:new Date().toISOString(),tests,passed:tests.filter(t=>t.passed).length,total:tests.length};
await fs.writeFile(OUT+'/mascot-layer-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(report.passed!==report.total)process.exitCode=1;
