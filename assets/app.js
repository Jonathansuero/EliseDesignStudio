/* =========================================================
   Elise Design Studio — app.js  (sin dependencias)
   ========================================================= */

/* ---- CONFIGURACIÓN: cambia estos datos ---- */
const CONFIG = {
  email: "info@elisedesign-studio.com",
  whatsapp: "",        // Ej.: "19545551234" (código de país + número, sin + ni espacios). Vacío = se ocultan los botones de WhatsApp
  bookingUrl: "",      // Ej.: enlace de Calendly o Google Calendar. Vacío = se oculta la tarjeta "Agenda en línea"
  formEndpoint: "",    // Ej.: "https://formspree.io/f/xxxxxx". Vacío = el formulario abre el correo del visitante
};

document.documentElement.classList.add("js");

(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Idioma ---------------- */
  // Cada página existe en inglés (raíz del sitio) y en español (carpeta /es/).
  // Los botones EN / ES llevan a la misma página en el otro idioma (y conservan la sección, ej. #faq).
  // Google muestra a cada persona la versión de su idioma gracias a las etiquetas hreflang.
  const DICT = window.I18N || { en: {}, es: {} };
  const lang = document.documentElement.lang === "es" ? "es" : "en";
  const onLang = [];
  const t = (k, vars = {}) => {
    let s = DICT[lang]?.[k] ?? DICT.en?.[k] ?? k;
    for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b);
    return s;
  };
  // Interruptor de idioma: la bolita se desliza al otro lado y luego abre la página en el otro idioma
  $$("[data-lang]").forEach((a) => a.addEventListener("click", (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;   // abrir en pestaña nueva funciona normal
    e.preventDefault();
    const dest = a.href.split("#")[0] + location.hash;
    a.classList.add("is-switching");
    a.setAttribute("aria-checked", String(a.dataset.lang === "es"));
    setTimeout(() => { location.href = dest; }, reduce ? 0 : 260);
  }));
  // Enlaces antiguos con ?lang=es o ?lang=en: llevar a la página del idioma pedido
  const wanted = new URLSearchParams(location.search).get("lang");
  if ((wanted === "es" || wanted === "en") && wanted !== lang) {
    const target = $(`[data-lang="${wanted}"]`);
    if (target) { location.replace(target.href.split("#")[0] + location.hash); return; }
  }

  /* ---------------- Toast ---------------- */
  const toastEl = $("[data-toast]");
  let toastTimer;
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2600);
  };

  /* ---------------- Copiar ---------------- */
  async function copyText(text, fallbackEl) {
    try {
      await navigator.clipboard.writeText(text);
      toast(t("w.copied"));
    } catch (e) {
      if (fallbackEl) {
        const r = document.createRange();
        r.selectNodeContents(fallbackEl);
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      }
      toast(t("w.copyFail"));
    }
  }
  $$("[data-copy]").forEach((b) => b.addEventListener("click", () => copyText(b.dataset.copy, b.closest(".channel")?.querySelector("[data-copy-src]"))));

  /* ---------------- Año ---------------- */
  $$("[data-year]").forEach((y) => { y.textContent = new Date().getFullYear(); });

  /* ---------------- WhatsApp y agenda ---------------- */
  if (CONFIG.whatsapp) {
    const setWa = () => $$("[data-whatsapp]").forEach((a) => {
      a.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t("wa.text"))}`;
      a.target = "_blank"; a.rel = "noopener"; a.hidden = false;
    });
    setWa(); onLang.push(setWa);
    $$("[data-wa-item]").forEach((el) => { el.hidden = false; });
    $$("[data-wa-number]").forEach((el) => { el.textContent = "+" + CONFIG.whatsapp; });
  }
  if (CONFIG.bookingUrl) {
    $$("[data-booking]").forEach((a) => { a.href = CONFIG.bookingUrl; });
    $$("[data-booking-item]").forEach((el) => { el.hidden = false; });
  }

  /* ---------------- Header, progreso, barra móvil, parallax ---------------- */
  const header = $("[data-header]");
  const progress = $(".scroll-progress span");
  const mbar = $("[data-mobile-bar]");
  const parallax = $$("[data-parallax] img");
  const isContact = location.pathname.endsWith("contacto.html");
  let ticking = false;
  function onScroll() {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    header?.classList.toggle("is-scrolled", y > 24);
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (mbar) mbar.classList.toggle("is-on", !isContact && y > innerHeight * 0.6);
    if (!reduce) parallax.forEach((img) => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) img.style.transform = `translate3d(0, ${(r.top) * -0.08}px, 0)`;
    });
    updateProcess();
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  $$("[data-to-top-link]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); }));

  /* ---------------- Menú: siempre empezar arriba ---------------- */
  // Al abrir cualquier página desde el menú (logo, Projects, Services, etc.) se muestra desde el inicio,
  // aunque el navegador recuerde dónde estaba. Si el enlace es a la misma página, sube al inicio.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (!location.hash) scrollTo(0, 0);
  $$(".site-header a[href], .mobile-menu a[href], .subnav a[href]").forEach((a) => a.addEventListener("click", (e) => {
    const url = new URL(a.href, location.href);
    if (url.hash) return;                                   // enlaces a secciones (ej. #proceso) funcionan igual
    if (url.pathname.replace(/index\.html$/, "") === location.pathname.replace(/index\.html$/, "")) {
      e.preventDefault();
      scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    }
  }));

  /* ---------------- Menú móvil ---------------- */
  const toggle = $("[data-menu-toggle]");
  const menu = $("[data-mobile-menu]");
  const menuOpen = () => toggle?.getAttribute("aria-expanded") === "true";
  const labelToggle = () => toggle?.setAttribute("aria-label", t(menuOpen() ? "aria.menuClose" : "aria.menuOpen"));
  onLang.push(labelToggle);
  function openMenu() {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add("is-open"));
    toggle.setAttribute("aria-expanded", "true"); labelToggle();
    document.body.classList.add("no-scroll", "menu-open");
  }
  function closeMenu(focus = true) {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false"); labelToggle();
    document.body.classList.remove("no-scroll", "menu-open");
    setTimeout(() => { if (!menu.classList.contains("is-open")) menu.hidden = true; }, 400);
    if (focus) toggle.focus();
  }
  if (toggle && menu) {
    toggle.addEventListener("click", () => (menuOpen() ? closeMenu() : openMenu()));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => closeMenu(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menuOpen()) closeMenu(); });
    matchMedia("(min-width: 1081px)").addEventListener("change", (e) => { if (e.matches && !menu.hidden) closeMenu(false); });
  }

  /* ---------------- Aparición al hacer scroll ---------------- */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
    }), { rootMargin: "0px 0px -6% 0px" });
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add("is-visible"));

  /* ---------------- Slider del hero ---------------- */
  const slider = $("[data-slider]");
  if (slider) {
    const slides = $$("[data-slide]", slider);
    const dots = $$("[data-dot]", slider);
    let i = 0, timer;
    const go = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle("is-active", k === i));
      dots.forEach((d, k) => d.classList.toggle("is-active", k === i));
    };
    const play = () => { if (!reduce) timer = setInterval(() => go(i + 1), 4200); };
    dots.forEach((d) => d.addEventListener("click", () => { clearInterval(timer); go(+d.dataset.dot); play(); }));
    slider.addEventListener("mouseenter", () => clearInterval(timer));
    slider.addEventListener("mouseleave", () => { clearInterval(timer); play(); });
    play();
  }

  /* ---------------- Vista previa de servicios (inicio) ---------------- */
  const preview = $("[data-svc-preview]");
  if (preview) {
    let pending;
    $$("[data-preview]").forEach((row) => {
      const show = () => {
        if (preview.getAttribute("src") === row.dataset.preview) return;
        preview.classList.add("is-swapping");
        clearTimeout(pending);
        pending = setTimeout(() => { preview.style.objectPosition = row.dataset.pos || "50% 50%"; preview.src = row.dataset.preview; preview.onload = () => preview.classList.remove("is-swapping"); }, 160);
      };
      row.addEventListener("mouseenter", show);
      row.addEventListener("focus", show);
    });
  }

  /* ---------------- Proceso ---------------- */
  const procList = $("[data-process]");
  const procLine = procList && $(".process-line span", procList);
  const procSteps = procList ? $$(".step", procList) : [];
  function updateProcess() {
    if (!procList) return;
    const r = procList.getBoundingClientRect();
    const trig = innerHeight * 0.6;
    procLine.style.transform = `scaleY(${Math.min(1, Math.max(0, (trig - r.top) / r.height))})`;
    procSteps.forEach((s) => s.classList.toggle("is-active", s.getBoundingClientRect().top + 28 < trig));
  }

  /* ---------------- Filtros genéricos ---------------- */
  // Cada grupo [data-filters="x"] filtra la lista [data-filter-list="x"].
  // data-filter-key indica el atributo a comparar (cat por defecto, o project).
  const lists = {};
  $$("[data-filter-list]").forEach((list) => { lists[list.dataset.filterList] = { list, state: {} }; });
  function applyFilter(name) {
    const { list, state } = lists[name];
    let shown = 0;
    $$("[data-item]", list).forEach((item) => {
      const ok = Object.entries(state).every(([key, val]) => val === "all" || item.dataset[key] === val);
      if (ok) {
        shown++; item.hidden = false;
        requestAnimationFrame(() => item.classList.remove("is-hiding"));
      } else {
        item.classList.add("is-hiding");
        setTimeout(() => { if (item.classList.contains("is-hiding")) item.hidden = true; }, reduce ? 0 : 320);
      }
    });
    const scope = list.closest("section");
    const count = scope && $("[data-count]", scope);
    if (count) count.textContent = shown;
    const empty = scope && $("[data-empty]", scope);
    if (empty) empty.hidden = shown > 0;
    $$(`.toc li`).forEach((li) => { if (name === "svc") li.hidden = !(state.cat === "all" || li.dataset.cat === state.cat); });
  }
  $$("[data-filters]").forEach((group) => {
    const name = group.dataset.filters;
    if (!lists[name]) return;
    const key = group.dataset.filterKey || "cat";
    lists[name].state[key] = "all";
    $$("[data-filter]", group).forEach((chip) => chip.addEventListener("click", () => {
      $$("[data-filter]", group).forEach((c) => { const on = c === chip; c.classList.toggle("is-active", on); c.setAttribute("aria-pressed", String(on)); });
      lists[name].state[key] = chip.dataset.filter;
      applyFilter(name);
    }));
  });

  /* ---------------- Índice con scrollspy (servicios) ---------------- */
  const tocLinks = $$("[data-toc] a");
  if (tocLinks.length && "IntersectionObserver" in window) {
    const spy = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) tocLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === "#" + en.target.id));
    }), { rootMargin: "-40% 0px -55% 0px" });
    tocLinks.forEach((a) => { const sec = document.getElementById(a.getAttribute("href").slice(1)); if (sec) spy.observe(sec); });
  }

  /* ---------------- Carruseles en celular ---------------- */
  // En pantallas pequeñas las galerías se deslizan de lado (CSS). Aquí se agregan los puntos
  // (o el contador "03 / 16" cuando hay muchas fotos) y se mantienen al día al filtrar.
  const carMQ = matchMedia("(max-width: 640px)");
  const carLists = $$(".gallery, .pcards, .review-grid");
  function carItems(list) { return [...list.children].filter((el) => !el.hidden && el.offsetParent !== null); }
  function carBuild(list) {
    let nav = list.nextElementSibling;
    if (!nav || !nav.classList.contains("car-nav")) {
      nav = document.createElement("div"); nav.className = "car-nav"; nav.setAttribute("aria-hidden", "true");
      list.after(nav);
    }
    const items = carItems(list);
    nav.replaceChildren();
    if (!carMQ.matches || items.length < 2) return;
    if (items.length <= 8) {
      items.forEach((it, k) => {
        const b = document.createElement("button"); b.type = "button"; b.className = "car-dot"; b.tabIndex = -1;
        b.addEventListener("click", () => list.scrollTo({ left: it.offsetLeft - list.offsetLeft - parseFloat(getComputedStyle(list).paddingLeft), behavior: reduce ? "auto" : "smooth" }));
        nav.append(b);
      });
    } else {
      const c = document.createElement("span"); c.className = "car-count"; nav.append(c);
    }
    const hint = document.createElement("span"); hint.className = "car-hint"; hint.textContent = t("car.swipe"); nav.append(hint);
    carSync(list);
  }
  function carSync(list) {
    const nav = list.nextElementSibling; if (!nav || !nav.classList.contains("car-nav")) return;
    const items = carItems(list); if (!items.length) return;
    const x = list.scrollLeft + 1;
    let i = 0; items.forEach((it, k) => { if (it.offsetLeft - list.offsetLeft - parseFloat(getComputedStyle(list).paddingLeft) <= x) i = k; });
    if (list.scrollLeft + list.clientWidth >= list.scrollWidth - 4) i = items.length - 1;
    $$(".car-dot", nav).forEach((d, k) => d.setAttribute("aria-current", String(k === i)));
    const c = $(".car-count", nav); if (c) c.textContent = `${String(i + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
    const h = $(".car-hint", nav); if (h) h.hidden = i > 0;
  }
  carLists.forEach((list) => {
    let raf;
    list.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => carSync(list)); }, { passive: true });
    new MutationObserver(() => setTimeout(() => { list.scrollLeft = 0; carBuild(list); }, reduce ? 0 : 340)).observe(list, { subtree: true, attributes: true, attributeFilter: ["hidden"] });
    carBuild(list);
  });
  carMQ.addEventListener("change", () => carLists.forEach(carBuild));

  /* ---------------- Lightbox ---------------- */
  const lb = $("[data-lb]");
  if (lb) {
    const lbImg = $("[data-lb-img]", lb), lbTitle = $("[data-lb-title]", lb), lbSub = $("[data-lb-sub]", lb);
    const lbCount = $("[data-lb-count]", lb), thumbs = $("[data-lb-thumbs]", lb);
    let list = [], idx = 0, trigger = null;
    const show = (n) => {
      idx = (n + list.length) % list.length;
      const b = list[idx], im = $("img", b);
      lbImg.src = b.dataset.full || im.src;
      lbImg.alt = im.alt;
      lbTitle.textContent = $(".g-cap strong", b)?.textContent || "";
      lbSub.textContent = $(".g-cap em", b)?.textContent || "";
      lbCount.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(list.length).padStart(2, "0")}`;
      $$("button", thumbs).forEach((tb, k) => { tb.setAttribute("aria-current", String(k === idx)); if (k === idx) tb.scrollIntoView({ inline: "center", block: "nearest" }); });
      const nxt = list[(idx + 1) % list.length];
      if (nxt) { const pre = new Image(); pre.src = nxt.dataset.full; }
    };
    const open = (btn) => {
      const gal = btn.closest("[data-gallery]");
      list = $$("[data-lightbox]", gal).filter((b) => !b.closest("[data-item]")?.hidden);
      trigger = btn;
      thumbs.replaceChildren(...list.map((b, k) => {
        const tb = document.createElement("button");
        tb.type = "button"; tb.setAttribute("aria-label", `${k + 1}`);
        const ti = document.createElement("img"); ti.src = $("img", b).currentSrc || $("img", b).src; ti.alt = "";
        tb.append(ti); tb.addEventListener("click", () => show(k));
        return tb;
      }));
      lb.hidden = false;
      requestAnimationFrame(() => lb.classList.add("is-open"));
      document.body.classList.add("no-scroll");
      show(list.indexOf(btn));
      $("[data-lb-close]", lb).focus();
    };
    const close = () => {
      lb.classList.remove("is-open");
      document.body.classList.remove("no-scroll");
      setTimeout(() => { lb.hidden = true; }, 300);
      trigger?.focus();
    };
    document.addEventListener("click", (e) => { const b = e.target.closest("[data-lightbox]"); if (b) open(b); });
    $("[data-lb-close]", lb).addEventListener("click", close);
    $("[data-lb-prev]", lb).addEventListener("click", () => show(idx - 1));
    $("[data-lb-next]", lb).addEventListener("click", () => show(idx + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lb-figure")) close(); });
    document.addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(idx + 1);
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "Tab") {
        const f = $$("button", lb).filter((b) => b.offsetParent);
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    let tx = null;
    lb.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (tx === null) return;
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 45) show(idx + (dx < 0 ? 1 : -1));
      tx = null;
    });
  }

  /* ---------------- Cursor "View" sobre imágenes (desktop) ---------------- */
  const cur = $("[data-cursor]");
  if (cur && matchMedia("(hover: hover) and (pointer: fine)").matches && !reduce) {
    let x = 0, y = 0, raf;
    addEventListener("mousemove", (e) => {
      x = e.clientX; y = e.clientY;
      if (!raf) raf = requestAnimationFrame(() => { cur.style.translate = `${x}px ${y}px`; raf = null; });
    }, { passive: true });
    document.addEventListener("mouseover", (e) => cur.classList.toggle("is-on", !!e.target.closest("[data-cursor-target]")));
  }

  /* ---------------- Estado y ciudad ---------------- */
  // Cada par [data-state] / [data-city] dentro del mismo formulario se enlaza:
  // al elegir el estado, la lista de ciudades se llena con las de ese estado.
  const LOCS = window.US_LOCATIONS || [];
  const OTHER = "__other";
  function fillStates(sel) {
    const cur = sel.value;
    sel.replaceChildren(new Option(t("loc.pickState"), ""), ...LOCS.map(([code, name]) => new Option(name, code)));
    sel.value = cur;
  }
  function fillCities(stateSel, citySel) {
    const cur = citySel.value;
    const entry = LOCS.find(([code]) => code === stateSel.value);
    if (!entry) {
      citySel.replaceChildren(new Option(t("loc.cityFirst"), ""));
      citySel.disabled = true;
      return;
    }
    citySel.replaceChildren(new Option(t("loc.pickCity"), ""), ...entry[2].map((c) => new Option(c, c)), new Option(t("loc.otherCity"), OTHER));
    citySel.disabled = false;
    if ([...citySel.options].some((o) => o.value === cur)) citySel.value = cur;
  }
  const locPairs = $$("form").map((f) => [$("[data-state]", f), $("[data-city]", f)]).filter(([a, b]) => a && b);
  locPairs.forEach(([st, ci]) => {
    fillStates(st); fillCities(st, ci);
    st.addEventListener("change", () => { ci.value = ""; fillCities(st, ci); });
  });
  onLang.push(() => locPairs.forEach(([st, ci]) => { fillStates(st); fillCities(st, ci); }));
  const locText = (st, ci) => {
    if (!st?.value) return "";
    const state = st.options[st.selectedIndex].textContent;
    if (!ci.value) return state;
    return ci.value === OTHER ? `${t("loc.otherCity")}, ${state}` : `${ci.value}, ${state}`;
  };

  /* ---------------- Planificador ---------------- */
  const planner = $("[data-planner]");
  const form = $("[data-contact]");
  if (planner) {
    const steps = $$("[data-step]", planner);
    const bar = $("[data-planner-bar]", planner), count = $("[data-planner-count]", planner);
    const prev = $("[data-planner-prev]", planner), next = $("[data-planner-next]", planner);
    const go = $("[data-planner-go]", planner), reset = $("[data-planner-reset]", planner);
    const err = $("[data-planner-error]", planner), result = $("[data-planner-result]", planner), sum = $("[data-planner-summary]", planner);
    let step = 0, errKey = "";
    const a0 = () => { const st = $("#p-estado", planner), ci = $("#p-ciudad", planner); st.value = ""; fillCities(st, ci); };
    const label = (inp) => inp?.nextElementSibling?.textContent.trim() ?? "";
    const pick = (n) => $$(`input[name="${n}"]:checked`, planner);
    const ans = () => ({ tipo: pick("p-tipo")[0], esp: pick("p-espacios"), st: $("#p-estado", planner), ci: $("#p-ciudad", planner), ini: pick("p-inicio")[0] });
    const valid = () => {
      const a = ans();
      if (step === 0 && !a.tipo) return "pl.e1";
      if (step === 1 && !a.esp.length) return "pl.e2";
      if (step === 2 && (!a.st.value || !a.ci.value || !a.ini)) return "pl.e3";
      return "";
    };
    const render = () => {
      const done = step >= steps.length;
      steps.forEach((s, k) => { s.hidden = k !== step; });
      result.hidden = !done; prev.hidden = step === 0 || done; next.hidden = done; go.hidden = !done; reset.hidden = !done;
      bar.style.width = `${done ? 100 : ((step + 1) / steps.length) * 100}%`;
      count.textContent = done ? t("pl.done") : t("pl.step", { n: step + 1, total: steps.length });
      next.textContent = t(step === steps.length - 1 ? "pl.review" : "pl.next");
      err.textContent = errKey ? t(errKey) : "";
      if (done) {
        const a = ans();
        const rows = [["pl.r.svc", label(a.tipo)], ["pl.r.sp", a.esp.map(label).join(", ")], ["pl.r.loc", locText(a.st, a.ci)], ["pl.r.start", label(a.ini)]];
        sum.replaceChildren(...rows.flatMap(([k, v]) => { const dt = document.createElement("dt"); dt.textContent = t(k); const dd = document.createElement("dd"); dd.textContent = v; return [dt, dd]; }));
      }
    };
    onLang.push(render);
    next.addEventListener("click", () => {
      errKey = valid();
      if (!errKey) { step++; if (step >= steps.length) toForm(); }
      render();
      if (step >= steps.length) result.focus();
    });
    prev.addEventListener("click", () => { errKey = ""; step = Math.max(0, step - 1); render(); });
    reset.addEventListener("click", () => { $$("input", planner).forEach((i) => { i.checked = false; }); a0(); step = 0; errKey = ""; render(); });
    $$('input[name="p-tipo"]', planner).forEach((r) => r.addEventListener("change", () => setTimeout(() => { if (step === 0) next.click(); }, reduce ? 0 : 260)));
    go.addEventListener("click", (e) => {
      e.preventDefault();
      $("#formulario")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      setTimeout(() => { form?.classList.add("is-flash"); $("#f-nombre")?.focus({ preventScroll: true }); }, reduce ? 0 : 500);
      setTimeout(() => form?.classList.remove("is-flash"), 1800);
    });
    function toForm() {
      if (!form) return;
      const a = ans();
      $("#f-servicio").value = a.tipo.value;
      const fs = $("#f-estado"), fc = $("#f-ciudad");
      if (fs && fc) { fs.value = a.st.value; fillCities(fs, fc); fc.value = a.ci.value; }
      const msg = $("#f-mensaje");
      const line = t("pl.line", { spaces: a.esp.map(label).join(", "), start: label(a.ini) });
      msg.value = msg.value.trim() ? `${msg.value.trim()}\n${line}` : `${line}\n`;
      msg.dispatchEvent(new Event("input"));
    }
    render();

    // Servicio preseleccionado desde otra página: contacto.html#svc-<id>
    const h = location.hash.match(/^#svc-([a-z0-9-]+)$/);
    if (h) {
      const r = $(`input[name="p-tipo"][value="${h[1]}"]`, planner);
      if (r) {
        r.checked = true; step = 1; render();
        $("#f-servicio").value = h[1];
        setTimeout(() => { $("#planifica").scrollIntoView({ behavior: "auto" }); toast(t("svc.preselected", { s: label(r) })); }, 60);
      }
    }
  }

  /* ---------------- Teléfono y ZIP con formato automático ---------------- */
  // Teléfono de EE. UU.: (954) 270-1712 mientras se escribe; con +1 delante: +1 (954) 270-1712.
  // Números de otros países (empiezan con + y otro código): se dejan con dígitos y espacios.
  // ZIP: 5 dígitos (33301) o ZIP+4 (33301-1234).
  const digits = (v) => v.replace(/\D/g, "");
  function fmtPhone(v) {
    const raw = v.trimStart();
    if (raw.startsWith("+") && !raw.startsWith("+1")) return "+" + raw.slice(1).replace(/[^\d ]/g, "").replace(/ {2,}/g, " ").slice(0, 19);
    let d = digits(raw), pre = "";
    if (raw.startsWith("+1") || (d.length > 10 && d[0] === "1")) { pre = "+1 "; d = d.slice(1); }
    d = d.slice(0, 10);
    if (!d) return pre.trim();
    if (d.length < 4) return pre + "(" + d;
    if (d.length < 7) return `${pre}(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `${pre}(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  }
  const fmtZip = (v) => { const d = digits(v).slice(0, 9); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; };
  function liveFormat(inp, fmt) {
    inp.addEventListener("input", (e) => {
      const caret = inp.selectionStart ?? inp.value.length;
      let v = inp.value;
      // Al borrar un paréntesis, espacio o guion, borra también el dígito anterior
      if (e.inputType === "deleteContentBackward" && digits(v) === digits(inp.dataset.prev || "") && caret > 0) {
        const before = v.slice(0, caret), idx = before.search(/\d\D*$/);
        if (idx >= 0) v = v.slice(0, idx) + v.slice(idx + 1);
      }
      const nBefore = digits(v.slice(0, caret)).length;
      const out = fmt(v);
      const unchanged = out === inp.value;
      inp.value = out;
      inp.dataset.prev = out;
      if (!unchanged && document.activeElement === inp) {
        let pos = 0, seen = 0;
        while (pos < out.length && seen < nBefore) { if (/\d/.test(out[pos])) seen++; pos++; }
        if (nBefore === 0) pos = out.startsWith("+") ? Math.min(out.length, 1) : 0;
        inp.setSelectionRange(pos, pos);
      }
    });
  }
  $$("[data-phone]").forEach((i) => liveFormat(i, fmtPhone));
  $$("[data-zip]").forEach((i) => liveFormat(i, fmtZip));

  /* ---------------- Formulario ---------------- */
  if (form) {
    const status = $("[data-form-status]", form), counter = $("[data-counter]", form), msg = $("#f-mensaje");
    const fb = $("[data-form-fallback]", form), fbText = $("[data-form-text]", form);
    let statusKey = "";
    msg.addEventListener("input", () => { counter.textContent = msg.value.length; });
    const rules = {
      nombre: (v) => v.trim().length >= 2 || "fm.e.name",
      email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "fm.e.email",
      telefono: (v) => { const t0 = v.trim(), d = digits(t0); if (!t0) return true; if (t0.startsWith("+") && !t0.startsWith("+1")) return (d.length >= 8 && d.length <= 15) || "fm.e.phone"; return (d.length === 10 || (d.length === 11 && d[0] === "1")) || "fm.e.phone"; },
      zip: (v) => !v.trim() || /^\d{5}(-\d{4})?$/.test(v.trim()) || "fm.e.zip",
      mensaje: (v) => v.trim().length >= 10 || "fm.e.msg",
    };
    const check = (name) => {
      const inp = form.elements[name], res = rules[name](inp.value), ok = res === true;
      const e = document.getElementById("e-" + name);
      inp.closest(".field").classList.toggle("has-error", !ok);
      inp.setAttribute("aria-invalid", String(!ok));
      if (e) { e.textContent = ok ? "" : t(res); ok ? inp.removeAttribute("aria-describedby") : inp.setAttribute("aria-describedby", e.id); }
      return ok;
    };
    Object.keys(rules).forEach((n) => {
      form.elements[n].addEventListener("blur", () => { if (form.elements[n].value) check(n); });
      form.elements[n].addEventListener("input", () => { if (form.elements[n].closest(".field").classList.contains("has-error")) check(n); });
    });
    onLang.push(() => {
      Object.keys(rules).forEach((n) => { if (form.elements[n].closest(".field").classList.contains("has-error")) check(n); });
      status.textContent = statusKey ? t(statusKey) : "";
    });
    const setStatus = (k) => { statusKey = k; status.textContent = k ? t(k) : ""; };
    const optText = (sel) => sel.options[sel.selectedIndex]?.textContent.trim() ?? "";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const res = Object.keys(rules).map(check);
      if (res.includes(false)) { form.elements[Object.keys(rules)[res.indexOf(false)]].focus(); setStatus("fm.check"); return; }
      const d = Object.fromEntries(new FormData(form));
      const subject = `${t("m.subject")}: ${optText(form.elements.servicio)} | ${d.nombre}`;
      const body = [
        `${t("m.name")}: ${d.nombre}`, `${t("m.email")}: ${d.email}`, `${t("m.phone")}: ${d.telefono || "—"}`,
        `${t("m.svc")}: ${optText(form.elements.servicio)}`, `${t("m.loc")}: ${locText(form.elements.estado, form.elements.ciudad) || "—"}`, `${t("m.zip")}: ${d.zip || "—"}`,
        d.zoom ? t("m.zoom") : "", d.contacto ? `${t("m.pref")}` : "", "", d.mensaje,
      ].filter((l, i) => l !== "" || i === 8).join("\n");
      fbText.textContent = `${subject}\n\n${body}`;

      if (CONFIG.formEndpoint) {
        setStatus("fm.sending");
        try {
          const r = await fetch(CONFIG.formEndpoint, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ ...d, _subject: subject, idioma: lang }) });
          if (!r.ok) throw new Error(r.status);
          setStatus("fm.sent"); fb.hidden = true; form.reset(); counter.textContent = "0";
        } catch (err) { setStatus("fm.fail"); fb.hidden = false; }
        return;
      }
      // Sin servicio de formularios: abre el correo del visitante y deja el mensaje listo para copiar
      location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus("fm.mail");
      fb.hidden = false;
    });
    $("[data-copy-form]", form)?.addEventListener("click", () => copyText(fbText.textContent, fbText));
  }

  /* ---------------- Arranque ---------------- */
  onScroll();
})();
