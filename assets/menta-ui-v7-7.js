/* Progressive UI: static routes only; never interpolate, persist or transmit the input. */
(function () {
  'use strict';
  const form = document.getElementById('menta-form');
  if (!form) return;
  const input = document.getElementById('menta-query');
  const submit = document.getElementById('menta-submit');
  const results = document.getElementById('menta-results');
  const heading = document.getElementById('menta-results-title');
  const list = document.getElementById('menta-options');
  const note = document.getElementById('menta-note');
  const status = document.getElementById('menta-status');
  const urgent = document.getElementById('menta-urgent');
  const fallback = document.getElementById('menta-fallback');
  let urgentShown = false;
  const visual = state => document.dispatchEvent(new CustomEvent('menta:state', {detail:{state}}));
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!window.Menta || !window.MentaConfig) { fallback.hidden = false; visual('error'); return; }
    present(true);
  });
  if (!window.Menta || !window.MentaConfig) return;
  function clear() {
    input.value = '';
    list.replaceChildren();
    note.textContent = '';
    status.textContent = '';
    results.hidden = true;
    urgent.hidden = true;
    urgentShown = false;
    document.getElementById('menta').classList.remove('menta-crisis');
    visual('idle');
  }
  function crisis(show, moveFocus) {
    urgent.hidden = !show;
    urgentShown = show;
    document.getElementById("menta").classList.toggle("menta-crisis",show);
    if (show) {
      visual('urgent');
      results.hidden = true;
      status.textContent = '';
      if (moveFocus) document.getElementById('menta-urgent-title').focus();
    }
  }
  function present(moveFocus) {
    try {
      visual('searching');
      const outcome = window.Menta.analyse(input.value);
      if (outcome.kind === 'emergency') { crisis(true, moveFocus); return; }
      crisis(false, false);
      if (outcome.kind === 'empty') {
        results.hidden = true;
        status.textContent = outcome.note;
        visual('empty');
        input.focus();
        return;
      }
      heading.textContent = outcome.kind === 'unknown' ? 'Non ho trovato una corrispondenza precisa.'
        : outcome.kind === 'choices' ? 'Potresti cercare…' : 'Un punto da cui partire';
      note.textContent = outcome.note || 'Scegli il collegamento da aprire. Puoi sempre modificare i filtri o esplorare in autonomia.';
      const fragment = document.createDocumentFragment();
      outcome.results.forEach(function (route) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'menta-option';
        link.href = route.href;
        const title = document.createElement('strong');
        title.textContent = route.label;
        const description = document.createElement('span');
        description.textContent = route.description;
        const cue = document.createElement('span');
        cue.className = 'menta-option-cue';
        cue.textContent = route.filtered ? 'Apri con i filtri →' : 'Apri la sezione →';
        link.append(title, description, cue);
        item.append(link);
        fragment.append(item);
      });
      list.replaceChildren(fragment);
      results.dataset.state = outcome.kind;
      results.hidden = false;
      visual(outcome.kind === 'unknown' ? 'empty' : outcome.kind === 'choices' ? 'choice' : 'found');
      status.textContent = outcome.results.length + (outcome.results.length === 1 ? ' percorso disponibile.' : ' percorsi disponibili.');
      if (moveFocus) heading.focus();
    } catch (_) {
      // Deliberately do not report the query or exception to any remote service.
      results.hidden = true;
      fallback.hidden = false;
      status.textContent = 'L’orientamento non è disponibile. Puoi aprire direttamente Trova un servizio.';
      visual('error');
    }
  }
  input.addEventListener('input', function (event) {
    if (event.isComposing) return;
    const danger = window.Menta.emergency(input.value);
    if (danger) crisis(true, false);
    else if (urgentShown) crisis(false, false);
    if (!danger) {
      results.hidden = true;
      status.textContent = '';
      visual(input.value.trim() ? 'listening' : 'idle');
    }
  });
  input.addEventListener('compositionend', function () {
    if (window.Menta.emergency(input.value)) crisis(true, false);
    else visual(input.value.trim() ? 'listening' : 'idle');
  });
  input.addEventListener('focus', function () {
    if (!urgentShown && results.hidden) visual(input.value.trim() ? 'listening' : 'idle');
  });
  document.querySelectorAll('[data-menta-example]').forEach(function (button) {
    button.disabled = false;
    button.addEventListener('click', function () {
      input.value = button.dataset.mentaExample;
      present(true);
    });
  });
  document.getElementById('menta-reset').addEventListener('click', function () { clear(); input.focus(); });
  // Avoid keeping needs in the back/forward cache or restored form values.
  window.addEventListener('pagehide', clear);
  window.addEventListener('pageshow', function (event) { if (event.persisted) clear(); });
  clear();
  input.disabled = false;
  submit.disabled = false;
  fallback.hidden = true;
})();
