(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches || navigator.connection?.saveData) return;

  if ('IntersectionObserver' in window) {
    const targets = document.querySelectorAll('.audience-photo, .pallet, .steps');
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, {threshold: .18, rootMargin: '0px 0px -24px 0px'});
    document.documentElement.classList.add('motion-ready');
    targets.forEach((target) => observer.observe(target));
  }

  // A short pulse confirms a changed quantity or price; no animation runs at rest.
  for (const id of ['quantity', 'total', 'sticky-total']) {
    const element = document.getElementById(id);
    if (!element) continue;
    let previous = element.textContent;
    new MutationObserver(() => {
      const current = element.textContent;
      if (current === previous) return;
      previous = current;
      if (reducedMotion.matches || document.hidden || !element.animate) return;
      element.animate([
        {opacity: .55, transform: 'translateY(5px)'},
        {opacity: 1, transform: 'translateY(0)'}
      ], {duration: 260, easing: 'cubic-bezier(.2,.75,.25,1)'});
    }).observe(element, {childList: true, characterData: true, subtree: true});
  }
})();
