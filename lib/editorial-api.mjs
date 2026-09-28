import {authenticate,protectWrite,bodyJSON,HttpError,json,config,securityHeaders} from './editorial-auth.mjs';
import {ROLES,FIELDS,text,safeURL,validDay,cleanContent,readyToPublish,isVisible} from '../assets/editorial-core-v7-18.mjs';
const now=()=>new Date().toISOString(),uid=()=>crypto.randomUUID(),parse=(s,fallback={})=>s?JSON.parse(s):fallback;
const fail=(status,message)=>{throw new HttpError(status,message);};
const has=(u,r)=>u.roles.includes(r),admin=u=>has(u,'admin'),editor=u=>admin(u)||has(u,'editor'),reviewer=u=>admin(u)||has(u,'data_reviewer')||has(u,'specialist');
const dbFor=env=>env.EDITORIAL_DB.withSession?env.EDITORIAL_DB.withSession('first-primary'):env.EDITORIAL_DB;
const stmt=(db,sql,...args)=>db.prepare(sql).bind(...args),one=(db,sql,...args)=>stmt(db,sql,...args).first();
const all=async(db,sql,...args)=>(await stmt(db,sql,...args).all()).results||[];
const stable=x=>JSON.stringify(x,Object.keys(x).sort());
export async function digest(value){const data=typeof value==='string'?new TextEncoder().encode(value):value;return [...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(x=>x.toString(16).padStart(2,'0')).join('');}
const audit=(db,user,action,target,before,after)=>stmt(db,'INSERT INTO cms_audit(actor,action,target,before_json,after_json,created_at) VALUES(?,?,?,?,?,?)',user.email,action,target,before==null?null:JSON.stringify(before),after==null?null:JSON.stringify(after),now());
/* A failed compare-and-swap guard aborts the ENTIRE D1 batch, including the audit. */
async function transaction(db,condition,args,statements){const id=uid();try{return await db.batch([stmt(db,`INSERT INTO cms_guards(id,ok) SELECT ?,CASE WHEN (${condition}) THEN 1 ELSE 0 END`,id,...args),...statements,stmt(db,'DELETE FROM cms_guards WHERE id=?',id)]);}catch(e){if(/CHECK|constraint|cms_guards/i.test(String(e)))fail(409,'Il contenuto è cambiato. Ricarica e confronta la versione corrente.');throw e;}}
export async function requireUser(request,env,verify=authenticate){
 config(env);const identity=await verify(request,env),db=dbFor(env);let row=await one(db,'SELECT * FROM cms_users WHERE email=?',identity.email);
 /* Bootstrap is one-time, server-configured, and requires a real verified Access identity. */
 if(!row&&identity.email===String(env.BOOTSTRAP_ADMIN_EMAIL||'').trim().toLowerCase()){
 const done=await one(db,"SELECT value FROM cms_settings WHERE key='bootstrap'");
 if(!done){try{await transaction(db,"NOT EXISTS(SELECT 1 FROM cms_settings WHERE key='bootstrap')",[],[
 stmt(db,'INSERT INTO cms_users(email,name,roles,scopes,created_at) VALUES(?,?,?,?,?)',identity.email,'Responsabile',JSON.stringify(['admin']), '[]',now()),
 stmt(db,"INSERT INTO cms_settings(key,value) VALUES('bootstrap',?)",now()),audit(db,identity,'bootstrap','users',null,{email:identity.email})]);}catch(e){if(e.status!==409)throw e;}row=await one(db,'SELECT * FROM cms_users WHERE email=?',identity.email);}
 }
 if(!row||row.disabled)fail(403,'Questo account non è autorizzato alla redazione. Contatta un responsabile del progetto.');
 return {db,user:{...row,roles:parse(row.roles,[]),scopes:parse(row.scopes,[])}};
}
async function catalog(request,env){const u=new URL('/data/editorial-catalog-v7-18.json',request.url);const r=await env.ASSETS.fetch(new Request(u,{method:'GET'}));if(!r.ok)fail(503,'Catalogo tecnico non disponibile.');const d=await r.json();if(d.schema!==1||!Array.isArray(d.records))fail(503,'Catalogo tecnico non valido.');return d.records;}
function inScope(u,r){return admin(u)||!u.scopes.length||u.scopes.includes(r.asl)||u.scopes.includes(r.entity);}
function publicOverride(row,base){
 const values=parse(row.values_json),before=parse(row.base_values),meta=parse(row.meta_json);
 if(!row.addition&&(!base||Object.keys(before).some(k=>String(base.fields[k]??'')!==String(before[k]??''))))return null;
 return {key:row.target,entity:row.entity,values,meta,addition:!!row.addition,version:row.version};
}
async function current(db,records,key){const base=records.find(r=>r.key===key),over=await one(db,'SELECT * FROM cms_overrides WHERE target=?',key);if(!base&&!over?.addition)fail(404,'Scheda non trovata.');const p=over?publicOverride(over,base):null;const fields={...(base?.fields||{}),...(p?.values||{})};return {base,over,record:{key,entity:base?.entity||over.entity,origin:base?.origin||fields.origin,asl:base?.asl||fields.asl||'',category:base?.category||fields.category||'',fields},hash:await digest(stable(fields))};}
async function publicFeed(db){const rows=await all(db,'SELECT id,kind,live,published_at FROM cms_content WHERE live IS NOT NULL ORDER BY published_at DESC LIMIT 500');return rows.map(r=>({id:r.id,...parse(r.live),published_at:r.published_at})).filter(isVisibleNow);}
const isVisibleNow=c=>isVisible(c);
function contentRow(r){return {...r,draft:parse(r.draft),live:r.live?parse(r.live):null};}
async function imageExists(db,u,c){if(!c.image_id)return;const r=await one(db,'SELECT * FROM cms_media WHERE id=?',c.image_id);if(!r||(!admin(u)&&r.owner!==u.email))fail(400,'L’immagine non è disponibile per questo contenuto.');}
async function contentAPI(db,u,request,parts){
 if(!editor(u))fail(403,'Il tuo ruolo non può gestire i contenuti editoriali.');const id=parts[0]||'',action=parts[1]||'';
 if(request.method==='GET'){
 if(id&&action==='history'){const r=await one(db,'SELECT * FROM cms_content WHERE id=?',id);if(!r||(!admin(u)&&r.owner!==u.email))fail(404,'Contenuto non trovato.');return json(await all(db,'SELECT * FROM cms_content_history WHERE content_id=? ORDER BY version DESC LIMIT 100',id));}
 if(id){const r=await one(db,'SELECT * FROM cms_content WHERE id=?',id);if(!r||(!admin(u)&&r.owner!==u.email))fail(404,'Contenuto non trovato.');return json(contentRow(r));}
 return json((await all(db,admin(u)?'SELECT * FROM cms_content ORDER BY updated_at DESC LIMIT 250':'SELECT * FROM cms_content WHERE owner=? ORDER BY updated_at DESC LIMIT 250',...(admin(u)?[]:[u.email]))).map(contentRow));
 }
 const b=await bodyJSON(request);
 if(!id&&request.method==='POST'){
 const c=cleanContent(b);await imageExists(db,u,c);const key=uid();await db.batch([stmt(db,'INSERT INTO cms_content(id,kind,owner,draft,status,version,updated_at) VALUES(?,?,?,?,?,?,?)',key,c.kind,u.email,JSON.stringify(c),'draft',1,now()),audit(db,u,'content.create',key,null,c)]);return json({id:key,version:1},201);
 }
 if(!['POST','PUT'].includes(request.method))fail(405,'Metodo non consentito.');
 const r=await one(db,'SELECT * FROM cms_content WHERE id=?',id);if(!r||(!admin(u)&&r.owner!==u.email))fail(404,'Contenuto non trovato.');
 if(!Number.isInteger(b.version)||b.version!==r.version)fail(409,'Versione superata. Ricarica il contenuto.');
 let c=parse(r.draft),live=r.live,status=r.status,published=r.published_at;
 if(!action&&request.method==='PUT'){c=cleanContent(b);if(c.kind!==r.kind)fail(400,'Il tipo di un contenuto esistente non può cambiare.');await imageExists(db,u,c);status='draft';}
 else if(action==='submit'){readyToPublish(c);status='review';}
 else if(action==='publish'){if(!admin(u))fail(403,'Solo un Admin può pubblicare.');readyToPublish(c);await imageExists(db,u,c);live=JSON.stringify(c);status='published';published=now();}
 else if(action==='unpublish'){if(!admin(u))fail(403,'Solo un Admin può ritirare un contenuto.');if(!text(b.reason||'',500))fail(400,'Indica perché ritiri il contenuto.');live=null;status='draft';}
 else if(action==='restore'){if(!admin(u))fail(403,'Ripristino riservato agli Admin.');const h=await one(db,'SELECT snapshot FROM cms_content_history WHERE content_id=? AND version=?',id,Number(b.restore_version)||0);if(!h)fail(404,'Versione non trovata.');c=cleanContent(parse(h.snapshot));status='draft';}
 else fail(404,'Operazione non disponibile.');
 await transaction(db,'EXISTS(SELECT 1 FROM cms_content WHERE id=? AND version=?)',[id,b.version],[
 stmt(db,'INSERT INTO cms_content_history(content_id,version,snapshot,actor,created_at) VALUES(?,?,?,?,?)',id,r.version,r.draft,u.email,now()),
 stmt(db,'UPDATE cms_content SET draft=?,live=?,status=?,version=version+1,updated_at=?,published_at=? WHERE id=?',JSON.stringify(c),live,status,now(),published,id),
 audit(db,u,'content.'+(action||'edit'),id,{draft:parse(r.draft),live:r.live?parse(r.live):null,status:r.status},{draft:c,status,reason:b.reason||''})]);
 return json({id,version:r.version+1,status});
}
function proposalView(r){return {...r,base:parse(r.base_json),patch:parse(r.patch),evidence:parse(r.evidence),uncertain:parse(r.uncertain,[])};}
function sensitiveProposal(p){return p.mode==='add'||Object.keys(parse(p.patch)).some(k=>FIELDS[k]?.sensitive);}
function validateProposal(b,record,mode){
 const patch=b.patch;if(!patch||Array.isArray(patch)||!Object.keys(patch).length||Object.keys(patch).length>18)fail(400,'Seleziona almeno un campo.');
 const evidence={},values={};for(const [k,v] of Object.entries(patch)){
 if(!Object.hasOwn(FIELDS,k))fail(400,'Campo non modificabile: '+k);values[k]=text(v,4000);
 if(k==='website'&&values[k])values[k]=safeURL(values[k],true);
 if(k==='email'&&values[k]&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[k]))fail(400,'Email non valida.');
 if(mode==='confirm'&&String(record.fields[k]??'')!==values[k])fail(400,'La conferma senza modifiche deve mantenere il valore corrente.');
 const e=b.evidence?.[k];if(!e||!Array.isArray(e.urls)||!e.urls.length||e.urls.length>5)fail(400,'Fonte obbligatoria per '+FIELDS[k].label);
 evidence[k]={urls:e.urls.map(x=>safeURL(x,true)),kind:e.kind==='institutional'?'institutional':'publisher'};
 if((FIELDS[k].sensitive||mode==='add')&&evidence[k].kind!=='institutional')fail(400,'Per nuovi servizi e campi sensibili serve una fonte istituzionale.');
 }
 if('ssn' in values&&!['indicata','dichiarazione','da-verificare','rete-asl'].includes(values.ssn))fail(400,'Stato SSN non valido.');
 if(values.ssn==='rete-asl'&&record.origin!=='rete')fail(400,'Un rapporto SSN non modifica la gestione della struttura.');
 const uncertain=Array.isArray(b.uncertain)?b.uncertain.filter(k=>Object.hasOwn(values,k)):[];
 return {values,evidence,checked:validDay(b.checked_at),uncertain,note:text(b.note||'',2000)};
}
async function proposalsAPI(db,u,request,parts,records){
 if(!reviewer(u))fail(403,'Il tuo ruolo non può modificare le schede.');const id=parts[0]||'',action=parts[1]||'';
 if(request.method==='GET'){
 const rows=id?await all(db,'SELECT * FROM cms_proposals WHERE id=?',id):await all(db,'SELECT * FROM cms_proposals ORDER BY updated_at DESC LIMIT 500');
 return json(rows.filter(r=>(admin(u)||has(u,'specialist')||r.author===u.email)&&inScope(u,records.find(x=>x.key===r.target)||{entity:r.entity,asl:parse(r.base_json).asl})).map(proposalView));
 }
 const b=await bodyJSON(request);
 if(!id&&request.method==='POST'){
 if(!['update','confirm','add'].includes(b.mode))fail(400,'Tipo di revisione non valido.');
 let target=b.target,record,hash;
 if(b.mode==='add'){
 if(!['clinical','support'].includes(b.entity))fail(400,'Categoria di scheda non valida.');
 if(b.entity==='clinical'&&!['rete','moduli','privati'].includes(b.origin))fail(400,'Indica la rete del nuovo servizio.');
 if(b.entity==='support'&&!['PUA','Consultorio','PIS','Emergenza sociale'].includes(b.category))fail(400,'Categoria territoriale non ammessa. Nessuna sede protetta.');
 target=(b.entity==='clinical'?b.origin:'support')+':NG-'+uid();record={key:target,entity:b.entity,origin:b.origin||'support',asl:text(b.asl||'',80),category:b.category||'',fields:{}};hash=await digest('{}');
 if(!b.patch?.name||!b.patch?.town)fail(400,'Nome e comune sono obbligatori per una nuova scheda.');
 }else{const curr=await current(db,records,target);record=curr.record;hash=curr.hash;}
 if(!inScope(u,record))fail(403,'Scheda fuori dal territorio assegnato.');
 const p=validateProposal(b,record,b.mode),key=uid();if(b.base_hash&&b.base_hash!==hash)fail(409,'La scheda è cambiata. Ricaricala.');
 await db.batch([stmt(db,'INSERT INTO cms_proposals(id,target,entity,mode,base_hash,base_json,patch,evidence,checked_at,uncertain,note,author,status,version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',key,target,record.entity,b.mode,hash,JSON.stringify(record),JSON.stringify(p.values),JSON.stringify(p.evidence),p.checked,JSON.stringify(p.uncertain),p.note,u.email,'draft',1,now(),now()),audit(db,u,'data.propose',target,null,{proposal:key,patch:p.values})]);return json({id:key,target,version:1},201);
 }
 const r=await one(db,'SELECT * FROM cms_proposals WHERE id=?',id);if(!r)fail(404,'Proposta non trovata.');if(!Number.isInteger(b.version)||b.version!==r.version)fail(409,'La proposta è cambiata. Ricaricala.');
 const base=parse(r.base_json);if(!inScope(u,base))fail(403,'Scheda fuori dal territorio assegnato.');
 if(!action&&request.method==='PUT'){
 if(r.author!==u.email||!['draft','needs_changes','rejected'].includes(r.status))fail(403,'Questa proposta non è modificabile.');
 const curr=r.mode==='add'?{record:base,hash:await digest('{}')}:await current(db,records,r.target),p=validateProposal(b,curr.record,r.mode);
 await transaction(db,'EXISTS(SELECT 1 FROM cms_proposals WHERE id=? AND version=?)',[id,b.version],[stmt(db,"UPDATE cms_proposals SET patch=?,evidence=?,checked_at=?,uncertain=?,note=?,base_hash=?,base_json=?,status='draft',specialist=NULL,version=version+1,updated_at=? WHERE id=?",JSON.stringify(p.values),JSON.stringify(p.evidence),p.checked,JSON.stringify(p.uncertain),p.note,curr.hash,JSON.stringify(curr.record),now(),id),audit(db,u,'data.edit-proposal',r.target,proposalView(r),p)]);return json({id,version:r.version+1});
 }
 if(request.method!=='POST')fail(405,'Metodo non consentito.');
 let status=r.status,specialist=r.specialist,note=text(b.reason||'',1000);
 if(action==='submit'){if(r.author!==u.email||!['draft','needs_changes','rejected'].includes(r.status))fail(403,'Solo l’autore può inviare questa bozza.');status='submitted';specialist=null;}
 else if(action==='specialist'){if(!has(u,'specialist')||u.email===r.author||r.status!=='submitted')fail(403,'Serve una verifica specialistica distinta dall’autore.');specialist=u.email;}
 else if(['reject','request_changes'].includes(action)){if(!admin(u)||r.status!=='submitted')fail(403,'Revisione riservata agli Admin.');if(!note)fail(400,'Indica una motivazione.');status=action==='reject'?'rejected':'needs_changes';specialist=null;}
 else if(action==='approve'){
 if(!admin(u)||r.status!=='submitted'||r.author===u.email)fail(403,'Serve l’approvazione di un Admin diverso dal proponente.');
 if(sensitiveProposal(r)&&!specialist)fail(403,'Questa proposta richiede prima la verifica specialistica.');
 if(specialist){const expert=await one(db,'SELECT * FROM cms_users WHERE email=?',specialist);if(!expert||expert.disabled||!parse(expert.roles,[]).includes('specialist'))fail(409,'La verifica specialistica deve essere rinnovata.');}
 const curr=r.mode==='add'?{record:base,hash:await digest('{}'),over:null,base:null}:await current(db,records,r.target);
 if(curr.hash!==r.base_hash)fail(409,'I valori correnti differiscono da quelli revisionati. Chiedi una nuova proposta.');
 const old=curr.over,values={...parse(old?.values_json),...parse(r.patch)},meta={...parse(old?.meta_json)},baseValues={...parse(old?.base_values)};
 if(r.mode==='add'){values.origin=base.origin;values.asl=base.asl;values.category=base.category;}
 const ev=parse(r.evidence),uncertain=parse(r.uncertain,[]);
 for(const k of Object.keys(parse(r.patch))){baseValues[k]=String(curr.base?.fields[k]??'');meta[k]={checked_at:r.checked_at,changed:String(curr.record.fields[k]??'')!==values[k],uncertain:uncertain.includes(k),sources:ev[k].urls};}
 const after={target:r.target,entity:r.entity,values_json:JSON.stringify(values),meta_json:JSON.stringify(meta),base_values:JSON.stringify(baseValues),addition:old?.addition||Number(r.mode==='add'),version:(old?.version||0)+1,published_at:now()};
 const guard='EXISTS(SELECT 1 FROM cms_proposals WHERE id=? AND version=? AND status=\'submitted\') AND '+(old?'EXISTS(SELECT 1 FROM cms_overrides WHERE target=? AND version=?)':'NOT EXISTS(SELECT 1 FROM cms_overrides WHERE target=?)');
 await transaction(db,guard,[id,b.version,r.target,...(old?[old.version]:[])],[
 stmt(db,'INSERT INTO cms_overrides(target,entity,values_json,meta_json,base_values,addition,version,published_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(target) DO UPDATE SET values_json=excluded.values_json,meta_json=excluded.meta_json,base_values=excluded.base_values,version=excluded.version,published_at=excluded.published_at',after.target,after.entity,after.values_json,after.meta_json,after.base_values,after.addition,after.version,after.published_at),
 stmt(db,"UPDATE cms_proposals SET status='approved',approver=?,reviewed_at=?,version=version+1,updated_at=? WHERE id=?",u.email,now(),now(),id),
 stmt(db,'INSERT INTO cms_data_history(target,proposal_id,before_json,after_json,actor,created_at) VALUES(?,?,?,?,?,?)',r.target,id,old?JSON.stringify(old):null,JSON.stringify(after),u.email,now()),audit(db,u,'data.approve',r.target,old,{proposal:id,values,meta})]);return json({id,status:'approved',version:r.version+1});
 }else fail(404,'Operazione non disponibile.');
 await transaction(db,'EXISTS(SELECT 1 FROM cms_proposals WHERE id=? AND version=?)',[id,b.version],[stmt(db,'UPDATE cms_proposals SET status=?,specialist=?,review_note=?,version=version+1,updated_at=? WHERE id=?',status,specialist,note,now(),id),audit(db,u,'data.'+action,r.target,{status:r.status},{proposal:id,status,reason:note})]);return json({id,status,version:r.version+1});
}
async function usersAPI(db,u,request){
 if(!admin(u))fail(403,'Gestione utenti riservata agli Admin.');
 if(request.method==='GET')return json((await all(db,'SELECT * FROM cms_users ORDER BY email')).map(x=>({...x,roles:parse(x.roles,[]),scopes:parse(x.scopes,[])})));
 if(request.method!=='POST')fail(405,'Metodo non consentito.');const b=await bodyJSON(request),email=text(b.email||'',254).toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!Array.isArray(b.roles)||!b.roles.length||b.roles.some(r=>!ROLES.includes(r)))fail(400,'Email o ruoli non validi.');
 const roles=[...new Set(b.roles)],name=text(b.name||'',100),scopes=Array.isArray(b.scopes)?b.scopes.map(s=>text(s,80)):[],disabled=Number(b.disabled===true);
 if(email===u.email&&(disabled||!roles.includes('admin')))fail(400,'Non puoi disabilitare o rimuovere il tuo ruolo Admin da questa schermata.');
 const old=await one(db,'SELECT * FROM cms_users WHERE email=?',email);if(old&&b.version!==old.version)fail(409,'Utente modificato: ricarica.');
 await transaction(db,old?'EXISTS(SELECT 1 FROM cms_users WHERE email=? AND version=?)':'NOT EXISTS(SELECT 1 FROM cms_users WHERE email=?)',[email,...(old?[b.version]:[])],[
 stmt(db,'INSERT INTO cms_users(email,name,roles,scopes,disabled,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET name=excluded.name,roles=excluded.roles,scopes=excluded.scopes,disabled=excluded.disabled,version=cms_users.version+1',email,name,JSON.stringify(roles),JSON.stringify(scopes),disabled,now()),audit(db,u,'users.authorize',email,old,{name,roles,scopes,disabled})]);
 return json({email,version:(old?.version||0)+1,message:'Autorizzazione salvata. Condividi il link dell’area redazione; nessuna email di invito è stata inviata automaticamente.'});
}
export function inspectWebP(bytes){
 if(bytes.length<30||bytes.length>3*1024*1024)throw Error('Immagine WebP troppo grande o non valida.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),s=(at,n)=>String.fromCharCode(...bytes.slice(at,at+n));
 if(s(0,4)!=='RIFF'||s(8,4)!=='WEBP'||view.getUint32(4,true)+8!==bytes.length)throw Error('Formato immagine non valido.');
 let width=0,height=0,hasPixels=false;for(let at=12;at+8<=bytes.length;){const k=s(at,4),n=view.getUint32(at+4,true),p=at+8;if(p+n>bytes.length)throw Error('Immagine troncata.');if(!['VP8 ','VP8L','VP8X','ALPH'].includes(k))throw Error('Usa un’immagine statica esportata dal pannello, senza metadati.');
 if(k==='VP8 '){if(n<10||s(p+3,3)!=='\x9d\x01\x2a')throw Error('WebP non valido.');width=view.getUint16(p+6,true)&16383;height=view.getUint16(p+8,true)&16383;hasPixels=true;}
 if(k==='VP8L'){if(n<5||bytes[p]!==47)throw Error('WebP non valido.');const b=view.getUint32(p+1,true);width=(b&16383)+1;height=((b>>>14)&16383)+1;hasPixels=true;}
 if(k==='VP8X'&&n>=10&&(bytes[p]&2))throw Error('Le immagini animate non sono consentite.');at=p+n+(n%2);}
 if(!hasPixels||width<1||height<1||width>4096||height>4096||width*height>12000000)throw Error('Dimensioni immagine non consentite.');return {width,height};
}
async function mediaAPI(db,u,request,env,id){
 if(!editor(u))fail(403,'Caricamento immagini riservato alla redazione.');if(!env.EDITORIAL_MEDIA)fail(503,'Archivio immagini non ancora configurato.');
 if(request.method==='GET'){
 if(!id)return json(await all(db,admin(u)?'SELECT * FROM cms_media ORDER BY created_at DESC LIMIT 100':'SELECT * FROM cms_media WHERE owner=? ORDER BY created_at DESC LIMIT 100',...(admin(u)?[]:[u.email])));
 const m=await one(db,'SELECT * FROM cms_media WHERE id=?',id);if(!m||(!admin(u)&&m.owner!==u.email))fail(404,'Immagine non trovata.');const o=await env.EDITORIAL_MEDIA.get(m.object_key);if(!o)fail(404,'Immagine non trovata.');return new Response(o.body,{headers:{...securityHeaders,'Content-Type':'image/webp'}});
 }
 if(request.method!=='POST'||id)fail(405,'Metodo non consentito.');if(request.headers.get('Content-Type')!=='image/webp')fail(415,'Sono accettate solo immagini WebP.');
 const reader=request.body?.getReader();if(!reader)fail(400,'Immagine mancante.');const chunks=[];let size=0;for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>3*1024*1024){await reader.cancel();fail(413,'Immagine troppo grande (massimo 3 MB).');}chunks.push(value);}
 const bytes=new Uint8Array(size);let off=0;for(const c of chunks){bytes.set(c,off);off+=c.length;}const dimensions=inspectWebP(bytes);let alt;try{alt=text(decodeURIComponent(request.headers.get('X-Image-Alt')||''),250);}catch(_){fail(400,'Descrizione immagine non valida.');}if(!alt)fail(400,'Il testo alternativo è obbligatorio.');
 const key=uid(),objectKey='editorial/'+key+'.webp';await env.EDITORIAL_MEDIA.put(objectKey,bytes,{httpMetadata:{contentType:'image/webp'}});
 try{await db.batch([stmt(db,'INSERT INTO cms_media(id,object_key,owner,alt,bytes,width,height,sha256,created_at) VALUES(?,?,?,?,?,?,?,?,?)',key,objectKey,u.email,alt,size,dimensions.width,dimensions.height,await digest(bytes),now()),audit(db,u,'media.upload',key,null,{bytes:size,alt})]);}catch(e){await env.EDITORIAL_MEDIA.delete(objectKey);throw e;}
 return json({id:key,alt,...dimensions},201);
}
async function historyAPI(db,u,request,records){
 if(!reviewer(u))fail(403,'Storico riservato ai revisori.');const target=new URL(request.url).searchParams.get('target');if(!target)fail(400,'Seleziona una scheda.');const cur=await current(db,records,target);if(!inScope(u,cur.record))fail(403,'Scheda non assegnata.');
 if(request.method==='GET')return json(await all(db,'SELECT * FROM cms_data_history WHERE target=? ORDER BY id DESC LIMIT 100',target));
 if(request.method!=='POST'||!admin(u))fail(403,'Ripristino riservato agli Admin.');const b=await bodyJSON(request);if(!text(b.reason||'',1000))fail(400,'Motivazione del ripristino obbligatoria.');
 const history=await one(db,'SELECT * FROM cms_data_history WHERE target=? AND id=?',target,Number(b.history_id)||0),old=cur.over;if(!history||!old||old.version!==b.version)fail(409,'Versione superata o storico non disponibile.');
 if(!history.before_json&&old.addition)fail(400,'Per un nuovo servizio proponi lo stato di cessazione; non cancellare la sua identità.');
 const previous=parse(history.before_json,{target,entity:cur.record.entity,values_json:'{}',meta_json:'{}',base_values:'{}',addition:0}),after={...previous,version:old.version+1,published_at:now()};
 await transaction(db,'EXISTS(SELECT 1 FROM cms_overrides WHERE target=? AND version=?)',[target,b.version],[stmt(db,'UPDATE cms_overrides SET values_json=?,meta_json=?,base_values=?,version=?,published_at=? WHERE target=?',after.values_json,after.meta_json,after.base_values,after.version,after.published_at,target),stmt(db,'INSERT INTO cms_data_history(target,proposal_id,before_json,after_json,actor,created_at) VALUES(?,?,?,?,?,?)',target,null,JSON.stringify(old),JSON.stringify(after),u.email,now()),audit(db,u,'data.rollback',target,old,{...after,reason:b.reason})]);return json({target,version:after.version});
}
/* Injectable verifier is a code-level test dependency, never a request or environment bypass. */
export function createAPI(verify=authenticate){return async function handle(request,env){
 try{
 const url=new URL(request.url),parts=url.pathname.replace(/^\/api\//,'').split('/').filter(Boolean),area=parts.shift();
 if(area==='public'){
 if(!['GET','HEAD'].includes(request.method))fail(405,'Metodo non consentito.');
 if(env.EDITORIAL_ENABLED!=='true'||!env.EDITORIAL_DB)return json({active:false,items:[]});
 const db=dbFor(env),what=parts.shift();
 if(what==='content')return json({active:true,items:await publicFeed(db)});
 if(what==='revisions'){const records=await catalog(request,env),rows=await all(db,'SELECT * FROM cms_overrides');const items=[],conflicts=[];for(const r of rows){const p=publicOverride(r,records.find(x=>x.key===r.target));if(p)items.push(p);else conflicts.push(r.target);}return json({active:true,items,conflicts});}
 if(what==='media'){
 const id=parts[0],live=(await publicFeed(db)).some(c=>c.image_id===id);if(!live||!env.EDITORIAL_MEDIA)fail(404,'Immagine non pubblicata.');const m=await one(db,'SELECT object_key FROM cms_media WHERE id=?',id);if(!m)fail(404,'Immagine non trovata.');const o=await env.EDITORIAL_MEDIA.get(m.object_key);if(!o)fail(404,'Immagine non trovata.');return new Response(request.method==='HEAD'?null:o.body,{headers:{...securityHeaders,'Cache-Control':'no-store','Content-Type':'image/webp'}});
 }fail(404,'Risorsa non trovata.');
 }
 if(area!=='admin')fail(404,'Risorsa non trovata.');protectWrite(request,env);const {db,user:u}=await requireUser(request,env,verify),what=parts.shift();
 if(['POST','PUT','PATCH','DELETE'].includes(request.method)){const rate=await one(db,'SELECT COUNT(*) AS n FROM cms_audit WHERE actor=? AND created_at>?',u.email,new Date(Date.now()-60000).toISOString());if(rate?.n>=60)fail(429,'Troppe operazioni. Attendi un minuto.');}
 if(what==='me'&&request.method==='GET')return json({email:u.email,name:u.name,roles:u.roles,scopes:u.scopes,media_ready:!!env.EDITORIAL_MEDIA});
 if(what==='content')return contentAPI(db,u,request,parts);
 if(what==='users')return usersAPI(db,u,request);
 if(what==='media')return mediaAPI(db,u,request,env,parts[0]);
 if(what==='audit'){if(!admin(u)||request.method!=='GET')fail(403,'Audit riservato agli Admin.');return json(await all(db,'SELECT * FROM cms_audit ORDER BY id DESC LIMIT 250'));}
 if(['catalog','proposals','history'].includes(what)){
 if(!reviewer(u))fail(403,'Ruolo revisore richiesto.');const records=await catalog(request,env);
 if(what==='proposals')return proposalsAPI(db,u,request,parts,records);
 if(what==='history')return historyAPI(db,u,request,records);
 if(request.method!=='GET')fail(405,'Metodo non consentito.');
 if(url.searchParams.has('key')){const c=await current(db,records,url.searchParams.get('key'));if(!inScope(u,c.record))fail(403,'Scheda fuori dal territorio assegnato.');return json({record:c.record,base_hash:c.hash,override_version:c.over?.version||0});}
 const overs=await all(db,'SELECT * FROM cms_overrides');const keys=[...new Set(records.map(r=>r.key).concat(overs.filter(r=>r.addition).map(r=>r.target)))],out=[];for(const key of keys){const base=records.find(r=>r.key===key),r=overs.find(r=>r.target===key),p=r?publicOverride(r,base):null,rec={key,entity:base?.entity||r.entity,origin:base?.origin||p?.values.origin,asl:base?.asl||p?.values.asl||'',category:base?.category||p?.values.category||'',fields:{...(base?.fields||{}),...(p?.values||{})},needs_reconciliation:!!r&&!p};if(inScope(u,rec))out.push(rec);}return json(out);
 }
 fail(404,'Operazione non trovata.');
 }catch(e){if(e instanceof HttpError)return json({error:e.message},e.status);if(e?.message&&/obbligat|non valid|troppo|HTTPS|scadenza|successiv|Descrivi|Data di|immagine|formato|collegamento|dimension/i.test(e.message))return json({error:e.message},400);return json({error:'Servizio editoriale non disponibile. Nessuna modifica è stata confermata; ricarica e verifica lo stato.'},503);}
};}
export const handle=createAPI();
