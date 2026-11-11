/**
 * RestroGo v2 — Shared Utilities
 * Toast, observers, helpers used across all pages.
 */

/* ── TOAST SYSTEM ── */
const Toast = (() => {
  let container;

  function getContainer() {
    if (!container) {
      container = document.getElementById("toast-container");
      if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
      }
    }
    return container;
  }

  function show(message, type = "info", duration = 3500) {
    const icons = { success:"✅", error:"❌", info:"ℹ️", warning:"⚠️" };
    const c = getContainer();
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span>${icons[type] || "ℹ️"}</span><span>${message}</span>`;
    c.appendChild(el);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add("show"));
    });

    setTimeout(() => {
      el.classList.remove("show");
      el.addEventListener("transitionend", () => el.remove(), { once: true });
    }, duration);
  }

  return {
    success: (m, d) => show(m, "success", d),
    error:   (m, d) => show(m, "error",   d),
    info:    (m, d) => show(m, "info",    d),
    warning: (m, d) => show(m, "warning", d)
  };
})();

/* ── SCROLL FADE-IN OBSERVER ── */
function initFadeObserver() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add("visible");
        }, i * 80);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".fade-in").forEach(el => obs.observe(el));
  return obs;
}

/* ── FORMAT CURRENCY ── */
function formatPrice(amount, symbol = "₹") {
  return `${symbol}${Number(amount).toLocaleString("en-IN")}`;
}

/* ── DEBOUNCE ── */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ── GENERATE ORDER ID ── */
function generateOrderId() {
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RG-${ts}-${rand}`;
}

/* ── SANITIZE HTML (basic, for user input display) ── */
function sanitize(str) {
  const el = document.createElement("div");
  el.textContent = String(str);
  return el.innerHTML;
}

/* ── LAZY IMAGE LOADING ── */
function initLazyImages() {
  if (!("IntersectionObserver" in window)) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.removeAttribute("data-src");
          img.classList.remove("skeleton");
        }
        obs.unobserve(img);
      }
    });
  }, { rootMargin: "200px" });

  document.querySelectorAll("img[data-src]").forEach(img => obs.observe(img));
}

/* ── URL PARAMS ── */
function getParam(key) {
  return new URLSearchParams(window.location.search).get(key) || "";
}

/* ── LOCAL STORAGE (safe) ── */
const Store = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch {}
  }
};

/* ── TIME HELPERS ── */
function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true
  });
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

/* ── COPY TO CLIPBOARD ── */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

/* ── QR CODE GENERATOR (uses qrcode.js CDN) ── */
function generateQR(containerId, url, size = 200) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = "";
  if (window.QRCode) {
    new QRCode(el, {
      text:          url,
      width:         size,
      height:        size,
      colorDark:     "#000000",
      colorLight:    "#ffffff",
      correctLevel:  QRCode.CorrectLevel.H
    });
  } else {
    // Fallback: Google Charts API
    const img = document.createElement("img");
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
    img.alt = "QR Code";
    img.width = size; img.height = size;
    el.appendChild(img);
  }
}

window.Toast       = Toast;
window.formatPrice = formatPrice;
window.debounce    = debounce;
window.generateOrderId = generateOrderId;
window.sanitize    = sanitize;
window.Store       = Store;
window.timeAgo     = timeAgo;
window.formatTime  = formatTime;
window.formatDate  = formatDate;
window.copyToClipboard = copyToClipboard;
window.generateQR  = generateQR;
window.getParam    = getParam;
window.initFadeObserver = initFadeObserver;
window.initLazyImages   = initLazyImages;
