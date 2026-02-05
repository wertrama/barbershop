(function () {
  const root = document.documentElement;

  // Mobile nav toggle
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  const navLinks = document.querySelectorAll(".nav a");

  function closeNav() {
    if (!nav) return;
    nav.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
  }

  toggle?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach(a => a.addEventListener("click", closeNav));

  // Gallery buttons (horizontal scroll)
  const track = document.querySelector("[data-gallery-track]");
  const prevBtn = document.querySelector("[data-gallery-prev]");
  const nextBtn = document.querySelector("[data-gallery-next]");

  function scrollGallery(dir) {
    if (!track) return;
    const amount = Math.min(track.clientWidth * 0.85, 520);
    track.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  prevBtn?.addEventListener("click", () => scrollGallery(-1));
  nextBtn?.addEventListener("click", () => scrollGallery(1));

  // Offset scroll for sticky header (better anchor landing)
  const header = document.querySelector(".header");
  const headerHeight = () => (header?.offsetHeight || 72) + 10;

  document.querySelectorAll("section[id]").forEach(sec => {
    sec.style.scrollMarginTop = headerHeight() + "px";
  });

  window.addEventListener("resize", () => {
    document.querySelectorAll("section[id]").forEach(sec => {
      sec.style.scrollMarginTop = headerHeight() + "px";
    });
  });

  // Footer year
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Contact form: open mail client (simple, no backend)
  window.HNDRCKX = window.HNDRCKX || {};
  window.HNDRCKX.sendMail = (event) => {
    event.preventDefault();
    const form = event.target;

    const name = encodeURIComponent(form.name.value.trim());
    const email = encodeURIComponent(form.email.value.trim());
    const message = encodeURIComponent(form.message.value.trim());

    const subject = encodeURIComponent("Bericht via hndrckx.nl");
    const body = encodeURIComponent(
      `Naam: ${decodeURIComponent(name)}\nE-mail: ${decodeURIComponent(email)}\n\nBericht:\n${decodeURIComponent(message)}`
    );

    // TODO: replace with your real email if you want mailto:
    const to = "info@hndrckx.nl";
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    return false;
  };
})();
