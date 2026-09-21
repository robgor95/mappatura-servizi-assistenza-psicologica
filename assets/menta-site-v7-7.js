/* Contextual Menta motion. No network, storage, analytics or free-text logging. */
(function () {
  'use strict';
  const validStates = new Set(['idle','listening','searching','found','choice','empty','urgent','error','ambient']);

  function setFigureState(figure, state) {
    if (!figure || !validStates.has(state)) return;
    figure.dataset.state = state;
  }

  function setHomeState(state) {
    const home = document.getElementById('menta');
    if (!home || !validStates.has(state)) return;
    home.dataset.mentaState = state;
    home.querySelectorAll('.menta-figure').forEach(figure => setFigureState(figure, state));
  }

  document.querySelectorAll('.menta-figure').forEach(figure => {
    if (figure.dataset.state) return;
    setFigureState(figure, figure.dataset.variant === 'welcome' ? 'idle' : 'ambient');
  });

  if (document.body.classList.contains('page-404') || location.pathname.endsWith('/404.html')) {
    document.querySelectorAll('.menta-figure').forEach(figure => setFigureState(figure, 'error'));
  }

  document.addEventListener('menta:state', event => {
    const state = event && event.detail && event.detail.state;
    if (validStates.has(state)) setHomeState(state);
  });

  const load = document.getElementById('svc-load-status');
  const error = document.getElementById('menta-service-error');
  if (load && error) {
    const update = () => {
      const show = load.classList.contains('error');
      error.hidden = !show;
      const figure = error.querySelector('.menta-figure');
      if (figure) setFigureState(figure, show ? 'error' : 'ambient');
    };
    new MutationObserver(update).observe(load, {attributes:true,attributeFilter:['class']});
    update();
  }

  document.querySelectorAll('[data-menta-retry]').forEach(button => {
    button.addEventListener('click', () => location.reload());
  });
})();
