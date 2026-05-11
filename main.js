/**
 * Интерактив лендинга: анимации, навигация, блок отзыва (статусы в ВК).
 * Подключается с index.html; политика CSP: script-src 'self'.
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var supportsIO = "IntersectionObserver" in window;

  var revealItems = document.querySelectorAll(
    ".reveal-up, .reveal-scale, .reveal-left, .reveal-right"
  );

  if (reduceMotion || !supportsIO) {
    revealItems.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" }
    );
    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  }

  var header = document.querySelector("header");
  var handleHeaderScroll = function () {
    if (!header) return;
    if (window.scrollY > 12) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  };
  handleHeaderScroll();
  window.addEventListener("scroll", handleHeaderScroll, { passive: true });

  var smoothBehavior = reduceMotion ? "auto" : "smooth";
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var href = link.getAttribute("href");
      if (!href || href === "#" || href.length < 2) return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: smoothBehavior, block: "start" });
    });
  });

  function animateCount(el) {
    var target = +el.dataset.count;
    if (Number.isNaN(target)) return;
    var suffix = el.dataset.suffix || "";
    var prefix = el.dataset.prefix || "";
    var duration = 1200;
    var start = performance.now();
    function step(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.floor(target * eased);
      el.textContent = prefix + value + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = prefix + target + suffix;
      }
    }
    requestAnimationFrame(step);
  }

  var countElements = document.querySelectorAll("[data-count]");
  if (reduceMotion) {
    countElements.forEach(function (el) {
      var t = +el.dataset.count;
      if (!Number.isNaN(t)) {
        el.textContent =
          (el.dataset.prefix || "") + t + (el.dataset.suffix || "");
      }
    });
  } else if (supportsIO) {
    var countObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.35 }
    );
    countElements.forEach(function (el) {
      countObserver.observe(el);
    });
  } else {
    countElements.forEach(function (el) {
      animateCount(el);
    });
  }

  var sections = document.querySelectorAll("section[id]");
  var navLinks = document.querySelectorAll(".nav-links a");
  var activateNav = function () {
    var currentId = "";
    var scrollPad = 100;
    sections.forEach(function (section) {
      var top = section.offsetTop - scrollPad;
      if (window.scrollY >= top) {
        currentId = section.getAttribute("id") || "";
      }
    });
    navLinks.forEach(function (link) {
      link.classList.toggle(
        "is-active",
        !!(currentId && link.getAttribute("href") === "#" + currentId)
      );
    });
  };
  activateNav();
  window.addEventListener("scroll", activateNav, { passive: true });

  var reviewForm = document.getElementById("review-form");
  if (reviewForm) {
    var ratingInput = document.getElementById("review-rating");
    var statusEl = document.getElementById("review-form-status");
    var starButtons = reviewForm.querySelectorAll(".review-form-star");
    var currentRating = 0;

    function setRating(n) {
      currentRating = n;
      if (ratingInput) ratingInput.value = n ? String(n) : "";
      starButtons.forEach(function (btn) {
        var v = +btn.getAttribute("data-value");
        var on = v <= currentRating;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }

    starButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setRating(+btn.getAttribute("data-value"));
      });
    });

    var vkBtn = document.getElementById("review-vk-btn");
    var consentEl = document.getElementById("review-consent");
    if (vkBtn && consentEl && statusEl) {
      vkBtn.addEventListener("click", function (e) {
        if (!consentEl.checked) {
          e.preventDefault();
          statusEl.classList.add("is-error");
          statusEl.textContent =
            "Отметьте согласие в чекбоксе или откройте текст документа по ссылке «согласием на обработку…» выше.";
          consentEl.focus();
          return;
        }
        statusEl.classList.remove("is-error");
        statusEl.textContent = "";
      });
      consentEl.addEventListener("change", function () {
        if (consentEl.checked) {
          statusEl.classList.remove("is-error");
          statusEl.textContent = "";
        }
      });
    }
  }
})();
