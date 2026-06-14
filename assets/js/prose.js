(function () {
  'use strict';

  function applyWidth() {
    var m = document.querySelector('meta[name="prose-width"]');
    if (m && m.content) document.documentElement.style.setProperty('--content-width', m.content);
  }

  function initProgress() {
    var bar = document.getElementById('reading-progress');
    var post = document.querySelector('.post-content');
    if (!bar || !post) return;
    function update() {
      var top = post.getBoundingClientRect().top + window.scrollY;
      var pct = Math.min(Math.max(((window.scrollY - top) / post.offsetHeight) * 100, 0), 100);
      bar.style.width = pct + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function initReadingTime() {
    var content = document.querySelector('.post-content');
    var targets = document.querySelectorAll('[data-reading-time]');
    if (!content || !targets.length) return;
    var words = content.innerText.trim().split(/\s+/).length;
    var mins = Math.max(1, Math.round(words / 220));
    var label = mins === 1 ? '1 min read' : mins + ' min read';
    targets.forEach(function(el) { el.textContent = label; });
  }

  function initCopyButtons() {
    document.querySelectorAll('.post-content pre').forEach(function(pre) {
      var btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      pre.appendChild(btn);
      btn.addEventListener('click', function() {
        var code = pre.querySelector('code');
        var text = (code ? code.innerText : pre.innerText).replace(/^Copy\n?/, '').trim();
        navigator.clipboard.writeText(text).then(function() {
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(function() { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
        });
      });
    });
  }

  function initFadeIn() {
    if (!('IntersectionObserver' in window)) return;
    var items = document.querySelectorAll('.feed');
    var obs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e, i) {
        if (e.isIntersecting) {
          setTimeout(function() { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; }, i * 25);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.04 });
    items.forEach(function(el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = 'opacity .3s ease, transform .3s ease';
      obs.observe(el);
    });
  }

  function initBurger() {
    var burger = document.querySelector('.gh-burger');
    var menu = document.querySelector('.gh-head-menu');
    if (!burger || !menu) return;
    burger.textContent = '☰';
    burger.addEventListener('click', function() { menu.classList.toggle('open'); });
  }

  function initStickyHeader() {
    var head = document.querySelector('.gh-head');
    if (!head) return;
    window.addEventListener('scroll', function() {
      head.style.boxShadow = window.scrollY > 10 ? '0 1px 10px rgba(0,0,0,.07)' : 'none';
    }, { passive: true });
  }

  function initHeadingAnchors() {
    var content = document.querySelector('.post-content');
    if (!content) return;
    content.querySelectorAll('h2, h3').forEach(function(h) {
      if (!h.id) h.id = h.innerText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.setAttribute('aria-hidden', 'true');
      a.innerHTML = ' #';
      Object.assign(a.style, { fontSize: '.7em', opacity: '0', color: 'var(--color-text-faint)', transition: 'opacity .15s', fontWeight: '400', textDecoration: 'none' });
      h.appendChild(a);
      h.addEventListener('mouseenter', function() { a.style.opacity = '1'; });
      h.addEventListener('mouseleave', function() { a.style.opacity = '0'; });
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    applyWidth();
    initProgress();
    initReadingTime();
    initCopyButtons();
    initFadeIn();
    initBurger();
    initStickyHeader();
    initHeadingAnchors();
  });
})();
