#!/usr/bin/env python3
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'assets/network-v7-18.css';s=p.read_text().replace('--ng-teal:#087e85','--ng-teal:#08676f');p.write_text(s)
p=ROOT/'tools/test-network-v7-18.mjs';s=p.read_text()
s=s.replace("await p.goto(BASE+'/orientati.html',{waitUntil:'networkidle'});await p.locator('#menta-query:not([disabled])').waitFor();", "await p.goto(BASE+'/orientati.html',{waitUntil:'networkidle'});await p.locator('#orientation-custom > summary').click();await p.locator('#menta-query:not([disabled])').waitFor();")
# Each page reports independently so one styling failure does not prevent the rest of the audit.
s=s.replace("await p.goto(BASE+'/'+page,{waitUntil:'networkidle'});if(page==='servizi.html')", "await test('Public page '+page+' at '+width+'px',async()=>{await p.goto(BASE+'/'+page,{waitUntil:'networkidle'});if(page==='servizi.html')")
s=s.replace("fullPage:page==='index.html'||page==='network-giovani.html'});\n }await c.close();}", "fullPage:page==='index.html'||page==='network-giovani.html'});\n });}await c.close();}")
p.write_text(s)
# All generated pages expose the actual current navigation version.
for p in [*ROOT.glob('*.html'),*ROOT.glob('guide/*.html')]:
 if p.name=='archivio.html':continue
 s=p.read_text()
 if 'ng-site' in s:s=s.replace('data-navigation-version="7.12.1"','data-navigation-version="7.18"');p.write_text(s)
print('Contrasto e percorso tastiera Menta corretti; tutte le pagine vengono collaudate indipendentemente.')
