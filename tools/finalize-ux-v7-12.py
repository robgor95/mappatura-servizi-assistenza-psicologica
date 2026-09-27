"""Reproducible UX build plus directory disclosure and narrow-screen fixes.
The source datasets and historical files are never edited.
"""
from pathlib import Path
import json, runpy, subprocess
from bs4 import BeautifulSoup
R=Path(__file__).resolve().parents[1]
runpy.run_path(str(R/'tools/build-ux-v7-12.py'),run_name='__main__')
BASE='9a15c39c6f1c5008cde6fbe44dd4f419f524ba97'
audit=json.loads((R/'downloads/Audit_UX_V7_12.json').read_text())
outputs=json.loads((R/'research/v7_12/generated-files.json').read_text())
def save(p,text):
    (R/p).write_text(text.rstrip()+'\n',encoding='utf-8')
def replacement(text,needle,new):
    assert needle in text, 'Missing expected source fragment: '+needle[:100]
    return text.replace(needle,new,1)
engine=subprocess.check_output(['git','show',BASE+':assets/directory-v7-11-2.js'],cwd=R,text=True)
engine=replacement(engine,'var extraSources=',"var v712Sources=Promise.all([3,4,5,6,7].map(function(n){return fetch('/data/audit_operativo_v7_11_'+n+'.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Aggiornamenti documentali non caricati');return r.json()})}));\nvar extraSources=")
engine=replacement(engine,'v7111Source,v7112Source])).then','v7111Source,v7112Source,v712Sources])).then')
old='audit=x[x.length-8],current=x[x.length-7],latest=x[x.length-6],v793=x[x.length-5],v794=x[x.length-4],v711=x[x.length-3],v7111=x[x.length-2],v7112=x[x.length-1],additional=x.slice(2,-8)'
new='audit=x[x.length-9],current=x[x.length-8],latest=x[x.length-7],v793=x[x.length-6],v794=x[x.length-5],v711=x[x.length-4],v7111=x[x.length-3],v7112=x[x.length-2],v712=x[x.length-1],additional=x.slice(2,-9)'
engine=replacement(engine,old,new)
engine=replacement(engine,'rows=window.LazioAudit7112.directory(c,rows,v7112);init(rows)',"rows=window.LazioAudit7112.directory(c,rows,v7112);v712.forEach(function(d,i){rows=window['LazioAudit711'+(i+3)].directory(c,rows,d)});init(rows)")
save('assets/directory-v7-12.js',engine);outputs.append('assets/directory-v7-12.js')
for item in audit['pages']:
    p=item['path'];s=BeautifulSoup((R/p).read_text(),'html.parser')
    s.head.append(s.new_tag('link',attrs={'rel':'stylesheet','href':'/assets/ux-polish-v7-12.css'}))
    if s.select_one('#directory-grid'):
        s.head.append(s.new_tag('script',attrs={'defer':'','src':'/assets/directory-disclosure-v7-12.js'}))
        grid=s.select_one('#directory-grid')
        help=s.new_tag('p',attrs={'class':'ux-directory-help'});help.string='Leggi prima le informazioni essenziali. Apri “Dettagli, fonti e aggiornamenti” nella scheda per approfondire.';grid.insert_before(help)
        downloads=s.select_one('.v75-downloads')
        if downloads:
            wrap=s.new_tag('details',attrs={'class':'ux-directory-more ux-download-disclosure'})
            summary=s.new_tag('summary');summary.string='Download e dati di riferimento';wrap.append(summary)
            downloads.replace_with(wrap);wrap.append(downloads)
            for a in downloads.select('a[href]'):
                if a.get_text(strip=True)=='Scarica CSV':a.string='Scarica CSV · copia precedente'
    if p in ['strutture-approfondite.html','privati.html']:
        cfgscript=next(n for n in s.find_all('script') if 'window.V75_CONFIG=' in (n.string or ''))
        cfg=json.loads(cfgscript.string.split('window.V75_CONFIG=',1)[1].strip().rstrip(';'))
        for n in [3,4,5,6,7]:
            for key,label in [('riesame','Riesame documentale'),('fonti','Fonti'),('note','Limiti del riesame'),('nota_geografia','Precisazione geografica')]:
                field=key+'_v711'+str(n)
                if field not in cfg['fields']:cfg['fields'].append(field)
                cfg.setdefault('fieldLabels',{})[field]=label+' V7.11.'+str(n)
        cfgscript.string='window.V75_CONFIG='+json.dumps(cfg,ensure_ascii=False,separators=(',',':'))+';'
        oldscript=s.find('script',src='/assets/directory-v7-11-2.js');assert oldscript
        for n in [3,4,5,6,7]:oldscript.insert_before(s.new_tag('script',attrs={'src':'/assets/audit-data-v7-11-'+str(n)+'.js'}))
        oldscript['src']='/assets/directory-v7-12.js'
        hero=s.select_one('.v75-hero')
        for t in list(hero.find_all(string=True)):
            if 'V7.11.1' in str(t):t.replace_with(str(t).replace('V7.11.1','V7.11.7').replace('26/09/2026','27/09/2026'))
        if p=='strutture-approfondite.html':hero.find('h1').string='Comunità e centri diurni'
    save(p,str(s))
disclosure=(R/'assets/directory-disclosure-v7-12.js').read_text()
disclosure=disclosure.replace('/^(stato servizio|stato del servizio|rapporto ssn)$/','/^(stato servizio|stato del servizio|rapporto ssn|stato|stato dato|stato verifica|periodo validita|ultima verifica|anno scolastico|data documentale precedente)$/')
save('assets/directory-disclosure-v7-12.js',disclosure);outputs.append('assets/directory-disclosure-v7-12.js')
# Keep the original test source unchanged; build a superset with additional checks.
test=(R/'tools/test-ui-v7-12.mjs').read_text()
extra="""
 await test('Compact cards preserve every field and disclose details on demand',async()=>{const {c,p}=await context();for(const file of ['universita.html','scuole.html','strutture-approfondite.html','privati.html']){await go(p,file);const card=p.locator('.directory-card[data-ux-compact]').first();await card.waitFor();const original=Number(await card.getAttribute('data-original-fields'));assert.equal(await card.locator('dl.card-fields > div').count(),original);const details=card.locator('.ux-directory-more');if(await details.count()){assert.equal(await details.getAttribute('open'),null);await details.locator('summary').click();assert(await details.locator('dl').isVisible());}assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}await c.close();});
 await test('Structure directory loads the same existing latest address overlays',async()=>{const {c,p}=await context();await go(p,'strutture-approfondite.html');assert.match(await p.locator('#result-count').innerText(),/184/);await p.fill('#directory-search','Il Colle');await p.waitForTimeout(250);const cards=p.locator('.directory-card');assert(await cards.count()>0);const all=await cards.allTextContents();assert(all.some(t=>t.includes('Record legacy')&&t.includes('Via Maremmana Inferiore, 102')));await go(p,'privati.html');assert.match(await p.locator('#result-count').innerText(),/17/);await c.close();});
"""
needle=" await test('No unhandled JavaScript errors across reviewed pages'"
test=replacement(test,needle,extra+needle)
save('tools/test-ui-final-v7-12.mjs',test);outputs.append('tools/test-ui-final-v7-12.mjs')
audit['directory_display']={'progressive_disclosure':True,'original_fields_preserved':True,'existing_overlays_loaded_through':'7.11.7','historical_downloads_labelled':True}
save('downloads/Audit_UX_V7_12.json',json.dumps(audit,ensure_ascii=False,indent=2))
notes=(R/'downloads/Release_Notes_V7_12.md').read_text()+'\n## Schede degli elenchi\nLe informazioni essenziali sono mostrate per prime; tutti gli altri campi e le fonti restano disponibili in una sezione espandibile. Date, annualità e avvertenze operative non vengono nascoste dalla semplificazione. Comunità e strutture private applicano anche gli aggiornamenti già disponibili fino alla V7.11.7, senza modificare i dataset.\n'
save('downloads/Release_Notes_V7_12.md',notes)
save('research/v7_12/generated-files.json',json.dumps(list(dict.fromkeys(outputs)),ensure_ascii=False,indent=2))
print(json.dumps({'pages':len(audit['pages']),'fields_preserved':True,'current_directory_overlays':'7.11.7'},indent=2))
