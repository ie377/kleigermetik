/* Клей-Герметик.ru — main.js (vanilla, no deps) */
(function () {
  "use strict";

  /* ---------- mobile nav drawer ---------- */
  var body = document.body;
  var burger = document.getElementById("burger");
  var navOverlay = document.getElementById("nav-overlay");

  function closeNav() {
    body.classList.remove("nav-open");
    if (burger) burger.setAttribute("aria-expanded", "false");
  }
  function openNav() {
    body.classList.add("nav-open");
    if (burger) burger.setAttribute("aria-expanded", "true");
  }
  if (burger) {
    burger.addEventListener("click", function () {
      if (body.classList.contains("nav-open")) closeNav();
      else openNav();
    });
  }
  if (navOverlay) navOverlay.addEventListener("click", closeNav);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeNav(); closeFeedback(); }
  });
  /* close drawer when a link inside is clicked (mobile) */
  var navEl = document.getElementById("site-nav");
  if (navEl) {
    navEl.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a") : null;
      if (a && window.innerWidth < 1024) closeNav();
    });
  }

  /* ---------- desktop dropdowns open on hover ---------- */
  if (window.matchMedia("(hover:hover) and (min-width:1024px)").matches) {
    var items = document.querySelectorAll(".nav-item");
    items.forEach(function (it) {
      var timer = null;
      it.addEventListener("mouseenter", function () {
        clearTimeout(timer);
        it.setAttribute("open", "");
      });
      it.addEventListener("mouseleave", function () {
        timer = setTimeout(function () { it.removeAttribute("open"); }, 140);
      });
    });
  }

  /* ---------- header shadow on scroll ---------- */
  var header = document.getElementById("site-header");
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 6) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
    var tt = document.getElementById("to-top");
    if (tt) {
      if (window.scrollY > 500) tt.classList.add("show");
      else tt.classList.remove("show");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toTop = document.getElementById("to-top");
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- feedback modal (Yandex Forms) ---------- */
  var fOverlay = document.getElementById("f-overlay");
  var fModal = document.getElementById("f-modal");
  var fFrame = document.getElementById("ya-form-frame");
  var lastFocus = null;

  function openFeedback() {
    if (!fModal) return;
    if (fFrame && !fFrame.getAttribute("src") && fFrame.getAttribute("data-src")) {
      fFrame.setAttribute("src", fFrame.getAttribute("data-src"));
    }
    lastFocus = document.activeElement;
    fOverlay.classList.add("open");
    fModal.classList.add("open");
    body.style.overflow = "hidden";
    var c = fModal.querySelector(".f-close");
    if (c) setTimeout(function () { c.focus(); }, 60);
  }
  function closeFeedback() {
    if (!fModal || !fModal.classList.contains("open")) return;
    fOverlay.classList.remove("open");
    fModal.classList.remove("open");
    body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  window.openFeedback = openFeedback;

  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-feedback], .fab, .f-close, #f-overlay") : null;
    if (!t) return;
    if (t.classList.contains("f-close") || t.id === "f-overlay") { e.preventDefault(); closeFeedback(); return; }
    if (t.hasAttribute && (t.hasAttribute("data-feedback") || t.classList.contains("fab"))) {
      e.preventDefault();
      openFeedback();
    }
  });

  /* ---------- simple search engine (poisk.html) ---------- */
  var searchPage = document.getElementById("search-page");
  if (searchPage && window.SEARCH_INDEX) {
    var input = document.getElementById("search-input");
    var resultsEl = document.getElementById("search-results");
    var metaEl = document.getElementById("search-meta");

    function norm(s) { return s.toLowerCase().replace(/ё/g, "е"); }
    function esc(s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    function countOcc(hay, needle) {
      var n = 0, i = 0;
      while ((i = hay.indexOf(needle, i)) !== -1) { n++; i += needle.length; }
      return n;
    }
    /* light stemmer: for longer words also try a truncated variant */
    function variants(tok) {
      var v = [tok];
      if (tok.length > 5) v.push(tok.slice(0, Math.max(4, tok.length - 2)));
      return v;
    }
    function reTok(s) {
      return s.replace(/[.*+?^{}()|[\]\\]/g, function (m) { return "\\" + m; });
    }
    function highlight(text, toks) {
      var pats = [];
      toks.forEach(function (tk) {
        variants(tk).forEach(function (v) { if (pats.indexOf(v) === -1) pats.push(v); });
      });
      pats.sort(function (a, b) { return b.length - a.length; });
      var out = esc(text);
      if (pats.length) {
        var re = new RegExp("(" + pats.map(reTok).join("|") + ")", "gi");
        out = out.replace(re, function (m) { return "<mark>" + m + "</mark>"; });
      }
      return out;
    }
    function snippet(body, toks) {
      var nb = norm(body);
      var pos = -1;
      toks.forEach(function (tk) {
        variants(tk).forEach(function (v) {
          var p = nb.indexOf(v);
          if (p !== -1 && (pos === -1 || p < pos)) pos = p;
        });
      });
      if (pos === -1) pos = 0;
      var start = Math.max(0, pos - 70);
      var end = Math.min(body.length, pos + 220);
      var s = (start > 0 ? "…" : "") + body.slice(start, end).trim() + (end < body.length ? "…" : "");
      return highlight(s, toks);
    }
    function search(q) {
      var toks = norm(q).split(/[^a-z0-9\u0430-\u044f\-]+/).filter(function (t) { return t.length >= 2; });
      if (!toks.length) {
        resultsEl.innerHTML = "";
        metaEl.textContent = "Введите запрос — например, «герметик для швов», «зеркало», «купить».";
        return;
      }
      var found = [];
      window.SEARCH_INDEX.forEach(function (doc) {
        var nt = norm(doc.t), nd = norm(doc.d || ""), nb = norm(doc.b || "");
        var score = 0, ok = true;
        for (var i = 0; i < toks.length; i++) {
          var vs = variants(toks[i]);
          var inT = false, inD = false, cB = 0, startsTitle = false;
          vs.forEach(function (v) {
            if (nt.indexOf(v) !== -1) inT = true;
            if (nt.indexOf(v) === 0) startsTitle = true;
            if (nd.indexOf(v) !== -1) inD = true;
            cB = Math.max(cB, countOcc(nb, v));
          });
          if (!inT && !inD && cB === 0) { ok = false; break; }
          score += (inT ? 100 : 0) + (startsTitle ? 40 : 0) + (inD ? 30 : 0) + Math.min(cB, 12) * 3;
        }
        if (ok) found.push({ doc: doc, score: score });
      });
      found.sort(function (a, b) { return b.score - a.score; });
      found = found.slice(0, 25);
      metaEl.textContent = found.length
        ? "Найдено страниц: " + found.length + " по запросу «" + q.trim() + "»"
        : "";
      if (!found.length) {
        resultsEl.innerHTML =
          '<div class="s-empty">По запросу <b>«' + esc(q.trim()) + "»</b> ничего не найдено.<br><br>" +
          'Попробуйте изменить запрос или посмотрите <a href="index.html">главную страницу</a> и ' +
          '<a href="kupit.html">контакты</a>.</div>';
        return;
      }
      var html = "";
      found.forEach(function (r) {
        var d = r.doc;
        html +=
          '<div class="s-result"><h3><a href="' + d.u + '">' + esc(d.t) + "</a></h3>" +
          '<div class="s-url">kleigermetik.ru/' + d.u + "</div>" +
          "<p>" + snippet(d.b || d.d || "", toks) + "</p></div>";
      });
      resultsEl.innerHTML = html;
    }

    var timer = null;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { search(input.value); }, 130);
    });
    var params = new URLSearchParams(location.search);
    var q0 = params.get("q");
    if (q0) { input.value = q0; search(q0); }
    else { search(""); input.focus(); }
  }
})();
