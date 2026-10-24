(() => {
  'use strict';

  /* ---------------------------------------------------------
     Personalise here
     --------------------------------------------------------- */
  const CONFIG = {
    name: 'آلاء',
    signature: 'حبيبك للأبد، يوسف',
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const isMobile = matchMedia('(max-width: 768px)').matches;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HEART_COLORS = ['#8E1F33', '#B23A52', '#C2546B', '#E8B4B8', '#6E1423'];
  const rand = (a, b) => a + Math.random() * (b - a);

  $$('[data-name]').forEach(el => { el.textContent = CONFIG.name; });
  $$('[data-signature]').forEach(el => { el.textContent = CONFIG.signature; });

  // Without GSAP (offline), still let her in and read everything.
  if (!window.gsap || !window.ScrollTrigger) {
    $('#openBtn').addEventListener('click', () => {
      $('#gate').remove(); $('#intro').remove(); $$('.curtain').forEach(c => c.remove());
      $$('.wish-msg > *').forEach(el => { el.style.opacity = 1; el.style.visibility = 'visible'; });
      document.documentElement.classList.remove('is-locked');
      $('#song').play().catch(() => {});
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------------------------------------------------------
     Falling rose petals
     --------------------------------------------------------- */
  const Petals = (() => {
    const canvas = $('#petals');
    const ctx = canvas.getContext('2d');
    const colors = ['#8E1F33', '#6E1423', '#B23A52', '#D98A98', '#E8B4B8'];
    const base = reduceMotion ? 6 : (isMobile ? 16 : 32);
    let w, h, dpr, petals = [];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
    }

    function make(anywhere) {
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : -20 * dpr,
        s: rand(5, 12) * dpr,
        vy: rand(0.35, 1.1) * dpr,
        vx: rand(-0.2, 0.2) * dpr,
        rot: Math.random() * Math.PI * 2,
        vr: rand(-0.02, 0.02),
        sway: Math.random() * Math.PI * 2,
        flip: Math.random() * Math.PI * 2,
        color: colors[(Math.random() * colors.length) | 0],
        a: rand(0.5, 0.9),
      };
    }

    function draw(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.abs(Math.cos(p.flip)) * 0.7 + 0.3);
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -p.s);
      ctx.bezierCurveTo(p.s * 0.9, -p.s * 0.6, p.s * 0.7, p.s * 0.6, 0, p.s);
      ctx.bezierCurveTo(-p.s * 0.7, p.s * 0.6, -p.s * 0.9, -p.s * 0.6, 0, -p.s);
      ctx.fill();
      ctx.restore();
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      if (petals.length < base && Math.random() < 0.08) petals.push(make(false));
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        p.sway += 0.015; p.flip += 0.02; p.rot += p.vr;
        p.x += p.vx + Math.sin(p.sway) * 0.6 * dpr;
        p.y += p.vy;
        if (p.y > h + 30 * dpr || p.x < -40 * dpr || p.x > w + 40 * dpr) {
          if (petals.length > base) { petals.splice(i, 1); continue; }
          Object.assign(p, make(false));
        }
        draw(p);
      }
      requestAnimationFrame(tick);
    }

    resize();
    addEventListener('resize', resize);
    for (let i = 0; i < base * 0.5; i++) petals.push(make(true));
    tick();

    return { burst(n) { for (let i = 0; i < n; i++) petals.push(make(true)); } };
  })();

  /* ---------------------------------------------------------
     Hearts
     --------------------------------------------------------- */
  function heartEl(cls) {
    const el = document.createElement('span');
    el.className = cls;
    el.innerHTML = '<svg viewBox="0 0 24 24"><use href="#heart"/></svg>';
    el.style.color = HEART_COLORS[(Math.random() * HEART_COLORS.length) | 0];
    document.body.appendChild(el);
    return el;
  }

  function heartBurst(x, y, n) {
    for (let i = 0; i < n; i++) {
      const el = heartEl('burst-heart');
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      const a = Math.random() * Math.PI * 2;
      const d = rand(80, isMobile ? 200 : 320);
      gsap.fromTo(el, { x: 0, y: 0, scale: 0 }, {
        x: Math.cos(a) * d, y: Math.sin(a) * d - 80,
        scale: rand(0.6, 1.6), rotate: rand(-60, 60),
        duration: rand(1.4, 2.4), ease: 'power3.out',
        onComplete: () => el.remove(),
      });
      gsap.to(el, { opacity: 0, duration: 0.6, delay: rand(1, 1.8) });
    }
  }

  let started = false;
  document.addEventListener('pointerdown', e => {
    if (!started || e.target.closest('button, a')) return;
    const el = heartEl('tap-heart');
    el.style.left = e.clientX + 'px';
    el.style.top = e.clientY + 'px';
    gsap.fromTo(el, { scale: 0, opacity: 1 }, {
      scale: rand(0.8, 1.3), y: -rand(70, 130), x: rand(-30, 30), opacity: 0,
      duration: 1.4, ease: 'power2.out', onComplete: () => el.remove(),
    });
  });

  /* ---------------------------------------------------------
     Music
     --------------------------------------------------------- */
  const audio = $('#song');
  const musicBtn = $('#musicBtn');
  const VOLUME = 0.85;

  function setMusicUI(on) {
    musicBtn.classList.toggle('is-playing', on);
    musicBtn.setAttribute('aria-pressed', String(on));
  }

  function playSong(fade) {
    if (fade) audio.volume = 0;
    const p = audio.play();
    const onPlay = () => {
      setMusicUI(true);
      if (fade) gsap.to(audio, { volume: VOLUME, duration: 5, ease: 'sine.inOut' });
    };
    if (p && p.then) p.then(onPlay).catch(() => setMusicUI(false));
    else onPlay();
  }

  musicBtn.addEventListener('click', () => {
    if (audio.paused) { audio.volume = VOLUME; playSong(false); }
    else { audio.pause(); setMusicUI(false); }
  });

  let wasPlaying = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { wasPlaying = !audio.paused; audio.pause(); }
    else if (wasPlaying) playSong(false);
  });

  /* ---------------------------------------------------------
     A rose that blooms, built from petals
     --------------------------------------------------------- */
  const PETAL = 'M0 0 C -30 -4 -34 -44 0 -52 C 34 -44 30 -4 0 0Z';
  const RINGS = [
    { n: 8, s: 1, o: 0, f: 'url(#petal1)' },
    { n: 7, s: 0.8, o: 24, f: 'url(#petal2)' },
    { n: 6, s: 0.62, o: 8, f: 'url(#petal1)' },
    { n: 5, s: 0.45, o: 40, f: 'url(#petal3)' },
    { n: 4, s: 0.28, o: 12, f: 'url(#petal3)' },
  ];

  function buildBloom(group) {
    const ns = 'http://www.w3.org/2000/svg';
    const petals = [];
    RINGS.forEach(r => {
      for (let i = 0; i < r.n; i++) {
        const g = document.createElementNS(ns, 'g');
        g.setAttribute('transform', `rotate(${r.o + (i * 360) / r.n})`);
        const p = document.createElementNS(ns, 'path');
        p.setAttribute('d', PETAL);
        p.setAttribute('fill', r.f);
        p.setAttribute('stroke', 'rgba(62, 9, 18, .35)');
        p.setAttribute('stroke-width', '.6');
        p.dataset.s = r.s;
        g.appendChild(p);
        group.appendChild(g);
        petals.push(p);
      }
    });
    const core = document.createElementNS(ns, 'circle');
    core.setAttribute('r', '5');
    core.setAttribute('fill', '#3E0912');
    group.appendChild(core);
    // inner petals open first, the outer ones unfold last
    petals.reverse();
    gsap.set(petals, { transformOrigin: '50% 100%', scale: 0 });
    gsap.set(core, { transformOrigin: '50% 50%', scale: 0 });
    return { petals, core, scaleOf: i => +petals[i].dataset.s };
  }

  /* ---------------------------------------------------------
     Gate → intro → curtains
     --------------------------------------------------------- */
  const gateBloom = buildBloom($('#gateBloom'));
  gsap.timeline({ delay: 0.3 })
    .to(gateBloom.core, { scale: 1, duration: 0.4 })
    .to(gateBloom.petals, {
      scale: gateBloom.scaleOf, rotate: 0, duration: 1.3,
      stagger: 0.035, ease: 'back.out(1.5)',
    }, '<')
    .from('.gate__content > *:not(.gate__rose)', {
      y: 24, autoAlpha: 0, duration: 1, stagger: 0.15, ease: 'power3.out',
    }, '-=0.8');

  function unlock() {
    document.documentElement.classList.remove('is-locked');
    window.scrollTo(0, 0);
    started = true;
    ScrollTrigger.refresh();
    gsap.to('.music', { autoAlpha: 1, duration: 0.8 });
  }

  function heroIn() {
    return gsap.timeline()
      .from('.hero__rose', { scale: 0.3, autoAlpha: 0, rotate: -40, duration: 1.8, stagger: 0.12, ease: 'power3.out' }, 0)
      .from('.hero__title .li', { yPercent: 115, duration: 1.4, stagger: 0.15, ease: 'power4.out' }, 0.2)
      .from('.hero__kicker, .hero__name, .scroll-hint > *', {
        autoAlpha: 0, y: 24, filter: 'blur(6px)', duration: 1.1, stagger: 0.15, ease: 'power3.out',
      }, 0.8);
  }

  $('#openBtn').addEventListener('click', () => {
    playSong(true);
    const lines = $$('.intro__line');
    const tl = gsap.timeline();
    tl.to('.gate__content', { autoAlpha: 0, y: -24, duration: 0.7, ease: 'power2.in' })
      .to('#gate', { autoAlpha: 0, duration: 0.8, onComplete: () => $('#gate').remove() })
      .set('.intro', { autoAlpha: 1 });

    lines.forEach(line => {
      tl.fromTo(line, { autoAlpha: 0, y: 30, filter: 'blur(10px)' },
        { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 1.3, ease: 'power2.out' })
        .to(line, { autoAlpha: 0, y: -20, filter: 'blur(8px)', duration: 0.9, ease: 'power2.in' }, '+=1.7');
    });

    tl.addLabel('open')
      .to('.intro', { autoAlpha: 0, duration: 0.4 }, 'open')
      .to('.curtain--l', { xPercent: -101, duration: 2, ease: 'power3.inOut' }, 'open')
      .to('.curtain--r', { xPercent: 101, duration: 2, ease: 'power3.inOut' }, 'open')
      .add(unlock, 'open+=0.5')
      .add(heroIn(), 'open+=0.6')
      .add(() => { $$('.curtain').forEach(c => c.remove()); $('#intro').remove(); });

    $('#intro').addEventListener('click', () => {
      if (tl.time() < tl.labels.open) tl.seek('open', false);
    }, { once: true });
  }, { once: true });

  /* ---------------------------------------------------------
     Generic scroll reveals
     --------------------------------------------------------- */
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((word, i) => {
      const outer = document.createElement('span');
      outer.className = 'w';
      const inner = document.createElement('span');
      inner.className = 'wi';
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return $$('.wi', el);
  }

  function reveals(scope) {
    $$('[data-split]', scope).forEach(el => {
      gsap.from(splitWords(el), {
        yPercent: 110, opacity: 0, duration: 1.1, stagger: 0.05, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 86%' },
      });
    });

    $$('[data-reveal]', scope).forEach(el => {
      gsap.from(el, {
        y: 40, autoAlpha: 0, filter: 'blur(6px)', duration: 1.3, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });

    $$('[data-frame]', scope).forEach(frame => {
      gsap.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'power4.inOut',
        scrollTrigger: { trigger: frame, start: 'top 85%' },
      });
      gsap.fromTo($('img', frame), { scale: 1.35 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    $$('[data-speed]', scope).forEach(el => {
      const speed = parseFloat(el.dataset.speed);
      const dist = (isMobile ? 60 : 140) * speed;
      gsap.fromTo(el, { y: dist }, {
        y: -dist, ease: 'none',
        scrollTrigger: { trigger: scope, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });
  }

  /* ---------------------------------------------------------
     Scenes (set up in page order so pins measure correctly)
     --------------------------------------------------------- */
  const scenes = {
    hero(section) {
      const st = { trigger: section, start: 'top top', end: 'bottom top', scrub: true };
      gsap.to('.hero__inner', { yPercent: 35, autoAlpha: 0, ease: 'none', scrollTrigger: st });
      gsap.to('.hero__rose-wrap--tl, .hero__rose-wrap--bl', { xPercent: -40, ease: 'none', scrollTrigger: st });
      gsap.to('.hero__rose-wrap--tr, .hero__rose-wrap--br', { xPercent: 40, ease: 'none', scrollTrigger: st });
      gsap.to('.scroll-hint', { autoAlpha: 0, ease: 'none', scrollTrigger: { ...st, end: '20% top' } });
    },

    swap(section) {
      const words = $$('.swap__words span', section);
      gsap.set(words.slice(1), { yPercent: 100, autoAlpha: 0 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top top', end: `+=${words.length * 80}%`, pin: true, scrub: 1 },
      });
      tl.from('.swap__inner', { scale: 0.85, autoAlpha: 0, duration: 0.8 });
      for (let i = 1; i < words.length; i++) {
        tl.to({}, { duration: 0.7 })
          .to(words[i - 1], { yPercent: -100, autoAlpha: 0, duration: 1 })
          .to(words[i], { yPercent: 0, autoAlpha: 1, duration: 1 }, '<');
      }
      tl.to(words[words.length - 1], { color: '#E8B4B8', scale: 1.08, duration: 0.8 })
        .to({}, { duration: 0.6 });
    },

    moments(section) {
      const track = $('.moments__track', section);
      const distance = () => Math.max(0, track.scrollWidth - innerWidth);
      // the page is RTL, so the track starts on the right and slides right
      gsap.to(track, {
        x: () => distance(), ease: 'none',
        scrollTrigger: {
          trigger: section, start: 'top top', end: () => `+=${distance()}`,
          pin: true, scrub: 1, invalidateOnRefresh: true,
        },
      });
    },

    beauty(section) {
      gsap.set('.beauty__text > *', { autoAlpha: 0, y: 40 });
      gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top top', end: '+=200%', pin: true, scrub: 1 },
      })
        .from('.beauty__head > *', { autoAlpha: 0, y: 30, stagger: 0.15, duration: 0.6 })
        .from('.beauty__frame-wrap', { scale: 0.85, autoAlpha: 0, duration: 0.6 }, '<')
        .to('.beauty__frame', { clipPath: 'circle(100% at 50% 40%)', duration: 2, ease: 'power2.inOut' })
        .fromTo('.beauty__frame img', { scale: 1.45 }, { scale: 1, duration: 2, ease: 'power2.out' }, '<')
        .to('.beauty__text > *', { autoAlpha: 1, y: 0, stagger: 0.5, duration: 1 })
        .to({}, { duration: 1 });
    },

    reasons(section) {
      const cards = $$('.reason', section);
      cards.forEach((c, i) => { c.style.zIndex = i + 1; });
      gsap.set(cards.slice(1), { yPercent: 130, rotate: i => (i % 2 ? 6 : -6) });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top top', end: `+=${cards.length * 70}%`, pin: true, scrub: 1 },
      });
      tl.from('.reasons__head > *', { autoAlpha: 0, y: 30, stagger: 0.15, duration: 0.6 })
        .from(cards[0], { autoAlpha: 0, scale: 0.9, duration: 0.6 }, '<0.2');
      for (let i = 1; i < cards.length; i++) {
        tl.to({}, { duration: 0.5 })
          .to(cards[i], { yPercent: 0, rotate: i % 2 ? 1.5 : -1.5, duration: 1, ease: 'power2.out' })
          .to(cards[i - 1], { scale: 0.92, autoAlpha: 0.5, duration: 1 }, '<');
      }
      tl.to({}, { duration: 0.6 });
    },

    letter(section) {
      const words = $$('.letter__body p', section).flatMap(splitWords);
      gsap.fromTo(words, { opacity: 0.1 }, {
        opacity: 1, stagger: 0.05, ease: 'none',
        scrollTrigger: { trigger: '.letter__body', start: 'top 78%', end: 'bottom 55%', scrub: true },
      });
    },

    always(section) {
      gsap.from('.always__head > *', {
        autoAlpha: 0, y: 30, stagger: 0.15, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '.always__head', start: 'top 85%' },
      });

      // the photo slides in and develops like a real polaroid as she scrolls
      gsap.timeline({
        scrollTrigger: { trigger: '.always__photo', start: 'top 90%', end: 'center 45%', scrub: 1 },
      })
        .fromTo('.always__photo', { autoAlpha: 0, y: 70, rotation: -12, scale: 0.88 },
          { autoAlpha: 1, y: 0, rotation: -3, scale: 1, duration: 1, ease: 'power2.out' })
        .fromTo('.always__photo img',
          { filter: 'sepia(1) brightness(1.9) contrast(0.45) blur(6px)' },
          { filter: 'sepia(0) brightness(1) contrast(1) blur(0px)', duration: 2, ease: 'none' }, '<0.3');

      $$('.always__line', section).forEach(line => {
        gsap.from(line, {
          autoAlpha: 0, x: 30, duration: 1.1, ease: 'power3.out',
          scrollTrigger: { trigger: line, start: 'top 85%' },
        });
      });
    },

    finale(section) {
      const bloom = buildBloom($('#finaleBloom'));
      const stem = $('#finaleStem');
      const len = stem.getTotalLength();
      gsap.set(stem, { strokeDasharray: len, strokeDashoffset: len });
      gsap.set('.f-leaf--l', { scale: 0, transformOrigin: '100% 50%' });
      gsap.set('.f-leaf--r', { scale: 0, transformOrigin: '0% 50%' });

      gsap.timeline({
        scrollTrigger: { trigger: '.finale__rose', start: 'top 85%', end: 'bottom 50%', scrub: 1 },
      })
        .to(stem, { strokeDashoffset: 0, duration: 1.2, ease: 'none' })
        .to('.f-leaf', { scale: 1, duration: 0.5, stagger: 0.25 }, '-=0.7')
        .to(bloom.core, { scale: 1, duration: 0.2 })
        .to(bloom.petals, { scale: bloom.scaleOf, duration: 0.6, stagger: 0.03, ease: 'back.out(1.6)' });

      gsap.from('.wish > .wish-hint, .love-heart', {
        autoAlpha: 0, y: 30, duration: 1.2, stagger: 0.2, ease: 'power3.out',
        scrollTrigger: { trigger: '.wish', start: 'top 85%' },
      });

      const heart = $('#loveHeart');
      let opened = false;
      heart.addEventListener('click', () => {
        const r = heart.getBoundingClientRect();
        heartBurst(r.left + r.width / 2, r.top + r.height / 2, isMobile ? 26 : 40);
        Petals.burst(isMobile ? 20 : 40);
        gsap.fromTo(heart.querySelector('svg'), { scale: 1.35 }, { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.4)' });
        if (opened) return;
        opened = true;
        gsap.timeline()
          .to('.wish-hint', { autoAlpha: 0, duration: 0.4 })
          .fromTo('.wish-msg > *', { autoAlpha: 0, y: 30 },
            { autoAlpha: 1, y: 0, stagger: 0.3, duration: 1.1, ease: 'power3.out' });
      });

      $('#replay').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    },
  };

  $$('[data-scene]').forEach(section => {
    reveals(section);
    const setup = scenes[section.dataset.scene];
    if (setup) setup(section);
  });

  gsap.to('.progress span', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
  });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
