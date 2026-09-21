import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';

const BASE='https://mappatura-servizi-assistenza-psicologica.pages.dev';
const report={version:'7.7.4',audited_at:new Date().toISOString(),production:BASE,scenarios:[],page_metrics:[],accessibility:[],observations:[]};
await fs.mkdir('ux-audit-artifacts',{recursive:true});

async function newPage(browser,width=390,height=844){
  const ctx=await browser.newContext({viewport:{width,height},locale:'it-IT',reducedMotion:'reduce'});
  const page=await ctx.newPage();
  page.setDefaultTimeout(15000);
  return {ctx,page};
}
async function screenshot(page,name,fullPage=false){
  const path='ux-audit-artifacts/'+name+'.png';
  await page.screenshot({path,fullPage});
  return path;
}
async function axe(page,label){
  const res=await new AxeBuilder({page}).analyze();
  report.accessibility.push({label,violations:res.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length,help:v.help}))});
}
async function visibleText(page){ return await page.locator('body').innerText(); }
async function linkTexts(page,selector='a'){
  return await page.locator(selector).evaluateAll(els=>els.filter(e=>{
    const s=getComputedStyle(e), r=e.getBoundingClientRect();
    return s.visibility!=='hidden'&&s.display!=='none'&&r.width>0&&r.height>0;
  }).map(e=>({text:(e.innerText||e.textContent||'').trim().replace(/\s+/g,' '),href:e.getAttribute('href')})));
}
async function box(page,sel){
  const b=await page.locator(sel).boundingBox();
  return b?{x:Math.round(b.x),y:Math.round(b.y),width:Math.round(b.width),height:Math.round(b.height)}:null;
}
function addObs(severity,page,title,evidence,recommendation){ report.observations.push({severity,page,title,evidence,recommendation}); }

const browser=await chromium.launch({headless:true});
try{
  {
    const {ctx,page}=await newPage(browser,390,844);
    await page.goto(BASE+'/',{waitUntil:'networkidle'});
    await page.locator('#menta-query').waitFor({state:'visible'});
    report.page_metrics.push({
      page:'home-mobile',viewport:'390x844',
      menta:await box(page,'#menta'),start:await box(page,'.home-start'),
      situations:await box(page,'#esplora'),resources:await box(page,'#risorse'),
      links_visible_initial:(await linkTexts(page)).filter(x=>x.text).length
    });
    await screenshot(page,'home-390-top',false);
    await axe(page,'home-390');
    await ctx.close();
  }

  {
    const {ctx,page}=await newPage(browser,390,844);
    await page.goto(BASE+'/',{waitUntil:'networkidle'});
    await page.locator('#nav-toggle').click();
    const top=await linkTexts(page,'#site-navigation a');
    await page.locator('#nav-more summary').click();
    const all=await linkTexts(page,'#site-navigation a');
    await screenshot(page,'menu-390',false);
    report.scenarios.push({id:'mobile-menu',goal:'Capire le principali sezioni da smartphone',interactions:2,primary_links:top.map(x=>x.text),all_links:all.map(x=>x.text),secondary_link_count:all.length-top.length});
    await axe(page,'mobile-menu-open-390');
    await ctx.close();
  }

  {
    const {ctx,page}=await newPage(browser,390,844);
    await page.goto(BASE+'/',{waitUntil:'networkidle'});
    await page.locator('#menta-query').fill('cerco un CSM a Viterbo');
    await page.locator('#menta-submit').click();
    await page.locator('#menta-results').waitFor({state:'visible'});
    const options=await linkTexts(page,'#menta-options a');
    await screenshot(page,'menta-csm-viterbo-390',false);
    if(options[0]){
      await Promise.all([page.waitForURL(/servizi\.html/),page.locator('#menta-options a').first().click()]);
      await page.locator('#svc-list .svc-card').first().waitFor({state:'visible'});
      const count=(await page.locator('#svc-count').innerText()).trim();
      const cards=await page.locator('#svc-list .svc-card').count();
      await page.locator('#svc-list .svc-card a[data-open]').first().click();
      await page.locator('#svc-dialog').waitFor({state:'visible'});
      const detailHead=(await page.locator('#svc-detail-title').innerText()).trim();
      await screenshot(page,'service-detail-csm-viterbo-390',false);
      report.scenarios.push({id:'csm-viterbo',goal:'Trovare un CSM a Viterbo e aprire i contatti',interactions:3,menta_options:options,resulting_url:page.url(),result_count_text:count,cards_on_page:cards,opened_service:detailHead});
    }
    await ctx.close();
  }

  {
    const {ctx,page}=await newPage(browser,390,844);
    await page.goto(BASE+'/',{waitUntil:'networkidle'});
    await page.locator('#menta-query').fill('psicologo per adolescente');
    await page.locator('#menta-submit').click();
    await page.locator('#menta-results').waitFor({state:'visible'});
    const opts=await linkTexts(page,'#menta-options a');
    const directChildHref=await page.locator('.home-situations-grid a').filter({hasText:'Bambini e adolescenti'}).getAttribute('href');
    await screenshot(page,'menta-adolescente-390',false);
    report.scenarios.push({id:'adolescent-ambiguity',goal:'Capire dove cercare supporto per un adolescente',interactions:1,menta_choices:opts,home_situation_direct_target:directChildHref});
    await axe(page,'menta-adolescent-choices-390');
    await ctx.close();
  }

  {
    const {ctx,page}=await newPage(browser,390,844);
    await page.goto(BASE+'/',{waitUntil:'networkidle'});
    await page.locator('#menta-query').fill('suicidio');
    await page.locator('#menta-urgent').waitFor({state:'visible'});
    const urgent=(await page.locator('#menta-urgent').innerText()).trim().replace(/\s+/g,' ');
    const calls=await linkTexts(page,'#menta-urgent a');
    report.scenarios.push({id:'crisis',goal:'Riconoscere immediatamente una possibile emergenza',interactions:0,response_immediate_on_typing:true,call_links:calls,text_excerpt:urgent.slice(0,500)});
    await screenshot(page,'menta-emergency-390',false);
    await ctx.close();
  }

  {
    const {ctx,page}=await newPage(browser,390,844);
    await page.goto(BASE+'/',{waitUntil:'networkidle'});
    const card=page.locator('.home-situations-grid a').filter({hasText:'Studenti e università'});
    await Promise.all([page.waitForURL(/studenti\.html/),card.click()]);
    const studentLinks=await linkTexts(page,'main a');
    const primary=studentLinks.filter(x=>/universit|scuol/i.test(x.text)).slice(0,10);
    await screenshot(page,'studenti-390',false);
    report.scenarios.push({id:'student',goal:'Trovare supporto psicologico per uno studente',interactions_to_student_hub:1,relevant_links:primary});
    await axe(page,'studenti-390');
    await ctx.close();
  }

  {
    const {ctx,page}=await newPage(browser,390,844);
    await page.goto(BASE+'/',{waitUntil:'networkidle'});
    const card=page.locator('.home-situations-grid a').filter({hasText:'Psicologo o psicoterapeuta privato'});
    await Promise.all([page.waitForURL(/guide\/privato\.html/),card.click()]);
    const headings=await page.locator('main h1, main h2, main h3').evaluateAll(es=>es.slice(0,20).map(e=>(e.textContent||'').trim()));
    report.scenarios.push({id:'private-professional',goal:'Capire come scegliere uno psicologo/psicoterapeuta privato',interactions:1,page_url:page.url(),first_headings:headings});
    await screenshot(page,'guide-privato-390',false);
    await ctx.close();
  }

  for(const spec of [[390,844,'390'],[1440,1000,'1440']]){
    const width=spec[0],height=spec[1],label=spec[2];
    const {ctx,page}=await newPage(browser,width,height);
    await page.goto(BASE+'/servizi.html',{waitUntil:'networkidle'});
    await page.locator('#svc-controls:not([disabled])').waitFor({state:'attached'});
    const metrics={
      page:'servizi-'+label,viewport:width+'x'+height,
      intro:await box(page,'.svc-intro'),search:await box(page,'#ricerca'),results:await box(page,'#risultati'),
      service_heading:(await page.locator('#svc-title').innerText()).trim().replace(/\s+/g,' '),
      has_actual_map:(await page.locator('iframe[src*="map"], [class*="mapbox"], [class*="leaflet"], #map, .map').count())>0,
      province_label:(await page.locator('label[for="svc-provincia"]').innerText()).trim(),
      advanced_asl_label:(await page.locator('label[for="svc-asl"]').innerText()).trim(),
      empty_reset_label:(await page.locator('#svc-reset-empty').innerText()).trim()
    };
    report.page_metrics.push(metrics);
    if(label==='390') await screenshot(page,'servizi-390-top',false);
    await axe(page,'servizi-'+label);
    await ctx.close();
  }

  const scanPages=['/','/servizi.html','/studenti.html','/universita.html','/scuole.html','/ascolto.html','/guide/index.html','/guide/privato.html','/orientamento-servizi.html','/documenti.html'];
  const terms=['dataset','record','nodi','moduli','riesame','versione','v7.'];
  for(const path of scanPages){
    const {ctx,page}=await newPage(browser,390,844);
    await page.goto(BASE+path,{waitUntil:'networkidle'});
    const text=(await visibleText(page)).toLowerCase();
    const found={};
    for(const term of terms){
      const re=new RegExp(term.replace('.','\\.'),'g');
      const n=(text.match(re)||[]).length;
      if(n) found[term]=n;
    }
    report.page_metrics.push({page:'wording:'+path,technical_terms_visible:found});
    await ctx.close();
  }

  {
    const {ctx,page}=await newPage(browser,390,844);
    await page.goto(BASE+'/documenti.html',{waitUntil:'networkidle'});
    const details=await page.locator('main details').evaluateAll(ds=>ds.map(d=>({summary:(d.querySelector('summary')?.textContent||'').trim(),open:d.open})));
    report.scenarios.push({id:'documents',goal:'Trovare una guida senza entrare nei dettagli tecnici',details});
    await screenshot(page,'documenti-390',false);
    await axe(page,'documenti-390');
    await ctx.close();
  }

  const adolescent=report.scenarios.find(x=>x.id==='adolescent-ambiguity');
  if(adolescent && adolescent.menta_choices.length>=3 && /TSMREE/.test(adolescent.home_situation_direct_target||'')){
    addObs('alta','Home — Esplora per situazione','Il percorso “Bambini e adolescenti” è più prescrittivo di Menta','Menta offre più alternative per “psicologo per adolescente”, mentre la card della home porta direttamente al solo filtro TSMREE/NPIA.','Far aprire una pagina/area di scelta per età evolutiva o mostrare 3–4 alternative, invece di un unico filtro.');
  }
  const svc390=report.page_metrics.find(x=>x.page==='servizi-390');
  if(svc390 && /Mappa dei servizi/i.test(svc390.service_heading) && !svc390.has_actual_map){
    addObs('media','Trova un servizio','Il titolo “Mappa dei servizi” suggerisce una mappa geografica che non c’è','La pagina è una directory con ricerca e filtri; nel DOM non risulta un componente cartografico.','Usare “Trova un servizio” o “Cerca tra i servizi di salute mentale nel Lazio” come H1.');
  }
  if(svc390 && /Provincia.*territorio ASL/i.test(svc390.province_label) && /ASL/.test(svc390.advanced_asl_label)){
    addObs('media','Trova un servizio — Filtri','Provincia e territorio ASL sono mescolati in un filtro, mentre ASL compare di nuovo tra i filtri avanzati','Filtro principale: '+svc390.province_label+'; filtro avanzato: '+svc390.advanced_asl_label+'.','Rinominare il filtro principale semplicemente “Provincia” e lasciare “ASL / territorio” come filtro separato.');
  }
  if(svc390 && /schede/i.test(svc390.empty_reset_label)){
    addObs('bassa','Trova un servizio — Nessun risultato','Resta il termine tecnico “schede” in un’azione destinata all’utente','Il pulsante di reset usa “'+svc390.empty_reset_label+'”.','Cambiare in “Mostra tutti i servizi” o “Azzera i filtri”.');
  }
  const menu=report.scenarios.find(x=>x.id==='mobile-menu');
  if(menu && menu.all_links.some(x=>/Studenti: università e scuole/.test(x)) && menu.all_links.some(x=>/^Università$/.test(x)) && menu.all_links.some(x=>/Sportelli scolastici/.test(x))){
    addObs('media','Menu — Altro','La sezione studenti è duplicata con le due destinazioni che contiene','Nel menu compaiono “Studenti: università e scuole”, “Università” e “Sportelli scolastici”.','Tenere Università e Scuole come accessi diretti oppure solo il contenitore Studenti, evitando tutte e tre le voci insieme.');
  }
  if(menu && menu.secondary_link_count>=9){
    addObs('bassa','Menu — Altro','“Altro” contiene molte opzioni secondarie','Dopo l’apertura sono disponibili '+menu.secondary_link_count+' collegamenti aggiuntivi.','Ridurre il menu secondario alle destinazioni più usate e spostare metodo/download nel footer, dove sono già presenti.');
  }
  const docsW=report.page_metrics.find(x=>x.page==='wording:/documenti.html');
  if(docsW && Object.keys(docsW.technical_terms_visible).length){
    addObs('bassa','Documenti e download','La pagina tecnica contiene ancora molto linguaggio di versione/dataset',JSON.stringify(docsW.technical_terms_visible),'È accettabile nella documentazione tecnica, ma mantenere questa pagina fuori dai percorsi primari e noindex come già configurato.');
  }

  report.summary={
    scenarios:report.scenarios.length,
    observations:report.observations.length,
    high:report.observations.filter(x=>x.severity==='alta').length,
    medium:report.observations.filter(x=>x.severity==='media').length,
    low:report.observations.filter(x=>x.severity==='bassa').length,
    axe_violations:report.accessibility.reduce((n,x)=>n+x.violations.length,0)
  };
  await fs.writeFile('ux-audit-artifacts/report.json',JSON.stringify(report,null,2));
} finally {
  await browser.close();
}
console.log(JSON.stringify(report.summary,null,2));
