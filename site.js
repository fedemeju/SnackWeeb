// ──────────────── FINAL SITE JS ────────────────
// (Stripped of the wireframe-specific tabs / notes / compare logic.
//  Keeps: hamburger menu, smooth scroll, live hours, year counters,
//  ES/EN toggle.)

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
const HOURS_SCHEDULE = {
  0: { open: 510, close: 1560 }, // Domingo
  1: { open: 510, close: 1560 }, // Lunes
  2: { open: 510, close: 1560 }, // Martes
  3: { open: 510, close: 1560 }, // Miércoles
  4: { open: 510, close: 1560 }, // Jueves
  5: { open: 510, close: 1680 }, // Viernes
  6: { open: 510, close: 1680 }, // Sábado
};

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
  const yesterdaySchedule = HOURS_SCHEDULE[yesterdayDow];
  const todaySchedule = HOURS_SCHEDULE[dow];

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

// ─── language toggle (ES / EN) ───
const I18N = {
  en: {
    'Bowling, pool, restaurante y pelotero, en Martínez.': 'Bowling, pool, restaurant and ball pit, in Martínez.',
    'VER CARTA →': 'VIEW MENU →',
    'HABLAR POR WHATSAPP': 'CHAT ON WHATSAPP',
    'Multiespacio familiar desde 1967. Vení por una pista de bowling, quedate a comer y festejá tus cumples acá.': 'Family multispace since 1967. Come for a bowling lane, stay for dinner and host your birthdays here.',
    'los espacios': 'spaces',
    'el restaurante': 'the restaurant',
    'eventos': 'events',
    'línea de tiempo': 'timeline',
    'contacto': 'contact',
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
    'La cocina que acompaña a Snack desde 1995. Carta amplia, opciones para chicos y grandes, sin necesidad de reservar.': 'The kitchen accompanying Snack since 1995. Wide menu, options for kids and adults, no reservation needed.',
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
    'after office · 15 años · corporativos': 'after office · birthdays · corporate',
    'Hola, les estoy hablando desde la web!': 'Hi, I\'m messaging from your website!',
  }
};

let currentLang = 'es';

function applyLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang;

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
