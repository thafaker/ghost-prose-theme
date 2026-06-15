/* ============================================================
   PROSE THEME — JavaScript
   Ghost 6 | Text-focused Microblog
   ============================================================ */

(function () {
  'use strict';

  /* ---------- 1. Reading Progress Bar ---------- */
  function initProgressBar() {
    const bar = document.getElementById('reading-progress');
    if (!bar) return;

    const post = document.querySelector('.post-content');
    if (!post) { bar.style.display = 'none'; return; }

    function updateBar() {
      const rect = post.getBoundingClientRect();
      const postTop = rect.top + window.scrollY;
      const postHeight = rect.height;
      const scrolled = window.scrollY - postTop;
      const pct = Math.min(Math.max((scrolled / postHeight) * 100, 0), 100);
      bar.style.width = pct + '%';
    }

    window.addEventListener('scroll', updateBar, { passive: true });
    updateBar();
  }

  /* ---------- 2. Estimated Reading Time ---------- */
  function calcReadingTime() {
    const content = document.querySelector('.post-content');
    const targets = document.querySelectorAll('[data-reading-time]');
    if (!content || !targets.length) return;

    const words = content.innerText.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 220));
    const label = minutes === 1 ? '1 min read' : minutes + ' min read';
    targets.forEach(el => el.textContent = label);
  }

  /* ---------- 3. Copy-Code Buttons ---------- */
  function initCopyButtons() {
    document.querySelectorAll('.post-content pre').forEach(pre => {
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.setAttribute('aria-label', 'Copy code');
      pre.style.position = 'relative';
      pre.appendChild(btn);

      btn.addEventListener('click', () => {
        const code = pre.querySelector('code');
        const text = code ? code.innerText : pre.innerText.replace('Copy', '').trim();
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 2000);
        }).catch(() => {
          btn.textContent = 'Error';
          setTimeout(() => btn.textContent = 'Copy', 2000);
        });
      });
    });
  }

  /* ---------- 4. Fade-in animation for post cards ---------- */
  function initFadeIn() {
    if (!('IntersectionObserver' in window)) return;

    const cards = document.querySelectorAll('.post-card');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, i * 40);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });

    cards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(10px)';
      card.style.transition = 'opacity .35s ease, transform .35s ease';
      obs.observe(card);
    });
  }

  /* ---------- 5. Smooth External Link Indicator ---------- */
  function markExternalLinks() {
    const content = document.querySelector('.post-content');
    if (!content) return;
    content.querySelectorAll('a[href]').forEach(link => {
      if (link.hostname && link.hostname !== window.location.hostname) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        if (!link.querySelector('.ext-icon')) {
          const span = document.createElement('span');
          span.className = 'ext-icon';
          span.innerHTML = ' ↗';
          span.style.cssText = 'font-size:.7em;opacity:.5;';
          link.appendChild(span);
        }
      }
    });
  }

  /* ---------- 6. Footnote tooltip preview ---------- */
  function initFootnotes() {
    document.querySelectorAll('a[href^="#fn"]').forEach(link => {
      link.addEventListener('mouseenter', () => {
        const id = link.getAttribute('href').slice(1);
        const fn = document.getElementById(id);
        if (!fn) return;
        const tip = document.createElement('div');
        tip.className = 'fn-tip';
        tip.textContent = fn.innerText.replace(/↩/g, '').trim();
        Object.assign(tip.style, {
          position: 'absolute',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          padding: '8px 12px',
          borderRadius: '5px',
          fontSize: '.75rem',
          maxWidth: '280px',
          lineHeight: '1.5',
          boxShadow: 'var(--shadow-md)',
          zIndex: '500',
          pointerEvents: 'none',
        });
        document.body.appendChild(tip);
        const rect = link.getBoundingClientRect();
        tip.style.top = (window.scrollY + rect.bottom + 6) + 'px';
        tip.style.left = Math.min(rect.left, window.innerWidth - 300) + 'px';
        link._fntip = tip;
      });
      link.addEventListener('mouseleave', () => {
        if (link._fntip) { link._fntip.remove(); link._fntip = null; }
      });
    });
  }

  /* ---------- 7. Apply Content Width from Ghost Custom Setting ---------- */
  function applyContentWidth() {
    // Ghost injects custom settings as body data attributes or via a meta tag
    // We read from the meta tag set in default.hbs
    // Width is set inline in <head> to avoid layout shift.
    // Keep meta support for backwards compatibility.
    const meta = document.querySelector('meta[name="prose-width"], meta[name="prose-content-width"]');
    if (meta) {
      const w = meta.getAttribute('content');
      if (w) document.documentElement.style.setProperty('--content-width', w);
    }
  }

  /* ---------- 8. Heading Anchor Links ---------- */
  function initHeadingAnchors() {
    const content = document.querySelector('.post-content');
    if (!content) return;
    content.querySelectorAll('h2, h3').forEach(h => {
      if (!h.id) {
        h.id = h.innerText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.className = 'heading-anchor';
      a.innerHTML = '#';
      a.setAttribute('aria-hidden', 'true');
      Object.assign(a.style, {
        marginLeft: '8px',
        opacity: '0',
        fontSize: '.75em',
        color: 'var(--text-faint)',
        transition: 'opacity .15s',
        fontWeight: '400',
        textDecoration: 'none',
      });
      h.appendChild(a);
      h.addEventListener('mouseenter', () => a.style.opacity = '1');
      h.addEventListener('mouseleave', () => a.style.opacity = '0');
    });
  }

  /* ---------- 10. Hover preview (lazy-load image) ---------- */
  function initHoverPreview() {
    const preview = document.getElementById('hover-preview');
    if (!preview) return;

    const supportsHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
    if (!supportsHover) return;

    let abortCtrl = null;
    const cache = new Map(); // url -> {img, title, date, tag}

    function setPos(x, y) {
      const pad = 14;
      const w = 270;
      const h = 240;
      const maxX = window.innerWidth - w - pad;
      const maxY = window.innerHeight - h - pad;
      const px = Math.max(pad, Math.min(x + 16, maxX));
      const py = Math.max(pad, Math.min(y + 16, maxY));
      preview.style.transform = `translate(${px}px, ${py}px)`;
    }

    function hide() {
      preview.classList.remove('is-visible');
      preview.setAttribute('aria-hidden', 'true');
      preview.style.transform = 'translate(-9999px,-9999px)';
      if (abortCtrl) abortCtrl.abort();
      abortCtrl = null;
    }

    function escapeHtml(s) {
      return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function render(data) {
      preview.innerHTML = `
        <div class="hover-preview-card">
          ${data.img ? `<img class="hover-preview-img" src="${data.img}" alt="" loading="lazy" decoding="async">` : `<div class="hover-preview-img" aria-hidden="true"></div>`}
          <div class="hover-preview-body">
            <div class="hover-preview-title">${escapeHtml(data.title)}</div>
            <div class="hover-preview-meta">
              ${data.tag ? `<span class="hover-preview-pill">${escapeHtml(data.tag)}</span>` : ''}
              ${data.date ? `<span>${escapeHtml(data.date)}</span>` : ''}
            </div>
          </div>
        </div>`;
      preview.classList.add('is-visible');
      preview.setAttribute('aria-hidden', 'false');
    }

    async function fetchPostPreview(url) {
      if (!url) return null;
      if (cache.has(url)) return cache.get(url);

      if (abortCtrl) abortCtrl.abort();
      abortCtrl = new AbortController();

      const res = await fetch(url, {
        signal: abortCtrl.signal,
        headers: { 'Accept': 'text/html' },
      });
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // Prefer twitter:image for hover preview (explicit social card), fallback to og:image
      const twImg = doc.querySelector('meta[name="twitter:image"], meta[name="twitter:image:src"]')?.getAttribute('content') || '';
      const ogImg = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
      const img = twImg || ogImg;

      const title = (doc.querySelector('meta[property="og:title"], meta[name="twitter:title"]')?.getAttribute('content')) || '';

      let tag = '';
      const tagEl = doc.querySelector('.post-full-tags a, a.post-full-tag');
      if (tagEl) tag = (tagEl.textContent || '').trim();

      let date = '';
      const time = doc.querySelector('time[datetime]');
      if (time) date = (time.textContent || '').trim();

      const data = { img, title, tag, date };
      cache.set(url, data);
      return data;
    }

    document.addEventListener('mousemove', (e) => {
      if (preview.classList.contains('is-visible')) setPos(e.clientX, e.clientY);
    }, { passive: true });

    document.addEventListener('mouseover', async (e) => {
      const card = e.target.closest('.feed') || e.target.closest('.feed-inner');
      if (!card) return;

      // Only enable preview for posts tagged "picture" or "pictures"
      // Ghost adds classes like "tag-picture" / "tag-pictures" via {{post_class}}
      const tagGateEl = card.classList.contains('feed') ? card : card.closest('.feed');
      const isPictureTagged = !!tagGateEl && (tagGateEl.classList.contains('tag-picture') || tagGateEl.classList.contains('tag-pictures'));
      if (!isPictureTagged) return;

      const url =
        card.querySelector?.('a.u-permalink')?.getAttribute('href') ||
        card.getAttribute?.('data-url') ||
        null;

      setPos(e.clientX, e.clientY);
      try {
        const data = await fetchPostPreview(url);
        if (!data) return;

        if (!data.title) {
          const t = card.querySelector?.('.feed-title');
          data.title = t ? t.textContent.trim() : '';
        }

        render(data);
      } catch (err) {
        // keep silent in production
      }
    });

    document.addEventListener('mouseout', (e) => {
      const card = e.target.closest('.feed') || e.target.closest('.feed-inner');
      if (!card) return;
      hide();
    });
  }

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    applyContentWidth();
    initProgressBar();
    calcReadingTime();
    initCopyButtons();
    initFadeIn();
    markExternalLinks();
    initFootnotes();
    initHeadingAnchors();
    initHoverPreview();
  });

})();
