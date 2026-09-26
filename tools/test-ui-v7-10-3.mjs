import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const BASE=(process.env.QA_BASE||'http://127.0.0.1:8123').replace(/\/$/,'');
const OUT=process.env.QA_OUT||'/tmp/v7103-ui';await fs.mkdir(OUT,{recursive:true});
const tests=[];async function test(name,fn){try{await fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e.message});}}
const browser=await chromium.launch({headless:true});const c=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'});const p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
try{
 await test('home exposes student entry without mobile overflow',async()=>{await p.goto(BASE+'/',{waitUntil:'networkidle'});const entry=p.locator('.student-entry');assert(await entry.isVisible());assert.match(await entry.innerText(),/Sei uno studente\?/);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);assert.equal(await entry.locator('a[href="/studenti.html"]').count(),1);});
 await test('student hub has four clear routes',async()=>{await p.goto(BASE+'/studenti.html',{waitUntil:'networkidle'});assert.equal(await p.locator('h1').innerText(),'Sei uno studente?');assert.equal(await p.locator('.student-path-card').count(),4);for(const href of ['/universita.html','/scuole.html','/servizi.html','/ascolto.html'])assert.equal(await p.locator('.student-path-card[href="'+href+'"]').count(),1);});
 await test('generic Menta student query points to hub',async()=>{await p.goto(BASE+'/',{waitUntil:'networkidle'});await p.fill('#menta-query','sono uno studente');await p.click('#menta-submit');await p.locator('#menta-results:not([hidden])').waitFor();const hrefs=await p.locator('#menta-options a').evaluateAll(xs=>xs.map(x=>x.getAttribute('href')));assert(hrefs.some(x=>x==='/studenti.html'));});
 await test('explicit university query still points directly to university directory',async()=>{await p.fill('#menta-query','sono uno studente universitario');await p.click('#menta-submit');await p.locator('#menta-results:not([hidden])').waitFor();const href=await p.locator('#menta-options a').first().getAttribute('href');assert.equal(href,'/universita.html');});
 await test('student hub mobile accessibility has no axe violations',async()=>{await p.goto(BASE+'/studenti.html',{waitUntil:'networkidle'});const a=await new AxeBuilder({page:p}).analyze();assert.equal(a.violations.length,0,JSON.stringify(a.violations));});
 await test('student path does not alter current service counts',async()=>{await p.goto(BASE+'/servizi.html',{waitUntil:'networkidle'});await p.locator('#svc-controls:not([disabled])').waitFor();assert.match(await p.locator('#svc-count').innerText(),/443/);});
 await test('no uncaught JavaScript errors',async()=>assert.deepEqual(errors,[]));
}finally{await c.close();await browser.close();}
const report={version:'7.10.3',base:BASE,tests,passed:tests.filter(x=>x.passed).length,total:tests.length};await fs.writeFile(path.join(OUT,'student-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
