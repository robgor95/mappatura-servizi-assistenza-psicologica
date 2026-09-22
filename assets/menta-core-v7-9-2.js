/* Pure deterministic router. No DOM, network, storage, analytics or input logging. */
(function (root) {
  'use strict';
  const config = typeof module === 'object' && module.exports
    ? require('./menta-config-v7-9-2.js') : root.MentaConfig;
  const normalize = value => String(value == null ? '' : value).slice(0, 4000)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9ə]+/g, ' ').replace(/\s+/g, ' ').trim();
  const has = (text, phrase) => (' ' + text + ' ').includes(' ' + normalize(phrase) + ' ');
  function emergency(value) {
    if (!config) return false;
    let text = normalize(value);
    // Only remove explicit non-urgent phrases, never negations of suicide/violence/danger.
    config.nonurgentPhrases.forEach(p => { text = text.replaceAll(normalize(p), ' '); });
    return config.emergency.some(word => has(text, word));
  }
  function geography(text) {
    const candidates = [];
    const hay = ' ' + text + ' ';
    for (const item of config.geography) for (const alias of item.aliases) {
      const term = ' ' + normalize(alias) + ' ', start = hay.indexOf(term);
      if (start >= 0) candidates.push({start, end: start + term.length - 1, length: term.length, item});
    }
    // Longest named place wins over a name inside it (e.g. Genzano di Roma ≠ Roma).
    candidates.sort((a,b) => b.length - a.length);
    const chosen = [];
    candidates.forEach(c => {
      if (!chosen.some(x => c.start < x.end && c.end > x.start)) chosen.push(c);
    });
    const unique = [...new Map(chosen.map(c => [JSON.stringify(c.item.filters), c.item])).values()];
    if (unique.length > 1) return {filters:{}, label:'Hai indicato più territori: scegli il territorio nei filtri.', ambiguous:true};
    return unique.length ? {...unique[0], ambiguous:false} : {filters:{},label:'',ambiguous:false};
  }
  function link(id, geo = {filters:{}}) {
    // Both route and geography are allowlisted config values, never raw free text.
    let key = id;
    if (id === 'private' && Object.keys(geo.filters).length) key = 'private-db';
    const r = config.routes[key];
    if (!r) throw new Error('Percorso Menta non configurato');
    const filters = {...(r.filters || {})};
    if (r.page === '/servizi.html') Object.assign(filters, geo.filters);
    if (r.page === '/scuole.html' && geo.filters.provincia) filters.provincia = geo.filters.provincia;
    const params = new URLSearchParams(filters);
    return {id:key,label:r.label,description:r.description,href:r.page + (params.size ? '?' + params.toString() : ''),filtered:Object.keys(filters).length>0};
  }
  function analyse(value) {
    if (!config) throw new Error('Configurazione Menta non disponibile');
    const text = normalize(value), geo = geography(text);
    if (emergency(text)) return {kind:'emergency',intents:[],results:[link('safety'),link('helpline'),...(has(text,'violenza') || has(text,'aggressione') ? [link('violence')] : [])],note:''};
    if (!text) return {kind:'empty',intents:[],results:[],note:'Scrivi un tipo di servizio o scegli “Esplora in autonomia”.'};
    const hits = config.intents.filter(intent => intent.keywords.some(word => has(text,word)))
      .filter(intent => intent.id !== 'private' || !['non privato','non privati','non cerco un privato','non voglio un privato','non voglio privato'].some(p=>has(text,p)))
      .sort((a,b) => b.priority - a.priority);
    const ids = hits.map(i=>i.id), combo = config.combinations.find(c=>c.all.every(id=>ids.includes(id)));
    let targetIds = [], selected = [];
    if (combo) { targetIds = combo.routes; selected = combo.all; }
    else if (hits.length) {
      const top = hits.filter(h=>h.priority >= hits[0].priority - 12);
      selected = top.map(h=>h.id);
      // Show the primary route of each distinct matching intent before supporting guides.
      targetIds = [...top.map(h=>h.routes[0]), ...top.flatMap(h=>h.routes.slice(1))];
    }
    const results = [...new Set(targetIds)].slice(0,4).map(id=>link(id,geo));
    if (!results.length) return {kind:'unknown',intents:[],results:[link('database',geo),link('guides'),link('helpline')],note:'Non ho trovato una corrispondenza precisa. Prova con parole più semplici oppure esplora i servizi.'};
    const notes = selected.map(id=>config.notes[id]).filter(Boolean);
    if (geo.label) notes.push(geo.label + (geo.ambiguous ? '' : '. Il territorio viene applicato ai collegamenti del database compatibili.'));
    return {kind:results.length>1?'choices':'match',intents:selected,results,note:notes.join(' ')};
  }
  const api = {normalize,emergency,geography,link,analyse};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Menta = api;
})(typeof window === 'object' ? window : globalThis);
