(() => {
  'use strict';

  // Аналог initHallOfFameFlow() с главной: фон меняет единая поверхность,
  // а не градиент или маска поверх соседних секций.
  function initArchiveFlow() {
    const surface = document.querySelector('[data-hall-page-flow]');
    const archive = surface?.querySelector('.hall-archive');
    if (!surface || !archive) return;

    const light = [251, 250, 248];
    const dark = [8, 15, 28]; // Совпадает с фоном общего Footer.
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const clamp = (n) => Math.max(0, Math.min(1, n));
    const smooth = (n) => n * n * (3 - 2 * n);
    let queued = false;

    function update() {
      const vh = window.innerHeight;
      const rect = archive.getBoundingClientRect();
      // Начинаем затемнять ещё в нижней части «Легенд»; при входе в архив
      // общая поверхность уже почти тёмная. Стык секций не виден.
      const progress = smooth(clamp((vh * 0.95 - rect.top) / (vh * 1.02)));
      const darkness = reducedMotion.matches ? (rect.top < vh * 0.65 ? 1 : 0) : progress;
      const color = light.map((from, i) => Math.round(from + (dark[i] - from) * darkness));
      const visibility = reducedMotion.matches ? darkness : smooth(clamp((progress - 0.16) / 0.78));

      surface.style.setProperty('--hall-page-bg', `rgb(${color.join(', ')})`);
      surface.style.setProperty('--hall-archive-image-opacity', String(visibility));
      surface.style.setProperty('--hall-archive-content-opacity', String(visibility));
      queued = false;
    }

    function schedule() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    reducedMotion.addEventListener('change', schedule);
  }

  // Переключаем подсветку двух существующих якорей по скроллу.
  function initHallNav() {
    const links = [...document.querySelectorAll('.hall-hero__nav-item[href^="#"]')];
    if (!links.length || !('IntersectionObserver' in window)) return;
    const targets = links.map((link) => document.querySelector(link.getAttribute('href')));
    const setCurrent = (target) => {
      links.forEach((link, index) => {
        const active = targets[index] === target;
        link.classList.toggle('hall-hero__nav-item--active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setCurrent(entry.target);
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    targets.filter(Boolean).forEach((target) => observer.observe(target));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initArchiveFlow(); initHallNav(); }, { once: true });
  } else {
    initArchiveFlow();
    initHallNav();
  }
})();
