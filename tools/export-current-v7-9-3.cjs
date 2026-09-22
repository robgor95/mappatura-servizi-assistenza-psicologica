/* Exact same read-only data layer order as current browser entrypoints. */
const fs=require('node:fs'),vm=require('node:vm');
const sandbox={URL,URLSearchParams,console,document:{readyState:'loading',addEventListener(){}}};sandbox.window=sandbox;vm.createContext(sandbox);
for(const f of ['servizi-data-v7-5-1','audit-data-v7-9','audit-data-v7-9-1','audit-data-v7-9-2','audit-data-v7-9-3'])vm.runInContext(fs.readFileSync('assets/'+f+'.js','utf8'),sandbox);
const read=p=>JSON.parse(fs.readFileSync(p));const data=read('data/portal_data_v7_3.json');data.moduli.push(...read('data/multisede_v7_7_5.json').records);
sandbox.LazioAudit79.set(read('data/audit_operativo_v7_9.json'));sandbox.LazioAudit791.set(read('data/audit_operativo_v7_9_1.json'));sandbox.LazioAudit792.set(read('data/audit_operativo_v7_9_2.json'));sandbox.LazioAudit793.set(read('data/audit_operativo_v7_9_3.json'));
const rows=sandbox.LazioServices.build(data,read('data/privati_v7_5.json'));
fs.writeFileSync(process.argv[2]||'/tmp/current-rows-v793.json',JSON.stringify(rows,null,2));console.log(rows.length+' services');
