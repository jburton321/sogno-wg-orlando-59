/* ============================================================
   Legal modal viewer (QA: footer T&C / Privacy links should open
   a modal instead of leaving the checkout).
   Intercepts clicks on links to the legal pages and shows them in
   an in-page overlay iframe (?embed=1 hides the page chrome).
   Links keep their real href, so no-JS and middle-click still work.
   ============================================================ */
(function () {
  "use strict";

  var LEGAL = /(terms-and-conditions|privacy-policy)\.html/;

  var css = "" +
    ".legal-overlay{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(16,34,47,.62);}" +
    ".legal-overlay.is-open{display:flex;}" +
    ".legal-overlay__card{position:relative;width:min(920px,96vw);height:min(760px,88vh);background:#fff;border-radius:14px;box-shadow:0 24px 64px rgba(0,0,0,.35);overflow:hidden;display:flex;flex-direction:column;}" +
    ".legal-overlay__bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid #e3e8ee;}" +
    ".legal-overlay__title{font-weight:800;font-size:16px;color:#10222f;margin:0;}" +
    ".legal-overlay__close{border:none;background:none;font-size:26px;line-height:1;cursor:pointer;color:#5b6b79;padding:2px 6px;}" +
    ".legal-overlay__frame{border:0;width:100%;flex:1;}" +
    "@media (max-width:600px){.legal-overlay{padding:10px;}.legal-overlay__card{height:calc(100dvh - 20px);}}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var overlay = document.createElement("div");
  overlay.className = "legal-overlay";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML =
    '<div class="legal-overlay__card" role="dialog" aria-modal="true">' +
    '  <div class="legal-overlay__bar">' +
    '    <p class="legal-overlay__title"></p>' +
    '    <button type="button" class="legal-overlay__close" aria-label="Close">&times;</button>' +
    "  </div>" +
    '  <iframe class="legal-overlay__frame" title="Legal document"></iframe>' +
    "</div>";
  document.body.appendChild(overlay);

  var frame = overlay.querySelector(".legal-overlay__frame");
  var title = overlay.querySelector(".legal-overlay__title");

  function open(href) {
    var isTerms = href.indexOf("terms-and-conditions") !== -1;
    title.textContent = isTerms ? "Terms & Conditions" : "Privacy Policy";
    frame.src = href + (href.indexOf("?") === -1 ? "?embed=1" : "&embed=1");
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function close() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    frame.src = "about:blank";
    document.body.style.overflow = "";
  }

  /* ---- Deep links: #terms / #privacy open the modal and stay in sync
     with the address bar, so the popup state is shareable and the
     back button dismisses it. ---- */
  var current = null; // kind currently shown: "terms" | "privacy" | null

  function hrefFor(kind) {
    var file = kind === "terms" ? "terms-and-conditions" : "privacy-policy";
    // reuse a real on-page link so the relative path is always right
    var a = document.querySelector('a[href*="' + file + '"]');
    return a ? a.getAttribute("href") : "../" + file + ".html";
  }
  function kindFromHash() {
    var h = location.hash.replace("#", "");
    return h === "terms" || h === "privacy" ? h : null;
  }
  function syncFromHash() {
    var k = kindFromHash();
    if (k && k !== current) { current = k; open(hrefFor(k)); }
    else if (!k && current) { current = null; close(); }
  }
  function requestClose() {
    // strip the hash without adding a history entry, then close
    if (kindFromHash()) history.replaceState(null, "", location.pathname + location.search);
    current = null;
    close();
  }

  window.addEventListener("hashchange", syncFromHash);
  syncFromHash(); // auto-open when the page is loaded with #terms / #privacy

  overlay.querySelector(".legal-overlay__close").addEventListener("click", requestClose);
  overlay.addEventListener("click", function (e) { if (e.target === overlay) requestClose(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && overlay.classList.contains("is-open")) requestClose(); });

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || !LEGAL.test(a.getAttribute("href") || "")) return;
    e.preventDefault();
    // route through the hash so the URL reflects the open popup
    location.hash = a.getAttribute("href").indexOf("terms-and-conditions") !== -1 ? "terms" : "privacy";
  });
})();
