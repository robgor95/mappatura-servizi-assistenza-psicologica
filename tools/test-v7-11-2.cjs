'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const v=read('version.json'),overlay=read('data/audit_operativo_v7_11_2.json'),geo=read('data/presidi_geo_v7_11_2.json'),oldGeo=read('data/presidi_geo_v7_11_1.json');
const ctx={URL,URLSearchParams,console,document:{readyState:'loading',addEventListener(){}}};ctx.window=ctx;vm.createContext(ctx);
const load=p=>vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});
load('assets/servizi-data-v7-5-1.js');
const chain=[['7-9','7_9','79'],['7-9-1','7_9_1','791'],['7-9-2','7_9_2','792'],['7-9-3','7_9_3','793'],['7-9-4','7_9_4','794'],['7-11','7_11','711'],['7-11-1','7_11_1','7111']];
for(const [s,t,g] of chain){load('assets/audit-data-v'+s+'.js');ctx['LazioAudit'+g].set(read('data/audit_operativo_v'+t+'.json'));}
const D=read('data/portal_data_v7_3.json'),P=read('data/privati_v7_5.json');D.moduli.push(...read('data/multisede_v7_7_5.json').records);
const before=JSON.parse(JSON.stringify(ctx.LazioServices.build(D,P))),oldBy=Object.fromEntries(before.map(x=>[x.key,x]));
load('assets/audit-data-v7-11-2.js');ctx.LazioAudit7112.set(overlay);
const rows=JSON.parse(JSON.stringify(ctx.LazioServices.build(D,P))),by=Object.fromEntries(rows.map(x=>[x.key,x]));
load('assets/map-data-v7-11-2.js');const G=ctx.LazioMapData;
const tests=[];function check(name,fn){try{fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e.message});}}
const keys=['rete:R1-08','rete:R1-19','rete:NET-008','rete:FR-05','rete:PUB72-FR-003','moduli:MOD-058'];
check('443 services are preserved with no additions',()=>{assert.equal(rows.length,443);assert.equal(new Set(rows.map(r=>r.key)).size,443);assert.deepEqual(rows.map(r=>r.key),before.map(r=>r.key));assert.equal(overlay.additions.length,0);});
check('V7.11.2 changes only a geographic note in service records',()=>{assert.equal(overlay.revisions.length,6);for(const r of rows){const e=overlay.revisions.find(e=>e.service_key===r.key);if(!e)continue;assert.deepEqual(Object.keys(e.fields),['nota_geografia_v7112']);for(const k of ['name','address','town','type','subtype','asl','territory','regime','origin','auth','accreditation','ssn','admin','extra','mobility','beds','phone','email','access','domains'])assert.deepEqual(r[k],oldBy[r.key][k],r.key+' '+k);}});
check('All 344 previous positions are byte-equivalent in the new geography',()=>{let n=0;for(const [k,p] of Object.entries(oldGeo.records)){if(Number.isFinite(p.lat)&&Number.isFinite(p.lng)){n++;assert.deepEqual(geo.records[k],p,k);}}assert.equal(n,344);});
check('Six documented C positions are added at four coordinates',()=>{assert.deepEqual(overlay.revisions.map(x=>x.service_key).sort(),keys.slice().sort());assert.equal(new Set(keys.map(k=>geo.records[k].lat+','+geo.records[k].lng)).size,4);assert.equal(keys.filter(k=>geo.records[k].precision==='building').length,4);assert.equal(keys.filter(k=>geo.records[k].precision==='approximate').length,2);for(const k of keys){const p=geo.records[k];assert.equal(p.quality,'C');assert.equal(p.entrance_verified,false);assert.match(p.source_url,/^https:\/\//);assert.match(p.address_source_url,/^https:\/\//);assert(G.position(by[k],geo),k);}});
check('Actual runtime gate yields 350 located and 93 unlocated',()=>{assert.equal(rows.filter(r=>G.position(r,geo)).length,350);assert.equal(rows.filter(r=>!G.position(r,geo)).length,93);});
check('Shared address points preserve distinct services',()=>{assert.notEqual(by['rete:R1-19'].key,by['rete:NET-008'].key);assert.equal(geo.records['rete:R1-19'].lat,geo.records['rete:NET-008'].lat);assert.equal(geo.records['rete:FR-05'].lat,geo.records['rete:PUB72-FR-003'].lat);});
check('Coordinate notes never claim a verified entrance',()=>{for(const k of keys){const p=geo.records[k];assert(!/ingresso (fisico )?verificato(?!.*non)/i.test(p.note));assert(/non |indicativ|presidio|complesso/i.test(p.note));}});
check('All new evidence sources are HTTPS and field-scoped',()=>{for(const e of overlay.revisions){assert(e.sources.length>=2);assert(e.sources.every(u=>/^https:\/\//.test(u)));const ev=e.evidence.nota_geografia_v7112;assert(ev&&ev.sources.length>=2);}});
check('Queue drops exactly from 99 to 93 without hiding unrelated rows',()=>{const lines=fs.readFileSync('downloads/Coda_Geografia_V7_11_2.csv','utf8').trim().split(/\r?\n/);assert.equal(lines.length-1,93);for(const k of keys)assert(!lines.some(x=>x.startsWith(k+';')));});
check('Manifest is coherent and privacy safeguards remain',()=>{assert.equal(v.web_version,'7.11.2');assert.equal(v.counts_current.search,443);assert.equal(v.map.localized,350);assert.equal(v.map.unlocated,93);assert.deepEqual(v.map.quality,{D:91,A:28,C:322,E:2});assert.equal(v.map.entrances_verified,0);assert.equal(v.indexing_enabled,false);assert.equal(v.clinical_review,false);});
check('New audit adapter contains no network, storage or geolocation code',()=>{const s=fs.readFileSync('assets/audit-data-v7-11-2.js','utf8');assert(!/fetch\s*\(|XMLHttpRequest|sendBeacon|geolocation|localStorage|sessionStorage/.test(s));});
const report={version:'7.11.2',tests,passed:tests.filter(x=>x.passed).length,total:tests.length};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
