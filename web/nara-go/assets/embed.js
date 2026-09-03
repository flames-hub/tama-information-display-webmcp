(() => {
  'use strict';

  document.body.classList.add('tama-info-embedded');

  const notifyActivity = () => {
    if (window.parent === window) return;
    window.parent.postMessage({ type: 'tama-info:activity' }, window.location.origin);
  };

  ['pointerdown', 'keydown', 'wheel', 'scroll'].forEach((eventName) => {
    document.addEventListener(eventName, notifyActivity, { passive: true });
  });
})();
