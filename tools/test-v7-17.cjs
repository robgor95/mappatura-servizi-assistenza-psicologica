'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const d=JSON.parse(fs.readFileSync('data/supporto_territoriale_v7_17.json','utf8')),v=JSON.parse(fs.readFileSync('version.json','utf8'));
assert.equal(d.version,'7.17');assert.equal(d.consultori_master.length,135);assert.equal(d.pua_sites.length,96);assert.equal(d.pis_services.length,6);
assert.equal(new Set(d.pua_sites.map(x=>x.id)).size,96);assert.equal(new Set([...d.consultori_master,...d.pua_sites,...d.pis_services].map(x=>x.id)).size,237);
const by=d.pua_sites.reduce((a,r)=>(a[r.asl]=(a[r.asl]||0)+1,a),{});
for(const [asl,n] of Object.entries({'ASL Roma 4':13,'ASL Roma 5':8,'ASL Roma 6':5,'ASL Frosinone':12,'ASL Latina':6,'ASL Rieti':7}))assert.equal(by[asl],n,asl);
assert.equal(d.coverage.pua.by_asl['ASL Frosinone'].status,'complete_against_current_asl_pua_page');
assert.equal(d.coverage.pua.by_asl['ASL Roma 6'].status,'partial_current_sites');
assert.equal(d.coverage.pis.overall,'partial_no_single_regional_registry');
assert(d.pua_sites.some(x=>x.id==='PUA-072'&&x.address.includes('Caduti di Nassirya')));
assert(d.pua_sites.some(x=>x.id==='PUA-090'&&x.address.includes('Ortensie 28')));
assert(d.pua_sites.some(x=>x.id==='PUA-070'&&x.address.includes('Mario Calò')));
assert.equal(v.web_version,'7.17');assert.equal(v.counts_current.search,443);assert.equal(v.counts_current.support_pua,96);assert.equal(v.map.localized,379);assert.equal(v.map.unlocated,64);
assert.equal(v.support_layer.pua_sites_documented,96);assert.equal(v.support_layer.complete.pua_sites,false);assert.equal(v.support_layer.complete.pis,false);
for(const r of [...d.consultori_master,...d.pua_sites,...d.pis_services]){assert.match(r.source_url,/^https:\/\//);assert(!/casa rifugio/i.test(String(r.address||'')));}
const s=fs.readFileSync('assets/supporto-v7-17.js','utf8');assert(!/geolocation|sendBeacon|localStorage|sessionStorage|XMLHttpRequest|nominatim|googleapis|mapbox/i.test(s));assert.match(s,/supporto_territoriale_v7_17\.json/);
console.log(JSON.stringify({version:'7.17',rows:237,consultori:135,pua:96,pis:6,by_asl:by},null,2));
