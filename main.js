/**
 * Интерактив лендинга: анимации, навигация, форма отзыва.
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
    var ratingError = document.getElementById("review-rating-error");
    var statusEl = document.getElementById("review-form-status");
    var starButtons = reviewForm.querySelectorAll(".review-form-star");
    var currentRating = 0;

    function setRating(n) {
      currentRating = n;
      ratingInput.value = n ? String(n) : "";
      starButtons.forEach(function (btn) {
        var v = +btn.getAttribute("data-value");
        var on = v <= currentRating;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      if (ratingError) ratingError.hidden = true;
    }

    starButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        setRating(+btn.getAttribute("data-value"));
      });
    });

    function removeFallback() {
      var fb = reviewForm.querySelector(".review-form-fallback");
      if (fb) fb.remove();
    }

    function showFallback(composed, shortMsg) {
      statusEl.classList.add("is-error");
      statusEl.textContent = shortMsg || "";
      removeFallback();
      var wrap = document.createElement("div");
      wrap.className = "review-form-fallback";
      var hint = document.createElement("p");
      hint.innerHTML =
        "<strong>Ваш отзыв</strong> — скопируйте и отправьте в " +
        '<a class="link-inline" href="https://vk.ru/aldoshin2013" target="_blank" rel="noopener noreferrer">ВКонтакте</a> или в Max.';
      wrap.appendChild(hint);
      var ta = document.createElement("textarea");
      ta.className = "review-form-fallback-ta";
      ta.rows = 6;
      ta.readOnly = true;
      ta.value = composed;
      wrap.appendChild(ta);
      var copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "btn btn-secondary btn-sm";
      copyBtn.textContent = "Скопировать текст";
      copyBtn.addEventListener("click", function () {
        function done() {
          copyBtn.textContent = "Готово";
        }
        ta.select();
        ta.setSelectionRange(0, 99999);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(composed).then(done).catch(function () {
            document.execCommand("copy");
            done();
          });
        } else {
          document.execCommand("copy");
          done();
        }
      });
      wrap.appendChild(copyBtn);
      var vk = document.createElement("a");
      vk.href = "https://vk.ru/aldoshin2013";
      vk.target = "_blank";
      vk.rel = "noopener noreferrer";
      vk.className = "btn btn-primary btn-sm";
      vk.textContent = "Открыть ВКонтакте";
      wrap.appendChild(vk);
      var maxA = document.createElement("a");
      maxA.href =
        "https://max.ru/u/f9LHodD0cOK017RyHOv7-yJKGVO9RTJ48qBQtrNakn1WfJn8NyTjKH566Zk";
      maxA.target = "_blank";
      maxA.rel = "noopener noreferrer";
      maxA.className = "btn btn-secondary btn-sm";
      maxA.textContent = "Написать в Max";
      wrap.appendChild(maxA);
      reviewForm.appendChild(wrap);
    }

    reviewForm.addEventListener("submit", function (e) {
      e.preventDefault();
      statusEl.textContent = "";
      statusEl.classList.remove("is-error");
      removeFallback();

      var honey = reviewForm.querySelector('[name="botcheck"]');
      if (honey && String(honey.value || "").trim() !== "") return;

      if (!ratingInput.value) {
        if (ratingError) ratingError.hidden = false;
        return;
      }

      if (!reviewForm.checkValidity()) {
        reviewForm.reportValidity();
        return;
      }

      var submitBtn = reviewForm.querySelector(".review-form-submit");
      var accessKeyInput = reviewForm.querySelector('[name="access_key"]');
      var key = accessKeyInput && accessKeyInput.value ? accessKeyInput.value.trim() : "";

      var nameEl = reviewForm.querySelector('[name="name"]');
      var cityEl = reviewForm.querySelector('[name="city"]');
      var messageEl = reviewForm.querySelector('[name="message"]');
      var name = nameEl ? nameEl.value : "";
      var city = cityEl ? cityEl.value : "";
      var message = messageEl ? messageEl.value : "";
      var rating = ratingInput.value;

      var composed =
        "Имя: " + name.trim() + "\nОценка: " + rating + " из 5";
      if (city.trim()) composed += "\nГород: " + city.trim();
      composed += "\n\n" + message.trim();

      var fd = new FormData(reviewForm);
      fd.set("message", composed);
      fd.set("from_name", name.trim());
      fd.delete("name");
      fd.delete("city");
      fd.delete("rating");
      fd.delete("consent");
      fd.delete("botcheck");

      submitBtn.disabled = true;

      if (!key) {
        submitBtn.disabled = false;
        showFallback(
          composed,
          "Чтобы отзывы приходили на почту, вставьте бесплатный ключ с web3forms.com в скрытое поле access_key в коде страницы."
        );
        return;
      }

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: fd,
        credentials: "omit",
        mode: "cors",
        referrerPolicy: "strict-origin-when-cross-origin",
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          var ct = (res.headers.get("content-type") || "").toLowerCase();
          if (ct.indexOf("application/json") === -1) throw new Error("not json");
          return res.json();
        })
        .then(function (data) {
          if (data.success) {
            statusEl.classList.remove("is-error");
            statusEl.textContent =
              "Спасибо! Отзыв отправлен. После проверки он может быть опубликован на сайте.";
            reviewForm.reset();
            setRating(0);
            removeFallback();
          } else {
            throw new Error(data.message || "fail");
          }
        })
        .catch(function () {
          showFallback(
            composed,
            "Не удалось отправить автоматически. Скопируйте текст ниже или напишите вручную."
          );
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }
})();
