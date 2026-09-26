'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const v=read('version.json'),overlay=read('data/audit_operativo_v7_11_3.json'),geo=read('data/presidi_geo_v7_11_3.json'),oldGeo=read('data/presidi_geo_v7_11_2.json');
const ctx={URL,URLSearchParams,console,document:{readyState:'loading',addEventListener(){}}};ctx.window=ctx;vm.createContext(ctx);
const load=p=>vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});
load('assets/servizi-data-v7-5-1.js');
for(const [s,t,g] of [['7-9','7_9','79'],['7-9-1','7_9_1','791'],['7-9-2','7_9_2','792'],['7-9-3','7_9_3','793'],['7-9-4','7_9_4','794'],['7-11','7_11','711'],['7-11-1','7_11_1','7111'],['7-11-2','7_11_2','7112']]){load('assets/audit-data-v'+s+'.js');ctx['LazioAudit'+g].set(read('data/audit_operativo_v'+t+'.json'));}
const D=read('data/portal_data_v7_3.json'),P=read('data/privati_v7_5.json');D.moduli.push(...read('data/multisede_v7_7_5.json').records);
const before=JSON.parse(JSON.stringify(ctx.LazioServices.build(D,P))),oldBy=Object.fromEntries(before.map(x=>[x.key,x]));
load('assets/audit-data-v7-11-3.js');ctx.LazioAudit7113.set(overlay);
const rows=JSON.parse(JSON.stringify(ctx.LazioServices.build(D,P))),by=Object.fromEntries(rows.map(x=>[x.key,x]));
load('assets/map-data-v7-11-3.js');const G=ctx.LazioMapData;
const tests=[];function check(name,fn){try{fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e.message});}}
const pins=['rete:FR-10','rete:RI-13','rete:VT-18'];
check('443 service identities preserved',()=>{assert.equal(rows.length,443);assert.equal(new Set(rows.map(r=>r.key)).size,443);assert.deepEqual(rows.map(r=>r.key),before.map(r=>r.key));assert.equal(overlay.additions.length,0);});
check('Three pins plus one address-only revision',()=>{assert.equal(overlay.revisions.length,4);assert.deepEqual(overlay.revisions.filter(x=>x.status==='localizzazione_indicativa').map(x=>x.service_key).sort(),pins.slice().sort());assert.equal(overlay.revisions.filter(x=>x.status==='indirizzo_documentato_non_localizzato').length,1);});
check('RI-14 address updated from regional source without a pin',()=>{assert.equal(by['rete:RI-14'].address,'Viale Maestri del Lavoro, 2');assert.equal(G.position(by['rete:RI-14'],geo),null);assert.match(by['rete:RI-14'].raw.nota_geografia_v7113,/nessun punto/i);});
check('All 350 previous located records preserved exactly',()=>{let n=0;for(const [k,p] of Object.entries(oldGeo.records))if(Number.isFinite(p.lat)&&Number.isFinite(p.lng)){n++;assert.deepEqual(geo.records[k],p,k);}assert.equal(n,350);});
check('Three new C positions are runtime-valid and no entrances are verified',()=>{for(const k of pins){const p=geo.records[k];assert.equal(p.quality,'C');assert.equal(p.precision,'approximate');assert.equal(p.entrance_verified,false);assert(G.position(by[k],geo),k);assert.match(p.source_url,/^https:\/\//);assert.match(p.address_source_url,/^https:\/\//);}});
check('Actual runtime gate yields 353/90',()=>{assert.equal(rows.filter(r=>G.position(r,geo)).length,353);assert.equal(rows.filter(r=>!G.position(r,geo)).length,90);});
check('SerD Ceccano does not inherit civic 52',()=>{assert.equal(by['rete:FR-10'].address,'Borgo Santa Lucia');assert.match(geo.records['rete:FR-10'].note,/non attribuisce.*52/i);});
check('Secondary-coordinate cases explicitly disclose secondary source',()=>{for(const k of ['rete:RI-13','rete:VT-18'])assert.match(geo.records[k].note,/secondaria/i);});
check('Queue contains exactly 90 residual rows',()=>{const lines=fs.readFileSync('downloads/Coda_Geografia_V7_11_3.csv','utf8').trim().split(/\r?\n/);assert.equal(lines.length-1,90);for(const k of pins)assert(!lines.some(x=>x.startsWith(k+';')));assert(lines.some(x=>x.startsWith('rete:RI-14;')&&x.includes('Viale Maestri del Lavoro')));});
check('Manifest and safeguards coherent',()=>{assert.equal(v.web_version,'7.11.3');assert.equal(v.counts_current.search,443);assert.equal(v.map.localized,353);assert.equal(v.map.unlocated,90);assert.deepEqual(v.map.quality,{D:88,A:28,C:325,E:2});assert.equal(v.map.entrances_verified,0);assert.equal(v.indexing_enabled,false);assert.equal(v.clinical_review,false);});
check('Adapter has no live network/storage/geolocation',()=>{const s=fs.readFileSync('assets/audit-data-v7-11-3.js','utf8');assert(!/fetch\s*\(|XMLHttpRequest|sendBeacon|geolocation|localStorage|sessionStorage/.test(s));});
const report={version:'7.11.3',tests,passed:tests.filter(x=>x.passed).length,total:tests.length};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
