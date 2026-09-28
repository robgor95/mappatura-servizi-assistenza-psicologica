/* Build-time canonical catalog for authenticated review and stale-override detection. */
const fs=require('node:fs'),vm=require('node:vm');
const ctx={URL,URLSearchParams,console,document:{readyState:'loading',addEventListener(){}}};ctx.window=ctx;vm.createContext(ctx);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),load=p=>vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});
load('assets/servizi-data-v7-5-1.js');
for(const [a,d,g] of [['7-9','7_9','79'],['7-9-1','7_9_1','791'],['7-9-2','7_9_2','792'],['7-9-3','7_9_3','793'],['7-9-4','7_9_4','794'],['7-11','7_11','711'],['7-11-1','7_11_1','7111'],['7-11-2','7_11_2','7112'],['7-11-3','7_11_3','7113'],['7-11-4','7_11_4','7114'],['7-11-5','7_11_5','7115'],['7-11-6','7_11_6','7116'],['7-11-7','7_11_7','7117'],['7-16','7_16','716']]){load('assets/audit-data-v'+a+'.js');ctx['LazioAudit'+g].set(read('data/audit_operativo_v'+d+'.json'));}
const D=read('data/portal_data_v7_3.json');D.moduli.push(...read('data/multisede_v7_7_5.json').records);
const rows=JSON.parse(JSON.stringify(ctx.LazioServices.build(D,read('data/privati_v7_5.json'))));
if(rows.length!==443)throw Error('Baseline sanitaria inattesa');
const str=v=>v==null?'':String(v),records=rows.map(r=>({key:r.key,entity:'clinical',origin:r.origin,asl:r.asl,sources:r.sources,fields:{
 name:r.name,address:r.address,town:r.town,phone:str(r.raw.telefono||r.raw.contatti||r.phone),email:str(r.raw.email||r.email),website:str(r.raw.sito_ufficiale||r.raw.sito),hours:str(r.raw.orari),access:str(r.raw.accesso||r.raw.ammissione||r.access),accessibility:str(r.raw.accessibilita),serviceState:str(r.serviceState||r.raw.stato_servizio),type:r.type,subtype:r.subtype,ssn:r.ssn,accreditation:r.accreditation,auth:r.auth,contractedBeds:str(r.raw.posti_contrattualizzati),target:str(r.raw.destinatari)
}}));
const support=read('data/supporto_territoriale_v7_17.json');
for(const r of [...support.consultori_master,...support.pua_sites,...support.pis_services])records.push({key:'support:'+r.id,entity:'support',origin:'support',category:r.category,asl:r.asl||'',sources:r.source_urls||[r.source_url],fields:{name:str(r.name),address:str(r.address),town:str(r.town||r.territory),phone:str(r.phone),email:str(r.email),website:str(r.website),hours:str(r.hours),access:str(r.access),accessibility:str(r.accessibility),serviceState:str(r.status)}});
if(records.length!==680||new Set(records.map(x=>x.key)).size!==680)throw Error('Identità editoriali non coerenti');
fs.writeFileSync('data/editorial-catalog-v7-18.json',JSON.stringify({schema:1,baseline:'7.17',clinical:443,support:237,records},null,2)+'\n');
console.log('Catalogo: '+records.length+' schede; nessun dato originale modificato.');
