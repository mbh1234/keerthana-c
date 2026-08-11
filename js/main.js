/* Interactions — perf-conscious: no idle animation loops. */
(function () {
  const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

  // ---- rotating role word ----
  const rot = document.getElementById('rot');
  if (rot) {
    // EDIT: swap these for the things you actually build/do
    const words = ['things', 'from scratch', 'for the web', 'that ship', 'that work'];
    let i = 0;
    setInterval(() => {
      rot.classList.add('out');
      setTimeout(() => { i = (i + 1) % words.length; rot.textContent = words[i]; rot.classList.remove('out'); }, 320);
    }, 2600);
  }

  // ---- hero cursor glow: a soft light that follows the pointer, CSS-driven (no canvas/idle loop) ----
  const heroGlow = document.querySelector('.hero-glow');
  const hero = document.getElementById('hero');
  if (heroGlow && hero && matchMedia('(hover:hover) and (pointer:fine)').matches) {
    let queued = false, px = 0, py = 0;
    const apply = () => {
      queued = false;
      heroGlow.style.setProperty('--mx', px + 'px');
      heroGlow.style.setProperty('--my', py + 'px');
    };
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      px = e.clientX - r.left; py = e.clientY - r.top;
      if (!queued) { queued = true; requestAnimationFrame(apply); }
    }, { passive: true });
    hero.addEventListener('pointerenter', () => hero.classList.add('glow-active'));
    hero.addEventListener('pointerleave', () => hero.classList.remove('glow-active'));
  }

  // ---- scroll reveal ----
  const io = new IntersectionObserver((es) => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // ---- counters ----
  const fmt = n => n.toLocaleString('en-US');
  const cIO = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1300;
      const tick = t => { const p = Math.min(1, (t - t0) / dur); el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3)))) + suf; if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick); cIO.unobserve(el);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(el => cIO.observe(el));

  // ---- nav active + invert over dark sections (rAF-throttled, no layout thrash) ----
  const nav = document.getElementById('nav');
  const sections = [...document.querySelectorAll('main section[id]')];
  const links = [...document.querySelectorAll('.nav-links a')];
  let ticking = false;
  function update() {
    ticking = false;
    let cur = sections[0];
    for (const s of sections) if (s.getBoundingClientRect().top <= 56) cur = s;
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur.id));
    nav.classList.toggle('on-dark', cur.classList.contains('dark'));
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();

  // ---- mobile menu ----
  const toggle = document.getElementById('navToggle'), menu = document.getElementById('navLinks');
  toggle.addEventListener('click', () => { menu.classList.toggle('open'); toggle.classList.toggle('open'); });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { menu.classList.remove('open'); toggle.classList.remove('open'); }));

  // ---- magnetic buttons (fine pointers only) ----
  if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * 0.22}px,${(e.clientY - (r.top + r.height / 2)) * 0.28}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }




  // ---- project media: accept .jpg/.png/.gif/.webp, or .mp4/.webm as a looping video ----
  function resolveMedia(img) {
    const base = img.dataset.base;
    if (!base) return;
    const exts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    let i = 0;
    img.addEventListener('error', function next() {
      i++;
      if (i < exts.length) { img.src = `${base}.${exts[i]}`; return; }
      // no still image found — try video, else show the placeholder
      const vid = document.createElement('video');
      vid.className = 'gimg pmedia';
      vid.autoplay = true; vid.muted = true; vid.loop = true; vid.playsInline = true;
      vid.setAttribute('muted', ''); vid.setAttribute('playsinline', '');
      let vi = 0; const vexts = ['mp4', 'webm'];
      vid.addEventListener('error', () => {
        vi++;
        if (vi < vexts.length) { vid.src = `${base}.${vexts[vi]}`; return; }
        const box = vid.closest('.proj-media'); if (box) { box.classList.add('empty'); vid.remove(); }
      });
      vid.src = `${base}.${vexts[0]}`;
      const box = img.closest('.proj-media');
      if (box) { box.appendChild(vid); img.remove(); }
    });
  }
  document.querySelectorAll('img.pmedia').forEach(resolveMedia);


  // ---- lazy-load project videos: fetch only when the card scrolls into view ----
  const lazyVideo = new IntersectionObserver((es) => {
    es.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) {
        if (!v.src && v.dataset.src) v.src = v.dataset.src;
        v.play?.().catch(() => {});
      } else { v.pause?.(); }
    });
  }, { rootMargin: '300px' });
  document.querySelectorAll('video[data-src]').forEach(v => lazyVideo.observe(v));


  // ---- inline show-more toggles: project detail, older news, extended bio, etc. ----
  document.querySelectorAll('.show-more-toggle').forEach(btn => {
    const target = document.getElementById(btn.dataset.target);
    if (!target) return;
    btn.addEventListener('click', () => {
      const willShow = target.hidden;
      target.hidden = !willShow;
      btn.textContent = willShow ? '···· show less ····' : '···· show more ····';
    });
  });

  console.log('%cKeerthana Chirumamilla', 'font:600 22px "Space Grotesk",sans-serif');
})();
