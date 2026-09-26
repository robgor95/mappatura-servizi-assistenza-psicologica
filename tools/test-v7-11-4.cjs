'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const v=read('version.json'),overlay=read('data/audit_operativo_v7_11_4.json'),geo=read('data/presidi_geo_v7_11_4.json'),oldGeo=read('data/presidi_geo_v7_11_3.json');
const ctx={URL,URLSearchParams,console,document:{readyState:'loading',addEventListener(){}}};ctx.window=ctx;vm.createContext(ctx);
const load=p=>vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});
load('assets/servizi-data-v7-5-1.js');
for(const [s,t,g] of [['7-9','7_9','79'],['7-9-1','7_9_1','791'],['7-9-2','7_9_2','792'],['7-9-3','7_9_3','793'],['7-9-4','7_9_4','794'],['7-11','7_11','711'],['7-11-1','7_11_1','7111'],['7-11-2','7_11_2','7112'],['7-11-3','7_11_3','7113']]){load('assets/audit-data-v'+s+'.js');ctx['LazioAudit'+g].set(read('data/audit_operativo_v'+t+'.json'));}
const D=read('data/portal_data_v7_3.json'),P=read('data/privati_v7_5.json');D.moduli.push(...read('data/multisede_v7_7_5.json').records);
const before=JSON.parse(JSON.stringify(ctx.LazioServices.build(D,P))),oldBy=Object.fromEntries(before.map(x=>[x.key,x]));
load('assets/audit-data-v7-11-4.js');ctx.LazioAudit7114.set(overlay);
const rows=JSON.parse(JSON.stringify(ctx.LazioServices.build(D,P))),by=Object.fromEntries(rows.map(x=>[x.key,x]));
load('assets/map-data-v7-11-4.js');const G=ctx.LazioMapData;
const tests=[];function check(name,fn){try{fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e.message});}}
const keys=['rete:VT-01','rete:NET-073','rete:VT-04','rete:VT-08','rete:VT-13','rete:VT-15'];
check('443 service identities preserved',()=>{assert.equal(rows.length,443);assert.equal(new Set(rows.map(r=>r.key)).size,443);assert.deepEqual(rows.map(r=>r.key),before.map(r=>r.key));assert.equal(overlay.additions.length,0);});
check('Six scoped geography revisions only',()=>{assert.equal(overlay.revisions.length,6);assert.deepEqual(overlay.revisions.map(x=>x.service_key).sort(),keys.slice().sort());for(const e of overlay.revisions)for(const k of Object.keys(e.fields))assert(['indirizzo','nota_geografia_v7114'].includes(k));});
check('DSM and DNA acquire Via Enrico Fermi 15 only',()=>{for(const k of ['rete:VT-01','rete:NET-073'])assert.equal(by[k].address,'Via Enrico Fermi, 15');for(const k of keys.filter(x=>!['rete:VT-01','rete:NET-073'].includes(x)))assert.equal(by[k].address,oldBy[k].address);});
check('All 353 previous located records are preserved exactly',()=>{let n=0;for(const [k,p] of Object.entries(oldGeo.records))if(Number.isFinite(p.lat)&&Number.isFinite(p.lng)){n++;assert.deepEqual(geo.records[k],p,k);}assert.equal(n,353);});
check('Six new C positions use official embedded-map evidence',()=>{assert.equal(new Set(keys.map(k=>geo.records[k].lat+','+geo.records[k].lng)).size,5);const counts={};for(const k of keys){const p=geo.records[k];counts[p.precision]=(counts[p.precision]||0)+1;assert.equal(p.quality,'C');assert.equal(p.entrance_verified,false);assert.match(p.source_url,/^https:\/\/www\.asl\.vt\.it\//);assert.match(p.embedded_map_url,/^https:\/\/www\.google\.com\/maps\/embed/);assert(G.position(by[k],geo),k);}assert.deepEqual(counts,{building:2,street:2,approximate:1,address:1});});
check('Runtime coverage is 359 located and 84 unlocated',()=>{assert.equal(rows.filter(r=>G.position(r,geo)).length,359);assert.equal(rows.filter(r=>!G.position(r,geo)).length,84);});
check('DSM and DNA remain distinct despite one shared complex point',()=>{assert.notEqual(by['rete:VT-01'].key,by['rete:NET-073'].key);assert.equal(geo.records['rete:VT-01'].lat,geo.records['rete:NET-073'].lat);assert.match(geo.records['rete:NET-073'].note,/2° piano|complesso/i);});
check('No new note claims a verified physical entrance',()=>{for(const k of keys){const p=geo.records[k];assert(!/ingresso fisico verificato(?!.*non)/i.test(p.note));assert(/indicativ|non ingresso|non certifica|complesso|via|piazza/i.test(p.note));}});
check('Residual queue has exactly 84 rows',()=>{const lines=fs.readFileSync('downloads/Coda_Geografia_V7_11_4.csv','utf8').trim().split(/\r?\n/);assert.equal(lines.length-1,84);for(const k of keys)assert(!lines.some(x=>x.startsWith(k+';')));});
check('Manifest and privacy safeguards remain coherent',()=>{assert.equal(v.web_version,'7.11.4');assert.equal(v.counts_current.search,443);assert.equal(v.map.localized,359);assert.equal(v.map.unlocated,84);assert.deepEqual(v.map.quality,{D:82,A:28,C:331,E:2});assert.equal(v.map.entrances_verified,0);assert.equal(v.indexing_enabled,false);assert.equal(v.clinical_review,false);});
check('New adapter performs no network, storage or geolocation actions',()=>{const s=fs.readFileSync('assets/audit-data-v7-11-4.js','utf8');assert(!/fetch\s*\(|XMLHttpRequest|sendBeacon|geolocation|localStorage|sessionStorage/.test(s));});
const report={version:'7.11.4',tests,passed:tests.filter(x=>x.passed).length,total:tests.length};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
