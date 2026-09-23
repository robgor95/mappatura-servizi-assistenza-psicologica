'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={URL,URLSearchParams,document:{readyState:'complete',getElementById:()=>null,querySelectorAll:()=>[],addEventListener:()=>{}}};ctx.window=ctx;vm.createContext(ctx);
function run(p){vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});}
run('assets/servizi-data-v7-5-1.js');
for(const n of ['audit-data-v7-9','audit-data-v7-9-1','audit-data-v7-9-2','audit-data-v7-9-3','audit-data-v7-9-4'])run('assets/'+n+'.js');
const D=JSON.parse(fs.readFileSync('data/portal_data_v7_3.json')),P=JSON.parse(fs.readFileSync('data/privati_v7_5.json'));D.moduli.push(...JSON.parse(fs.readFileSync('data/multisede_v7_7_5.json')).records);
ctx.LazioAudit79.set(JSON.parse(fs.readFileSync('data/audit_operativo_v7_9.json')));
ctx.LazioAudit791.set(JSON.parse(fs.readFileSync('data/audit_operativo_v7_9_1.json')));
ctx.LazioAudit792.set(JSON.parse(fs.readFileSync('data/audit_operativo_v7_9_2.json')));
ctx.LazioAudit793.set(JSON.parse(fs.readFileSync('data/audit_operativo_v7_9_3.json')));
ctx.LazioAudit794.set(JSON.parse(fs.readFileSync('data/audit_operativo_v7_9_4.json')));
const rows=ctx.LazioServices.build(D,P),by=Object.fromEntries(rows.map(r=>[r.key,r]));
const tests=[];function check(name,fn){try{fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e.message});}}
check('443 services remain unique',()=>{assert.equal(rows.length,443);assert.equal(new Set(rows.map(r=>r.key)).size,443);});
check('Colle Cesarano has eight distinct services and 70 H24 places',()=>{const cs=rows.filter(r=>/colle cesarano/i.test(JSON.stringify(r.raw))||r.key==='moduli:V794-CESARANO-ILCOLLE-H24');assert.equal(cs.length,8);const n=by['moduli:V794-CESARANO-ILCOLLE-H24'];assert(n);assert.equal(String(n.raw.posti_accreditati),'10');const keys=['moduli:MOD-026','moduli:MOD-027','moduli:MOD-028','moduli:V794-CESARANO-ILCOLLE-H24'];assert.equal(keys.map(k=>Number(by[k].raw.posti_accreditati||by[k].raw.posti_dichiarati)).reduce((a,b)=>a+b,0),70);assert.match(n.raw.budget_2026_stato,/non acquisito/i);});
check('Geography is 443/315/128 with no verified entrances',()=>{const g=JSON.parse(fs.readFileSync('data/presidi_geo_v7_9_4.json'));assert.equal(g.summary.services_after,443);assert.equal(g.summary.located_after,315);assert.equal(g.summary.unlocated_after,128);assert.equal(g.summary.entrances_verified,0);for(const k of ['rete:NET-019','rete:FR-03','rete:NET-075','rete:NET-076','rete:RI-12','moduli:V794-CESARANO-ILCOLLE-H24']){const p=g.records[k];assert(p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng));assert.equal(p.precision,'building');assert.equal(p.entrance_verified,false);}});
check('Official hospital context is preserved',()=>{assert.match(by['rete:NET-019'].raw.indirizzo,/Santo Stefano Rotondo, 5/);assert.match(by['rete:NET-075'].raw.indirizzo,/Santa Scolastica/);assert.match(by['rete:NET-076'].raw.indirizzo,/SS\. Trinità/);assert.match(by['rete:NET-085'].raw.indirizzo,/Dono Svizzero/);assert.match(by['rete:NET-085'].raw.nota_indirizzo,/nessun nuovo pin/i);});
check('Abaton civic conflict stays unresolved',()=>{const t=by['moduli:MOD-038'].raw.nota_indirizzo;assert.match(t,/De Gasperi 2/);assert.match(t,/36/);assert.match(t,/48\/50/);assert.match(t,/riconferm/i);});
check('Multisite audit adds no invented health sites',()=>{const m=JSON.parse(fs.readFileSync('downloads/Audit_Multisede_V7_9_4.json'));assert.equal(m.managers.length,2);assert.equal(m.managers.reduce((a,x)=>a+Number(x.new_sites_added||0),0),0);assert.match(by['moduli:MOD-109'].raw.nota_multisede_v794,/Via Isonzo 34/);assert.match(by['moduli:MOD-109'].raw.nota_multisede_v794,/non viene promossa/i);});
check('Earlier V7.9.3 access evidence remains active',()=>{assert.match(by['rete:R1-15'].raw.trasporto_pubblico,/Metro B/);assert.match(by['rete:RI-03'].raw.accessibilita,/barriere architettoniche/i);});
check('No live network or storage code in current audit adapter',()=>{const s=fs.readFileSync('assets/audit-data-v7-9-4.js','utf8');assert(!/fetch\s*\(|XMLHttpRequest|sendBeacon|geolocation|localStorage|sessionStorage/.test(s));});
check('Version counts and noindex policy are coherent',()=>{const v=JSON.parse(fs.readFileSync('version.json'));assert.equal(v.web_version,'7.9.4');assert.equal(v.counts_current.search,443);assert.equal(v.counts_current.moduli,128);assert.equal(v.counts_current.structure_directory,184);assert.equal(v.map.localized,315);assert.equal(v.map.unlocated,128);assert.equal(v.indexing_enabled,false);});
const report={version:'7.9.4',tests,passed:tests.filter(x=>x.passed).length,total:tests.length};console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
