/* Run with Node >=18: node tools/test-menta-v7-7.cjs. No packages required. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),M=require('../assets/menta-core-v7-7.js'),C=require('../assets/menta-config-v7-7.js');
const tests=[];
function check(name,fn){try{fn();tests.push({name,passed:true});}catch(e){tests.push({name,passed:false,error:e.message});}}
const ctx={URL,URLSearchParams,document:{readyState:'complete',getElementById:()=>null}};ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'assets/servizi-data-v7-5-1.js'),'utf8'),ctx);
const A=ctx.LazioServices,D=JSON.parse(fs.readFileSync(path.join(root,'data/portal_data_v7_3.json'))),P=JSON.parse(fs.readFileSync(path.join(root,'data/privati_v7_5.json')));
const beforeD=JSON.stringify(D),beforeP=JSON.stringify(P),rows=A.build(D,P),keys=rows.map(r=>r.key);
check('Current V7.6 overlay: 428 records, 296 network, 115 modules, 17 private',()=>{
 assert.equal(rows.length,428);for(const [key,n] of Object.entries({rete:296,moduli:115,privati:17}))assert.equal(rows.filter(r=>r.origin===key).length,n);
});
check('Every original ID remains represented once in its dataset',()=>{assert.equal(new Set(keys).size,428);D.rete_asl.forEach(r=>assert(keys.includes('rete:'+r.id)));D.moduli.forEach(r=>assert(keys.includes('moduli:'+r.id_modulo)));P.records.forEach(r=>assert(keys.includes('privati:'+r.id)));});
check('Adapter does not mutate source objects',()=>{assert.equal(JSON.stringify(D),beforeD);assert.equal(JSON.stringify(P),beforeP);});
for(const [name,expected] of Object.entries({CSM:86,SerD:44,SPDC:20,STPIT:7,'Centro diurno':58,SRTR:51,SRSR:55,'TSMREE/NPIA':25,'DCA/DNA':10}))check('Current filter '+name,()=>assert.equal(rows.filter(r=>A.matches(r,{tipo:name})).length,expected));
check('Historical URL aliases remain accepted',()=>{for(const q of ['?view=stpit','?view=network&tipo=CSM','?view=contracted','?view=pending','?view=public'])assert(rows.filter(r=>A.matches(r,A.parse(q,D))).length>0);D.moduli.forEach(r=>assert.equal(A.parse('?view=stpit&id='+r.id_modulo,D).scheda,r.id_modulo));D.pubbliche_ricontrollate.forEach((r,i)=>assert.equal(A.parse('?view=public&indice='+i,D).scheda,'rete:'+r.id));});
for(const intent of C.intents)for(const word of intent.keywords)check('Vocabulary: '+intent.id+' / '+word,()=>{const out=M.analyse(word);assert.notEqual(out.kind,'unknown');assert.notEqual(out.kind,'empty');assert(out.results.length<=4);});
for(const word of C.emergency)check('Safety priority: '+word,()=>{assert(M.emergency(word));assert.equal(M.analyse('CSM '+word).kind,'emergency');});
for(const phrase of ['non urgente','non urgenti','non è urgente','116117','guardia medica'])check('Non-urgent is not emergency: '+phrase,()=>assert.notEqual(M.analyse(phrase).kind,'emergency'));
check('Negated or informational suicide/violence still shows safety numbers',()=>{for(const q of ['prevenzione del suicidio','non voglio farmi del male','non urgente ma overdose','non sono in pericolo','informazioni sulla violenza'])assert.equal(M.analyse(q).kind,'emergency');});
const examples={
 'cerco uno psicologo':'first','sono uno studente universitario':'university','cerco un CSM':'csm','ho bisogno di un centro diurno':'day','dipendenze':'addictions','supporto per mio figlio':'consultori','sportello scolastico':'school','psicologo gratuito':'public','consultorio':'consultori','DCA':'food','SerD':'serd','ricovero':'spdc','STPIT':'stpit','centro privato':'private','ho bisogno di parlare con qualcuno':'helpline',
 'CENTRO DI SALUTE MENTALE':'csm','S.e.r.D.':'serd','comunità dipendenze':'residential-addictions','privato adolescente':'private-child','studente':'university','DNA':'food','NPIA':'children','numero non urgente':'nonurgent'
};
for(const [q,id] of Object.entries(examples))check('Requested/representative example: '+q,()=>assert.equal(M.analyse(q).results[0].id,id));
check('Adolescent ambiguity exposes four choices',()=>assert.deepEqual(M.analyse('psicologo per adolescente').results.map(r=>r.id),['children','young-listening','school','private-child']));
check('Unspecified child age is not inferred',()=>assert(M.analyse('mio figlio').note.includes('Non hai specificato')));
check('Generic symptoms do not produce a diagnosis',()=>assert.equal(M.analyse('ansia depressione panico').results[0].id,'first'));
check('Unknown input never becomes a database raw query',()=>{const out=M.analyse('XYZ_SCONOSCIUTO_123');assert.equal(out.kind,'unknown');assert(out.results.every(r=>!r.href.includes('XYZ')));});
check('Empty, punctuation-only, null and non-string inputs are safe',()=>{for(const q of ['',null,'  !  ',undefined])assert.equal(M.analyse(q).kind,'empty');assert.doesNotThrow(()=>M.analyse(123));});
check('No accidental substring match inside an unrelated word',()=>{for(const q of ['csmxyz','elettrodomestico','gastronomico'])assert.equal(M.analyse(q).kind,'unknown');});
check('Viterbo CSM combines type and actual municipality',()=>{const u=new URL(M.analyse('Viterbo CSM').results[0].href,'https://local.invalid');assert.equal(u.searchParams.get('tipo'),'CSM');assert.equal(u.searchParams.get('comune'),'Viterbo');assert(rows.some(r=>A.matches(r,Object.fromEntries(u.searchParams))));});
check('Province and ASL are explicitly selectable by keywords',()=>{assert(M.analyse('CSM provincia di Viterbo').results[0].href.includes('provincia=VT'));assert(M.analyse('CSM ASL Roma 2').results[0].href.includes('asl=ASL+Roma+2'));});
check('Longest geographical name prevents false Roma filter',()=>assert(M.analyse('CSM Genzano di Roma').results[0].href.includes('comune=Genzano+di+Roma')));
check('Multiple places do not silently pick one',()=>{const o=M.analyse('CSM Roma o Viterbo');assert(!o.results[0].href.includes('comune='));assert(o.note.includes('più territori'));});
for(const geo of C.geography)check('Allowlisted territory values exist: '+geo.label,()=>{for(const [key,value] of Object.entries(geo.filters)){const property={comune:'town',provincia:'territory',asl:'asl'}[key];assert(rows.some(r=>r[property]===value));}});
for(const [id,route] of Object.entries(C.routes))check('Route exists and filters supported: '+id,()=>{const u=new URL(M.link(id).href,'https://local.invalid');assert(fs.existsSync(path.join(root,u.pathname)));if(route.page==='/servizi.html'){for(const key of u.searchParams.keys())assert(A.filterKeys.includes(key));assert(rows.some(r=>A.matches(r,Object.fromEntries(u.searchParams))));}});
check('Every legacy service filtering field is preserved',()=>{for(const r of rows)assert(A.matches(r,{tipo:r.type,comune:r.town,origine:r.origin,asl:r.asl,regime:r.regime}));});
check('CSV formula injection neutralised and missing contact not fabricated',()=>{assert(A.csv([{...rows[0],name:'=1+1'}]).includes("'=1+1"));assert.equal(A.phone('Non documentato'),'');assert.equal(A.urls('javascript:alert(1)').length,0);});
check('Free text cannot inject raw data or script in a generated route',()=>{const sentinel='PERSONA_TEST_123';const out=M.analyse('<img src=x onerror=alert(1)> CSM Viterbo '+sentinel+' &q=privacy');for(const r of out.results){assert(!r.href.includes(sentinel));assert(!r.href.includes('onerror'));assert(!r.href.includes('q='));assert(r.href.startsWith('/'));}});
check('Router and renderer have no network, persistence or telemetry code',()=>{for(const name of ['menta-core-v7-7.js','menta-ui-v7-7.js']){const code=fs.readFileSync(path.join(root,'assets',name),'utf8');assert(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|document\.cookie|console\.(log|error)/.test(code));}});
const auditPath=path.join(root,'downloads/Audit_Menta_V7_7.json');
if(fs.existsSync(auditPath)){const baseline=JSON.parse(fs.readFileSync(auditPath)).preserved_sha256||{};for(const [name,hash] of Object.entries(baseline))check('Original bytes preserved: '+name,()=>assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex'),hash));}
const report={version:'7.7',suite:'Node deterministic routing, V7.6 adapter, integrity',tests,passed:tests.filter(t=>t.passed).length,total:tests.length};
console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;
