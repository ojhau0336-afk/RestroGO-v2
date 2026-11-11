/**
 * RestroGo v2 — Landing Page JS
 */

document.addEventListener("DOMContentLoaded", () => {

  /* ── NAVBAR SCROLL ── */
  const nav = document.getElementById("landNav");
  window.addEventListener("scroll", () => {
    nav?.classList.toggle("scrolled", window.scrollY > 60);
  });

  /* ── MOBILE MENU ── */
  const hamburger  = document.getElementById("landHamburger");
  const mobileMenu = document.getElementById("landMobileMenu");

  hamburger?.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = mobileMenu.classList.toggle("open");
    hamburger.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", open);
  });

  // Close on link click
  mobileMenu?.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      hamburger?.classList.remove("open");
    });
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".land-nav")) {
      mobileMenu?.classList.remove("open");
      hamburger?.classList.remove("open");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      mobileMenu?.classList.remove("open");
      hamburger?.classList.remove("open");
    }
  });

  /* ── FAQ ACCORDION ── */
  document.querySelectorAll(".faq-q").forEach(btn => {
    btn.addEventListener("click", () => {
      const answer   = btn.nextElementSibling;
      const expanded = btn.getAttribute("aria-expanded") === "true";

      // Close all
      document.querySelectorAll(".faq-q").forEach(b => {
        b.setAttribute("aria-expanded", "false");
        b.nextElementSibling?.classList.remove("open");
      });

      // Open clicked (unless it was already open)
      if (!expanded) {
        btn.setAttribute("aria-expanded", "true");
        answer?.classList.add("open");
      }
    });
  });

  /* ── SCROLL FADE-IN ── */
  initFadeObserver();

  /* ── LAZY IMAGES ── */
  initLazyImages();

  /* ── SMOOTH SCROLL for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
    });
  });

  /* ── DEMO CARDS — keyboard accessibility ── */
  document.querySelectorAll(".demo-card").forEach(card => {
    card.setAttribute("tabindex", "0");
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const primary = card.querySelector(".demo-order-btn");
        if (primary) primary.click();
      }
    });
  });

});
