/* Image zoom (no dependencies)
   - 1st click: open overlay
   - 2nd click / ESC / backdrop / close button: close
*/
(function () {
  const SELECTOR = ".gh-content img";
  const OPEN_CLASS = "is-zoom-open";
  const ZOOMABLE_CLASS = "is-zoomable";

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function ensureOverlay() {
    let overlay = document.querySelector(".img-zoom-overlay");
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.className = "img-zoom-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Bild vergrößert");
    overlay.innerHTML = `
      <button class="img-zoom-close" type="button" aria-label="Schließen (Esc)">
        <span aria-hidden="true">×</span>
      </button>
      <figure class="img-zoom-figure">
        <img class="img-zoom-img" alt="" />
        <figcaption class="img-zoom-caption" aria-live="polite"></figcaption>
      </figure>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  function getCaption(img) {
    const fig = img.closest("figure");
    const cap = fig ? fig.querySelector("figcaption") : null;
    return (cap && cap.textContent ? cap.textContent.trim() : "") || img.getAttribute("alt") || "";
  }

  function getLargeSrc(img) {
    const srcset = img.getAttribute("srcset");
    if (srcset) {
      const candidates = srcset
        .split(",")
        .map((s) => s.trim())
        .map((entry) => {
          const parts = entry.split(/\s+/);
          return { url: parts[0], w: parseInt((parts[1] || "0").replace("w", ""), 10) || 0 };
        })
        .sort((a, b) => b.w - a.w);
      if (candidates[0] && candidates[0].url) return candidates[0].url;
    }
    return img.currentSrc || img.src;
  }

  let lastActive = null;

  function setZoomState(overlay, zoomed) {
    overlay.classList.toggle("is-zoomed", !!zoomed);
    overlay.dataset.zoomed = zoomed ? "1" : "0";

    const zoomImg = overlay.querySelector(".img-zoom-img");
    if (zoomImg) {
      // Reset any panning translate
      zoomImg.style.transform = "";
      zoomImg.dataset.tx = "0";
      zoomImg.dataset.ty = "0";
    }
  }

  function openZoom(img) {
    const overlay = ensureOverlay();
    const zoomImg = overlay.querySelector(".img-zoom-img");
    const captionEl = overlay.querySelector(".img-zoom-caption");

    lastActive = document.activeElement;

    zoomImg.src = getLargeSrc(img);
    zoomImg.alt = img.getAttribute("alt") || "";
    captionEl.textContent = getCaption(img);

    // Start unzoomed each time
    setZoomState(overlay, false);

    document.documentElement.classList.add(OPEN_CLASS);
    overlay.classList.add("is-open");

    if (prefersReducedMotion()) overlay.classList.add("reduce-motion");
    else overlay.classList.remove("reduce-motion");

    overlay.querySelector(".img-zoom-close")?.focus({ preventScroll: true });
  }

  function closeZoom() {
    const overlay = document.querySelector(".img-zoom-overlay");
    if (!overlay || !overlay.classList.contains("is-open")) return;

    setZoomState(overlay, false);

    overlay.classList.remove("is-open");
    document.documentElement.classList.remove(OPEN_CLASS);

    const zoomImg = overlay.querySelector(".img-zoom-img");
    if (zoomImg) zoomImg.src = "";

    lastActive?.focus?.({ preventScroll: true });
    lastActive = null;
  }

  function setupImages(root) {
    const imgs = root.querySelectorAll(SELECTOR);
    imgs.forEach((img) => {
      if (img.classList.contains(ZOOMABLE_CLASS)) return;
      img.classList.add(ZOOMABLE_CLASS);
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      img.setAttribute(
        "aria-label",
        (img.getAttribute("alt") || "Bild") + " – klicken zum Vergrößern"
      );

      img.addEventListener("click", () => openZoom(img));
      img.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openZoom(img);
        }
      });
    });
  }

  function applyPanTransform(overlay) {
    const zoomImg = overlay.querySelector(".img-zoom-img");
    if (!zoomImg) return;

    const zoomed = overlay.classList.contains("is-zoomed");
    const tx = parseFloat(zoomImg.dataset.tx || "0");
    const ty = parseFloat(zoomImg.dataset.ty || "0");

    // Base scale is controlled by CSS when zoomed.
    if (!zoomed) {
      zoomImg.style.transform = "";
      return;
    }

    zoomImg.style.transform = `translate(${tx}px, ${ty}px) scale(1.6)`;
  }

  function toggleZoom(overlay) {
    const zoomed = overlay.classList.contains("is-zoomed");
    setZoomState(overlay, !zoomed);
    applyPanTransform(overlay);
  }

  function setupOverlayEvents() {
    const overlay = ensureOverlay();

    // Close on backdrop click (not on image/figure)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeZoom();
    });

    overlay.querySelector(".img-zoom-close")?.addEventListener("click", closeZoom);

    // Toggle zoom when clicking the enlarged image
    overlay.querySelector(".img-zoom-img")?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleZoom(overlay);
    });

    // Drag to pan (only when zoomed)
    let dragging = false;
    let startX = 0,
      startY = 0,
      baseTx = 0,
      baseTy = 0;

    const imgEl = overlay.querySelector(".img-zoom-img");

    function onDown(clientX, clientY) {
      if (!overlay.classList.contains("is-zoomed")) return;
      dragging = true;
      overlay.classList.add("is-dragging");
      startX = clientX;
      startY = clientY;
      baseTx = parseFloat(imgEl.dataset.tx || "0");
      baseTy = parseFloat(imgEl.dataset.ty || "0");
    }

    function onMove(clientX, clientY) {
      if (!dragging) return;
      const dx = clientX - startX;
      const dy = clientY - startY;
      imgEl.dataset.tx = String(baseTx + dx);
      imgEl.dataset.ty = String(baseTy + dy);
      applyPanTransform(overlay);
    }

    function onUp() {
      if (!dragging) return;
      dragging = false;
      overlay.classList.remove("is-dragging");
    }

    // Mouse
    imgEl?.addEventListener("mousedown", (e) => {
      // Only left click
      if (e.button !== 0) return;
      onDown(e.clientX, e.clientY);
    });
    window.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
    window.addEventListener("mouseup", onUp);

    // Touch
    imgEl?.addEventListener(
      "touchstart",
      (e) => {
        if (!e.touches || e.touches.length !== 1) return;
        const t = e.touches[0];
        onDown(t.clientX, t.clientY);
      },
      { passive: true }
    );
    window.addEventListener(
      "touchmove",
      (e) => {
        if (!dragging) return;
        if (!e.touches || e.touches.length !== 1) return;
        const t = e.touches[0];
        onMove(t.clientX, t.clientY);
      },
      { passive: true }
    );
    window.addEventListener("touchend", onUp);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeZoom();

      // Space/Enter toggles zoom when overlay open (handy on laptops)
      const isOpen = overlay.classList.contains("is-open");
      if (isOpen && (e.key === " " || e.key === "Enter")) {
        // Don't interfere when focus is on the close button
        const ae = document.activeElement;
        if (ae && ae.classList && ae.classList.contains("img-zoom-close")) return;
        e.preventDefault();
        toggleZoom(overlay);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupOverlayEvents();
    setupImages(document);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches?.(SELECTOR)) setupImages(node.parentElement || document);
          else if (node.querySelectorAll) setupImages(node);
        }
      }
    });

    mo.observe(document.body, { childList: true, subtree: true });
  });
})();
