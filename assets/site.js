/* =========================================================
   Classroom Comeback — site behavior
   ---------------------------------------------------------
   CONFIG: the only two values you need to edit.
   ========================================================= */
const CC_CONFIG = {
  // Google Apps Script web-app URL from lead-tracker/SETUP (ends in /exec).
  // Leave empty and the form falls back to opening an email to the leads inbox.
  LEADS_ENDPOINT: "https://script.google.com/macros/s/AKfycby8bi527dObp6tWit3-7BP6WtgP-53x9ZB2DJnPqbSb_l6fWStemFQnEX-6seJDjcE0/exec",

  // Scheduling link for discovery calls (Calendly, Google Calendar appointment
  // schedule, etc.). Leave empty and "Book a call" buttons jump to the form.
  BOOKING_URL: "https://calendar.app.google/Wt5tJ4gcXBtW36g87",
  // Optional second schedule for Build & Partner (philanthropists, investors, ground-up
  // builds, policy). Buttons marked data-book="partner" use it; falls back to BOOKING_URL.
  BOOKING_URL_PARTNER: "https://calendar.app.google/duDpr1mCUP62cXnB6",

  LEADS_EMAIL: "classroomcomeback@classroomcomeback.com",
};


/* ---------- Before / after gallery ----------
   One entry per slide, shown in this order. To add a project (e.g. Anderson Mill):
   1. Put a matching before + after photo in /assets/photos/ (same size and framing,
      landscape, about 1400px wide, JPEG).
   2. Copy an entry below and change the text and file names.
      Add layout: "side" to show the two photos next to each other instead of
      the drag slider (best when the before and after weren't shot from the same spot).
   Never use photos where a child can be identified. */
const CC_GALLERY = [
  {
    project: "Palm Valley",
    room: "Preschool classroom",
    scope: "New flooring, fresh paint, and a fully furnished learning space",
    before: "/assets/photos/pv-classroom-before.jpg",
    after: "/assets/photos/pv-classroom-after.jpg",
  },
  {
    project: "Palm Valley",
    room: "Toddler room",
    scope: "Worn tile replaced, room cleared and set up for small groups",
    before: "/assets/photos/pv-toddler-room-before.jpg",
    after: "/assets/photos/pv-toddler-room-after.jpg",
  },
  {
    project: "Palm Valley",
    room: "Infant room",
    scope: "New flooring, brighter walls, and a calm infant setup",
    before: "/assets/photos/pv-infant-room-before.jpg",
    after: "/assets/photos/pv-infant-room-after.jpg",
  },
  {
    project: "Palm Valley",
    room: "Restroom",
    scope: "Child-height fixtures, new flooring, and a clean, bright finish",
    before: "/assets/photos/pv-restroom-before.jpg",
    after: "/assets/photos/pv-restroom-after.jpg",
  },
  {
    project: "Palm Valley",
    room: "The second comeback",
    scope: "Years later, the building needed a full reset. We cleared it out and set up the learning spaces again",
    before: "/assets/photos/pv2-classroom-before.jpg",
    after: "/assets/photos/pv2-classroom-after.jpg",
    layout: "side",
  },
  {
    project: "Flow Academy · Tennessee",
    room: "Early childhood classroom",
    scope: "Learning centers stocked with materials, warm wood shelving, and a clear layout",
    before: "/assets/photos/flow-classroom-before.jpg",
    after: "/assets/photos/flow-classroom-after.jpg",
    layout: "side",
  },
  {
    project: "Anderson Mill",
    room: "Outdoor side yard",
    scope: "Bare dirt path turned into a clean gravel walkway with stepping stones",
    before: "/assets/photos/am-side-yard-before.jpg",
    after: "/assets/photos/am-side-yard-after.jpg",
    layout: "side",
  },
];

document.documentElement.classList.remove("no-js");

/* ---------- Lead form ----------
   Set up first, so a problem anywhere else on the page can never break it.
   The form posts natively into a hidden iframe (works in every browser and
   isn't affected by tracking-prevention settings); JS only validates and
   shows messages. */
try {
  const form = document.querySelector("form.lead-form");
  if (form) setupLeadForm(form);
} catch (err) {
  console.error("Lead form setup failed", err);
}

function setupLeadForm(form) {
  const statusBox = document.getElementById("form-status");
  const errorBox = document.getElementById("form-errors");
  const submitBtn = form.querySelector("button[type=submit]");
  const frame = document.querySelector('iframe[name="cc-submit-frame"]');
  let sending = false;
  let watchdog;

  const show = (box, kind, html) => {
    box.className = `form-status show ${kind}`;
    box.innerHTML = html;
  };
  const clear = (box) => { box.className = "form-status"; box.innerHTML = ""; };

  const nextStep = () =>
    CC_CONFIG.BOOKING_URL
      ? ` Your next step: <a href="${CC_CONFIG.BOOKING_URL}" target="_blank" rel="noopener">book your discovery call</a>.`
      : " We'll reach out within two business days to schedule your discovery call.";

  const labelFor = (el) => {
    const l = form.querySelector(`label[for="${el.id}"]`);
    return l ? l.childNodes[0].textContent.trim() : el.name;
  };

  form.querySelectorAll("[required]").forEach((el) =>
    el.addEventListener("input", () => { if (el.checkValidity()) el.removeAttribute("aria-invalid"); })
  );

  const finish = (ok) => {
    clearTimeout(watchdog);
    sending = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Send my inquiry";
    if (ok) {
      form.reset();
      clear(errorBox);
      show(statusBox, "ok", "Thank you. Your inquiry is in, and a member of our team has been notified." + nextStep());
    } else {
      show(statusBox, "err", `We couldn't confirm your inquiry was sent. Please email us at <a href="mailto:${CC_CONFIG.LEADS_EMAIL}">${CC_CONFIG.LEADS_EMAIL}</a>.`);
    }
    statusBox.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  if (frame) frame.addEventListener("load", () => { if (sending) finish(true); });

  form.addEventListener("submit", (e) => {
    clear(statusBox);
    // Say exactly what's missing, at the top of the form AND next to the button.
    const missing = [...form.querySelectorAll("[required]")].filter((el) => !el.checkValidity());
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
    if (missing.length) {
      e.preventDefault();
      missing.forEach((el) => el.setAttribute("aria-invalid", "true"));
      const msg = `Almost there. Please complete: <strong>${missing.map(labelFor).join(", ")}</strong>.`;
      show(errorBox, "err", msg);
      show(statusBox, "err", msg);
      errorBox.scrollIntoView({ block: "start", behavior: "smooth" });
      missing[0].focus({ preventScroll: true });
      return;
    }
    clear(errorBox);

    // Hidden spam trap: autofill can fill it for real people, so flag, never drop.
    const trap = form.elements.namedItem("zq_check");
    if (trap && trap.value) {
      form.elements.namedItem("message").value += "\n\n[Flag: hidden spam-trap field was filled]";
      trap.value = "";
    }
    form.elements.namedItem("page").value = location.pathname;
    form.elements.namedItem("submittedAt").value = new Date().toISOString();

    // No endpoint configured: hand off to the visitor's email app.
    if (!CC_CONFIG.LEADS_ENDPOINT) {
      e.preventDefault();
      const lines = [];
      for (const [k, v] of new FormData(form).entries()) if (v && k !== "zq_check") lines.push(`${k}: ${v}`);
      const subject = encodeURIComponent(`New inquiry: ${form.elements.namedItem("name").value || "Website lead"}`);
      location.href = `mailto:${CC_CONFIG.LEADS_EMAIL}?subject=${subject}&body=${encodeURIComponent(lines.join("\n"))}`;
      show(statusBox, "ok", "Your email app should open with your details filled in. Just press send." + nextStep());
      return;
    }

    // Let the browser submit natively into the hidden iframe.
    form.action = CC_CONFIG.LEADS_ENDPOINT;
    sending = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    watchdog = setTimeout(() => { if (sending) finish(false); }, 20000);
  });
}


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

/* ---------- Build gallery slides from CC_GALLERY ---------- */
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
document.querySelectorAll("[data-gallery]").forEach((track) => {
  CC_GALLERY.forEach((g, n) => {
    const name = `${g.project}: ${g.room}`;
    const lazy = n === 0 ? "" : ' loading="lazy"';
    const altB = `${esc(g.room)} at ${esc(g.project)} before the comeback`;
    const altA = `${esc(g.room)} at ${esc(g.project)} after the comeback`;
    // layout "side": two photos next to each other (use when the shots aren't framed the same).
    const media = g.layout === "side"
      ? `<div class="side-by-side">
          <figure><img src="${esc(g.before)}" alt="${altB}"${lazy} decoding="async"><span class="label l">Before</span></figure>
          <figure><img src="${esc(g.after)}" alt="${altA}"${lazy} decoding="async"><span class="label r">After</span></figure>
        </div>`
      : `<div class="compare has-photos">
          <div class="layer before"><img src="${esc(g.before)}" alt="${altB}"${lazy} decoding="async"></div>
          <div class="layer after"><img src="${esc(g.after)}" alt="${altA}"${lazy} decoding="async"></div>
          <span class="label l">Before</span><span class="label r">After</span>
          <div class="divider"></div>
          <input type="range" min="0" max="100" value="50" aria-label="Compare before and after: ${esc(name)}">
        </div>`;
    track.insertAdjacentHTML("beforeend", `
      <div class="slide" role="group" aria-roledescription="slide" aria-label="${esc(name)}">
        ${media}
        <div class="slide-caption"><h3>${esc(g.project)} · ${esc(g.room)}</h3><p>${esc(g.scope)}</p></div>
      </div>`);
  });
});

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

/* ---------- Footer year ---------- */
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
