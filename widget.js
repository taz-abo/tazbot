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

  /* ---- SVGs ---- */
  const SVG_CHAT   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  const SVG_CLOSE  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
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

  function addMessage(target, role, text, sources) {
    const wrapper = el("div", { class: "msg " + role });
    const bubble  = el("div", { class: "msg-bubble" }, text);
    wrapper.appendChild(bubble);

    if (sources && sources.length) {
      const det = el("details", { class: "msg-sources" });
      det.appendChild(el("summary", null, "Quellen (" + sources.length + ")"));
      sources.forEach(s => {
        const item = el("div", { class: "src-item" });
        item.textContent = s.text.slice(0, 160) + (s.text.length > 160 ? "…" : "");
        det.appendChild(item);
      });
      wrapper.appendChild(det);
    }
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
      if (data.sources && data.sources.length) {
        const det = el("details", { class: "msg-sources" });
        det.appendChild(el("summary", null, "Quellen (" + data.sources.length + ")"));
        data.sources.forEach(s => {
          const item = el("div", { class: "src-item" });
          item.textContent = s.text.slice(0, 180) + (s.text.length > 180 ? "…" : "");
          det.appendChild(item);
        });
        typing.parentElement.appendChild(det);
      }
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
    const toggle = el("button", { id: "taz-widget-toggle", html: SVG_CHAT, "aria-label": "Chat öffnen" });
    document.body.appendChild(toggle);

    /* Panel */
    const panel = el("div", { id: "taz-widget-panel" });

    const header = el("div", { class: "w-header" });
    header.innerHTML = "taz Assistent <span>FRAGEN &amp; HILFE</span>";
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
      toggle.innerHTML = open ? SVG_CLOSE : SVG_CHAT;
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
