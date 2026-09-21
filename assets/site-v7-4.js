/* Funzioni progressive: contenuti e dataset originali preservati. Revisione UI 7.5.1. */
(function () {
  'use strict';
  function notice(text) {
    var box = document.getElementById('toast');
    if (!box) { box = document.createElement('div'); box.id = 'toast'; box.className = 'toast'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
    box.textContent = text; box.hidden = false;
    clearTimeout(notice.timer); notice.timer = setTimeout(function () { box.hidden = true; }, 5500);
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea'); area.value = text;
      area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.left = '-9999px';
      document.body.appendChild(area); area.select();
      try { var ok = document.execCommand('copy'); area.remove(); ok ? resolve() : reject(new Error('copy')); }
      catch (err) { area.remove(); reject(err); }
    });
  }
  document.addEventListener('click', function (event) {
    var target = event.target.closest('[data-print], [data-share]');
    if (!target) return;
    if (target.hasAttribute('data-print')) { window.print(); return; }
    var url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url: url }).catch(function (err) {
        if (err.name !== 'AbortError') copy(url).then(function () { notice('Collegamento copiato.'); }).catch(function () { notice('Copia il collegamento dalla barra degli indirizzi.'); });
      });
    } else {
      copy(url).then(function () { notice('Collegamento copiato.'); }).catch(function () { notice('Copia il collegamento dalla barra degli indirizzi.'); });
    }
  });
  var tools = document.querySelector('[data-directory-tools]');
  var search = document.getElementById('directory-search'), category = document.getElementById('directory-category');
  // V7.5 directories own their filters. Do not attach legacy handlers to an absent select.
  if (tools && search && category && document.getElementById('result-count')) {
    var cards = Array.from(document.querySelectorAll('[data-entry]'));
    function normalize(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
    function update() {
      var query = normalize(search.value.trim()), count = 0;
      cards.forEach(function (card) {
        var show = (!query || normalize(card.dataset.search).includes(query)) && (!category.value || card.dataset.category === category.value);
        card.hidden = !show; if (show) count++;
      });
      document.getElementById('result-count').textContent = count + ' di ' + cards.length + ' schede mostrate.';
      var empty = document.querySelector('.empty-result'); if (empty) empty.hidden = count !== 0;
    }
    tools.hidden = false; search.addEventListener('input', update); category.addEventListener('change', update);
    var reset = tools.querySelector('[data-reset]');
    if (reset) reset.addEventListener('click', function () { search.value = ''; category.value = ''; update(); search.focus(); });
    update();
  }
  // Compatibility for unchanged, versioned V7.4 documents: update visible vocabulary and routes only.
  function wording(s) { return s.replace(/\bArchivio\b/g, 'Database').replace(/\barchivio\b/g, 'database'); }
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), node;
  while ((node = walker.nextNode())) {
    if (node.parentElement && !node.parentElement.closest('script,style,code,pre,textarea,[data-preserve-original]')) node.nodeValue = wording(node.nodeValue);
  }
  document.title = wording(document.title);
  document.querySelectorAll('meta[name="description"],meta[property="og:description"]').forEach(function(el){el.content=wording(el.content);});
  document.querySelectorAll('a[href],form[action]').forEach(function(el){
    var attr = el.tagName === 'FORM' ? 'action' : 'href', value = el.getAttribute(attr);
    try {
      var u = new URL(value, document.baseURI);
      if (u.origin === new URL(document.baseURI).origin && /^\/archivio(?:\.html)?\/?$/.test(u.pathname)) {
        el.setAttribute(attr, '/servizi.html' + u.search + u.hash);
        if (el.closest('.site-header nav') && el.tagName === 'A') el.textContent = 'Trova un servizio';
      }
    } catch (err) { /* Keep non-URL actions untouched. */ }
  });
  var path = new URL(document.baseURI).pathname.replace(/\.html$/, '').replace(/\/$/, '');
  var maps = {
    '/studenti': [['/universita.html', 'Servizi universitari'], ['/scuole.html', 'Sportelli scolastici']],
    '/ascolto': [['/helpline.html', 'Tutte le helpline'], ['/centri-ascolto.html', 'Centri e sportelli di ascolto']],
    '/glossario': [['/orientamento-servizi.html', 'Schede di orientamento ai servizi']],
    '/documenti': [['/downloads/Note_Rilascio_V7_5_1.txt', 'Novità di Trova un servizio'], ['/downloads/Verifiche_UI_V7_5_1.json', 'Verifiche interfaccia V7.5.1']],
    '/metodo': [['/servizi.html', 'Database dei servizi'], ['/downloads/Note_Rilascio_V7_5_1.txt', 'Metodo del restyling V7.5.1']]
  };
  if (maps[path] && !document.getElementById('service-links')) {
    var nav = document.createElement('nav'); nav.id = 'service-links'; nav.className = 'actions'; nav.setAttribute('aria-label','Sezioni collegate');
    maps[path].forEach(function(item){var a=document.createElement('a');a.className='button secondary';a.href=item[0];a.textContent=item[1]+' →';nav.appendChild(a);});
    var lead=document.querySelector('.page-lead'),main=document.querySelector('main');
    if (lead) lead.insertAdjacentElement('afterend',nav); else if(main)main.insertBefore(nav,main.firstChild);
  }
}());
