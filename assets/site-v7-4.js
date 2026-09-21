/* Funzioni progressive: i contenuti restano leggibili senza JavaScript. */
(function () {
  'use strict';
  function notice(text) {
    var box = document.getElementById('toast');
    if (!box) { box = document.createElement('div'); box.id = 'toast'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
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
  if (tools) {
    var search = document.getElementById('directory-search'), category = document.getElementById('directory-category');
    var cards = Array.from(document.querySelectorAll('[data-entry]'));
    function normalize(value) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
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
    tools.querySelector('[data-reset]').addEventListener('click', function () { search.value = ''; category.value = ''; update(); search.focus(); });
    update();
  }
}());
