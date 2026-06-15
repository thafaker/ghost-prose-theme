// ─────────────────────────────────────────────
//  Last.fm "Now Playing / Recently Played"
//  Ghost Theme Widget — assets/js/lastfm.js
// ─────────────────────────────────────────────
(function () {
  const LASTFM_USER    = "thafaker_de";
  const LASTFM_API_KEY = "5daac31eaadb5fe008c5e1ce3348b0a7";
  const REFRESH_MS     = 30_000;

  const widget  = document.getElementById("lastfm-widget");
  const artWrap = document.getElementById("lastfm-art-wrap");
  const status  = document.getElementById("lastfm-status");
  const track   = document.getElementById("lastfm-track");
  const meta    = document.getElementById("lastfm-meta");

  if (!widget) return; // widget not on page — bail out

  const API_URL =
    "https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks" +
    "&user=" + LASTFM_USER +
    "&api_key=" + LASTFM_API_KEY +
    "&format=json&limit=1";

  function placeholderSVG() {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--color-text-faint)">' +
      '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
  }

  // Last.fm returns a known grey placeholder image URL — detect and skip it
  const LASTFM_PLACEHOLDER = "2a96cbd8b46e442fc41c2b86b821562f";

  function setArt(url, alt) {
    artWrap.innerHTML = "";
    if (url && !url.includes(LASTFM_PLACEHOLDER)) {
      var img = document.createElement("img");
      img.className = "lastfm-art";
      img.src = url;
      img.alt = alt || "Album Art";
      img.onerror = function () { artWrap.innerHTML = placeholderSVG(); };
      artWrap.appendChild(img);
    } else {
      artWrap.innerHTML = placeholderSVG();
    }
  }

  async function fetchNowPlaying() {
    try {
      var res  = await fetch(API_URL);
      var data = await res.json();
      var t    = data && data.recenttracks && data.recenttracks.track && data.recenttracks.track[0];
      if (!t) throw new Error("no track");

      var isNow  = t["@attr"] && t["@attr"].nowplaying === "true";
      var name   = t.name || "Unbekannter Titel";
      var artist = (t.artist && t.artist["#text"]) || "Unbekannter Künstler";
      var album  = (t.album  && t.album["#text"])  || "";

      // Largest available image: index 3 = extralarge
      var imgs   = t.image || [];
      var artUrl = ((imgs[3] || imgs[2] || imgs[1] || imgs[0]) || {})["#text"] || "";

      widget.classList.remove("is-loading", "is-error", "now-playing");
      if (isNow) widget.classList.add("now-playing");

      status.textContent = isNow ? "Läuft gerade" : "Zuletzt gehört";
      track.textContent  = name;
      meta.innerHTML     = "<span>" + artist + "</span>" + (album ? " · " + album : "");
      setArt(artUrl, name + " – " + artist);

    } catch (err) {
      widget.classList.remove("is-loading", "now-playing");
      widget.classList.add("is-error");
      status.textContent = "Last.fm";
      track.textContent  = "Keine Daten";
      meta.textContent   = "";
      artWrap.innerHTML  = placeholderSVG();
    }
  }

  fetchNowPlaying();
  setInterval(fetchNowPlaying, REFRESH_MS);
})();
