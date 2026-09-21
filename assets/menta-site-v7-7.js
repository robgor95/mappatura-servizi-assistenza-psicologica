/* Non-interactive contextual helpers. No search text is read on other pages. */
(function () {
  'use strict';
  const load = document.getElementById('svc-load-status');
  const error = document.getElementById('menta-service-error');
  if (load && error) {
    const update = () => { error.hidden = !load.classList.contains('error'); };
    new MutationObserver(update).observe(load, {attributes:true,attributeFilter:['class']});
    update();
  }
  document.querySelectorAll('[data-menta-retry]').forEach(button => {
    button.addEventListener('click', () => location.reload());
  });
})();
