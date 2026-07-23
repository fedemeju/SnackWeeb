// ──────────────── FINAL SITE JS ────────────────
// (Stripped of the wireframe-specific tabs / notes / compare logic.
//  Keeps: hamburger menu, smooth scroll, live hours, year counters,
//  ES/EN toggle, trackEvent helper, hero carousel.)

// ─── galería · botón "Mostrar más" ───
document.querySelectorAll('[data-gallery-toggle]').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.closest('.gallery-section');
    const gallery = section?.querySelector('.gallery');
    if (!gallery) return;
    const expanded = gallery.classList.toggle('is-expanded');
    btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    if (!expanded) {
      // Si se cierra, scrollear de vuelta al inicio de la galería
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    trackEvent('gallery_toggle', { expanded });
  });
});

// ─── galería + lightbox ───
(function initGalleryLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;
  const lbImg = lightbox.querySelector('.lightbox-img');
  const lbCurrent = lightbox.querySelector('.lightbox-current');
  const lbTotal = lightbox.querySelector('.lightbox-total');
  let items = [];
  let current = 0;

  function open(galleryRoot, idx) {
    items = Array.from(galleryRoot.querySelectorAll('.gallery-item'));
    current = idx;
    show(idx);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    trackEvent('gallery_open', { idx });
  }
  function close() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lbImg.src = '';
  }
  function show(i) {
    current = (i + items.length) % items.length;
    lbImg.src = items[current].dataset.full;
    lbImg.alt = items[current].querySelector('img')?.alt || '';
    lbCurrent.textContent = current + 1;
    lbTotal.textContent = items.length;
  }

  // Conectar todos los .gallery (mobile + desktop)
  document.querySelectorAll('.gallery').forEach(g => {
    g.querySelectorAll('.gallery-item').forEach((item, i) => {
      item.addEventListener('click', () => open(g, i));
    });
  });
  lightbox.querySelector('.lightbox-close').addEventListener('click', close);
  lightbox.querySelector('.lightbox-prev').addEventListener('click', () => show(current - 1));
  lightbox.querySelector('.lightbox-next').addEventListener('click', () => show(current + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(current + 1);
    else if (e.key === 'ArrowLeft')  show(current - 1);
  });

  // ─── Gestos táctiles (swipe en mobile) · detector simple sin live-drag ───
  let touchStartX = 0, touchStartY = 0, touchStartT = 0;
  const SWIPE_MIN = 50;   // px mínimos para registrar swipe
  const SWIPE_MAX_T = 700; // ms máximos · más lento = no es swipe

  lightbox.addEventListener('touchstart', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.target.closest('.lightbox-btn')) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartT = Date.now();
  }, { passive: true });

  lightbox.addEventListener('touchend', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.target.closest('.lightbox-btn')) return;
    if (!touchStartT) return;
    const dt = Date.now() - touchStartT;
    touchStartT = 0;
    if (dt > SWIPE_MAX_T) return; // gesto demasiado lento
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    // Swipe horizontal claro (más X que Y · al menos 50px)
    if (absX > SWIPE_MIN && absX > absY * 1.3) {
      if (dx < 0) show(current + 1);   // swipe izquierda → siguiente
      else show(current - 1);          // swipe derecha → anterior
    }
    // Swipe vertical hacia abajo claro (más Y que X · al menos 80px)
    else if (dy > 80 && absY > absX * 1.3) {
      close();
    }
  }, { passive: true });
})();

// ─── hero carousel · auto-rotate, fade, dots, teclado, pausa en hover ───
function initHeroCarousel(root) {
  const slides = root.querySelectorAll('.hero-slide');
  const dots = root.querySelectorAll('.hero-dot');
  if (slides.length < 2) return;
  let current = 0, timer = null;
  const ROTATE_MS = 3000;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(i) {
    i = (i + slides.length) % slides.length;
    if (i === current) return;
    slides[current].classList.remove('is-active');
    dots[current]?.classList.remove('is-active');
    slides[i].classList.add('is-active');
    dots[i]?.classList.add('is-active');
    current = i;
  }
  function next() { show(current + 1); }
  function start() { if (!timer && !reduceMotion) timer = setInterval(next, ROTATE_MS); }
  function stop() { clearInterval(timer); timer = null; }

  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  dots.forEach(d => d.addEventListener('click', () => {
    stop(); show(parseInt(d.dataset.i)); start();
  }));
  // teclado solo cuando el carousel está visible en viewport
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { stop(); next(); start(); }
    if (e.key === 'ArrowLeft')  { stop(); show(current - 1); start(); }
  });
  start();
}
// Inicializar todos los carousels que estén visibles (mobile o desktop)
document.querySelectorAll('.hero-carousel').forEach(root => {
  // Solo iniciar el que está realmente visible
  if (root.offsetParent !== null) initHeroCarousel(root);
});
// Si la ventana se redimensiona y cambia qué carousel está visible, re-inicializar
let _heroResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_heroResizeTimer);
  _heroResizeTimer = setTimeout(() => {
    document.querySelectorAll('.hero-carousel').forEach(root => {
      if (root.offsetParent !== null && !root._heroInited) {
        root._heroInited = true;
        initHeroCarousel(root);
      }
    });
  }, 200);
});

// ─── Toast helper (notificaciones flotantes) ───
window.showToast = function(message, duration = 2500) {
  // remover toast previo si existe
  document.querySelectorAll('.site-toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'site-toast';
  toast.textContent = message;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 350);
  }, duration);
};

// ─── 1. Scroll progress bar ───
(() => {
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;
  let ticking = false;
  function update() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = docHeight > 0 ? window.scrollY / docHeight : 0;
    bar.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
})();

// ─── 2. Scroll reveal · fade-in on scroll ───
(() => {
  if (!('IntersectionObserver' in window)) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll(
    '.m-band, .d-band, .gallery-section, .cotizador, .cp-hero, .ev-hero, ' +
    '.ristrel-head, .ristrel-photo, .kids-card, .events-head, .events-types-grid, ' +
    '.events-stats, .events-pkg-section, .events-cta-block, .paq-pair, .ev-pkg-grid, ' +
    '.paq-compare, .ev-compare, .cp-faq, .cp-final, .ev-final, .d-duo-card--solo, ' +
    '.d-mundos, .d-ristrel, .d-timeline, .d-contact, .espacios-grid, .hist-hero'
    /* NOTA: .timeline NO va acá porque ya tiene su propia animación de items
       (controlada por historia.html · IntersectionObserver sobre .timeline-item) */
  );
  if (reduce) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }
  targets.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });
  targets.forEach(el => io.observe(el));
})();

// ─── 4. Smart sticky nav · hide on scroll down, show on scroll up ───
(() => {
  const navs = document.querySelectorAll('.m-nav, .d-nav');
  if (!navs.length) return;
  let lastScroll = window.scrollY;
  let ticking = false;
  function update() {
    const current = window.scrollY;
    const goingDown = current > lastScroll;
    const farFromTop = current > 120;
    navs.forEach(n => {
      if (goingDown && farFromTop) n.classList.add('nav-hidden');
      else n.classList.remove('nav-hidden');
    });
    lastScroll = current;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
})();

// ─── 8. Click-to-copy en teléfonos (solo desktop) ───
(() => {
  const isDesktop = matchMedia('(min-width: 980px)').matches;
  if (!isDesktop || !navigator.clipboard) return;
  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const number = link.textContent.trim() || link.getAttribute('href').replace('tel:', '');
      navigator.clipboard.writeText(number).then(() => {
        showToast(`📞 Copiado: ${number}`);
        trackEvent('phone_copy', { number });
      }).catch(() => {
        // fallback: dejar que el browser maneje
        window.location.href = link.getAttribute('href');
      });
    });
  });
})();

// ─── Cotizador · agregar toast al submit + min date = hoy ───
(function initCotizadores() {
  const todayIso = new Date().toISOString().split('T')[0];
  document.querySelectorAll('[data-cotizador] input[type="date"]').forEach(el => {
    el.min = todayIso;
  });
  document.querySelectorAll('[data-cotizador]').forEach(form => {
    form.addEventListener('submit', () => {
      setTimeout(() => showToast('✓ Abriendo WhatsApp...', 2500), 50);
    }, { capture: false });
  });
})();

// ─── PWA · registrar service worker (solo si está servido por http(s)) ───
if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
  });
}

// ─── analytics helper · enchufable a GA4 / Plausible / lo que sea ───
// Uso: trackEvent('cta_click', { label: 'whatsapp_hero' })
window.trackEvent = function(name, params) {
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    }
    // si después agregás Plausible: window.plausible && plausible(name, {props: params});
  } catch (e) {}
};

// Tracking automático: cualquier link a WhatsApp y todos los CTAs
document.addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;
  const href = a.getAttribute('href') || '';
  if (href.includes('api.whatsapp.com') || href.includes('wa.me')) {
    trackEvent('whatsapp_click', {
      page: location.pathname,
      label: a.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)
    });
  } else if (href.startsWith('mailto:')) {
    trackEvent('email_click', { page: location.pathname });
  } else if (href.startsWith('tel:')) {
    trackEvent('phone_click', { page: location.pathname });
  } else if (href.includes('menu.maxirest.com')) {
    trackEvent('menu_click', { page: location.pathname });
  } else if (href.includes('maps.google') || href.includes('google.com/maps')) {
    trackEvent('map_click', { page: location.pathname });
  }
}, { passive: true });

// ─── mobile menu overlay ───
document.querySelectorAll('[data-menu-toggle]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-menu]').forEach(m => m.classList.toggle('open'));
  });
});
document.querySelectorAll('[data-menu-link]').forEach(link => {
  link.addEventListener('click', (e) => {
    const menu = link.closest('[data-menu]');
    if (menu) menu.classList.remove('open');
    const href = link.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── auto-update year + years-since counter ───
function renderYears() {
  const yr = new Date().getFullYear();
  document.querySelectorAll('[data-current-year]').forEach(el => el.textContent = yr);
  document.querySelectorAll('[data-years-since]').forEach(el => {
    const since = parseInt(el.dataset.yearsSince, 10);
    if (!isNaN(since)) el.textContent = yr - since;
  });
}
renderYears();

// ─── live opening hours ───
// Domingo a Jueves: 08:30 → 02:00 (siguiente día)
// Viernes y Sábado: 08:30 → 04:00 (siguiente día)
// Excepción · víspera de feriado (mañana feriado, o hoy feriado con mañana Vie/Sáb) → cierre 04:00
const HOURS_SCHEDULE = {
  0: { open: 510, close: 1560 }, // Domingo
  1: { open: 510, close: 1560 }, // Lunes
  2: { open: 510, close: 1560 }, // Martes
  3: { open: 510, close: 1560 }, // Miércoles
  4: { open: 510, close: 1560 }, // Jueves
  5: { open: 510, close: 1680 }, // Viernes
  6: { open: 510, close: 1680 }, // Sábado
};

// Fallback de feriados argentinos · usado si la API no responde
// Fuente: calendario oficial 2026-2027 (actualizar año tras año si la API queda muerta)
const FERIADOS_FALLBACK = new Set([
  // 2026
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-03-23', '2026-03-24',
  '2026-04-02', '2026-04-03', '2026-05-01', '2026-05-25', '2026-06-15',
  '2026-06-20', '2026-07-09', '2026-08-17', '2026-10-12', '2026-11-23',
  '2026-12-08', '2026-12-25',
  // 2027
  '2027-01-01', '2027-02-08', '2027-02-09', '2027-03-24', '2027-03-26',
  '2027-04-02', '2027-05-01', '2027-05-25', '2027-06-15', '2027-06-21',
  '2027-07-09', '2027-08-16', '2027-10-11', '2027-11-22', '2027-12-08',
  '2027-12-25',
]);

let FERIADOS_AR = new Set(FERIADOS_FALLBACK);

function dateToISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isFeriado(date) {
  return FERIADOS_AR.has(dateToISO(date));
}

// Fetch async de la API · cachea 30 días en localStorage · re-renderiza al terminar
async function loadFeriados() {
  try {
    const cacheKey = 'feriados-AR-v1';
    const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    const now = Date.now();
    if (cached && cached.expires > now && Array.isArray(cached.data)) {
      FERIADOS_AR = new Set([...FERIADOS_FALLBACK, ...cached.data]);
      return;
    }
    const year = new Date().getFullYear();
    const fetches = [year, year + 1].map(y =>
      fetch(`https://api.argentinadatos.com/v1/feriados/${y}`, { signal: AbortSignal.timeout(3000) })
        .then(r => r.ok ? r.json() : [])
        .catch(() => [])
    );
    const results = await Promise.all(fetches);
    const fechas = results.flat().map(f => f.fecha).filter(Boolean);
    if (fechas.length) {
      FERIADOS_AR = new Set([...FERIADOS_FALLBACK, ...fechas]);
      localStorage.setItem(cacheKey, JSON.stringify({
        data: fechas,
        expires: now + 30 * 24 * 60 * 60 * 1000,
      }));
      renderHours();
    }
  } catch (_) { /* silencio · usa fallback */ }
}

function minutesToHHMM(mins) {
  const m = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
}

function renderHours() {
  const els = document.querySelectorAll('[data-hours]');
  if (!els.length) return;

  const now = new Date();
  const dow = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const yesterdayDow = (dow + 6) % 7;

  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const todayIsHoliday = isFeriado(now);
  const tomorrowIsHoliday = isFeriado(tomorrow);
  const yesterdayIsHoliday = isFeriado(yesterday);

  // Cierre extendido a 04:00 si:
  //  · mañana es feriado (víspera)
  //  · hoy es feriado AND mañana es Vie/Sáb
  function getCloseFor(dowVal, isToday, todayHoliday, tomorrowHoliday) {
    const base = HOURS_SCHEDULE[dowVal];
    if (!base) return base;
    const tomorrowDow = (dowVal + 1) % 7;
    const tomorrowIsFriSat = tomorrowDow === 5 || tomorrowDow === 6;
    const isWeekend = dowVal === 5 || dowVal === 6;
    if (isWeekend) return base; // Vie/Sáb ya cierran 04:00
    if (tomorrowHoliday) return { ...base, close: 1680 };
    if (todayHoliday && tomorrowIsFriSat) return { ...base, close: 1680 };
    return base;
  }

  const todaySchedule = getCloseFor(dow, true, todayIsHoliday, tomorrowIsHoliday);
  const yesterdaySchedule = getCloseFor(yesterdayDow, false, yesterdayIsHoliday, todayIsHoliday);

  let isOpen = false;
  let closesAtMins = null;

  if (yesterdaySchedule && yesterdaySchedule.close > 1440) {
    const spilloverEnd = yesterdaySchedule.close - 1440;
    if (minutes < spilloverEnd) { isOpen = true; closesAtMins = spilloverEnd; }
  }
  if (!isOpen && todaySchedule) {
    if (minutes >= todaySchedule.open && minutes < todaySchedule.close) {
      isOpen = true;
      closesAtMins = todaySchedule.close;
    }
  }

  let stateClass, statusText, detailText;
  if (isOpen) {
    const minsToClose = closesAtMins - minutes;
    const closeLabel = minutesToHHMM(closesAtMins);
    if (minsToClose <= 60) {
      stateClass = 'footer-hours--closing';
      statusText = 'Cerramos pronto';
      detailText = `Hasta las ${closeLabel}`;
    } else {
      stateClass = 'footer-hours--open';
      statusText = 'Abierto ahora';
      detailText = `Hasta las ${closeLabel}`;
    }
  } else {
    let openDay = dow;
    let nextOpenMins = null;
    if (todaySchedule && minutes < todaySchedule.open) nextOpenMins = todaySchedule.open;
    else {
      openDay = (dow + 1) % 7;
      const tomorrowSchedule = HOURS_SCHEDULE[openDay];
      if (tomorrowSchedule) nextOpenMins = tomorrowSchedule.open;
    }
    const openLabel = nextOpenMins != null ? minutesToHHMM(nextOpenMins) : '08:30';
    const dayLabel = openDay === dow ? 'hoy' : 'mañana';
    stateClass = 'footer-hours--closed';
    statusText = 'Cerrado ahora';
    detailText = `Abre ${dayLabel} a las ${openLabel}`;
  }

  els.forEach(el => {
    el.classList.remove('footer-hours--open', 'footer-hours--closing', 'footer-hours--closed');
    el.classList.add(stateClass);
    el.innerHTML = `<span class="footer-hours-status">${statusText}</span><span class="footer-hours-detail">${detailText}</span>`;
  });
}
renderHours();
setInterval(renderHours, 60000);
loadFeriados();

// ─── language toggle (ES / EN) ───
const I18N = {
  en: {
    'Bowling, pool, restaurante y pelotero, en Martínez.': 'Bowling, pool, restaurant and ball pit, in Martínez.',
    'Bowling, pool, restaurante y pelotero · en Martínez': 'Bowling, pool, restaurant and ball pit · in Martínez',
    'VER CARTA →': 'VIEW MENU →',
    'HABLAR POR WHATSAPP': 'CHAT ON WHATSAPP',
    'Multiespacio familiar desde 1967. Vení por una pista de bowling, quedate a comer y festejá tus cumples acá.': 'Family multispace since 1967. Come for a bowling lane, stay for dinner and host your birthdays here.',
    'los espacios': 'spaces',
    'el restaurante': 'the restaurant',
    'eventos': 'events',
    'línea de tiempo': 'timeline',
    'contacto': 'contact',
    'En línea': 'Online',
    'Escribir directo por WhatsApp': 'Message us on WhatsApp',
    'Abrir chat de ayuda': 'Open help chat',
    'Cerrar chat': 'Close chat',
    'Cuatro mundos': 'Four worlds',
    'bajo un techo': 'under one roof',
    'Eventos': 'Events',
    'La mejor opción para salidas empresariales, familiares o con amigos. Salón privado, gastronomía y bowling — todo bajo el mismo techo desde 1967.': 'The best option for corporate, family or friends gatherings. Private hall, gastronomy and bowling — all under one roof since 1967.',
    'años de historia': 'years of history',
    'Estamos en Martínez': 'We are in Martínez',
    'Sistema automático de conteo': 'Automatic counter system',
    'Abre Snack Bowling. Primer bowling automático del país.': 'Snack Bowling opens. First automatic bowling alley in the country.',
    'Reforma · llega el pelotero infantil.': 'Renovation · ball pit arrives.',
    'Acá estamos, esperándote.': 'Here we are, waiting for you.',
    '1967 · torneo de bowling': '1967 · bowling tournament',
    'bowling · 6 pistas automáticas': 'bowling · 6 automatic lanes',
    'pool · paños rojos clásicos': 'pool · classic red felt',
    'restaurante · parrilla y pastas': 'restaurant · grill & pasta',
    'pelotero · para los más chicos': 'ball pit · for little ones',
    'parrilla · pizzas · pastas · hamburguesas · tragos': 'grill · pizzas · pastas · burgers · drinks',
    'VER CARTA COMPLETA →': 'VIEW FULL MENU →',
    'Reservar mesa': 'Book a table',
    'La cocina que acompaña a Snack desde 1967. Carta amplia, opciones para chicos y grandes, sin necesidad de reservar.': 'The kitchen accompanying Snack since 1967. Wide menu, options for kids and adults, no reservation needed.',
    'platos\nen la carta': 'dishes\non the menu',
    'opciones\nsin TACC': 'gluten-free\noptions',
    'menú\npara chicos': 'kids\nmenu',
    'Gran bife Ristrel': 'Ristrel signature steak',
    '¡El cumple': 'The most',
    'más divertido': 'fun birthday',
    'de zona norte!': 'in zona norte!',
    'cumples infantiles': 'kids birthdays',
    'cómo funciona': 'how it works',
    'Escribinos por WP': 'Message us on WhatsApp',
    'contanos fecha y cuántos van': 'tell us the date and how many',
    'Elegís el paquete': 'Pick the package',
    'te pasamos opciones y armamos todo': 'we share options and set it up',
    'Llegan y festejan': 'Arrive and celebrate',
    'vos solo traés la torta': 'you only bring the cake',
    'qué incluye el cumple': 'what the party includes',
    'Bowling': 'Bowling',
    'Trofeos': 'Trophies',
    'y medallas': 'and medals',
    'solo Full': 'Full only',
    'Comida': 'Food',
    'Bebida': 'Drinks',
    'duración': 'duration',
    'chicos': 'kids',
    'paquetes': 'packages',
    '¿Festejamos?': 'Shall we celebrate?',
    'VER LOS PAQUETES →': 'VIEW PACKAGES →',
    'VER LOS 3 PAQUETES →': 'VIEW ALL 3 PACKAGES →',
    'de 6 a 13 años': 'from 6 to 13 years',
    'eventos & empresas': 'events & business',
    'para 10 a 180 personas': 'for 10 to 180 people',
    'After office': 'After office',
    'Despedidas': 'Send-offs',
    'Corporativos': 'Corporate',
    'Cumples adultos': 'Adult birthdays',
    'personas': 'people',
    'duración base': 'base duration',
    'qué ofrecemos': 'what we offer',
    'Pizza libre + bebida libre + postre': 'Unlimited pizza + drink + dessert',
    'Plato principal a elección + postre': 'Main course of choice + dessert',
    'Recepción + cazuela + postre': 'Reception + casserole + dessert',
    '+ opciones': '+ options',
    'o pedí cotización directa por WhatsApp': 'or request a quote directly via WhatsApp',
    'Festejá': 'Celebrate',
    'tu evento': 'your event',
    'con nosotros.': 'with us.',
    'Av. del Libertador 13054': '13054 Libertador Ave.',
    'Dom a Jue · 08:30 – 02:00': 'Sun to Thu · 08:30 – 02:00',
    'Vie y Sáb · 08:30 – 04:00': 'Fri & Sat · 08:30 – 04:00',
    'Los espacios': 'The spaces',
    'Carta digital': 'Digital menu',
    'Cumples infantiles': 'Kids birthdays',
    'Eventos & empresas': 'Events & business',
    'Historia': 'History',
    'Contacto': 'Contact',
    'Llamar': 'Call',
    'Dirección': 'Address',
    'Hablá por WhatsApp': 'Chat on WhatsApp',
    'bowling · pool · resto · pelotero': 'bowling · pool · restaurant · ball pit',
    'parrilla, pizzas, pastas y más': 'grill, pizzas, pasta and more',
    'desde 1967': 'since 1967',
    'after office · corporativos': 'after office · birthdays · corporate',
    'Hola, les estoy hablando desde la web!': 'Hi, I\'m messaging from your website!',

    // Cumples (sub-page)
    'Cumples Infantiles': 'Kids Birthdays',
    'Elegí': 'Choose',
    'tu paquete': 'your package',
    'de cumple': 'for your party',
    'Dos opciones simples. Sin sorpresas, sin agregados ocultos. Vos elegís cuál encaja con tu cumple.': 'Two simple options. No surprises, no hidden add-ons. You pick the one that fits.',
    'PAQUETE': 'PACKAGE',
    'FULL': 'FULL',
    'BASE': 'BASE',
    '🥇 El más elegido': '🥇 Most chosen',
    'Comida + bowling + diversión + sorpresas': 'Food + bowling + fun + surprises',
    'Comida + bowling + diversión': 'Food + bowling + fun',
    'incluye': 'includes',
    '1 línea de bowling + tiros libres': '1 bowling lane + free throws',
    'Bebida libre (Pepsi o agua)': 'Free drinks (Pepsi or water)',
    'Regalo para el homenajeado': 'Gift for the birthday kid',
    'Entrada de snacks': 'Snack starter',
    'Cuponera con líneas gratis para el homenajeado': 'Free-lane coupon book for the birthday kid',
    'Premiación con trofeos y medallas': 'Awards with trophies and medals',
    'Invitaciones digitales o físicas': 'Digital or printed invitations',
    'Sin entrada de snacks': 'No snack starter',
    'Sin cuponera gratis': 'No free coupon book',
    'Sin premiación con trofeos': 'No trophy ceremony',
    'chicos mín.': 'kids min.',
    'menú a elección': 'menu of choice',
    'Se elige un menú para todos. Hay opciones sin TACC.': 'One menu for everyone. Gluten-free options available.',
    'Hamburguesa': 'Burger',
    'Pizza': 'Pizza',
    'Panchos': 'Hot dogs',
    'Patitas': 'Chicken nuggets',
    'con papas fritas': 'with fries',
    '🎁 Ideal para los que quieren una experiencia completa con sorpresas, trofeos y diversión sin límites.': '🎁 Perfect for those who want the full experience with surprises, trophies and unlimited fun.',
    'PEDIR EL FULL POR WP': 'REQUEST FULL ON WP',
    'PEDIR EL BASE POR WP': 'REQUEST BASE ON WP',
    'Ver precios ↗': 'See prices ↗',
    'o si querés algo más simple': 'or if you want something simpler',
    'comparativa rápida': 'quick comparison',
    '¿En qué se diferencian?': 'How do they differ?',
    'Full': 'Full',
    'Base': 'Base',
    'Bowling + tiros libres': 'Bowling + free throws',
    'Bebida libre': 'Free drinks',
    'Regalo homenajeado': 'Gift for birthday kid',
    'Invitaciones': 'Invitations',
    'Entrada de snacks': 'Snack starter',
    'Cuponera homenajeado': 'Coupon book',
    'Trofeos y medallas': 'Trophies and medals',
    'Opciones de menú': 'Menu options',
    'preguntas frecuentes': 'frequently asked',
    'Lo que todos preguntan': 'What everyone asks',
    '¿Cómo reservo el día?': 'How do I book a date?',
    'Mandanos un mensaje por WhatsApp con la fecha tentativa y cuántos chicos van. Te confirmamos disponibilidad y reservamos con seña.': 'Send us a WhatsApp message with the tentative date and how many kids will attend. We confirm availability and reserve with a deposit.',
    '¿Hay opciones sin TACC?': 'Are there gluten-free options?',
    'Sí. Avisanos al reservar cuántos chicos lo necesitan y armamos el menú adaptado.': 'Yes. Let us know how many kids need it when booking and we adapt the menu.',
    '¿Puedo traer torta?': 'Can I bring a cake?',
    '¡Por supuesto! Vos traés la torta y nosotros nos encargamos del resto.': 'Of course! You bring the cake and we take care of the rest.',
    '¿Y si llegamos a 14 chicos?': 'What if we only have 14 kids?',
    'El mínimo es 15. Si son menos, igual escribinos y vemos cómo armarlo.': 'The minimum is 15. If fewer, write to us anyway and we\'ll see how to make it work.',
    '¿Adultos pueden comer?': 'Can adults eat too?',
    'Sí, los adultos eligen a la carta del restaurante Ristrel. No están incluidos en el paquete kids.': 'Yes, adults order from the Ristrel restaurant menu. Not included in the kids package.',
    '¿Lo armamos?': 'Shall we set it up?',
    'Decinos fecha, paquete y cuántos van. Listo.': 'Tell us the date, package and how many. Done.',

    // Eventos (sub-page)
    'Eventos & Empresas': 'Events & Business',
    'Tres paquetes,': 'Three packages,',
    'tu evento.': 'your event.',
    'After office, despedidas, corporativos o cumples de adultos. Elegí el formato gastronómico, sumá bowling y listo.': 'After office, send-offs, corporate events or adult birthdays. Pick the food format, add bowling and you\'re set.',

    'PAQUETE 1': 'PACKAGE 1',
    'PAQUETE 2': 'PACKAGE 2',
    'PAQUETE 3': 'PACKAGE 3',
    'Pizza Full': 'Pizza Full',
    'Ristrel Gourmet': 'Ristrel Gourmet',
    'Fun Food': 'Fun Food',
    '★ con más opciones': '★ more options',
    'desde': 'from',
    'Entrada + pizza libre + bebida libre + postre': 'Starter + unlimited pizza + free drinks + dessert',
    'Entrada + plato principal + bebida libre + postre': 'Starter + main course + free drinks + dessert',
    'Recepción + entradas + cazuela + bebida libre + postre': 'Reception + starters + casserole + free drinks + dessert',
    'adicionales': 'add-ons',
    '🎳 Bowling': '🎳 Bowling',
    '🍺 Hora extra de bebida libre': '🍺 Extra drinks hour',
    'Pizza libre · Mozzarella, fugazzeta, napolitana, jamón': 'Unlimited pizza · Mozzarella, onion, neapolitan, ham',
    'Bebida libre 2h · Pepsi o cerveza Quilmes': 'Free drinks 2h · Pepsi or Quilmes beer',
    'Bebida libre 2h · Pepsi, agua o cerveza Quilmes': 'Free drinks 2h · Pepsi, water or Quilmes beer',
    'Entrada de nachos y papas con cheddar': 'Nachos starter & cheddar fries',
    'Helado o café': 'Ice cream or coffee',
    'Invitaciones digitales': 'Digital invitations',
    '30 min de pool': '30 min of pool',
    '(excepto vie / sáb)': '(except Fri / Sat)',
    'entrada': 'starter',
    'plato principal · a elección': 'main course · pick one',
    'postre · a elección': 'dessert · pick one',
    'Milanesitas de mozzarella con salsa de tomate': 'Mozzarella sticks with tomato sauce',
    '🍝 Ñoquis con salsa cuatro quesos': '🍝 Gnocchi with four-cheese sauce',
    '🍗 Pollo deshuesado al champiñón': '🍗 Boneless chicken in mushroom sauce',
    '🥩 Bondiola con salsa Barbacoa': '🥩 Pork shoulder with BBQ sauce',
    'con papas noisette': 'with noisette potatoes',
    '🍨 Helados': '🍨 Ice cream',
    '🍓 Ensalada de frutas': '🍓 Fruit salad',
    '🥞 Panqueques': '🥞 Pancakes',
    'con crema o dulce de leche': 'with cream or dulce de leche',
    'recepción': 'reception',
    'entradas': 'starters',
    'Canapés y bruschetas': 'Canapés and bruschettas',
    'Brochette Capresse': 'Caprese brochette',
    'Huevos rellenos': 'Stuffed eggs',
    'Bombas de papa': 'Potato bombs',
    'Canastitas de calabaza y zanahoria': 'Pumpkin and carrot pastries',
    'cazuela · a elección': 'casserole · pick one',
    '🍝 Ravioles de ricota, jamón y nuez': '🍝 Ricotta, ham and walnut ravioli',
    'con boloñesa o mixta': 'with bolognese or mixed sauce',
    '🍗 Pollo en crema de puerros': '🍗 Chicken in leek cream',
    '🥘 Arroz a la valenciana': '🥘 Valencian rice',
    'Personas mínimo': 'Minimum people',
    'Recepción / canapés': 'Reception / canapés',
    'Entrada': 'Starter',
    'nachos': 'nachos',
    'milanesitas': 'mozzarella sticks',
    '4 opciones': '4 options',
    'Pizza libre': 'Unlimited pizza',
    'Plato principal': 'Main course',
    '3 opciones': '3 options',
    'cazuela · 3 op.': 'casserole · 3 opts.',
    'Postre': 'Dessert',
    'helado o café': 'ice cream or coffee',
    'Bebida libre 2h': 'Free drinks 2h',
    'Para decidir de un vistazo': 'To decide at a glance',
    'Bowling y hora extra de bebida disponibles como adicionales en cualquier paquete.': 'Bowling and extra drinks hour available as add-ons in any package.',
    'Mandanos fecha tentativa, cantidad de personas y qué paquete te interesa. Te respondemos rápido.': 'Send us a tentative date, number of people and which package interests you. We reply fast.',
    'Ver precios ↗': 'See prices ↗',

    // Historia (página completa)
    'años haciendo historia en Martínez': 'years making history in Martínez',
    'Snack Bowling abrió sus puertas en 1967 con el primer bowling automático del país. Desde entonces, cuatro generaciones de familias eligieron este lugar para festejar, jugar y comer.': 'Snack Bowling opened its doors in 1967 with the first automatic bowling alley in the country. Since then, four generations of families have chosen this place to celebrate, play and eat.',
    'Restaurante': 'Restaurant',
    'Más de 50 años de experiencia en el sector gastronómico. En esta foto podemos observar la primera caja registradora ¡una verdadera reliquia!': 'Over 50 years of experience in the food industry. In this photo we can see the first cash register — a true relic!',
    'Salón principal': 'Main hall',
    'Acá podemos ver el primer salón principal del restaurante, con la distribución original.': 'Here we can see the first main dining hall, with the original layout.',
    'Sector Bowling': 'Bowling area',
    'Acá podemos ver el bowling en sus orígenes. Los puntos se anotaban a mano y eran proyectados. Las máquinas de bowling son unas Brunswick A-1 ¡las primeras máquinas para palos automáticas de la Argentina!': 'Here we can see the bowling area in its origins. Scores were written by hand and projected. The bowling pinsetters are Brunswick A-1 — the first automatic pinsetters in Argentina!',
    'Primer diseño del bowling': 'First bowling design',
    'El primer estilo del bowling bien retro, el Brunswick Red Crown. Las pistas eran de madera, por lo cual se les hacía más mantenimiento para que no se dañen. Arriba se proyectaban las anotaciones.': 'The first super-retro bowling style, the Brunswick Red Crown. Lanes were wooden, requiring more maintenance to prevent damage. Scores were projected up above.',
    'Cambio a pistas sintéticas': 'Switch to synthetic lanes',
    'Se cambiaron las viejas pistas de madera por nuevas pistas sintéticas, más duraderas, con menos mantenimiento y las que se utilizan para jugar profesionalmente.': 'The old wooden lanes were replaced with new synthetic lanes — more durable, less maintenance, and the same ones used in professional play.',
    '¡Estrenando pistas!': 'New lanes opening!',
    'Las nuevas pistas y los nuevos retornos de bolas completamente instalados. También se cambió la decoración de las "máscaras" — lo que tapa la máquina de bowling — y los asientos.': 'The new lanes and ball returns fully installed. The pinsetter "masks" decoration and the seating were also updated.',
    'Nuevo salón restaurante': 'New restaurant hall',
    'Se renovó completamente el restaurante, cambiando la distribución del salón y unificando el mostrador (antes había dos). Se cambiaron todas las sillas y mesas.': 'The restaurant was fully renovated, changing the layout and unifying the counter (previously there were two). All chairs and tables were replaced.',
    'Mostrador restaurante': 'Restaurant counter',
    'Renovación del mostrador principal, cambio de heladeras y modernización del sistema de control de mesas.': 'Renovation of the main counter, new refrigerators and modernized table management system.',
    'Nueva entrada': 'New entrance',
    'Remodelación del jardín del frente. En ese momento no era necesario contar con estacionamiento, por lo tanto se usaba como jardín para poner mesas.': 'Renovation of the front garden. At that time parking wasn\'t needed, so the space was used as a garden with extra tables.',
    '¡Apareció el pool!': 'Pool tables arrive!',
    '¡Nuevo pool! Antes este sector se usaba como salón secundario con mesas para cenar o almorzar. Se remodeló completamente, agregando 5 mesas de pool.': 'New pool area! This sector was previously a secondary hall with dining tables. It was completely remodeled, adding 5 pool tables.',
    'Estacionamiento': 'Parking',
    'Ahora sí aparece el estacionamiento. También se renovó la fachada principal del local haciendo juego con el interior.': 'Now the parking lot appears. The main facade was also renovated to match the interior.',
    'Tercer diseño del bowling': 'Third bowling design',
    'Se cambió la estética general del bowling. Se cambió el sistema de anotaciones ¡por uno automático, ya no hay que anotar! Ahora los puntos se ven en pantallas.': 'The overall bowling aesthetic was updated. The scoring system was changed to an automatic one — no more manual scoring! Scores now show on screens.',
    'Nueva fachada': 'New facade',
    'Se renovó completamente el espacio exterior con una nueva imagen más moderna.': 'The outdoor space was fully renovated with a more modern look.',
    'Decks y nuevo cartel': 'Decks and new sign',
    'Se agregaron 3 decks exteriores y se cambió el cartel principal que da a la calle.': '3 outdoor decks were added and the main street-facing sign was replaced.',
  }
};

let currentLang = 'es';
window.currentLang = currentLang;

function applyLang(lang) {
  currentLang = lang;
  window.currentLang = lang;
  document.documentElement.lang = lang;
  // Reset chat si está en el DOM (para traducir preguntas/respuestas dinámicas)
  const chatRoot = document.querySelector('[data-chat]');
  if (chatRoot && chatRoot._chatReset) chatRoot._chatReset();

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const p = node.parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      if (p.closest('script, style')) return NodeFilter.FILTER_REJECT;
      if (p.matches('.lang-toggle, .lang-toggle *')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const dict = I18N[lang] || {};
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);

  nodes.forEach(node => {
    if (!node._origEs) node._origEs = node.nodeValue;
    const trimmed = node._origEs.trim();
    if (lang === 'es') node.nodeValue = node._origEs;
    else if (dict[trimmed]) node.nodeValue = node._origEs.replace(trimmed, dict[trimmed]);
    else node.nodeValue = node._origEs;
  });

  document.querySelectorAll('.lang-opt').forEach(el => {
    el.classList.toggle('is-active', el.dataset.lang === lang);
  });
}

document.querySelectorAll('[data-lang-toggle]').forEach(btn => {
  btn.addEventListener('click', () => applyLang(currentLang === 'es' ? 'en' : 'es'));
});

// ─── cotizador → arma mensaje y abre WhatsApp ───
const WP_PHONE = '+541168225209';
function encodeWp(t) { return encodeURIComponent(t).replace(/%20/g, '%20'); }

document.querySelectorAll('[data-cotizador]').forEach(form => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // Prevenir doble submit accidental (botón apretado dos veces rápido)
    if (form.dataset.submitting === 'true') return;
    form.dataset.submitting = 'true';
    setTimeout(() => { delete form.dataset.submitting; }, 2000);
    const tipo = form.dataset.cotizador;
    const data = Object.fromEntries(new FormData(form).entries());
    const fechaFmt = data.fecha
      ? new Date(data.fecha + 'T12:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'a definir';

    const lines = [];
    if (tipo === 'cumples') {
      const cumpleaneros = parseInt(data.cumpleaneros || '1', 10);
      const cumpleaneroLabel = cumpleaneros === 1 ? 'cumpleañero/a' : 'cumpleañeros/as';
      lines.push('¡Hola Snack! Quiero cotizar un cumple infantil:');
      lines.push('');
      lines.push(`• Paquete: ${data.paquete}`);
      lines.push(`• Fecha tentativa: ${fechaFmt}`);
      lines.push(`• Cantidad de invitados: ${data.cantidad} chicos`);
      lines.push(`• ${cumpleaneros} ${cumpleaneroLabel}`);
      if (data.nombre) lines.push(`• De parte de: ${data.nombre}`);
      lines.push('');
      lines.push('¡Gracias!');
    } else if (tipo === 'eventos') {
      lines.push('¡Hola Snack! Quiero cotizar un evento:');
      lines.push('');
      lines.push(`• Tipo: ${data.tipoEvento}`);
      lines.push(`• Paquete: ${data.paquete}`);
      lines.push(`• Fecha tentativa: ${fechaFmt}`);
      lines.push(`• Cantidad: ${data.cantidad} personas`);
      if (data.bowling) lines.push(`• ¿Con bowling?: ${data.bowling}`);
      if (data.nombre) lines.push(`• De parte de: ${data.nombre}`);
      lines.push('');
      lines.push('¡Gracias!');
    }
    const text = lines.join('\n');
    const url = `https://api.whatsapp.com/send?phone=${WP_PHONE}&text=${encodeWp(text)}`;
    trackEvent('cotizacion_submit', {
      tipo,
      paquete: data.paquete,
      cantidad: data.cantidad,
      fecha: data.fecha
    });
    window.open(url, '_blank', 'noopener');
  });
});

// ═══════════════════════════════════════════════════════════════
// CHAT ASISTENTE · quick-reply widget
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function initChat() {
  const root = document.querySelector('[data-chat]');
  if (!root) return;

  const body = root.querySelector('[data-chat-body]');
  const toggles = root.querySelectorAll('[data-chat-toggle]');
  const waLink = root.querySelector('[data-chat-wa]');
  const WA_BASE = 'https://api.whatsapp.com/send?phone=+541168225209&text=';

  const CHAT_CONTEXT = root.getAttribute('data-chat-context') || 'general';

  const CHAT_STRINGS = {
    es: {
      greet: CHAT_CONTEXT === 'cumples'
        ? '¡Hola! 🎂 ¿Tenés dudas sobre los cumples? Elegí una consulta.'
        : '¡Hola! 👋 Soy el asistente del <b>Snack</b>. ¿En qué te puedo ayudar?',
      back: '← Otra consulta',
      waPrefix: 'Hola! Tengo una consulta sobre: ',
      waDefault: CHAT_CONTEXT === 'cumples'
        ? '¡Hola! Quiero info de cumples infantiles.'
        : 'Hola, les estoy hablando desde la web!',
    },
    en: {
      greet: 'Hi! 👋 I\'m <b>Snack</b>\'s assistant. How can I help?',
      back: '← Another question',
      waPrefix: 'Hi! I have a question about: ',
      waDefault: CHAT_CONTEXT === 'cumples'
        ? 'Hi! I\'d like info about kids birthday parties.'
        : 'Hi, I\'m contacting you from your website!',
    },
  };

  const QA_CUMPLES = [
    {
      id: 'precio',
      wizard: 'cotizador-cumples',
      es: {
        q: '📅 ¿Cómo reservo? ¿Cuánto sale?',
      },
      en: {
        q: '📅 How do I book? How much?',
      },
    },
    {
      id: 'incluye',
      es: {
        q: '🎁 ¿Qué incluye el paquete?',
        a: 'Ambos paquetes incluyen <b>bowling con tiros libres</b>, comida a elección, bebida libre, regalo e invitaciones.<br><br>El <b>FULL</b> suma trofeos, medallas, entrada de snacks y cuponera con sorpresas.',
      },
      en: {
        q: '🎁 What\'s in the package?',
        a: 'Both packages include <b>bowling with free throws</b>, food, unlimited drinks, gift and invitations.<br><br>The <b>FULL</b> adds trophies, medals, snacks entry and a surprise coupon book.',
      },
    },
    {
      id: 'torta',
      es: {
        q: '🍰 ¿Puedo traer torta?',
        a: '¡Por supuesto! Vos traés la torta y nosotros nos encargamos del resto.',
      },
      en: {
        q: '🍰 Can I bring my own cake?',
        a: 'Of course! You bring the cake and we handle everything else.',
      },
    },
    {
      id: 'celiaco-cumple',
      es: {
        q: '🌾 ¿Opciones sin TACC?',
        a: '¡Sí! Avisanos al reservar cuántos chicos lo necesitan y armamos el <b>menú apto celíaco</b>.',
      },
      en: {
        q: '🌾 Gluten-free options?',
        a: 'Yes! Let us know how many kids need it when you book and we\'ll prep a <b>gluten-free menu</b>.',
      },
    },
    {
      id: 'adultos-cumple',
      es: {
        q: '🍔 ¿Adultos pueden comer?',
        a: 'Sí, los adultos eligen a la carta del <b>restaurante Ristrel</b>. No están incluidos en el paquete kids.',
      },
      en: {
        q: '🍔 Can adults eat too?',
        a: 'Yes, adults order from the <b>Ristrel restaurant</b> menu. Not included in the kids package.',
      },
    },
    {
      id: 'edad-cumple',
      es: {
        q: '🎳 ¿Qué edad pueden festejar?',
        a: 'Los cumples son para chicos de <b>6 a 13 años</b>.',
      },
      en: {
        q: '🎳 What ages can celebrate?',
        a: 'Birthday parties are for kids <b>6 to 13 years old</b>.',
      },
    },
  ];

  const QA_GENERAL = [
    {
      id: 'reservar',
      es: {
        q: '🎳 Reservar bowling o pool',
        a: 'No trabajamos con reserva de bowling ni pool · es por <b>orden de llegada</b>.',
      },
      en: {
        q: '🎳 Reserve bowling or pool',
        a: 'We don\'t take bowling or pool reservations · it\'s <b>first come, first served</b>.',
      },
    },
    {
      id: 'mesa',
      es: {
        q: '🍽️ Reservar mesa (cena/almuerzo)',
        a: 'Sí, tomamos reservas para comer. Llamanos al <b>4792-8009</b>.',
        cta: { text: '📞 Llamar al 4792-8009', href: 'tel:+541147928009' },
      },
      en: {
        q: '🍽️ Book a table (lunch/dinner)',
        a: 'Yes, we take reservations for meals. Call us at <b>4792-8009</b>.',
        cta: { text: '📞 Call 4792-8009', href: 'tel:+541147928009' },
      },
    },
    {
      id: 'menu',
      es: {
        q: '📖 Ver el menú de comidas',
        a: '¡Sí! Te paso nuestro menú digital con todos los platos y precios.',
        cta: { text: 'Ver menú digital →', href: 'https://menu.maxirest.com/408' },
      },
      en: {
        q: '📖 See the food menu',
        a: 'Sure! Here\'s our digital menu with all dishes and prices.',
        cta: { text: 'View digital menu →', href: 'https://menu.maxirest.com/408' },
      },
    },
    {
      id: 'celiacos',
      es: {
        q: '🌾 Opciones sin TACC (celíacos)',
        a: '¡Sí! Tenemos <b>varias opciones para celíacos</b>. Al llegar avisale al mozo/a y te asesoramos con lo apto.',
      },
      en: {
        q: '🌾 Gluten-free options (celiac)',
        a: 'Yes! We have <b>several gluten-free options</b>. Let your waiter know when you arrive and we\'ll guide you.',
      },
    },
    {
      id: 'cumples',
      es: {
        q: '🎂 Cumples infantiles',
        a: 'Sí, tenemos paquetes para chicos de <b>6 a 13 años</b>. Incluye bowling, comida y bebida.',
        cta: { text: 'Ver paquetes y cotizar →', href: '/cumples' },
      },
      en: {
        q: '🎂 Kids birthday parties',
        a: 'Yes, we have packages for kids <b>6 to 13 years old</b>. Includes bowling, food and drinks.',
        cta: { text: 'View packages & quote →', href: '/cumples' },
      },
    },
    {
      id: 'eventos',
      es: {
        q: '💼 Eventos y empresas',
        a: '¡Sí, realizamos eventos! After office, despedidas, corporativos y cumples adultos.<br><br>Tenemos <b>3 paquetes</b> para 10 a 180 personas.',
        cta: { text: 'Ver paquetes y cotizar →', href: '/eventos' },
      },
      en: {
        q: '💼 Events & companies',
        a: 'Yes, we host events! After office, farewell parties, corporate events and adult birthdays.<br><br>We have <b>3 packages</b> for 10 to 180 people.',
        cta: { text: 'View packages & quote →', href: '/eventos' },
      },
    },
    {
      id: 'horarios',
      es: {
        q: '🕐 Horarios de atención',
        a: () => {
          const hoy = getCloseHoyLabel();
          const linea = hoy ? `<b>Hoy</b> estamos abiertos hasta las <b>${hoy}</b>.<br><br>` : '';
          return `${linea}<b>Domingo a Jueves</b> · 08:30 a 02:00<br><b>Viernes y Sábados</b> · 08:30 a 04:00<br><br><i>Víspera de feriado extiende el cierre a 04:00.</i>`;
        },
      },
      en: {
        q: '🕐 Opening hours',
        a: () => {
          const hoy = getCloseHoyLabel();
          const linea = hoy ? `<b>Today</b> we're open until <b>${hoy}</b>.<br><br>` : '';
          return `${linea}<b>Sunday to Thursday</b> · 08:30 to 02:00<br><b>Friday & Saturday</b> · 08:30 to 04:00<br><br><i>Eve of holiday extends closing time to 04:00.</i>`;
        },
      },
    },
    {
      id: 'ubicacion',
      es: {
        q: '📍 Dónde estamos + estacionamiento',
        a: '<b>Av. del Libertador 13054</b>, Martínez (Zona Norte, BsAs).<br><br>Contamos con <b>estacionamiento propio</b> para más de 10 autos.',
        cta: { text: 'Ver en Google Maps →', href: 'https://www.google.com/maps/search/?api=1&query=Snack+Bowling+Av+del+Libertador+13054+Martinez' },
      },
      en: {
        q: '📍 Where we are + parking',
        a: '<b>Av. del Libertador 13054</b>, Martínez (Zona Norte, BsAs).<br><br>We have our own <b>parking</b> for more than 10 cars.',
        cta: { text: 'View on Google Maps →', href: 'https://www.google.com/maps/search/?api=1&query=Snack+Bowling+Av+del+Libertador+13054+Martinez' },
      },
    },
    {
      id: 'pelotero',
      es: {
        q: '👶 Pelotero para los chicos',
        a: 'Sí, tenemos pelotero para los más peques (<b>4 a 7 años</b>).<br><br>Libre para clientes del restaurante.',
      },
      en: {
        q: '👶 Ball pit for kids',
        a: 'Yes, we have a ball pit for the little ones (<b>4 to 7 years old</b>).<br><br>Free for restaurant customers.',
      },
    },
  ];

  const QA = CHAT_CONTEXT === 'cumples' ? QA_CUMPLES : QA_GENERAL;

  const getLang = () => (window.currentLang === 'en' ? 'en' : 'es');
  const getItem = (id) => QA.find(x => x.id === id);
  const t = () => CHAT_STRINGS[getLang()];

  // Calcula el horario de cierre de hoy usando la misma lógica de renderHours()
  const getCloseHoyLabel = () => {
    if (typeof HOURS_SCHEDULE === 'undefined') return null;
    const now = new Date();
    const dow = now.getDay();
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
    const todayHoliday = typeof isFeriado === 'function' && isFeriado(now);
    const tomorrowHoliday = typeof isFeriado === 'function' && isFeriado(tomorrow);
    const isWeekend = dow === 5 || dow === 6;
    const tomorrowIsFriSat = ((dow + 1) % 7) === 5 || ((dow + 1) % 7) === 6;
    let closeMins = HOURS_SCHEDULE[dow]?.close || 1560;
    if (!isWeekend && (tomorrowHoliday || (todayHoliday && tomorrowIsFriSat))) closeMins = 1680;
    const m = ((closeMins % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`;
  };

  const $ = (tag, cls) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  };

  const scrollToBottom = () => {
    body.scrollTop = body.scrollHeight;
  };

  const addMsg = (side, html, extraClass) => {
    const msg = $('div', 'ai-chat-msg ai-chat-msg--' + side + (extraClass ? ' ' + extraClass : ''));
    const bubble = $('div', 'ai-chat-bubble');
    bubble.innerHTML = html;
    msg.appendChild(bubble);
    body.appendChild(msg);
    scrollToBottom();
    return msg;
  };

  const addTyping = () => addMsg('bot', '<span></span><span></span><span></span>', 'ai-chat-typing');

  const addCta = (cta) => {
    // El CTA se agrega como HERMANO del mensaje, no dentro (evita conflictos de flex)
    const wrap = $('div', 'ai-chat-cta');
    const a = document.createElement('a');
    a.href = cta.href;
    a.textContent = cta.text;
    if (cta.href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener'; }
    wrap.appendChild(a);
    body.appendChild(wrap);
    scrollToBottom();
  };

  const renderMenu = () => {
    body.innerHTML = '';
    const lang = getLang();
    addMsg('bot', t().greet);
    const quicks = $('div', 'ai-chat-quicks');
    QA.forEach(item => {
      const btn = $('button', 'ai-chat-quick');
      btn.type = 'button';
      btn.textContent = item[lang].q;
      btn.addEventListener('click', () => showAnswer(item.id));
      quicks.appendChild(btn);
    });
    body.appendChild(quicks);
    scrollToBottom();
  };

  const showAnswer = (id) => {
    const item = getItem(id);
    const lang = getLang();
    const loc = item[lang];
    addMsg('user', loc.q);
    // Si es un wizard interactivo, arrancar el flow
    if (item.wizard === 'cotizador-cumples') {
      const typing = addTyping();
      setTimeout(() => { typing.remove(); startWizardCumples(); }, 650);
      return;
    }
    const typing = addTyping();
    setTimeout(() => {
      typing.remove();
      const answerText = typeof loc.a === 'function' ? loc.a() : loc.a;
      addMsg('bot', answerText);
      if (loc.cta) addCta(loc.cta);
      const quicks = $('div', 'ai-chat-quicks');
      const back = $('button', 'ai-chat-quick ai-chat-quick--back');
      back.type = 'button';
      back.textContent = t().back;
      back.addEventListener('click', renderMenu);
      quicks.appendChild(back);
      body.appendChild(quicks);
      scrollToBottom();
      if (waLink) {
        waLink.href = WA_BASE + encodeURIComponent(t().waPrefix + loc.q.replace(/^[^\s]+\s/, ''));
      }
    }, 650);
  };

  // ═══ WIZARD COTIZADOR CUMPLES · flow conversacional ═══
  const WIZARD_STR = {
    es: {
      askPaquete: '¿Qué paquete te interesa? 🎁',
      pkgFull: '🎁 Paquete FULL',
      pkgBase: '📦 Paquete BASE',
      pkgUnsure: '🤔 No estoy seguro/a',
      askCantidad: '¿Cuántos chicos van? <i>(mínimo 10)</i>',
      askFecha: '¿Qué fecha tentativa tenés en mente? 📅',
      askCumples: '¿Cuántos cumpleañeros/as festejan? 🎉',
      askNombre: '¿Cómo te llamás? <i>(opcional)</i>',
      skip: 'Saltar',
      next: 'Siguiente →',
      minError: 'El mínimo es 10 chicos.',
      resumen: '¡Perfecto! Este es el resumen:',
      confirmSend: '¿Envío esto por WhatsApp?',
      send: '✅ Enviar por WhatsApp',
      restart: '✏️ Empezar de nuevo',
      lPaquete: 'Paquete',
      lCantidad: 'Cantidad de chicos',
      lFecha: 'Fecha tentativa',
      lCumples: 'Cumpleañeros/as',
      lNombre: 'De parte de',
      msgHeader: '¡Hola Snack! Quiero cotizar un cumple infantil:',
      msgFooter: '¡Gracias!',
      undefined: 'A definir',
    },
    en: {
      askPaquete: 'Which package are you interested in? 🎁',
      pkgFull: '🎁 FULL Package',
      pkgBase: '📦 BASE Package',
      pkgUnsure: '🤔 Not sure yet',
      askCantidad: 'How many kids will come? <i>(min. 10)</i>',
      askFecha: 'What tentative date do you have in mind? 📅',
      askCumples: 'How many birthday kids? 🎉',
      askNombre: 'What\'s your name? <i>(optional)</i>',
      skip: 'Skip',
      next: 'Next →',
      minError: 'Minimum is 10 kids.',
      resumen: 'Perfect! Here\'s the summary:',
      confirmSend: 'Send this via WhatsApp?',
      send: '✅ Send via WhatsApp',
      restart: '✏️ Start over',
      lPaquete: 'Package',
      lCantidad: 'Number of kids',
      lFecha: 'Tentative date',
      lCumples: 'Birthday kids',
      lNombre: 'From',
      msgHeader: 'Hi Snack! I\'d like to quote a kids birthday party:',
      msgFooter: 'Thanks!',
      undefined: 'To be defined',
    },
  };

  const wz = () => WIZARD_STR[getLang()];

  const wizardData = { paquete: '', cantidad: '', fecha: '', cumpleaneros: '1', nombre: '' };

  const addOptionsRow = (options, onPick) => {
    const wrap = $('div', 'ai-chat-quicks');
    options.forEach(opt => {
      const btn = $('button', 'ai-chat-quick');
      btn.type = 'button';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => onPick(opt.value, opt.label));
      wrap.appendChild(btn);
    });
    body.appendChild(wrap);
    scrollToBottom();
    return wrap;
  };

  const addInputRow = (opts, onSubmit) => {
    const wrap = $('div', 'ai-chat-input-row');
    const input = document.createElement('input');
    input.type = opts.type || 'text';
    input.placeholder = opts.placeholder || '';
    input.className = 'ai-chat-input';
    if (opts.min != null) input.min = opts.min;
    if (opts.value != null) input.value = opts.value;
    if (opts.autofocus) setTimeout(() => input.focus(), 100);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ai-chat-input-send';
    btn.textContent = opts.buttonLabel || wz().next;
    const submit = () => {
      const val = input.value.trim();
      const err = opts.validate ? opts.validate(val) : null;
      if (err) {
        input.setAttribute('aria-invalid', 'true');
        wrap.querySelector('.ai-chat-input-error')?.remove();
        const errEl = $('div', 'ai-chat-input-error');
        errEl.textContent = err;
        wrap.appendChild(errEl);
        return;
      }
      onSubmit(val);
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
    });
    btn.addEventListener('click', submit);
    wrap.appendChild(input);
    wrap.appendChild(btn);
    if (opts.skipLabel) {
      const skip = document.createElement('button');
      skip.type = 'button';
      skip.className = 'ai-chat-input-skip';
      skip.textContent = opts.skipLabel;
      skip.addEventListener('click', () => onSubmit(''));
      wrap.appendChild(skip);
    }
    body.appendChild(wrap);
    scrollToBottom();
    return wrap;
  };

  const startWizardCumples = () => {
    Object.assign(wizardData, { paquete: '', cantidad: '', fecha: '', cumpleaneros: '1', nombre: '' });
    addMsg('bot', wz().askPaquete);
    addOptionsRow([
      { value: 'FULL', label: wz().pkgFull },
      { value: 'BASE', label: wz().pkgBase },
      { value: 'A definir', label: wz().pkgUnsure },
    ], (val, label) => {
      wizardData.paquete = val;
      addMsg('user', label);
      askCantidad();
    });
  };

  const askCantidad = () => {
    const typing = addTyping();
    setTimeout(() => {
      typing.remove();
      addMsg('bot', wz().askCantidad);
      addInputRow({
        type: 'number',
        min: 10,
        placeholder: '10',
        autofocus: true,
        validate: (v) => {
          const n = parseInt(v, 10);
          if (isNaN(n) || n < 10) return wz().minError;
          return null;
        },
      }, (val) => {
        wizardData.cantidad = val;
        addMsg('user', val);
        askFecha();
      });
    }, 500);
  };

  const askFecha = () => {
    const typing = addTyping();
    setTimeout(() => {
      typing.remove();
      addMsg('bot', wz().askFecha);
      const todayIso = new Date().toISOString().split('T')[0];
      addInputRow({
        type: 'date',
        min: todayIso,
        autofocus: true,
        validate: (v) => {
          if (v && v < todayIso) return getLang() === 'en' ? 'Please choose a future date.' : 'Elegí una fecha futura.';
          return null;
        },
      }, (val) => {
        wizardData.fecha = val;
        addMsg('user', val ? formatFecha(val) : wz().undefined);
        askCumples();
      });
    }, 500);
  };

  const askCumples = () => {
    const typing = addTyping();
    setTimeout(() => {
      typing.remove();
      addMsg('bot', wz().askCumples);
      addInputRow({
        type: 'number',
        min: 1,
        value: '1',
        autofocus: true,
        validate: (v) => {
          const n = parseInt(v, 10);
          if (isNaN(n) || n < 1) return '≥ 1';
          return null;
        },
      }, (val) => {
        wizardData.cumpleaneros = val;
        addMsg('user', val);
        askNombre();
      });
    }, 500);
  };

  const askNombre = () => {
    const typing = addTyping();
    setTimeout(() => {
      typing.remove();
      addMsg('bot', wz().askNombre);
      addInputRow({
        type: 'text',
        placeholder: '',
        autofocus: true,
        skipLabel: wz().skip,
      }, (val) => {
        wizardData.nombre = val;
        if (val) addMsg('user', val);
        showResumen();
      });
    }, 500);
  };

  const formatFecha = (iso) => {
    if (!iso) return wz().undefined;
    try {
      return new Date(iso + 'T12:00').toLocaleDateString(getLang() === 'en' ? 'en-US' : 'es-AR', {
        day: 'numeric', month: 'long', year: 'numeric',
      });
    } catch (_) { return iso; }
  };

  const showResumen = () => {
    const typing = addTyping();
    setTimeout(() => {
      typing.remove();
      const s = wz();
      const cumples = parseInt(wizardData.cumpleaneros || '1', 10);
      const html = [
        `<b>${s.resumen}</b>`,
        `• <b>${s.lPaquete}:</b> ${wizardData.paquete}`,
        `• <b>${s.lCantidad}:</b> ${wizardData.cantidad}`,
        `• <b>${s.lFecha}:</b> ${wizardData.fecha ? formatFecha(wizardData.fecha) : s.undefined}`,
        `• <b>${s.lCumples}:</b> ${cumples}`,
      ];
      if (wizardData.nombre) html.push(`• <b>${s.lNombre}:</b> ${wizardData.nombre}`);
      html.push('');
      html.push(s.confirmSend);
      addMsg('bot', html.join('<br>'));

      const actions = $('div', 'ai-chat-quicks');
      const sendBtn = $('button', 'ai-chat-quick ai-chat-quick--send');
      sendBtn.type = 'button';
      sendBtn.textContent = s.send;
      sendBtn.addEventListener('click', sendWizard);
      const restartBtn = $('button', 'ai-chat-quick ai-chat-quick--back');
      restartBtn.type = 'button';
      restartBtn.textContent = s.restart;
      restartBtn.addEventListener('click', () => {
        addMsg('user', s.restart);
        setTimeout(startWizardCumples, 300);
      });
      actions.appendChild(sendBtn);
      actions.appendChild(restartBtn);
      body.appendChild(actions);
      scrollToBottom();
    }, 500);
  };

  const sendWizard = () => {
    const s = wz();
    const cumples = parseInt(wizardData.cumpleaneros || '1', 10);
    const cumplesLabel = getLang() === 'en'
      ? (cumples === 1 ? 'birthday kid' : 'birthday kids')
      : (cumples === 1 ? 'cumpleañero/a' : 'cumpleañeros/as');
    const lines = [
      s.msgHeader,
      '',
      `• ${s.lPaquete}: ${wizardData.paquete}`,
      `• ${s.lFecha}: ${wizardData.fecha ? formatFecha(wizardData.fecha) : s.undefined}`,
      `• ${s.lCantidad}: ${wizardData.cantidad}`,
      `• ${cumples} ${cumplesLabel}`,
    ];
    if (wizardData.nombre) lines.push(`• ${s.lNombre}: ${wizardData.nombre}`);
    lines.push('', s.msgFooter);
    const text = lines.join('\n');
    const url = `${WA_BASE}${encodeURIComponent(text)}`;
    if (typeof trackEvent === 'function') {
      trackEvent('cotizacion_submit', { tipo: 'cumples-chat', ...wizardData });
    }
    window.open(url, '_blank', 'noopener');
  };

  // Exponer renderMenu para re-render cuando cambia el idioma
  root._chatReset = () => {
    if (body.children.length) renderMenu();
    if (waLink) waLink.href = WA_BASE + encodeURIComponent(t().waDefault);
  };

  const openChat = () => {
    root.setAttribute('data-chat-state', 'open');
    root.setAttribute('data-chat-visited', 'true');
    try { localStorage.setItem('chat-visited', '1'); } catch (_) {}
    if (!body.children.length) renderMenu();
  };

  const closeChat = () => {
    root.setAttribute('data-chat-state', 'closed');
    if (waLink) waLink.href = WA_BASE + encodeURIComponent(t().waDefault);
  };

  const toggle = () => {
    if (root.getAttribute('data-chat-state') === 'open') closeChat();
    else openChat();
  };

  toggles.forEach(btn => btn.addEventListener('click', toggle));

  // ESC cierra
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && root.getAttribute('data-chat-state') === 'open') closeChat();
  });

  // Ocultar pulse si el user ya visitó una vez
  try {
    if (localStorage.getItem('chat-visited')) root.setAttribute('data-chat-visited', 'true');
  } catch (_) {}

  // Hint tooltip · aparece a los 3s (solo en contexto cumples · solo primera visita)
  const hint = root.querySelector('[data-chat-hint]');
  if (hint && CHAT_CONTEXT === 'cumples') {
    let hintShown = false;
    try { hintShown = !!localStorage.getItem('chat-hint-shown-cumples'); } catch (_) {}
    if (!hintShown) {
      setTimeout(() => {
        if (root.getAttribute('data-chat-state') !== 'open') {
          root.setAttribute('data-chat-hint-visible', 'true');
        }
      }, 3000);
      setTimeout(() => {
        root.removeAttribute('data-chat-hint-visible');
        try { localStorage.setItem('chat-hint-shown-cumples', '1'); } catch (_) {}
      }, 12000);
    }
    // Cerrar hint al abrir chat
    toggles.forEach(btn => btn.addEventListener('click', () => {
      root.removeAttribute('data-chat-hint-visible');
      try { localStorage.setItem('chat-hint-shown-cumples', '1'); } catch (_) {}
    }));
  }
});
