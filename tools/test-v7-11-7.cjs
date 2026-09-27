'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const v=read('version.json'),overlay=read('data/audit_operativo_v7_11_7.json'),geo=read('data/presidi_geo_v7_11_7.json'),oldGeo=read('data/presidi_geo_v7_11_6.json');
const ctx={URL,URLSearchParams,console,document:{readyState:'loading',addEventListener(){}}};ctx.window=ctx;vm.createContext(ctx);
const load=p=>vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});
load('assets/servizi-data-v7-5-1.js');
for(const [s,t,g] of [['7-9','7_9','79'],['7-9-1','7_9_1','791'],['7-9-2','7_9_2','792'],['7-9-3','7_9_3','793'],['7-9-4','7_9_4','794'],['7-11','7_11','711'],['7-11-1','7_11_1','7111'],['7-11-2','7_11_2','7112'],['7-11-3','7_11_3','7113'],['7-11-4','7_11_4','7114'],['7-11-5','7_11_5','7115'],['7-11-6','7_11_6','7116']]){load('assets/audit-data-v'+s+'.js');ctx['LazioAudit'+g].set(read('data/audit_operativo_v'+t+'.json'));}
const D=read('data/portal_data_v7_3.json'),P=read('data/privati_v7_5.json');D.moduli.push(...read('data/multisede_v7_7_5.json').records);
const before=JSON.parse(JSON.stringify(ctx.LazioServices.build(D,P))),oldBy=Object.fromEntries(before.map(x=>[x.key,x]));
load('assets/audit-data-v7-11-7.js');ctx.LazioAudit7117.set(overlay);
const rows=JSON.parse(JSON.stringify(ctx.LazioServices.build(D,P))),by=Object.fromEntries(rows.map(x=>[x.key,x]));
load('assets/map-data-v7-11-7.js');const G=ctx.LazioMapData;
const tests=[];function check(name,fn){try{fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e.message});}}
const newPins=['rete:NET-082','moduli:MOD-066','moduli:MOD-070'];
check('443 service identities preserved',()=>{assert.equal(rows.length,443);assert.equal(new Set(rows.map(r=>r.key)).size,443);assert.deepEqual(rows.map(r=>r.key),before.map(r=>r.key));assert.equal(overlay.additions.length,0);});
check('V7.11.7 contains nine scoped decisions',()=>{assert.equal(overlay.revisions.length,9);for(const e of overlay.revisions){assert.ok(e.sources.length);assert.ok(Object.keys(e.fields).length);}});
check('All 370 previous positions preserved unless explicitly upgraded',()=>{let n=0;for(const [k,p] of Object.entries(oldGeo.records))if(Number.isFinite(p.lat)&&Number.isFinite(p.lng)){n++;assert.deepEqual(geo.records[k],p,k);}assert.equal(n,370);});
check('Three new positions are usable and no entrance is verified',()=>{for(const k of newPins){const p=geo.records[k];assert.ok(Number.isFinite(p.lat)&&Number.isFinite(p.lng),k);assert.ok(['A','C'].includes(p.quality));assert.equal(p.entrance_verified,false);assert.ok(G.position(by[k],geo),k);}});
check('DNA Frosinone uses updated Palazzina P address and shared street point',()=>{assert.match(by['rete:NET-082'].address,/Palazzina P/);assert.equal(geo.records['rete:NET-082'].shared_coordinate_from,'rete:FR-01');assert.equal(geo.records['rete:NET-082'].quality,'C');});
check('Villa Maddalena has named-structure point but no entrance claim',()=>{const p=geo.records['moduli:MOD-066'];assert.equal(p.precision,'building');assert.equal(p.quality,'C');assert.match(p.note,/ingresso/i);});
check('Legacy Il Colle is reconciled to canonical complex',()=>{assert.equal(by['moduli:MOD-070'].town,'Tivoli');assert.equal(by['moduli:MOD-070'].address,'Via Maremmana Inferiore, 102');assert.equal(geo.records['moduli:MOD-070'].shared_coordinate_from,'moduli:V794-CESARANO-ILCOLLE-H24');assert.equal(geo.records['moduli:MOD-070'].quality,'A');});
check('SerD D4 remains unlocated and explicitly non-actionable',()=>{assert.equal(G.position(by['rete:R2-10'],geo),null);assert.match(by['rete:R2-10'].serviceState,/temporaneamente chiusa/i);});
check('Updated Rieti addresses remain deliberately unlocated',()=>{assert.equal(by['rete:RI-01'].address,'Via del Terminillo, 42');assert.equal(G.position(by['rete:RI-01'],geo),null);assert.match(by['rete:NET-065'].address,/Ortensie/);assert.equal(G.position(by['rete:NET-065'],geo),null);});
check('Runtime coverage is 373 located and 70 unlocated',()=>{assert.equal(rows.filter(r=>G.position(r,geo)).length,373);assert.equal(rows.filter(r=>!G.position(r,geo)).length,70);});
check('Actionable queue has exactly 69 rows and excludes four resolved/non-actionable cases',()=>{const lines=fs.readFileSync('downloads/Coda_Geografia_V7_11_7.csv','utf8').trim().split(/\r?\n/);assert.equal(lines.length-1,69);for(const k of ['rete:NET-082','moduli:MOD-066','moduli:MOD-070','rete:R2-10'])assert(!lines.some(x=>x.startsWith(k+';')));});
check('Manifest and quality counts are coherent',()=>{assert.equal(v.web_version,'7.11.7');assert.equal(v.counts_current.search,443);assert.equal(v.map.localized,373);assert.equal(v.map.unlocated,70);assert.deepEqual(v.map.quality,{D:70,A:29,C:344,E:0});assert.equal(v.map.entrances_verified,0);assert.equal(v.indexing_enabled,false);assert.equal(v.clinical_review,false);});
check('Adapter performs no live network/storage/geolocation',()=>{const s=fs.readFileSync('assets/audit-data-v7-11-7.js','utf8');assert(!/fetch\s*\(|XMLHttpRequest|sendBeacon|geolocation|localStorage|sessionStorage/.test(s));});
const report={version:'7.11.7',tests,passed:tests.filter(x=>x.passed).length,total:tests.length};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
