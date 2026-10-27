(() => {
  'use strict';
  const valid = ['legends', 'athletes', 'archive'];
  function init() {
    const flow = document.querySelector('[data-hall-page-flow]');
    const links = [...document.querySelectorAll('.hall-hero__nav-item[href^="#"]')];
    if (!flow || links.length !== 3) return;
    const panels = [...flow.querySelectorAll('[data-hall-panel]')];
    const fromLocation = () => valid.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'legends';
    function select(name, scroll = false) {
      if (!valid.includes(name)) name = 'legends';
      flow.dataset.current = name;
      flow.dataset.enhanced = 'true';
      panels.forEach(panel => { panel.hidden = panel.dataset.hallPanel !== name; });
      links.forEach(link => {
        const active = link.getAttribute('href') === '#' + name;
        link.classList.toggle('hall-hero__nav-item--active', active);
        if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
      if (scroll) panels.find(panel => panel.dataset.hallPanel === name)?.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'});
    }
    links.forEach(link => link.addEventListener('click', event => {
      const name = link.getAttribute('href').slice(1);
      if (!valid.includes(name)) return;
      event.preventDefault();
      select(name, true);
      if (location.hash !== '#' + name) history.pushState(null, '', '#' + name);
    }));
    window.addEventListener('popstate', () => select(fromLocation(), true));
    window.addEventListener('hashchange', () => select(fromLocation(), true));
    select(fromLocation());
    if (location.hash && valid.includes(location.hash.slice(1))) requestAnimationFrame(() => panels.find(p => p.dataset.hallPanel === fromLocation())?.scrollIntoView({behavior:'instant',block:'start'}));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true}); else init();
})();
