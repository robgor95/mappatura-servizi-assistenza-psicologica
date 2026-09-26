'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const v=read('version.json'),overlay=read('data/audit_operativo_v7_11_6.json'),geo=read('data/presidi_geo_v7_11_6.json'),oldGeo=read('data/presidi_geo_v7_11_5.json');
const ctx={URL,URLSearchParams,console,document:{readyState:'loading',addEventListener(){}}};ctx.window=ctx;vm.createContext(ctx);
const load=p=>vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});
load('assets/servizi-data-v7-5-1.js');
for(const [s,t,g] of [['7-9','7_9','79'],['7-9-1','7_9_1','791'],['7-9-2','7_9_2','792'],['7-9-3','7_9_3','793'],['7-9-4','7_9_4','794'],['7-11','7_11','711'],['7-11-1','7_11_1','7111'],['7-11-2','7_11_2','7112'],['7-11-3','7_11_3','7113'],['7-11-4','7_11_4','7114'],['7-11-5','7_11_5','7115']]){load('assets/audit-data-v'+s+'.js');ctx['LazioAudit'+g].set(read('data/audit_operativo_v'+t+'.json'));}
const D=read('data/portal_data_v7_3.json'),P=read('data/privati_v7_5.json');D.moduli.push(...read('data/multisede_v7_7_5.json').records);
const before=JSON.parse(JSON.stringify(ctx.LazioServices.build(D,P))),oldBy=Object.fromEntries(before.map(x=>[x.key,x]));
load('assets/audit-data-v7-11-6.js');ctx.LazioAudit7116.set(overlay);
const rows=JSON.parse(JSON.stringify(ctx.LazioServices.build(D,P))),by=Object.fromEntries(rows.map(x=>[x.key,x]));
load('assets/map-data-v7-11-6.js');const G=ctx.LazioMapData;
const tests=[];function check(name,fn){try{fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e.message});}}
const rieti=['rete:RI-02','rete:RI-05','rete:RI-07'],insieme=['moduli:V79-INS-VENERE','moduli:V79-INS-MARTE'],keys=rieti.concat(insieme);
check('443 service identities preserved',()=>{assert.equal(rows.length,443);assert.equal(new Set(rows.map(r=>r.key)).size,443);assert.deepEqual(rows.map(r=>r.key),before.map(r=>r.key));assert.equal(overlay.additions.length,0);});
check('V7.11.6 changes only scoped geographic notes',()=>{assert.equal(overlay.revisions.length,5);assert.deepEqual(overlay.revisions.map(x=>x.service_key).sort(),keys.slice().sort());for(const e of overlay.revisions)assert.deepEqual(Object.keys(e.fields),['nota_geografia_v7116']);for(const k of keys)for(const f of ['address','town','type','subtype','asl','territory','regime','origin','auth','accreditation','ssn','admin','extra','mobility','beds','phone','email','access','domains'])assert.deepEqual(by[k][f],oldBy[k][f],k+' '+f);});
check('All 365 previous positions preserved exactly',()=>{let n=0;for(const [k,p] of Object.entries(oldGeo.records))if(Number.isFinite(p.lat)&&Number.isFinite(p.lng)){n++;assert.deepEqual(geo.records[k],p,k);}assert.equal(n,365);});
check('Five new C positions exist at two distinct coordinates',()=>{assert.equal(new Set(keys.map(k=>geo.records[k].lat+','+geo.records[k].lng)).size,2);for(const k of keys){const p=geo.records[k];assert.equal(p.quality,'C');assert.equal(p.entrance_verified,false);assert(G.position(by[k],geo),k);assert.match(p.source_url,/^https:\/\//);assert.match(p.address_source_url,/^https:\/\//);}});
check('Three Rieti services share one indicative presidium point',()=>{const first=geo.records[rieti[0]];for(const k of rieti){const p=geo.records[k];assert.equal(p.lat,first.lat);assert.equal(p.lng,first.lng);assert.equal(p.precision,'approximate');assert.match(p.note,/Via Salaria|presidio|ingresso/i);}});
check('Venere and Marte reuse Cerri Aprano street point only',()=>{const src=geo.records['moduli:MOD-042'];for(const k of insieme){const p=geo.records[k];assert.equal(p.lat,src.lat);assert.equal(p.lng,src.lng);assert.equal(p.precision,'street');assert.equal(p.shared_coordinate_from,'moduli:MOD-042');assert.match(p.note,/Cerri Aprano|area|via/i);}});
check('Runtime coverage is 370 located and 73 unlocated',()=>{assert.equal(rows.filter(r=>G.position(r,geo)).length,370);assert.equal(rows.filter(r=>!G.position(r,geo)).length,73);});
check('Queue has exactly 73 residual rows',()=>{const lines=fs.readFileSync('downloads/Coda_Geografia_V7_11_6.csv','utf8').trim().split(/\r?\n/);assert.equal(lines.length-1,73);for(const k of keys)assert(!lines.some(x=>x.startsWith(k+';')));});
check('Manifest and safeguards remain coherent',()=>{assert.equal(v.web_version,'7.11.6');assert.equal(v.counts_current.search,443);assert.equal(v.map.localized,370);assert.equal(v.map.unlocated,73);assert.deepEqual(v.map.quality,{D:71,A:28,C:342,E:2});assert.equal(v.map.entrances_verified,0);assert.equal(v.indexing_enabled,false);assert.equal(v.clinical_review,false);});
check('Adapter performs no live network/storage/geolocation',()=>{const s=fs.readFileSync('assets/audit-data-v7-11-6.js','utf8');assert(!/fetch\s*\(|XMLHttpRequest|sendBeacon|geolocation|localStorage|sessionStorage/.test(s));});
const report={version:'7.11.6',tests,passed:tests.filter(x=>x.passed).length,total:tests.length};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
