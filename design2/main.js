// main.js

// ===== Helpers =====
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// ===== Set year =====
const yearEl = $("#year");
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// ===== Mobile menu toggle =====
const nav = $("#primary-nav");
const toggle = $(".nav-toggle");

function closeMenu() {
  nav?.classList.remove("open");
  toggle?.setAttribute("aria-expanded", "false");
  toggle?.setAttribute("aria-label", "Open menu");
}

function openMenu() {
  nav?.classList.add("open");
  toggle?.setAttribute("aria-expanded", "true");
  toggle?.setAttribute("aria-label", "Close menu");
}

toggle?.addEventListener("click", () => {
  const isOpen = nav?.classList.contains("open");
  isOpen ? closeMenu() : openMenu();
});

// close menu when clicking a link
$$(".nav a").forEach(a => {
  a.addEventListener("click", () => closeMenu());
});

// close on ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});

// ===== Active section highlight (IntersectionObserver) =====
const navLinks = $$(".nav-link");
const sections = ["home","behandelingen","afspraak","fotos","over","contact","reviews"]
  .map(id => document.getElementById(id))
  .filter(Boolean);

const linkByHash = new Map(navLinks.map(l => [l.getAttribute("href"), l]));

function setActive(hash) {
  navLinks.forEach(l => l.classList.remove("active"));
  const link = linkByHash.get(hash);
  if (link) link.classList.add("active");
}

if ("IntersectionObserver" in window && sections.length) {
  const obs = new IntersectionObserver((entries) => {
    // choose the entry most visible
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    const id = visible.target.id;
    const hash = `#${id}`;

    // only highlight if this id exists in the nav
    if (linkByHash.has(hash)) setActive(hash);
  }, {
    root: null,
    threshold: [0.2, 0.35, 0.5, 0.65],
    rootMargin: "-20% 0px -60% 0px"
  });

  sections.forEach(s => obs.observe(s));
}

// ===== Smooth scroll offset for sticky header =====
// Prevent section from hiding behind sticky header when clicking nav links
const header = $(".site-header");
function scrollToHash(hash) {
  const target = document.querySelector(hash);
  if (!target) return;

  const headerH = header?.offsetHeight ?? 0;
  const top = target.getBoundingClientRect().top + window.scrollY - headerH - 10;

  window.scrollTo({ top, behavior: "smooth" });
}

document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;

  const hash = a.getAttribute("href");
  if (!hash || hash === "#") return;

  // Let default happen for back-to-top and if target missing
  const target = document.querySelector(hash);
  if (!target) return;

  e.preventDefault();
  scrollToHash(hash);

  // Update URL hash without jump
  history.pushState(null, "", hash);
});

// ===== Gallery lightbox =====
const lightbox = $("#lightbox");
const lightboxImg = $(".lightbox-img", lightbox || undefined);
const lightboxClose = $(".lightbox-close", lightbox || undefined);

function openLightbox(src, alt = "") {
  if (!lightbox || !lightboxImg) return;
  lightboxImg.src = src;
  lightboxImg.alt = alt;
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  if (!lightbox || !lightboxImg) return;
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImg.src = "";
  document.body.style.overflow = "";
}

$$(".g-item").forEach(btn => {
  btn.addEventListener("click", () => {
    const full = btn.getAttribute("data-full");
    const img = $("img", btn);
    if (!full) return;
    openLightbox(full, img?.alt || "");
  });
});

lightboxClose?.addEventListener("click", closeLightbox);
lightbox?.addEventListener("click", (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeLightbox();
});

// ===== Demo form submit =====
$("#fakeSubmit")?.addEventListener("click", () => {
  alert("Demo: koppel dit aan een echte form handler (Formspree/Netlify/Backend).");
});
