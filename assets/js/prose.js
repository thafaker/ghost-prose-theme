/* ============================================================
   PROSE THEME - JavaScript
   Ghost 6 | Text-focused Microblog
   ============================================================ */

(function () {
  'use strict';

  /* ---------- 1. Reading Progress Bar ---------- */
  function initProgressBar() {
    const bar = document.getElementById('reading-progress');
    if (!bar) return;

    const post = document.querySelector('.post-content');
    if (!post) {
      bar.style.display = 'none';
      return;
    }

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
    targets.forEach(el => {
      el.textContent = label;
    });
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
          setTimeout(() => {
            btn.textContent = 'Copy';
          }, 2000);
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
          pointerEvents: 'none'
        });
        document.body.appendChild(tip);

        const rect = link.getBoundingClientRect();
        tip.style.top = (window.scrollY + rect.bottom + 6) + 'px';
        tip.style.left = Math.min(rect.left, window.innerWidth - 300) + 'px';
        link._fntip = tip;
      });

      link.addEventListener('mouseleave', () => {
        if (link._fntip) {
          link._fntip.remove();
          link._fntip = null;
        }
      });
    });
  }

  /* ---------- 7. Apply Content Width from Ghost Custom Setting ---------- */
  function applyContentWidth() {
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
        textDecoration: 'none'
      });

      h.appendChild(a);
      h.addEventListener('mouseenter', () => {
        a.style.opacity = '1';
      });
      h.addEventListener('mouseleave', () => {
        a.style.opacity = '0';
      });
    });
  }

  /* ---------- 9. Burger Menu ---------- */
  function initBurgerMenu() {
    const burger = document.querySelector('.gh-burger');
    const menu = document.querySelector('.gh-head-menu');
    if (!burger || !menu) return;

    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Menue oeffnen');
    burger.innerHTML = '☰';

    burger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(isOpen));
      burger.setAttribute('aria-label', isOpen ? 'Menue schliessen' : 'Menue oeffnen');
      burger.innerHTML = isOpen ? '✕' : '☰';
    });

    document.addEventListener('click', (e) => {
      const insideMenu = menu.contains(e.target);
      const insideBurger = burger.contains(e.target);
      if (!insideMenu && !insideBurger) {
        menu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Menue oeffnen');
        burger.innerHTML = '☰';
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 700) {
        menu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Menue oeffnen');
        burger.innerHTML = '☰';
      }
    });
  }

  /* ---------- 10. Hover preview (lazy-load image + multimedia) ---------- */
  function initHoverPreview() {
    const preview = document.getElementById('hover-preview');
    if (!preview) return;

    const supportsHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
    if (!supportsHover) return;

    const SESSION_KEY = 'prose_site_default_img_path';
    let siteDefaultPath = sessionStorage.getItem(SESSION_KEY);

    if (siteDefaultPath === null) {
      fetch(window.location.origin + '/', { headers: { 'Accept': 'text/html' } })
        .then(r => r.text())
        .then(html => {
          const d = new DOMParser().parseFromString(html, 'text/html');
          const imgUrl = d.querySelector('meta[name="twitter:image"], meta[name="twitter:image:src"]')?.getAttribute('content') || '';
          try {
            siteDefaultPath = imgUrl ? new URL(imgUrl, location.origin).pathname : '';
          } catch (_) {
            siteDefaultPath = '';
          }
          sessionStorage.setItem(SESSION_KEY, siteDefaultPath);
        })
        .catch(() => {
          siteDefaultPath = '';
          sessionStorage.setItem(SESSION_KEY, '');
        });
    }

    let abortCtrl = null;
    const cache = new Map();
    let lastUrl = null;

    function setPos(x, y) {
      const pad = 14;
      const w = 270;
      const h = 240;
      const maxX = window.innerWidth - w - pad;
      const maxY = window.innerHeight - h - pad;
      const px = Math.max(pad, Math.min(x + 16, maxX));
      const py = Math.max(pad, Math.min(y + 16, maxY));
      preview.style.transform = 'translate(' + px + 'px, ' + py + 'px)';
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

    /* ---- Multimedia helpers ---- */

    /**
     * Detects multimedia embeds and links within a fetched post document.
     *
     * Returns an object: { youtubeId, spotifyUrl } — either value may be null.
     *
     * Detection strategy:
     *   Scope is intentionally limited to the post content area
     *   (.post-content, .gh-content) so that <link rel="me">, footer links,
     *   and other out-of-content Spotify/YouTube references in <head> or
     *   sidebars are never mistaken for embedded media.
     *
     *   Within that scope, iframes (= real Ghost embed blocks) are checked
     *   BEFORE plain links for both services, and Spotify iframes are checked
     *   BEFORE YouTube iframes — so an embedded Spotify track always wins over
     *   a YouTube link that merely appears in the same paragraph.
     *
     *   Full priority order:
     *     1. Spotify  iframe[src]   — Ghost embed block
     *     2. YouTube  iframe[src]   — Ghost embed block
     *     3. Spotify  a[href]       — plain link inside post text
     *     4. YouTube  a[href]       — plain link inside post text
     */
    function extractMedia(doc) {
      const YT_RE = /(?:youtube\.com\/(?:watch\?(?:[^"]*&)?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
      const SP_RE = /open\.spotify\.com\/(?:embed\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/;

      // Limit search to the post content element only.
      // Falls back to <body> if the selector isn't present (shouldn't happen).
      const scope = doc.querySelector('.post-content, .gh-content') || doc.body;

      let youtubeId = null;
      let spotifyUrl = null;

      // --- Pass 1: iframes (real embeds) ---
      for (const iframe of scope.querySelectorAll('iframe[src]')) {
        const src = iframe.getAttribute('src') || '';

        if (!spotifyUrl) {
          const m = src.match(SP_RE);
          if (m) spotifyUrl = 'https://open.spotify.com/' + m[1] + '/' + m[2];
        }

        if (!youtubeId) {
          const m = src.match(YT_RE);
          if (m) youtubeId = m[1];
        }

        // Both found in iframes — no need to check links
        if (spotifyUrl && youtubeId) return { youtubeId, spotifyUrl };
      }

      // --- Pass 2: plain links — only for whatever wasn't found via iframe ---
      for (const link of scope.querySelectorAll('a[href]')) {
        const href = link.getAttribute('href') || '';

        if (!spotifyUrl) {
          const m = href.match(SP_RE);
          if (m) spotifyUrl = 'https://open.spotify.com/' + m[1] + '/' + m[2];
        }

        if (!youtubeId) {
          const m = href.match(YT_RE);
          if (m) youtubeId = m[1];
        }

        if (spotifyUrl && youtubeId) break; // found both, stop early
      }

      return { youtubeId, spotifyUrl };
    }

    /**
     * Fetches Spotify track/album/playlist metadata via the public oEmbed
     * endpoint – no API key required.
     * Returns { title, author } or null on failure.
     */
    async function fetchSpotifyMeta(spotifyUrl, signal) {
      try {
        const oembed = 'https://open.spotify.com/oembed?url=' + encodeURIComponent(spotifyUrl);
        const res = await fetch(oembed, { signal, headers: { 'Accept': 'application/json' } });
        if (!res.ok) return null;
        const json = await res.json();
        return {
          title: json.title || '',
          author: json.provider_name || 'Spotify',
          thumbnail: json.thumbnail_url || ''
        };
      } catch (_) {
        return null;
      }
    }

    /* ---- Render helpers ---- */

    /**
     * Renders the standard image card (existing behaviour).
     */
    function renderImage(data) {
      preview.innerHTML = [
        '<div class="hover-preview-card">',
          '<img class="hover-preview-img" src="' + data.img + '" alt="" loading="lazy" decoding="async">',
          '<div class="hover-preview-body">',
            '<div class="hover-preview-title">' + escapeHtml(data.title) + '</div>',
            '<div class="hover-preview-meta">',
              data.tag ? '<span class="hover-preview-pill">' + escapeHtml(data.tag) + '</span>' : '',
              data.date ? '<span>' + escapeHtml(data.date) + '</span>' : '',
            '</div>',
          '</div>',
        '</div>'
      ].join('');
    }

    /**
     * Renders a YouTube preview card with thumbnail + play button overlay.
     * The thumbnail is fetched from YouTube's public image CDN – no API key needed.
     */
    function renderYouTube(data) {
      const thumbUrl = 'https://img.youtube.com/vi/' + data.youtubeId + '/hqdefault.jpg';
      preview.innerHTML = [
        '<div class="hover-preview-card hover-preview-card--youtube">',
          '<div class="hover-preview-media-wrap">',
            '<img class="hover-preview-img" src="' + thumbUrl + '" alt="" loading="lazy" decoding="async">',
            '<div class="hover-preview-play" aria-hidden="true">',
              // YouTube-style play triangle
              '<svg viewBox="0 0 68 48" xmlns="http://www.w3.org/2000/svg">',
                '<rect width="68" height="48" rx="10" fill="rgba(0,0,0,.55)"/>',
                '<polygon points="26,14 26,34 46,24" fill="#fff"/>',
              '</svg>',
            '</div>',
          '</div>',
          '<div class="hover-preview-body">',
            '<div class="hover-preview-badge hover-preview-badge--yt">▶ YouTube</div>',
            '<div class="hover-preview-title">' + escapeHtml(data.title) + '</div>',
            '<div class="hover-preview-meta">',
              data.tag ? '<span class="hover-preview-pill">' + escapeHtml(data.tag) + '</span>' : '',
              data.date ? '<span>' + escapeHtml(data.date) + '</span>' : '',
            '</div>',
          '</div>',
        '</div>'
      ].join('');
    }

    /**
     * Renders a Spotify preview card with album art (if available) and track info.
     */
    function renderSpotify(data) {
      const artHtml = data.spotifyThumbnail
        ? '<img class="hover-preview-img hover-preview-img--spotify" src="' + escapeHtml(data.spotifyThumbnail) + '" alt="" loading="lazy" decoding="async">'
        : '<div class="hover-preview-img hover-preview-img--spotify hover-preview-img--placeholder" aria-hidden="true">'
          + '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 1 1-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.623.623 0 0 1 .207.857zm1.223-2.722a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 0 1-.454-1.49c3.632-1.104 8.147-.569 11.234 1.327a.78.78 0 0 1 .257 1.072zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.937.937 0 1 1-.543-1.793c3.532-1.072 9.404-.865 13.115 1.338a.937.937 0 0 1-.955 1.612z"/></svg>'
          + '</div>';

      preview.innerHTML = [
        '<div class="hover-preview-card hover-preview-card--spotify">',
          artHtml,
          '<div class="hover-preview-body">',
            '<div class="hover-preview-badge hover-preview-badge--spotify">♫ Spotify</div>',
            data.spotifyTrack
              ? '<div class="hover-preview-title">' + escapeHtml(data.spotifyTrack) + '</div>'
              : '<div class="hover-preview-title">' + escapeHtml(data.title) + '</div>',
            '<div class="hover-preview-meta">',
              data.tag ? '<span class="hover-preview-pill">' + escapeHtml(data.tag) + '</span>' : '',
              data.date ? '<span>' + escapeHtml(data.date) + '</span>' : '',
            '</div>',
          '</div>',
        '</div>'
      ].join('');
    }

    /**
     * Unified render dispatcher – decides which card type to show.
     * Priority: image > youtube > spotify
     */
    function render(data) {
      if (data.img) {
        renderImage(data);
      } else if (data.youtubeId) {
        renderYouTube(data);
      } else if (data.spotifyUrl) {
        renderSpotify(data);
      } else {
        return; // nothing to show
      }
      preview.classList.add('is-visible');
      preview.setAttribute('aria-hidden', 'false');
    }

    /**
     * Fetches a post page and extracts:
     *   - twitter:image  (existing)
     *   - YouTube video ID  (new)
     *   - Spotify URL + oEmbed metadata  (new)
     * Results are cached per URL.
     */
    async function fetchPostPreview(url, background = false) {
      if (!url) return null;
      if (cache.has(url)) return cache.get(url);

      // Background prefetch: use a dedicated controller so it never
      // cancels an in-flight hover fetch (abortCtrl is only for hover).
      let signal;
      if (background) {
        signal = new AbortController().signal;
      } else {
        if (abortCtrl) abortCtrl.abort();
        abortCtrl = new AbortController();
        signal = abortCtrl.signal;
      }

      const res = await fetch(url, { signal, priority: background ? 'low' : 'auto', headers: { 'Accept': 'text/html' } });
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      // --- Shared metadata (title, tag, date) ---
      const title = doc.querySelector('meta[property="og:title"], meta[name="twitter:title"]')?.getAttribute('content') || '';

      let tag = '';
      const tagEl = doc.querySelector('.post-full-tags a, a.post-full-tag');
      if (tagEl) tag = (tagEl.textContent || '').trim();

      let date = '';
      const time = doc.querySelector('time[datetime]');
      if (time) date = (time.textContent || '').trim();

      const base = { title, tag, date, img: '', youtubeId: null, spotifyUrl: null, spotifyTrack: '', spotifyThumbnail: '' };

      // --- 1. Check twitter:image (existing logic) ---
      const imgMeta = doc.querySelector('meta[name="twitter:image"], meta[name="twitter:image:src"]')?.getAttribute('content') || '';
      if (imgMeta) {
        let imgPath = '';
        try { imgPath = new URL(imgMeta, location.origin).pathname; } catch (_) {}

        // Only use image if it's not the site-wide default placeholder
        if (!imgPath || siteDefaultPath === null || imgPath !== siteDefaultPath) {
          base.img = imgMeta;
          cache.set(url, base);
          return base;
        }
      }

      // --- 2. Check for YouTube embed / link, and Spotify embed / link ---
      // extractMedia() scopes its search to .post-content / .gh-content only,
      // so <link rel="me" href="https://open.spotify.com/..."> in <head> and
      // other out-of-content references are ignored.
      // Priority: Spotify iframe > YouTube iframe > Spotify link > YouTube link.
      const { youtubeId, spotifyUrl } = extractMedia(doc);

      if (youtubeId && !spotifyUrl) {
        base.youtubeId = youtubeId;
        cache.set(url, base);
        return base;
      }

      if (spotifyUrl) {
        base.spotifyUrl = spotifyUrl;
        // Fetch oEmbed metadata for track/album name + art
        const meta = await fetchSpotifyMeta(spotifyUrl, signal);
        if (meta) {
          base.spotifyTrack = meta.title;
          base.spotifyThumbnail = meta.thumbnail;
        }
        cache.set(url, base);
        return base;
      }

      // Nothing found – cache the empty result to avoid repeated fetches
      cache.set(url, base);
      return base;
    }

    /* ---- Background prefetch (Viewport-based cache warming) ----
     *
     * Fires only when all three conditions are met:
     *   1. The page has fully loaded (window 'load' event) — no competition
     *      with critical resources during initial page paint.
     *   2. The browser reports idle time via requestIdleCallback — the work
     *      is scheduled opportunistically and won't block the main thread.
     *   3. The user is not on a metered / slow connection (saveData or 2G) —
     *      respects data-conscious users and avoids PageSpeed penalties on
     *      simulated mobile profiles.
     *
     * For every .feed card that enters the viewport an IntersectionObserver
     * silently calls fetchPostPreview() in the background. By the time the
     * user hovers, the result is already in the cache and the card appears
     * instantly.
     */
    function startPrefetchObserver() {
      // Guard: skip on metered or very slow connections
      const conn = navigator.connection;
      if (conn && (conn.saveData || conn.effectiveType === '2g')) return;

      if (!('IntersectionObserver' in window)) return;

      const prefetchObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          const card = entry.target;
          const rawUrl =
            card.querySelector('a.u-permalink')?.getAttribute('href') ||
            card.getAttribute('data-url') ||
            null;
          if (!rawUrl) return;

          let url;
          try { url = new URL(rawUrl, window.location.origin).toString(); } catch (_) { return; }

          // Already cached — nothing to do
          if (cache.has(url)) return;

          // Fire-and-forget: fetch in background with low priority
          fetchPostPreview(url, /* background */ true).catch(() => {});

          // Unobserve immediately — one prefetch per card is enough
          prefetchObs.unobserve(card);
        });
      }, {
        rootMargin: '0px',  // only truly visible cards, not speculative ones below fold
        threshold: 0.1
      });

      document.querySelectorAll('.feed').forEach(card => prefetchObs.observe(card));
    }

    // Schedule prefetch warmup: after load + idle, never during page paint
    window.addEventListener('load', () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(startPrefetchObserver, { timeout: 3000 });
      } else {
        // Fallback for Safari < 18: wait 2 s after load
        setTimeout(startPrefetchObserver, 2000);
      }
    });

    /* ---- Event listeners ---- */

    document.addEventListener('mousemove', (e) => {
      if (preview.classList.contains('is-visible')) setPos(e.clientX, e.clientY);
    }, { passive: true });

    document.addEventListener('mouseover', async (e) => {
      const card = e.target.closest('.feed') || e.target.closest('.feed-inner');
      if (!card) return;

      const rawUrl =
        card.querySelector?.('a.u-permalink')?.getAttribute('href') ||
        card.getAttribute?.('data-url') ||
        null;

      const url = rawUrl ? new URL(rawUrl, window.location.origin).toString() : null;
      if (!url) return;

      if (url === lastUrl) {
        setPos(e.clientX, e.clientY);
        return;
      }
      lastUrl = url;

      setPos(e.clientX, e.clientY);
      try {
        const data = await fetchPostPreview(url);
        if (!data || (!data.img && !data.youtubeId && !data.spotifyUrl)) {
          hide();
          return;
        }

        // Fallback: use card title if og:title was empty
        if (!data.title) {
          const t = card.querySelector('.feed-title');
          data.title = t ? t.textContent.trim() : '';
        }

        render(data);
      } catch (_) {
        // silently ignore aborts / network errors
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
    initBurgerMenu();
    initHoverPreview();
  });
})();
