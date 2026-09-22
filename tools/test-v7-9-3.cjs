'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=process.cwd(),ctx={URL,URLSearchParams,document:{readyState:'complete',getElementById:()=>null,querySelectorAll:()=>[],addEventListener:()=>{}}};ctx.window=ctx;vm.createContext(ctx);
function run(p){vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});}
run('assets/servizi-data-v7-5-1.js');
for(const n of ['audit-data-v7-9','audit-data-v7-9-1','audit-data-v7-9-2','audit-data-v7-9-3'])run('assets/'+n+'.js');
const D=JSON.parse(fs.readFileSync('data/portal_data_v7_3.json')),P=JSON.parse(fs.readFileSync('data/privati_v7_5.json'));
ctx.LazioAudit79.set(JSON.parse(fs.readFileSync('data/audit_operativo_v7_9.json')));
ctx.LazioAudit791.set(JSON.parse(fs.readFileSync('data/audit_operativo_v7_9_1.json')));
ctx.LazioAudit792.set(JSON.parse(fs.readFileSync('data/audit_operativo_v7_9_2.json')));
ctx.LazioAudit793.set(JSON.parse(fs.readFileSync('data/audit_operativo_v7_9_3.json')));
const rows=ctx.LazioServices.build(D,P),by=Object.fromEntries(rows.map(r=>[r.key,r]));
const tests=[];function check(name,fn){try{fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e.message});}}
check('442 current services remain unique',()=>{assert.equal(rows.length,442);assert.equal(new Set(rows.map(r=>r.key)).size,442);});
check('Roma 1 Boccea access and transport documented',()=>{const r=by['rete:R1-08'];assert.match(r.raw.accesso,/PUA/);assert.match(r.raw.trasporto_pubblico,/ATAC 46/);assert.equal(r.v793.checked_at,'2026-09-22');});
check('Roma 1 Nomentana SerD criteria remain explicit',()=>{const r=by['rete:R1-15'];assert.match(r.raw.accesso,/gratuite/);assert.match(r.raw.criteri_ammissione,/Municipio 2/);assert.match(r.raw.trasporto_pubblico,/Metro B/);});
check('Roma 1 Cassia target and access are not inferred',()=>{const r=by['rete:R1-19'];assert.match(r.raw.destinatari,/Distretto 15/);assert.match(r.raw.accesso,/08:30/);});
check('Rieti accessibility is building-level and qualified',()=>{for(const k of ['rete:RI-03','rete:RI-06','rete:RI-12']){const r=by[k];assert.match(r.raw.accessibilita,/edificio|immobile/i);assert.match(r.raw.accessibilita,/non.*verifica/i);}});
check('Amatrice address conflict stays unresolved',()=>{const t=by['rete:RI-10'].raw.nota_indirizzo;assert.match(t,/Conflitto/);assert.match(t,/Via F. Grifoni 26/);assert.match(t,/Villa S. Cipriano/);});
check('Five Roma 5 records receive only non-unit 2026 funding context',()=>{for(const n of [61,62,63,64,65]){const r=by['moduli:MOD-'+String(n).padStart(3,'0')];assert.match(r.raw.budget_2026_stato,/quota\/budget 2026.*non.*acquisita/i);assert.match(r.raw.nota_budget_2026,/non va interpretato come budget unitario/i);}});
check('No live geocoding or tracking added by V7.9.3 adapter',()=>{const s=fs.readFileSync('assets/audit-data-v7-9-3.js','utf8');assert(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|geolocation|localStorage|sessionStorage/.test(s));});
check('Version keeps map counts unchanged and indexing disabled',()=>{const v=JSON.parse(fs.readFileSync('version.json'));assert.equal(v.web_version,'7.9.3');assert.equal(v.map.localized,309);assert.equal(v.map.unlocated,133);assert.equal(v.indexing_enabled,false);});
const report={version:'7.9.3',tests,passed:tests.filter(x=>x.passed).length,total:tests.length};
console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
