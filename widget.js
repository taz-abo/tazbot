/* ================================================================
   taz Hilfs-Assistent – Chat Widget (einbettbar)
   ================================================================
   Verwendung:  <script src="widget.js" data-backend="https://dein-server:8000"></script>
   ================================================================ */
(function () {
  "use strict";

  /* ---- config ---- */
  const scriptEl = document.currentScript;
  const BACKEND  = (scriptEl?.getAttribute("data-backend") || "http://localhost:8000").replace(/\/+$/, "");

  // Logo wird relativ zum Skript-Ort aufgelöst, damit das Widget auch auf
  // eingebetteten (fremden) Seiten das korrekte Logo findet.
  const LOGO_SRC = (scriptEl && scriptEl.src ? scriptEl.src.split("/").slice(0, -1).join("/") : ".") + "/taz-logo-white.svg";

  /* ---- SVGs ---- */
  const SVG_SEND   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';

  /* ---- helpers ---- */
  function el(tag, attrs, ...children) {
    const e = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else e.setAttribute(k, v);
    });
    children.forEach(c => {
      if (typeof c === "string") e.appendChild(document.createTextNode(c));
      else if (c) e.appendChild(c);
    });
    return e;
  }

  // Build the "Quellen" details block; each source is a clickable link to its
  // page (s.quelle) with a short text excerpt.
  function renderSources(sources) {
    if (!sources || !sources.length) return null;
    const det = el("details", { class: "msg-sources" });
    det.appendChild(el("summary", null, "Quellen (" + sources.length + ")"));
    sources.forEach(s => {
      const url = s.quelle || s.url;
      const title = (s.text || "").slice(0, 140) + ((s.text && s.text.length > 140) ? "…" : "");
      const item = document.createElement("a");
      item.className = "src-item";
      item.href = url;
      item.target = "_blank";
      item.rel = "noopener noreferrer";
      item.textContent = title;
      det.appendChild(item);
    });
    return det;
  }

  // Separate, subdued bubble shown below the answer for a form/action page.
  // Label differs for forms ("Formular öffnen") vs. generic pages.
  function renderFormLink(formLink, isForm) {
    if (!formLink) return null;
    const wrapper = el("div", { class: "msg form" });
    const bubble  = el("div", { class: "msg-bubble form" });
    const link = document.createElement("a");
    link.className = "w-form-link";
    link.href = formLink;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const arrow = el("span", { class: "w-form-icon", "aria-hidden": "true" }, "↗");
    link.appendChild(arrow);
    link.appendChild(document.createTextNode(" " + (isForm ? "Formular öffnen" : "Link öffnen")));
    bubble.appendChild(link);
    wrapper.appendChild(bubble);
    return wrapper;
  }

  function addMessage(target, role, text, sources) {
    const wrapper = el("div", { class: "msg " + role });
    const bubble  = el("div", { class: "msg-bubble" }, text);
    wrapper.appendChild(bubble);

    const det = renderSources(sources);
    if (det) wrapper.appendChild(det);
    target.appendChild(wrapper);
    target.scrollTop = target.scrollHeight;
    return bubble;
  }

  async function send(question, messagesEl, inputEl, sendBtn) {
    if (!question.trim()) return;
    inputEl.value = "";
    addMessage(messagesEl, "user", question);
    const typing = addMessage(messagesEl, "assistant", "Suche …");
    typing.classList.add("typing");
    sendBtn.disabled = true;

    try {
      const res  = await fetch(BACKEND + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      typing.classList.remove("typing");
      typing.textContent = data.answer || "Keine Antwort erhalten.";
      const det = renderSources(data.sources);
      if (det) typing.parentElement.appendChild(det);
      const fl = renderFormLink(data.formLink, data.isForm);
      if (fl) messagesEl.appendChild(fl);
    } catch (err) {
      typing.classList.remove("typing");
      typing.textContent = "Fehler: " + err.message;
    }
    sendBtn.disabled = false;
    inputEl.focus();
  }

  /* ---- build DOM ---- */
  function init() {
    /* Toggle button */
    const toggleImg = el("img", { src: LOGO_SRC, alt: "taz", id: "taz-widget-logo" });
    const toggle = el("button", { id: "taz-widget-toggle", "aria-label": "Chat öffnen" });
    toggle.appendChild(toggleImg);
    document.body.appendChild(toggle);

    /* Panel */
    const panel = el("div", { id: "taz-widget-panel" });

    const header = el("div", { class: "w-header" });
    const headerLogo = el("img", { src: LOGO_SRC, alt: "taz", class: "w-header-logo" });
    const headerText = el("span", { class: "w-header-title" }, "tazBot");
    const headerBeta = el("span", { class: "w-beta" }, "BETA");
    header.appendChild(headerLogo);
    header.appendChild(headerText);
    header.appendChild(headerBeta);
    panel.appendChild(header);

    const messages = el("div", { class: "w-messages" });
    addMessage(messages, "assistant", "Hallo! Wie kann ich dir helfen?");
    panel.appendChild(messages);

    const inputRow = el("div", { class: "w-input-row" });
    const input    = el("input", { class: "w-input", type: "text", placeholder: "Frage stellen …" });
    const sendBtn  = el("button", { class: "w-send", html: SVG_SEND, "aria-label": "Absenden" });
    inputRow.appendChild(input);
    inputRow.appendChild(sendBtn);
    panel.appendChild(inputRow);

    document.body.appendChild(panel);

    /* Events */
    let open = false;
    toggle.addEventListener("click", () => {
      open = !open;
      panel.classList.toggle("open", open);
      toggleImg.style.opacity = open ? "0.6" : "1";
      toggle.setAttribute("aria-label", open ? "Chat schließen" : "Chat öffnen");
      if (open) input.focus();
    });

    function doSend() { send(input.value, messages, input, sendBtn); }
    sendBtn.addEventListener("click", doSend);
    input.addEventListener("keydown", e => { if (e.key === "Enter") doSend(); });

    /* Central hero chat form (if present on the page) */
    const heroForm    = document.getElementById("chat-form");
    const heroMessages = document.getElementById("chat-messages");
    const heroInput   = document.getElementById("chat-input");
    const heroSendBtn = document.getElementById("send-btn");
    if (heroForm && heroMessages && heroInput) {
      heroForm.addEventListener("submit", (e) => {
        e.preventDefault();
        send(heroInput.value, heroMessages, heroInput, heroSendBtn);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
