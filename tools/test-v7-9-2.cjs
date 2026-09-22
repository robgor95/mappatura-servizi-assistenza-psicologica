'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const rows=JSON.parse(fs.readFileSync('/tmp/current-v792.json'));
const by=new Map(rows.map(r=>[r.key,r]));
const geo=JSON.parse(fs.readFileSync('data/presidi_geo_v7_9_2.json'));
const ops=JSON.parse(fs.readFileSync('data/audit_operativo_v7_9_2.json'));
const version=JSON.parse(fs.readFileSync('version.json'));
const M=require('../assets/menta-core-v7-9-2.js'),C=require('../assets/menta-config-v7-9-2.js');
assert.equal(rows.length,442);assert.equal(new Set(rows.map(r=>r.key)).size,442);
assert.equal(geo.summary.localized_after,309);assert.equal(geo.summary.unlocated_after,133);
assert.deepEqual(new Set(geo.summary.newly_localized_keys),new Set(['rete:R3-08','moduli:MOD-115']));
assert.equal(geo.summary.entrances_verified,0);
for(const [k,p] of Object.entries(geo.records)){assert.equal(p.source_address,by.get(k).address);assert.equal(p.source_town,by.get(k).town);if(['D','E'].includes(p.quality)){assert.equal(p.lat,null);assert.equal(p.lng,null);}}
for(const k of ['moduli:MOD-061','moduli:MOD-062','moduli:MOD-063','moduli:MOD-064','moduli:MOD-065']){
  const r=by.get(k);assert.equal(r.ssn,'indicata');assert.match(r.raw.contratto_periodo,/31\/12\/2026/);assert.match(r.raw.budget_2026_stato,/non acquisito/i);
}
const febo=by.get('moduli:V79-COOPERATE-FEBO');assert.equal(febo.ssn,'da-verificare');assert.match(febo.raw.accreditamento_stato,/attesa di accreditamento/i);
for(const k of ['moduli:MOD-107','moduli:MS775-NO-CASAGIOIA'])assert.match(by.get(k).raw.note_v792,/Piglio e Marino/);
assert.equal(C.version,'7.9.2');
for(const town of ['Gallicano nel Lazio','Itri','Labico','Rocca Canterano','San Cesareo','Valmontone','Zagarolo']){const x=M.analyse('CSM '+town);assert(x.results.some(r=>r.href.includes('comune='+encodeURIComponent(town).replaceAll('%20','+')))||x.results.some(r=>decodeURIComponent(r.href).includes(town)));}
for(const [q,id] of [['gabbiano','gabbiano-current'],['reverie','reverie-current'],['nuovi orizzonti','nuovi-orizzonti-current'],['villa pia','villa-pia-current']])assert.equal(M.analyse(q).results[0].id,id);
assert.equal(version.indexing_enabled,false);assert.equal(version.map.localized,309);assert.equal(version.menta_version,'7.9.2');
const code=fs.readFileSync('assets/menta-core-v7-9-2.js','utf8');assert(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie/.test(code));
console.log(JSON.stringify({passed:true,services:rows.length,localized:geo.summary.localized_after,unlocated:geo.summary.unlocated_after,revisions:ops.revisions.length,menta_towns:version.menta.towns}));
