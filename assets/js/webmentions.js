(function () {
  const cfg = window.__wm || {};
  const target = cfg.target || location.href;
  const perPage = Number(cfg.perPage || 50);

  const $list = document.getElementById("wm-list");
  const $loading = document.getElementById("wm-loading");
  const $empty = document.getElementById("wm-empty");
  const $summary = document.getElementById("wm-summary");

  if (!$list) return;

  const apiUrl =
    "https://webmention.io/api/mentions.jf2" +
    "?target=" + encodeURIComponent(target) +
    "&per-page=" + encodeURIComponent(perPage) +
    "&sort-by=published" +
    "&sort-dir=up";

  function text(s) {
    return (s || "").toString().trim();
  }

  function escapeHtml(s) {
    return text(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  }

  function hostnameFromUrl(u) {
    try {
      return new URL(u).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  }

  // Quick-win favicon fallback (external request to Google)
  function faviconUrlForPage(pageUrl, size = 64) {
    const host = hostnameFromUrl(pageUrl);
    if (!host) return "";
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
      host
    )}&sz=${encodeURIComponent(size)}`;
  }

  // Rough mapping: jf2 "wm-property" often includes:
  // in-reply-to, like-of, repost-of, mention-of, bookmark-of, rsvp
  function kind(entry) {
    const prop = text(entry?.["wm-property"]);
    if (prop === "in-reply-to") return "Reply";
    if (prop === "like-of") return "Like";
    if (prop === "repost-of") return "Repost";
    if (prop === "bookmark-of") return "Bookmark";
    if (prop === "rsvp") return "RSVP";
    return "Mention";
  }

  function displayName(entry) {
    return (
      text(entry?.author?.name) ||
      hostnameFromUrl(text(entry?.author?.url)) ||
      hostnameFromUrl(text(entry?.url) || text(entry?.["wm-source"])) ||
      "Unbekannt"
    );
  }

  function displayAvatar(entry) {
    const authorPhoto = text(entry?.author?.photo);
    if (authorPhoto && /^https?:\/\//.test(authorPhoto)) return authorPhoto;

    const src = text(entry?.url) || text(entry?.["wm-source"]);
    const fav = faviconUrlForPage(src, 64);
    return fav || "";
  }

  function truncate(s, max = 280) {
    const t = (s || "").toString().replace(/\s+/g, " ").trim();
    if (!t) return { text: "", truncated: false };
    if (t.length <= max) return { text: t, truncated: false };

    const cut = t.slice(0, max + 1);
    const lastSpace = cut.lastIndexOf(" ");
    const out = (lastSpace > 60 ? cut.slice(0, lastSpace) : cut.slice(0, max)).trim();
    return { text: out + " …", truncated: true };
  }

  function pickSnippet(entry) {
    const s =
      text(entry?.summary) ||
      text(entry?.content?.text) ||
      text(entry?.content) ||
      "";
    return truncate(s, 280);
  }

  function renderEntry(entry) {
    const url = text(entry?.url) || text(entry?.["wm-source"]) || "#";
    const published = text(entry?.published) || text(entry?.["wm-received"]);
    const date = fmtDate(published);

    const name = displayName(entry);
    const photo = displayAvatar(entry);
    const k = kind(entry);

    const title = text(entry?.name);
    const safeTitle = escapeHtml(title);

    const { text: snip, truncated } = pickSnippet(entry);
    const safeSnippet = escapeHtml(snip);

    return `
      <li class="wm__item wm__item--${k.toLowerCase()}">
        <article class="wm__card">
          <header class="wm__meta">
            ${photo ? `<img class="wm__avatar" src="${escapeHtml(
              photo
            )}" alt="" loading="lazy" decoding="async">` : `<span class="wm__avatar wm__avatar--empty" aria-hidden="true"></span>`}
            <div class="wm__byline">
              <div class="wm__who">
                <a class="wm__author" href="${escapeHtml(
                  url
                )}" rel="nofollow ugc">${escapeHtml(name)}</a>
                <span class="wm__kind">${escapeHtml(k)}</span>
              </div>
              ${date ? `<time class="wm__time" datetime="${escapeHtml(
                published
              )}">${escapeHtml(date)}</time>` : ``}
            </div>
          </header>

          ${safeTitle ? `<div class="wm__ext-title">${safeTitle}</div>` : ``}
          ${safeSnippet ? `<p class="wm__content">${safeSnippet}</p>` : ``}
          ${truncated ? `<a class="wm__more" href="${escapeHtml(
            url
          )}" rel="nofollow ugc">Weiterlesen →</a>` : ``}
        </article>
      </li>
    `;
  }

  function groupCount(children) {
    const counts = { Reply: 0, Like: 0, Repost: 0, Bookmark: 0, RSVP: 0, Mention: 0 };
    for (const e of children) counts[kind(e)]++;
    return counts;
  }

  function renderSummary(counts) {
    const parts = [];
    if (counts.Reply) parts.push(`${counts.Reply} Replies`);
    if (counts.Like) parts.push(`${counts.Like} Likes`);
    if (counts.Repost) parts.push(`${counts.Repost} Reposts`);
    if (counts.Bookmark) parts.push(`${counts.Bookmark} Bookmarks`);
    if (counts.RSVP) parts.push(`${counts.RSVP} RSVPs`);
    if (counts.Mention) parts.push(`${counts.Mention} Mentions`);
    return parts.join(" · ");
  }

  async function load() {
    try {
      const res = await fetch(apiUrl, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("HTTP " + res.status);

      const data = await res.json();
      const children = Array.isArray(data?.children) ? data.children : [];

      if ($loading) $loading.remove();

      if (!children.length) {
        if ($empty) $empty.hidden = false;
        return;
      }

      if ($summary) {
        const counts = groupCount(children);
        const s = renderSummary(counts);
        if (s) {
          $summary.textContent = s;
          $summary.hidden = false;
        }
      }

      const html = children.map(renderEntry).join("");
      $list.insertAdjacentHTML("beforeend", html);
    } catch (err) {
      if ($loading) $loading.textContent = "Webmentions konnten nicht geladen werden.";
      console.warn("[webmentions]", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load, { once: true });
  } else {
    load();
  }
})();