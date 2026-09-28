import {handle,requireUser} from '../lib/editorial-api.mjs';
import {securityHeaders} from '../lib/editorial-auth.mjs';
const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export default {
 async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path.startsWith('/api/'))return handle(request,env);
  if(path==='/admin'||path.startsWith('/admin/')){
   try{
    await requireUser(request,env);
    if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Metodo non consentito',{status:405,headers:securityHeaders});
    const response=await env.ASSETS.fetch(request),headers=new Headers(response.headers);for(const [k,v] of Object.entries(securityHeaders))headers.set(k,v);
    return new Response(response.body,{status:response.status,headers});
   }catch(e){
    const status=[401,403,503].includes(e.status)?e.status:503;
    const msg=status===503?'L’area redazione non è ancora attiva. Il portale pubblico rimane disponibile.':status===401?'Accedi attraverso il sistema di accesso riservato del progetto.':'Il tuo account non è autorizzato a questa area. Contatta il responsabile del progetto.';
    return new Response('<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Area riservata | Network Giovani</title><link rel="stylesheet" href="/assets/network-v7-18.css"></head><body class="ng-site"><main class="ng-admin"><section class="ng-admin-panel"><p class="ng-kicker">Network Giovani</p><h1>Area redazione</h1><p>'+escape(msg)+'</p><p><a href="/redazione.html">Informazioni sull’accesso</a> · <a href="/index.html">Torna al portale</a></p></section></main></body></html>',{status,headers:{...securityHeaders,'Content-Type':'text/html; charset=utf-8'}});
   }
  }
  return env.ASSETS.fetch(request);
 }
};
