/**
 * Интерактив лендинга: анимации, навигация, отзыв через MAX.
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

  function highlightCalculator() {
    var calcSection = document.getElementById("calculator");
    if (!calcSection) return;
    calcSection.classList.remove("calculator-highlight");
    void calcSection.offsetWidth;
    calcSection.classList.add("calculator-highlight");
    window.setTimeout(function () {
      calcSection.classList.remove("calculator-highlight");
    }, 2200);
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var href = link.getAttribute("href");
      if (!href || href === "#" || href.length < 2) return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: smoothBehavior, block: "start" });
      if (href === "#calculator") {
        highlightCalculator();
      }
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

    var maxBtn = document.getElementById("review-max-btn");
    var consentEl = document.getElementById("review-consent");
    /** Тот же профиль MAX, что и кнопки «Написать в Max» на сайте (личный чат). */
    var maxReviewChatUrl =
      "https://max.ru/u/f9LHodD0cOK017RyHOv7-yJKGVO9RTJ48qBQtrNakn1WfJn8NyTjKH566Zk";

    function buildReviewMessage() {
      var nameEl = document.getElementById("review-name");
      var cityEl = document.getElementById("review-city");
      var messageEl = document.getElementById("review-text");
      var name = nameEl ? String(nameEl.value || "").trim() : "";
      var city = cityEl ? String(cityEl.value || "").trim() : "";
      var message = messageEl ? String(messageEl.value || "").trim() : "";
      var rating = ratingInput ? String(ratingInput.value || "").trim() : "";
      var lines = ["Отзыв с сайта грузоперевозки (Обнинск, Дмитрий Алдошин)"];

      if (name) lines.push("Имя: " + name);
      if (rating) lines.push("Оценка: " + rating + " из 5");
      if (city) lines.push("Город: " + city);
      lines.push("");
      if (message) {
        lines.push(message);
      } else {
        lines.push("(текст отзыва можно дописать в MAX перед отправкой)");
      }
      lines.push("");
      lines.push("— отправлено через форму на сайте");
      return lines.join("\n");
    }

    if (maxBtn && consentEl && statusEl) {
      maxBtn.addEventListener("click", function () {
        if (!consentEl.checked) {
          statusEl.classList.add("is-error");
          statusEl.textContent =
            "Отметьте согласие в чекбоксе или откройте текст документа по ссылке «согласием на обработку…» выше.";
          consentEl.focus();
          return;
        }
        statusEl.classList.remove("is-error");
        var body = buildReviewMessage();
        /* :share?text= открывает экран «Кому отправить», а не личку — поэтому открываем прямой чат и копируем текст. */
        var win = window.open(maxReviewChatUrl, "_blank");
        if (win) {
          win.opener = null;
        } else {
          window.location.href = maxReviewChatUrl;
        }
        var okClipboard =
          "Открылся личный чат с Дмитрием в новой вкладке. Текст отзыва скопирован в буфер — вставьте его в поле сообщения (Ctrl+V или «Вставить» на телефоне) и отправьте.";
        var failClipboard =
          "Открылся личный чат с Дмитрием. Скопируйте текст отзыва из поля «Текст отзыва» выше и вставьте в сообщение в MAX.";
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText(body)
            .then(function () {
              statusEl.textContent = okClipboard;
            })
            .catch(function () {
              statusEl.textContent = failClipboard;
            });
        } else {
          statusEl.textContent = failClipboard;
        }
      });
      consentEl.addEventListener("change", function () {
        if (consentEl.checked) {
          statusEl.classList.remove("is-error");
          statusEl.textContent = "";
        }
      });
    }
  }

  var truckDialog = document.getElementById("truck-lightbox");
  if (truckDialog) {
    var truckLbImg = truckDialog.querySelector(".truck-lightbox-img");
    var truckLbCap = truckDialog.querySelector(".truck-lightbox-caption");
    var truckLbClose = truckDialog.querySelector(".truck-lightbox-close");
    var truckLastFocus = null;

    function closeTruckLb() {
      if (truckDialog.open) {
        truckDialog.close();
      }
    }

    function openTruckLb(src, alt, caption) {
      if (!truckLbImg || !src) return;
      truckLbImg.src = src;
      truckLbImg.alt = alt || "";
      if (truckLbCap) truckLbCap.textContent = caption || "";
      if (typeof truckDialog.showModal === "function") {
        truckDialog.showModal();
      } else {
        var w = window.open(src, "_blank", "noopener,noreferrer");
        if (w) w.opener = null;
      }
    }

    document.querySelectorAll("[data-truck-lightbox]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var img = btn.querySelector("img");
        if (!img) return;
        truckLastFocus = btn;
        openTruckLb(
          img.getAttribute("src") || "",
          img.getAttribute("alt") || "",
          btn.getAttribute("data-caption") || ""
        );
      });
    });

    if (truckLbClose) {
      truckLbClose.addEventListener("click", closeTruckLb);
    }

    truckDialog.addEventListener("close", function () {
      if (truckLastFocus && typeof truckLastFocus.focus === "function") {
        truckLastFocus.focus();
      }
    });
  }

  /* Калькулятор стоимости перевозки */
  var calcForm = document.getElementById("calc-form");
  if (calcForm) {
    var PRICE_PER_KM = 55;
    var VK_URL = "https://vk.ru/aldoshin2013";
    var NOMINATIM = "https://nominatim.openstreetmap.org/search";
    var OSRM = "https://router.project-osrm.org/route/v1/driving";
    var nominatimQueue = Promise.resolve();
    var lastNominatimAt = 0;

    var calcFrom = document.getElementById("calc-from");
    var calcTo = document.getElementById("calc-to");
    var calcStatus = document.getElementById("calc-status");
    var calcSubmit = document.getElementById("calc-submit-btn");
    var calcResult = document.getElementById("calc-result");
    var calcResultRoute = document.getElementById("calc-result-route");
    var calcResultDistance = document.getElementById("calc-result-distance");
    var calcResultPrice = document.getElementById("calc-result-price");
    var calcVkBtn = document.getElementById("calc-vk-btn");

    var selectedPlaces = { from: null, to: null };

    function formatRub(value) {
      return Math.round(value).toLocaleString("ru-RU") + " \u20BD";
    }

    function setCalcStatus(msg, isError) {
      if (!calcStatus) return;
      calcStatus.textContent = msg || "";
      calcStatus.classList.toggle("is-error", !!isError);
    }

    function hideCalcResult() {
      if (calcResult) calcResult.hidden = true;
    }

    function showCalcResult() {
      if (calcResult) calcResult.hidden = false;
    }

    function waitNominatimSlot() {
      var now = Date.now();
      var wait = Math.max(0, 1100 - (now - lastNominatimAt));
      nominatimQueue = nominatimQueue.then(function () {
        return new Promise(function (resolve) {
          window.setTimeout(resolve, wait);
        });
      });
      return nominatimQueue.then(function () {
        lastNominatimAt = Date.now();
      });
    }

    function parsePlace(item) {
      if (!item) return null;
      var addr = item.address || {};
      var name =
        item.name ||
        addr.city ||
        addr.town ||
        addr.village ||
        addr.hamlet ||
        addr.municipality ||
        (item.display_name ? item.display_name.split(",")[0] : "");
      name = String(name || "").trim();
      if (!name) return null;
      var region =
        addr.state ||
        addr.region ||
        addr.county ||
        addr.state_district ||
        "";
      return {
        name: name,
        region: String(region).trim(),
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        label: name,
      };
    }

    function nominatimSearch(query, limit) {
      var params =
        "q=" +
        encodeURIComponent(query + ", Россия") +
        "&format=json&addressdetails=1&limit=" +
        (limit || 8) +
        "&countrycodes=ru";
      return waitNominatimSlot().then(function () {
        return fetch(NOMINATIM + "?" + params, {
          headers: { "Accept-Language": "ru" },
        });
      }).then(function (res) {
        if (!res.ok) throw new Error("nominatim");
        return res.json();
      });
    }

    function geocodePlace(query) {
      return nominatimSearch(query, 1).then(function (items) {
        if (!items || !items.length) return null;
        return parsePlace(items[0]);
      });
    }

    function osrmDistanceKm(from, to) {
      var coords =
        from.lon + "," + from.lat + ";" + to.lon + "," + to.lat;
      return fetch(OSRM + "/" + coords + "?overview=false").then(function (res) {
        if (!res.ok) throw new Error("osrm");
        return res.json();
      }).then(function (data) {
        if (!data.routes || !data.routes.length) throw new Error("osrm");
        return Math.round(data.routes[0].distance / 1000);
      });
    }

    function setupAutocomplete(input, listId, key) {
      if (!input) return;
      var list = document.getElementById(listId);
      var debounceTimer = null;
      var abortCtrl = null;
      var activeIndex = -1;
      var suggestions = [];

      function closeList() {
        if (!list) return;
        list.hidden = true;
        list.innerHTML = "";
        activeIndex = -1;
        suggestions = [];
      }

      function renderList(items) {
        if (!list) return;
        list.innerHTML = "";
        suggestions = items;
        if (!items.length) {
          closeList();
          return;
        }
        items.forEach(function (place, idx) {
          var li = document.createElement("li");
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "calc-suggestion";
          btn.id = listId + "-opt-" + idx;
          var nameLine = document.createElement("span");
          nameLine.textContent = place.name;
          btn.appendChild(nameLine);
          if (place.region) {
            var sub = document.createElement("span");
            sub.className = "calc-suggestion-sub";
            sub.textContent = place.region;
            btn.appendChild(sub);
          }
          btn.addEventListener("click", function () {
            input.value = place.name;
            selectedPlaces[key] = place;
            closeList();
            input.focus();
          });
          li.appendChild(btn);
          list.appendChild(li);
        });
        list.hidden = false;
      }

      function search(query) {
        if (abortCtrl) abortCtrl.abort();
        abortCtrl = new AbortController();
        nominatimSearch(query, 8)
          .then(function (items) {
            var places = [];
            items.forEach(function (item) {
              var p = parsePlace(item);
              if (!p) return;
              if (places.some(function (x) { return x.name === p.name && x.region === p.region; })) return;
              places.push(p);
            });
            renderList(places.slice(0, 8));
          })
          .catch(function () {
            closeList();
          });
      }

      input.addEventListener("input", function () {
        selectedPlaces[key] = null;
        hideCalcResult();
        setCalcStatus("");
        var q = input.value.trim();
        if (debounceTimer) window.clearTimeout(debounceTimer);
        if (q.length < 2) {
          closeList();
          return;
        }
        debounceTimer = window.setTimeout(function () {
          search(q);
        }, 420);
      });

      input.addEventListener("keydown", function (e) {
        if (!list || list.hidden) return;
        var opts = list.querySelectorAll(".calc-suggestion");
        if (!opts.length) return;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          activeIndex = Math.min(activeIndex + 1, opts.length - 1);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          activeIndex = Math.max(activeIndex - 1, 0);
        } else if (e.key === "Enter" && activeIndex >= 0) {
          e.preventDefault();
          opts[activeIndex].click();
          return;
        } else if (e.key === "Escape") {
          closeList();
          return;
        } else {
          return;
        }
        opts.forEach(function (el, i) {
          el.classList.toggle("is-active", i === activeIndex);
        });
      });

      input.addEventListener("blur", function () {
        window.setTimeout(closeList, 180);
      });
    }

    setupAutocomplete(calcFrom, "calc-from-list", "from");
    setupAutocomplete(calcTo, "calc-to-list", "to");

    document.addEventListener("click", function (e) {
      if (!e.target.closest(".calc-autocomplete")) {
        ["calc-from-list", "calc-to-list"].forEach(function (id) {
          var list = document.getElementById(id);
          if (list) {
            list.hidden = true;
            list.innerHTML = "";
          }
        });
      }
    });

    function resolvePlace(input, key) {
      var text = input ? input.value.trim() : "";
      if (!text) return Promise.resolve(null);
      if (selectedPlaces[key] && selectedPlaces[key].name === text) {
        return Promise.resolve(selectedPlaces[key]);
      }
      return geocodePlace(text).then(function (place) {
        if (place) selectedPlaces[key] = place;
        return place;
      });
    }

    calcForm.addEventListener("submit", function (e) {
      e.preventDefault();
      hideCalcResult();
      setCalcStatus("");

      var fromText = calcFrom ? calcFrom.value.trim() : "";
      var toText = calcTo ? calcTo.value.trim() : "";

      if (!fromText || !toText) {
        setCalcStatus("Укажите пункт отправления и назначения.", true);
        return;
      }
      if (fromText.toLowerCase() === toText.toLowerCase()) {
        setCalcStatus("Пункты отправления и назначения должны отличаться.", true);
        return;
      }

      if (calcSubmit) {
        calcSubmit.disabled = true;
        calcSubmit.textContent = "Считаем маршрут…";
      }
      setCalcStatus("Определяем маршрут по дорогам…");

      resolvePlace(calcFrom, "from")
        .then(function (fromPlace) {
          if (!fromPlace) throw new Error("from-not-found");
          return resolvePlace(calcTo, "to").then(function (toPlace) {
            if (!toPlace) throw new Error("to-not-found");
            return { from: fromPlace, to: toPlace };
          });
        })
        .then(function (pair) {
          return osrmDistanceKm(pair.from, pair.to).then(function (km) {
            return { pair: pair, km: km };
          });
        })
        .then(function (data) {
          var km = data.km;
          var price = km * PRICE_PER_KM;
          var fromName = data.pair.from.name;
          var toName = data.pair.to.name;

          if (calcResultRoute) {
            calcResultRoute.textContent = fromName + " \u2192 " + toName;
          }
          if (calcResultDistance) {
            calcResultDistance.textContent = km.toLocaleString("ru-RU") + " км";
          }
          if (calcResultPrice) {
            calcResultPrice.textContent = formatRub(price);
          }
          if (calcVkBtn) {
            calcVkBtn.href = VK_URL;
          }

          showCalcResult();
          setCalcStatus("");
          if (calcResult && typeof calcResult.scrollIntoView === "function") {
            calcResult.scrollIntoView({ behavior: smoothBehavior, block: "nearest" });
          }
        })
        .catch(function (err) {
          hideCalcResult();
          if (err && err.message === "from-not-found") {
            setCalcStatus(
              "Населённый пункт «" + fromText + "» не найден. Уточните название или выберите из списка.",
              true
            );
            if (calcFrom) calcFrom.focus();
          } else if (err && err.message === "to-not-found") {
            setCalcStatus(
              "Населённый пункт «" + toText + "» не найден. Уточните название или выберите из списка.",
              true
            );
            if (calcTo) calcTo.focus();
          } else {
            setCalcStatus("Не удалось рассчитать маршрут. Попробуйте позже.", true);
          }
        })
        .finally(function () {
          if (calcSubmit) {
            calcSubmit.disabled = false;
            calcSubmit.textContent = "Рассчитать стоимость";
          }
        });
    });
  }
})();
