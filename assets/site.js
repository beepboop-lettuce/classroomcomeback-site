/* =========================================================
   Classroom Comeback — site behavior
   ---------------------------------------------------------
   CONFIG: the only two values you need to edit.
   ========================================================= */
const CC_CONFIG = {
  // Google Apps Script web-app URL from lead-tracker/SETUP (ends in /exec).
  // Leave empty and the form falls back to opening an email to the leads inbox.
  LEADS_ENDPOINT: "",

  // Scheduling link for discovery calls (Calendly, Google Calendar appointment
  // schedule, etc.). Leave empty and "Book a call" buttons jump to the form.
  BOOKING_URL: "",
  // Optional second schedule for Build & Partner (philanthropists, investors, ground-up
  // builds, policy). Buttons marked data-book="partner" use it; falls back to BOOKING_URL.
  BOOKING_URL_PARTNER: "",

  LEADS_EMAIL: "classroomcomeback@classroomcomeback.com",
};

document.documentElement.classList.remove("no-js");

/* ---------- Booking links ---------- */
document.querySelectorAll("[data-book]").forEach((el) => {
  const url = (el.dataset.book === "partner" && CC_CONFIG.BOOKING_URL_PARTNER) || CC_CONFIG.BOOKING_URL;
  if (url) {
    el.setAttribute("href", url);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  }
});

/* ---------- Mobile nav ---------- */
const toggle = document.querySelector(".menu-toggle");
const mobileNav = document.getElementById("mobile-nav");
if (toggle && mobileNav) {
  toggle.addEventListener("click", () => {
    const open = mobileNav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  mobileNav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
}

/* ---------- Reveal on scroll ---------- */
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
    { threshold: 0.12 }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("in"));
}

/* ---------- Before / after comparison sliders ---------- */
document.querySelectorAll(".compare").forEach((cmp) => {
  const range = cmp.querySelector("input[type=range]");
  const after = cmp.querySelector(".after");
  const divider = cmp.querySelector(".divider");
  const set = (v) => {
    after.style.clipPath = `inset(0 0 0 ${v}%)`;
    divider.style.left = `${v}%`;
  };
  range.addEventListener("input", () => set(range.value));
  set(range.value);
});

/* ---------- Carousel ---------- */
document.querySelectorAll(".carousel").forEach((car) => {
  const slides = [...car.querySelectorAll(".slide")];
  const dotsWrap = car.querySelector(".dots");
  const status = car.querySelector(".carousel-status");
  let i = 0;
  const dots = slides.map((_, n) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `Show project ${n + 1}`);
    b.addEventListener("click", () => go(n));
    dotsWrap.appendChild(b);
    return b;
  });
  function go(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle("active", k === i));
    dots.forEach((d, k) => d.setAttribute("aria-current", k === i ? "true" : "false"));
    if (status) status.textContent = `Project ${i + 1} of ${slides.length}`;
  }
  car.querySelector("[data-prev]").addEventListener("click", () => go(i - 1));
  car.querySelector("[data-next]").addEventListener("click", () => go(i + 1));
  go(0);
});

/* ---------- Lead form ---------- */
const form = document.querySelector("form.lead-form");
if (form) {
  const statusBox = document.getElementById("form-status");
  const submitBtn = form.querySelector("button[type=submit]");

  const show = (kind, html) => {
    statusBox.className = `form-status show ${kind}`;
    statusBox.innerHTML = html;
    statusBox.focus();
  };

  const nextStep = () =>
    CC_CONFIG.BOOKING_URL
      ? ` Your next step: <a href="${CC_CONFIG.BOOKING_URL}" target="_blank" rel="noopener">book your discovery call</a>.`
      : " We'll reach out within two business days to schedule your discovery call.";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    if (data.get("website")) return; // honeypot: bots fill hidden fields
    data.append("page", location.pathname);
    data.append("submittedAt", new Date().toISOString());

    // No endpoint yet: hand off to the visitor's email app so no lead is lost.
    if (!CC_CONFIG.LEADS_ENDPOINT) {
      const lines = [];
      for (const [k, v] of data.entries()) if (v && k !== "website") lines.push(`${k}: ${v}`);
      const subject = encodeURIComponent(`New inquiry: ${data.get("name") || "Website lead"}`);
      const body = encodeURIComponent(lines.join("\n"));
      location.href = `mailto:${CC_CONFIG.LEADS_EMAIL}?subject=${subject}&body=${body}`;
      show("ok", "Your email app should open with your details filled in. Just press send." + nextStep());
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    try {
      await fetch(CC_CONFIG.LEADS_ENDPOINT, {
        method: "POST",
        mode: "no-cors", // Apps Script redirects; we can't read the reply, only detect network failure
        body: new URLSearchParams(data),
      });
      form.reset();
      show("ok", "Thank you. Your inquiry is in, and a member of our team has been notified." + nextStep());
    } catch (err) {
      show(
        "err",
        `Something went wrong sending your inquiry. Please email us directly at <a href="mailto:${CC_CONFIG.LEADS_EMAIL}">${CC_CONFIG.LEADS_EMAIL}</a>.`
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send my inquiry";
    }
  });
}

/* ---------- Footer year ---------- */
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
