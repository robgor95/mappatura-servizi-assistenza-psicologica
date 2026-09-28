import {createRemoteJWKSet,jwtVerify} from 'jose';
const resolvers=new Map();
export class HttpError extends Error{constructor(status,message){super(message);this.status=status;}}
export function config(env){
 if(env.EDITORIAL_ENABLED!=='true'||!env.EDITORIAL_DB||!env.ACCESS_AUD||!env.ADMIN_ORIGIN||!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN||''))throw new HttpError(503,'Area redazione non ancora attiva. Il portale pubblico rimane disponibile.');
 const origin=new URL(env.ADMIN_ORIGIN);if(origin.protocol!=='https:'||origin.origin!==env.ADMIN_ORIGIN)throw new HttpError(503,'Configurazione redazione da completare.');
 return {origin:origin.origin,issuer:env.ACCESS_TEAM_DOMAIN,audience:env.ACCESS_AUD};
}
export async function verifyToken(token,cfg,resolver){
 if(!token||token.length>16000)throw new HttpError(401,'Accedi con il tuo account autorizzato.');
 try{const {payload}=await jwtVerify(token,resolver,{issuer:cfg.issuer,audience:cfg.audience,algorithms:['RS256'],requiredClaims:['exp','iat','sub','email'],clockTolerance:5});
 if(payload.type!=='app'||typeof payload.sub!=='string'||!payload.sub||typeof payload.email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email))throw Error('identity');
 return {email:payload.email.toLowerCase(),sub:payload.sub};
 }catch(_){throw new HttpError(401,'Sessione scaduta o non valida. Accedi nuovamente.');}
}
export async function authenticate(request,env){
 const cfg=config(env);
 if(new URL(request.url).origin!==cfg.origin)throw new HttpError(403,'Questo indirizzo non è autorizzato per la redazione.');
 const token=request.headers.get('Cf-Access-Jwt-Assertion')||((request.headers.get('Cookie')||'').match(/(?:^|;\s*)CF_Authorization=([^;]+)/)||[])[1];
 if(!token)throw new HttpError(401,'Accesso riservato. Apri /admin/ attraverso Cloudflare Access.');
 if(!resolvers.has(cfg.issuer))resolvers.set(cfg.issuer,createRemoteJWKSet(new URL(cfg.issuer+'/cdn-cgi/access/certs'),{timeoutDuration:5000,cacheMaxAge:300000}));
 return verifyToken(token,cfg,resolvers.get(cfg.issuer));
}
export function protectWrite(request,env){
 if(!['POST','PUT','PATCH','DELETE'].includes(request.method))return;
 if(request.headers.get('Origin')!==env.ADMIN_ORIGIN||request.headers.get('X-Editorial-Request')!=='1'||request.headers.get('Sec-Fetch-Site')==='cross-site')throw new HttpError(403,'Richiesta non autorizzata. Ricarica la pagina.');
}
export const securityHeaders={
 'Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
 'X-Robots-Tag':'noindex, nofollow, noarchive','Vary':'Cookie, Cf-Access-Jwt-Assertion',
 'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
 'Permissions-Policy':'camera=(), microphone=(), geolocation=()'
};
export const json=(data,status=200)=>Response.json(data,{status,headers:securityHeaders});
export async function bodyJSON(request){
 if(!(request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))throw new HttpError(415,'Richiesto contenuto JSON.');
 const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Richiesta vuota.');let size=0,chunks=[];
 for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>100000){await reader.cancel();throw new HttpError(413,'Richiesta troppo grande.');}chunks.push(value);}
 const all=new Uint8Array(size);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length;}
 try{return JSON.parse(new TextDecoder().decode(all));}catch(_){throw new HttpError(400,'Dati non validi.');}
}
