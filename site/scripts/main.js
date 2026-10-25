(() => {
  'use strict';

  async function mount(id, url) {
    const target = document.getElementById(id);
    if (!target) return;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      target.innerHTML = await response.text();
    } catch (error) {
      console.warn(`Не удалось загрузить компонент ${url}:`, error);
    }
  }

  // Структура и обработчики меню перенесены из проверенной схемы Landshaft Park.
  function initHeader() {
    const header = document.querySelector('.header');
    const burger = header?.querySelector('.header__burger');
    const menu = header?.querySelector('.mobile-menu');
    if (!header || !burger || !menu) return;

    const closeMenu = () => {
      header.classList.remove('is-active');
      document.body.classList.remove('lock');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Открыть меню');
      menu.setAttribute('aria-hidden', 'true');
    };

    burger.addEventListener('click', () => {
      const isActive = header.classList.toggle('is-active');
      if (isActive) header.classList.remove('is-hidden');
      document.body.classList.toggle('lock', isActive);
      burger.setAttribute('aria-expanded', String(isActive));
      burger.setAttribute('aria-label', isActive ? 'Закрыть меню' : 'Открыть меню');
      menu.setAttribute('aria-hidden', String(!isActive));
    });

    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
    window.matchMedia('(min-width: 1181px)').addEventListener('change', (event) => {
      if (event.matches) closeMenu();
    });

    // Как в Landshaft Park: вниз — скрываем, вверх — показываем.
    let lastScrollY = Math.max(window.scrollY, 0);
    let ticking = false;
    const updateScroll = () => {
      const y = Math.max(window.scrollY, 0);
      const delta = y - lastScrollY;
      if (header.classList.contains('is-active') || y <= 12) {
        header.classList.remove('is-hidden');
      } else if (Math.abs(delta) >= 6) {
        header.classList.toggle('is-hidden', delta > 0);
      }
      if (Math.abs(delta) >= 6 || y <= 12) lastScrollY = y;
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateScroll);
    }, { passive: true });

    // Текущая страница в навигации.
    const current = window.location.pathname;
    header.querySelectorAll('.header__nav a, .mobile-menu__nav a').forEach((link) => {
      const url = new URL(link.href, window.location.origin);
      if (url.pathname === current && !url.hash) {
        link.classList.add('is-current');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function initCountdown() {
    const timer = document.getElementById('hero-countdown');
    if (!timer) return;

    const targetDate = timer.dataset.target;
    if (!targetDate) return;

    const target = new Date(targetDate).getTime();
    if (!Number.isFinite(target)) return;

    const nodes = Object.fromEntries(
      ['days', 'hours', 'minutes', 'seconds'].map((name) => [
        name,
        timer.querySelector(`[data-time="${name}"]`),
      ]),
    );

    let interval = null;
    function update() {
      const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000));
      const values = {
        days: Math.floor(remaining / 86400),
        hours: Math.floor((remaining % 86400) / 3600),
        minutes: Math.floor((remaining % 3600) / 60),
        seconds: remaining % 60,
      };

      Object.entries(values).forEach(([name, value]) => {
        if (nodes[name]) nodes[name].textContent = String(value).padStart(2, '0');
      });

      if (remaining === 0) {
        timer.setAttribute('aria-label', 'Дата начала соревнований наступила');
        if (interval !== null) clearInterval(interval);
      }
    }

    update();
    if (target > Date.now()) interval = setInterval(update, 1000);
  }


  function initAchievements() {
    const section = document.querySelector('.achievements');
    if (!section) return;
    const values = [...section.querySelectorAll('[data-count]')];
    if (!values.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const animate = (node) => {
      const end = Number(node.dataset.count);
      if (!Number.isFinite(end)) return;
      const suffix = node.dataset.suffix || '';
      const start = performance.now();
      const duration = 1600;
      function frame(time) {
        const progress = Math.min(1, (time - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        node.textContent = `${Math.round(end * eased)}${suffix}`;
        if (progress < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.35 });
    values.forEach((value) => observer.observe(value));
  }


  function initAthletesCarousel() {
    const track = document.querySelector('[data-athletes-track]');
    const prev = document.querySelector('[data-athletes-prev]');
    const next = document.querySelector('[data-athletes-next]');
    if (!track || !prev || !next) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function cardStep() {
      const card = track.querySelector('.athlete-card');
      if (!card) return track.clientWidth;
      const gap = Number.parseFloat(getComputedStyle(track).gap) || 0;
      return card.getBoundingClientRect().width + gap;
    }

    function updateControls() {
      const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= maxScroll - 2;
    }

    prev.addEventListener('click', () => {
      track.scrollBy({ left: -cardStep(), behavior: reducedMotion ? 'auto' : 'smooth' });
    });

    next.addEventListener('click', () => {
      track.scrollBy({ left: cardStep(), behavior: reducedMotion ? 'auto' : 'smooth' });
    });

    track.addEventListener('scroll', updateControls, { passive: true });
    window.addEventListener('resize', updateControls);
    updateControls();
  }


  // Смена цвета ОБЩЕГО фона по принципу Estetic Club.
  // Не используем градиенты или маски поверх соседних секций.
  function initHallOfFameFlow() {
    const wrapper = document.querySelector('[data-hall-flow]');
    const hall = wrapper?.querySelector('.hall-of-fame');
    if (!wrapper || !hall) return;

    const light = [251, 250, 248];
    const dark = [8, 13, 22];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const clamp = (value) => Math.min(1, Math.max(0, value));
    const smooth = (value) => value * value * (3 - 2 * value);
    let queued = false;

    function update() {
      const top = hall.getBoundingClientRect().top;
      const vh = window.innerHeight;
      // Переход начинается, когда Зал славы приближается снизу,
      // и заканчивается уже внутри секции. Участок длиной ~1 viewport.
      const progress = reducedMotion.matches
        ? (top < vh * .45 ? 1 : 0)
        : smooth(clamp((vh * .95 - top) / (vh * 1.05)));
      const rgb = light.map((value, i) => Math.round(value + (dark[i] - value) * progress));

      wrapper.style.setProperty('--hall-flow-bg', `rgb(${rgb.join(', ')})`);
      wrapper.style.setProperty('--hall-photo-opacity', String(smooth(clamp((progress - .18) / .82))));
      wrapper.style.setProperty('--hall-content-opacity', String(smooth(clamp((progress - .36) / .64))));
      queued = false;
    }

    function scheduleUpdate() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    reducedMotion.addEventListener('change', scheduleUpdate);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
      mount('site-header', '/components/header.html?v=landshaft-1'),
      mount('site-footer', '/components/footer.html'),
    ]);
    initHeader();
    initCountdown();
    initAchievements();
    initAthletesCarousel();
    initHallOfFameFlow();
  });
})();
