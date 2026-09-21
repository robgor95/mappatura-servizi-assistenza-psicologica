/* Maintenance only: reproduce the exact production search without executing UI code. */
const fs=require('node:fs'),vm=require('node:vm');
const sandbox={URL,URLSearchParams,console,document:{readyState:'loading',addEventListener(){}}};
sandbox.window=sandbox;vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('assets/servizi-data-v7-5-1.js','utf8'),sandbox);
const data=JSON.parse(fs.readFileSync('data/portal_data_v7_3.json'));
const extra=JSON.parse(fs.readFileSync('data/multisede_v7_7_5.json'));
const ids=new Set(data.moduli.map(r=>r.id_modulo||r.id));
for(const r of extra.records)if(!ids.has(r.id_modulo||r.id)){data.moduli.push(r);ids.add(r.id_modulo||r.id);}
const rows=sandbox.LazioServices.build(data,JSON.parse(fs.readFileSync('data/privati_v7_5.json')));
fs.writeFileSync(process.argv[2]||'/tmp/map-rows.json',JSON.stringify(rows.map(r=>({key:r.key,name:r.name,address:r.address,town:r.town,type:r.type,territory:r.territory})),null,2));
