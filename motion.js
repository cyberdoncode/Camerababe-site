// camerababe — motion layer
//
// Adds the Jesper-Landberg-style motion pass: smooth scroll, word-mask text
// reveals, scroll-triggered fade-ups, image "wipe" reveals, magnetic
// buttons, and a lightweight cursor accent.
//
// Deliberately kept separate from main.js (which owns forms, payments and
// navigation) so this file can fail silently without ever breaking booking,
// payment or the review flow. Every block below checks that its library
// actually loaded before touching the page, and prefers-reduced-motion
// users get the plain, fully-visible page with no motion at all.

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (reduceMotion) return; // page is already fully visible without JS — nothing to do
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return; // CDN blocked — page stays fully visible, just static

  gsap.registerPlugin(ScrollTrigger);

  document.addEventListener('DOMContentLoaded', function () {

    // ---------------------------------------------------------------
    // Smooth scroll (Lenis), synced to GSAP's ticker so ScrollTrigger
    // stays perfectly in step with it.
    // ---------------------------------------------------------------
    if (typeof Lenis !== 'undefined') {
      const lenis = new Lenis({ duration: 1.05, smoothWheel: true, touchMultiplier: 1.4 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    // ---------------------------------------------------------------
    // Word-mask text reveal — splits a heading into words, each behind
    // its own overflow-hidden mask, and animates them up into place.
    // Handles one level of inline markup (e.g. <em>) so italic accents
    // inside a heading keep their styling.
    // ---------------------------------------------------------------
    function splitWords(el) {
      const nodes = Array.from(el.childNodes);
      el.textContent = '';
      const words = [];

      nodes.forEach(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const parts = node.textContent.split(/(\s+)/).filter(function (p) { return p.length; });
          parts.forEach(function (part) {
            if (/^\s+$/.test(part)) {
              el.appendChild(document.createTextNode(' '));
            } else {
              const mask = document.createElement('span');
              mask.className = 'word-mask';
              const word = document.createElement('span');
              word.className = 'word';
              word.textContent = part;
              mask.appendChild(word);
              el.appendChild(mask);
              words.push(word);
            }
          });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const text = node.textContent;
          const parts = text.split(/(\s+)/).filter(function (p) { return p.length; });
          parts.forEach(function (part) {
            if (/^\s+$/.test(part)) {
              el.appendChild(document.createTextNode(' '));
            } else {
              const mask = document.createElement('span');
              mask.className = 'word-mask';
              const wrap = document.createElement(node.tagName);
              wrap.className = 'word ' + (node.className || '');
              wrap.textContent = part;
              mask.appendChild(wrap);
              el.appendChild(mask);
              words.push(wrap);
            }
          });
        }
      });
      return words;
    }

    const revealHeadings = document.querySelectorAll('.hero h1, .page-hero h1');
    revealHeadings.forEach(function (h1) {
      const words = splitWords(h1);
      if (!words.length) return;
      gsap.set(words, { yPercent: 110 });
      const isMainHero = h1.closest('.hero') && !h1.closest('.page-hero');
      gsap.to(words, {
        yPercent: 0,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.06,
        delay: isMainHero ? 0.55 : 0.3
      });
    });

    // ---------------------------------------------------------------
    // Hero image parallax — subtle depth on scroll, contained safely
    // inside the hero's own overflow:hidden.
    // ---------------------------------------------------------------
    document.querySelectorAll('.hero-img, .page-hero-img').forEach(function (img) {
      gsap.to(img, {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: {
          trigger: img.closest('.hero, .page-hero'),
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    // ---------------------------------------------------------------
    // Generic fade-up reveal for repeating content blocks.
    // ---------------------------------------------------------------
    const revealSelectors = [
      '.section-head', '.home-intro-grid > div', '.teaser-card',
      '.lede', '.home-intro p', '.cta-band h2', '.cta-band p', '.cta-band .btn',
      '.portfolio-intro p',
      // About
      '.about-figure', '.about-copy p', '.value-card',
      // Films
      '.film-card',
      // Services
      '.service', '.rate-panel', '.rate-simple-group', '.family-block',
      // Policy / Services FAQ
      '.faq-item',
      // Booking
      '.booking-quote', '.t-grid > *', '.review-intro'
    ];
    document.querySelectorAll(revealSelectors.join(',')).forEach(function (el) {
      gsap.set(el, { opacity: 0, y: 34 });
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    // ---------------------------------------------------------------
    // Image wipe reveal — for grid tiles that already have
    // position:relative; overflow:hidden in the stylesheet
    // (.featured-item, .cat-tile), so no HTML/CSS restructuring is
    // needed: a mask panel is added as a sibling on top of the image
    // and wiped away on scroll-in.
    // ---------------------------------------------------------------
    const tileSelectors = '.featured-item, .cat-tile';
    const tiles = Array.from(document.querySelectorAll(tileSelectors));
    tiles.forEach(function (tile, i) {
      const img = tile.querySelector('img');
      if (!img) return;
      const mask = document.createElement('div');
      mask.className = 'reveal-img-mask';
      tile.appendChild(mask);

      gsap.set(img, { scale: 1.18 });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: tile, start: 'top 88%', once: true },
        delay: (i % 3) * 0.08
      });
      tl.to(mask, { scaleX: 0, duration: 0.9, ease: 'power3.inOut' }, 0)
        .to(img, { scale: 1, duration: 1.1, ease: 'power3.out' }, 0.05);
    });

    // ---------------------------------------------------------------
    // Magnetic buttons — desktop only. Pulls .btn / .cta toward the
    // cursor within a small radius, springs back on leave.
    // ---------------------------------------------------------------
    if (isFinePointer) {
      document.querySelectorAll('.btn, .cta').forEach(function (btn) {
        const strength = 0.35;
        btn.addEventListener('mousemove', function (e) {
          const r = btn.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) * strength;
          const y = (e.clientY - r.top - r.height / 2) * strength;
          gsap.to(btn, { x: x, y: y, duration: 0.4, ease: 'power3.out' });
        });
        btn.addEventListener('mouseleave', function () {
          gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
        });
      });

      // -------------------------------------------------------------
      // Cursor accent — a small dot + ring that trails the pointer and
      // grows over links/tiles. This is layered ON TOP of the normal
      // system cursor (never hidden), so it stays safe for typing into
      // the booking form and doesn't hurt usability.
      // -------------------------------------------------------------
      const dot = document.createElement('div');
      dot.className = 'cursor-dot';
      const ring = document.createElement('div');
      ring.className = 'cursor-ring';
      document.body.appendChild(dot);
      document.body.appendChild(ring);

      const setDot = gsap.quickTo(dot, 'x', { duration: 0.15, ease: 'power3.out' });
      const setDotY = gsap.quickTo(dot, 'y', { duration: 0.15, ease: 'power3.out' });
      const setRing = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3.out' });
      const setRingY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3.out' });

      window.addEventListener('mousemove', function (e) {
        setDot(e.clientX);
        setDotY(e.clientY);
        setRing(e.clientX);
        setRingY(e.clientY);
      });

      document.querySelectorAll('a, button, .cat-tile, .featured-item').forEach(function (el) {
        el.addEventListener('mouseenter', function () { ring.classList.add('is-hover'); });
        el.addEventListener('mouseleave', function () { ring.classList.remove('is-hover'); });
      });
    }

    // Re-measure after everything (fonts, images) settles.
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  });
})();
