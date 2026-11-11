/* INK SHARP - external JavaScript (linked in <head> with "defer")
   Topics applied: let/const, string methods, functions, DOM selectors,
   events with addEventListener, dialogs, and form validation. */

"use strict";

/* ---------- 1. Mobile menu ---------- */
const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");

function setMenu(isOpen) {
  siteNav.classList.toggle("open", isOpen);
  document.body.classList.toggle("menu-open", isOpen); // stop the page scrolling behind the menu
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.textContent = isOpen ? "✕" : "☰";
}

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    setMenu(false);
  }
});

menuToggle.addEventListener("click", function () {
  setMenu(!siteNav.classList.contains("open"));
});

// close the menu after choosing a link
siteNav.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", function () {
    setMenu(false);
  });
});


/* ---------- 2. Hero slideshow (auto, cross-fade) ---------- */
const heroSlides = document.querySelectorAll(".hero-slide");
const SLIDE_INTERVAL = 5000;
let currentSlide = 0;

function nextHeroSlide() {
  heroSlides[currentSlide].classList.remove("active");
  currentSlide = (currentSlide + 1) % heroSlides.length;
  heroSlides[currentSlide].classList.add("active");
}

setInterval(nextHeroSlide, SLIDE_INTERVAL);


/* ---------- 3. FAQ tabs ---------- */
const faqTabs = document.querySelectorAll('.faq-tabs [role="tab"]');
const faqPanels = document.querySelectorAll(".faq-panel");

function showFaqTab(selectedTab) {
  faqTabs.forEach(function (tab) {
    tab.setAttribute("aria-selected", String(tab === selectedTab));
  });
  faqPanels.forEach(function (panel) {
    panel.hidden = panel.id !== selectedTab.getAttribute("aria-controls");
  });
}

faqTabs.forEach(function (tab) {
  tab.addEventListener("click", function () {
    showFaqTab(tab);
  });
});


/* ---------- 4. Photo viewer (lightbox) ---------- */
const lightbox = document.getElementById("lightbox");
const lbImage = document.getElementById("lbImage");
const lbCaption = document.getElementById("lbCaption");
const workButtons = Array.from(document.getElementsByClassName("work"));
let currentWork = 0;

function showWork(index) {
  // wrap around at both ends
  currentWork = (index + workButtons.length) % workButtons.length;
  const button = workButtons[currentWork];
  const image = button.querySelector("img");

  lbImage.src = image.src;
  lbImage.alt = image.alt;
  lbCaption.textContent = button.dataset.caption;
}

workButtons.forEach(function (button, index) {
  button.addEventListener("click", function () {
    showWork(index);
    lightbox.showModal();
  });
});

document.getElementById("lbPrev").addEventListener("click", function () { showWork(currentWork - 1); });
document.getElementById("lbNext").addEventListener("click", function () { showWork(currentWork + 1); });
document.getElementById("lbClose").addEventListener("click", function () { lightbox.close(); });

// clicking the dark area closes it; arrow keys move between photos
lightbox.addEventListener("click", function (event) {
  if (event.target === lightbox) {
    lightbox.close();
  }
});

// swipe left / right on touch screens
let touchStartX = 0;

lightbox.addEventListener("touchstart", function (event) {
  touchStartX = event.changedTouches[0].screenX;
}, { passive: true });

lightbox.addEventListener("touchend", function (event) {
  const distance = event.changedTouches[0].screenX - touchStartX;
  if (Math.abs(distance) > 50) {
    showWork(currentWork + (distance < 0 ? 1 : -1));
  }
}, { passive: true });

lightbox.addEventListener("keydown", function (event) {
  if (event.key === "ArrowRight") {
    showWork(currentWork + 1);
  } else if (event.key === "ArrowLeft") {
    showWork(currentWork - 1);
  }
});


/* ---------- 5. Schedule an Appointment dialog + validation ---------- */
const quoteDialog = document.getElementById("quoteDialog");
const bookingForm = document.getElementById("bookingForm");
const nameInput = document.getElementById("name");
const contactInput = document.getElementById("contact-input");
const ideaInput = document.getElementById("idea");
const dateInput = document.getElementById("date");

// every "Schedule an Appointment" button opens the same dialog
document.querySelectorAll("[data-open-quote]").forEach(function (button) {
  button.addEventListener("click", function () {
    setMenu(false);
    quoteDialog.showModal();
    nameInput.focus();
  });
});

document.getElementById("quoteCancel").addEventListener("click", function () {
  quoteDialog.close();
});

quoteDialog.addEventListener("click", function (event) {
  if (event.target === quoteDialog) {
    quoteDialog.close();
  }
});

// Each validator takes a value and returns an error message, or "" when fine
function validateName(value) {
  const cleanName = value.trim();

  if (cleanName.length < 2) {
    return "Please enter your full name (at least 2 characters).";
  }
  if (!/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*$/.test(cleanName)) {
    return "Your name can only contain letters, spaces, apostrophes, dots and hyphens.";
  }
  return "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function isValidPhone(value) {
  const digitsOnly = value.replace(/[\s()+-]/g, "");
  return /^\d{10,13}$/.test(digitsOnly);
}

function validateContact(value) {
  const cleanContact = value.trim();

  // a value with "@" is treated as an email, anything else as a phone number
  if (cleanContact.indexOf("@") !== -1) {
    return isValidEmail(cleanContact) ? "" : "Please enter a valid email address (e.g. name@email.com).";
  }
  return isValidPhone(cleanContact) ? "" : "Please enter a valid phone number or email address.";
}

function validateIdea(value) {
  return ""; // no minimum length, any description is accepted
}

// Today's date as "YYYY-MM-DD" (local time)
function getTodayString() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return today.getFullYear() + "-" + month + "-" + day;
}

function validateDate(value) {
  return value >= getTodayString() ? "" : "Please choose today or a future date.";
}

// Show the message with the browser's built-in bubble
function applyValidation(input, message) {
  input.setCustomValidity(message);
  return message === "";
}

[nameInput, contactInput, ideaInput, dateInput].forEach(function (input) {
  input.addEventListener("input", function () {
    input.setCustomValidity("");
  });
});

dateInput.min = getTodayString(); // past dates can't be picked

bookingForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const isValid = [
    applyValidation(nameInput, validateName(nameInput.value)),
    applyValidation(contactInput, validateContact(contactInput.value)),
    applyValidation(ideaInput, validateIdea(ideaInput.value)),
    applyValidation(dateInput, validateDate(dateInput.value))
  ].every(Boolean);

  if (!isValid) {
    bookingForm.reportValidity();
    return;
  }

  const name = nameInput.value.trim();
  const contact = contactInput.value.trim();
  const artist = document.getElementById("artist").value;

  quoteDialog.close();
  alert(`Thank you, ${name}!\nYour appointment request with ${artist} on ${dateInput.value} has been received. We will contact you at ${contact}.`);
  bookingForm.reset();
});


/* ---------- 6. Newsletter ---------- */
const newsletterForm = document.getElementById("newsletterForm");
const newsletterEmail = document.getElementById("newsletterEmail");
const newsletterMessage = document.getElementById("newsletterMessage");

newsletterForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const email = newsletterEmail.value.trim();

  if (!isValidEmail(email)) {
    newsletterMessage.textContent = "Please enter a valid email address.";
    return;
  }

  newsletterMessage.textContent = "Thanks for submitting!";
  newsletterForm.reset();
});


/* ---------- 7. Smooth scroll reveal for sections ---------- */
const revealTargets = document.querySelectorAll(
  ".section-title, .features article, .artist, .works-grid li, .center-note, " +
  ".studio-tiles article, .reviews blockquote, .steps li, .contact-grid > *, " +
  ".mission > div, .faq-tabs, .faq-panel"
);

const revealObserver = new IntersectionObserver(function (entries) {
  entries.forEach(function (entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target); // animate only once
    }
  });
}, { threshold: 0.12 });

revealTargets.forEach(function (element, index) {
  // small stagger inside rows of three
  element.style.setProperty("--delay", (index % 3) * 120 + "ms");
  element.classList.add("reveal");
  revealObserver.observe(element);
});


/* ---------- 8. Artist cards: click / tap drops the details down ---------- */
document.querySelectorAll(".artist-toggle").forEach(function (button) {
  button.addEventListener("click", function () {
    const card = button.closest(".artist");
    const isOpen = card.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
  });
});
