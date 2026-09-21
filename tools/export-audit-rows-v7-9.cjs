/* Maintenance-only exact runtime adapter export. */
const fs=require('node:fs'),vm=require('node:vm');
const s={URL,URLSearchParams,console,document:{readyState:'loading',addEventListener(){}}};s.window=s;vm.createContext(s);
const baseline=process.argv.includes('--baseline');
for(const p of ['assets/servizi-data-v7-5-1.js'].concat(baseline?[]:['assets/audit-data-v7-9.js']))vm.runInContext(fs.readFileSync(p,'utf8'),s);
const d=JSON.parse(fs.readFileSync('data/portal_data_v7_3.json'));const m=JSON.parse(fs.readFileSync('data/multisede_v7_7_5.json'));
d.moduli.push(...m.records);if(!baseline)s.LazioAudit79.set(JSON.parse(fs.readFileSync('data/audit_operativo_v7_9.json')));
const rows=s.LazioServices.build(d,JSON.parse(fs.readFileSync('data/privati_v7_5.json')));
fs.writeFileSync(process.argv[2]||'/tmp/current-rows-v79.json',JSON.stringify(rows,null,2));console.log(rows.length,'runtime services');
