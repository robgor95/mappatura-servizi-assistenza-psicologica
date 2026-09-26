'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const v=read('version.json'),overlay=read('data/audit_operativo_v7_11_5.json'),geo=read('data/presidi_geo_v7_11_5.json'),oldGeo=read('data/presidi_geo_v7_11_4.json');
const ctx={URL,URLSearchParams,console,document:{readyState:'loading',addEventListener(){}}};ctx.window=ctx;vm.createContext(ctx);
const load=p=>vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});
load('assets/servizi-data-v7-5-1.js');
for(const [s,t,g] of [['7-9','7_9','79'],['7-9-1','7_9_1','791'],['7-9-2','7_9_2','792'],['7-9-3','7_9_3','793'],['7-9-4','7_9_4','794'],['7-11','7_11','711'],['7-11-1','7_11_1','7111'],['7-11-2','7_11_2','7112'],['7-11-3','7_11_3','7113'],['7-11-4','7_11_4','7114']]){load('assets/audit-data-v'+s+'.js');ctx['LazioAudit'+g].set(read('data/audit_operativo_v'+t+'.json'));}
const D=read('data/portal_data_v7_3.json'),P=read('data/privati_v7_5.json');D.moduli.push(...read('data/multisede_v7_7_5.json').records);
const before=JSON.parse(JSON.stringify(ctx.LazioServices.build(D,P))),oldBy=Object.fromEntries(before.map(x=>[x.key,x]));
load('assets/audit-data-v7-11-5.js');ctx.LazioAudit7115.set(overlay);
const rows=JSON.parse(JSON.stringify(ctx.LazioServices.build(D,P))),by=Object.fromEntries(rows.map(x=>[x.key,x]));
load('assets/map-data-v7-11-5.js');const G=ctx.LazioMapData;
const tests=[];function check(name,fn){try{fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e.message});}}
const fr=['rete:FR-01','rete:FR-11','rete:NET-083','rete:PUB72-FR-001','rete:PUB72-FR-002'],keys=fr.concat('rete:NET-057');
check('443 service identities preserved',()=>{assert.equal(rows.length,443);assert.equal(new Set(rows.map(r=>r.key)).size,443);assert.deepEqual(rows.map(r=>r.key),before.map(r=>r.key));assert.equal(overlay.additions.length,0);});
check('V7.11.5 changes only geographic notes',()=>{assert.equal(overlay.revisions.length,6);for(const e of overlay.revisions)assert.deepEqual(Object.keys(e.fields),['nota_geografia_v7115']);for(const k of keys)for(const f of ['address','town','type','subtype','asl','territory','regime','origin','auth','accreditation','ssn','admin','extra','mobility','beds','phone','email','access','domains'])assert.deepEqual(by[k][f],oldBy[k][f],k+' '+f);});
check('All 359 previous positions preserved exactly',()=>{let n=0;for(const [k,p] of Object.entries(oldGeo.records))if(Number.isFinite(p.lat)&&Number.isFinite(p.lng)){n++;assert.deepEqual(geo.records[k],p,k);}assert.equal(n,359);});
check('Six new C street points use two existing coordinates',()=>{assert.equal(new Set(keys.map(k=>geo.records[k].lat+','+geo.records[k].lng)).size,2);for(const k of keys){const p=geo.records[k];assert.equal(p.quality,'C');assert.equal(p.precision,'street');assert.equal(p.entrance_verified,false);assert(p.shared_coordinate_from);assert(p.street_extent_m>0&&p.street_extent_m<2500);assert(G.position(by[k],geo),k);}});
check('Five Frosinone records reuse Via Armando Fabi street point',()=>{const src=geo.records['rete:FR-02'];for(const k of fr){const p=geo.records[k];assert.equal(p.lat,src.lat);assert.equal(p.lng,src.lng);assert.equal(p.shared_coordinate_from,'rete:FR-02');assert.match(p.note,/via|stradal/i);}});
check('TSMREE Frascati reuses Via Enrico Fermi street point',()=>{const p=geo.records['rete:NET-057'],src=geo.records['rete:R6-06'];assert.equal(p.lat,src.lat);assert.equal(p.lng,src.lng);assert.equal(p.shared_coordinate_from,'rete:R6-06');assert.match(p.note,/non identifica un civico|stradale/i);});
check('DNA Frosinone deliberately remains unlocated',()=>{assert.equal(G.position(by['rete:NET-082'],geo),null);assert.match(by['rete:NET-082'].raw.nota_geografia_v7111||by['rete:NET-082'].raw.nota_geografia_v7112||by['rete:NET-082'].raw.nota_geografia_v7113||by['rete:NET-082'].raw.nota_indirizzo||'',/conflitto|Viale Mazzini|Via Armando Fabi/i);});
check('Runtime coverage is 365 located and 78 unlocated',()=>{assert.equal(rows.filter(r=>G.position(r,geo)).length,365);assert.equal(rows.filter(r=>!G.position(r,geo)).length,78);});
check('Queue has exactly 78 residual rows and keeps DNA case',()=>{const lines=fs.readFileSync('downloads/Coda_Geografia_V7_11_5.csv','utf8').trim().split(/\r?\n/);assert.equal(lines.length-1,78);for(const k of keys)assert(!lines.some(x=>x.startsWith(k+';')));assert(lines.some(x=>x.startsWith('rete:NET-082;')));});
check('Manifest and safeguards remain coherent',()=>{assert.equal(v.web_version,'7.11.5');assert.equal(v.counts_current.search,443);assert.equal(v.map.localized,365);assert.equal(v.map.unlocated,78);assert.deepEqual(v.map.quality,{D:76,A:28,C:337,E:2});assert.equal(v.map.entrances_verified,0);assert.equal(v.indexing_enabled,false);assert.equal(v.clinical_review,false);});
check('Adapter performs no live network/storage/geolocation',()=>{const s=fs.readFileSync('assets/audit-data-v7-11-5.js','utf8');assert(!/fetch\s*\(|XMLHttpRequest|sendBeacon|geolocation|localStorage|sessionStorage/.test(s));});
const report={version:'7.11.5',tests,passed:tests.filter(x=>x.passed).length,total:tests.length};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
