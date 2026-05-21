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
    'After office, despedidas, 15 años, corporativos o cumples de adultos. Elegí el formato gastronómico, sumá bowling y listo.': 'After office, send-offs, sweet 16s, corporate events or adult birthdays. Pick the food format, add bowling and you\'re set.',
    '15 años': 'Sweet 16',
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
    'Canapés y bruschettas mediterráneas': 'Canapés and Mediterranean bruschettas',
    'Brochette Caprese': 'Caprese brochette',
    'Pletzalej de peceto y dulce de mostaza': 'Pletzalej with roast beef and honey mustard',
    'Papitas rellenas de queso y ciboulette': 'Stuffed potatoes with cheese and chives',
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
    'Invitaciones digitales': 'Digital invitations',
    'Para decidir de un vistazo': 'To decide at a glance',
    'Bowling y hora extra de bebida disponibles como adicionales en cualquier paquete.': 'Bowling and extra drinks hour available as add-ons in any package.',
    'Mandanos fecha tentativa, cantidad de personas y qué paquete te interesa. Te respondemos rápido.': 'Send us a tentative date, number of people and which package interests you. We reply fast.',
    'Ver precios ↗': 'See prices ↗',
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
