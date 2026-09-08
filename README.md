# Snack Bowling · Web oficial

Sitio web de **Snack Bowling**, multiespacio familiar en Martínez (Buenos Aires, Argentina) desde 1967.
Bowling, pool, restaurante Ristrel y pelotero infantil. Cumples y eventos corporativos.

🌐 **Producción:** https://www.snackbowling.com.ar

---

## Stack

Sitio estático · sin frameworks · sin build step.

- **HTML5** semántico
- **CSS3** vanilla (custom properties, grid, container queries)
- **JavaScript vanilla** (ES6+)
- **PWA** con service worker (cache offline básico)
- **WebP** con fallback PNG/JPG

## Estructura

```
/
├── index.html              · Home
├── cumples.html            · Cumples infantiles (paquetes Full / Base + cotizador)
├── eventos.html            · Eventos & empresas (3 paquetes + cotizador)
├── historia.html           · Timeline desde 1967
├── 404.html                · Página de error
│
├── site.css                · Estilos custom · overrides + componentes nuevos
├── wireframes.css          · Estilos base heredados del wireframe
├── cumples.css             · Estilos específicos de cumples
├── eventos.css             · Estilos específicos de eventos
│
├── site.js                 · Toggle ES/EN, cotizador, tracking, PWA
│
├── manifest.webmanifest    · PWA · install metadata
├── sw.js                   · PWA · service worker (cache strategy)
├── sitemap.xml             · Para Google Search Console
├── robots.txt              · Apunta al sitemap
│
└── assets/
    ├── *.webp              · Versiones optimizadas (servidas por defecto)
    ├── *.png / *.jpg       · Originales (fallback / backup)
    └── timeline/           · 14 fotos históricas para la página de historia
```

## Funcionalidades

- 🎯 **Cotizador WhatsApp** en cumples + eventos · arma mensaje pre-llenado al enviar
- 📱 **Sticky bar mobile** en cumples/eventos con CTA contextual
- 🗺️ **Google Maps embed** con coordenadas exactas
- 🌐 **Toggle ES/EN** que traduce sin recargar (recorre el DOM con TreeWalker)
- 🕐 **Indicador de "Abierto / Cerrado ahora"** que se actualiza en vivo según horarios
- 📅 **Contador dinámico de años** ("X años de historia" se calcula con `new Date()`)
- 📊 **trackEvent helper** listo para enchufar a GA4 / Plausible
- 📡 **PWA instalable** con cache stale-while-revalidate
- 🔍 **SEO completo**: meta tags, OG, Twitter Cards, JSON-LD (Restaurant, Service, FAQPage), sitemap, robots

## Desarrollo local

No requiere instalación. Cualquier servidor estático funciona:

```bash
# Python
python -m http.server 8000

# Node (con http-server instalado globalmente)
npx http-server -p 8000

# PHP
php -S localhost:8000
```

Abrir http://localhost:8000

## Google Analytics

GA4 **ya está activo** en las 4 páginas con el ID `G-M6GGPZSK61`.

Eventos que se trackean solos: `whatsapp_click`, `email_click`, `phone_click`,
`map_click`, `menu_click`, `cotizacion_submit`, `reserva_modal_open`,
`reserva_fuera_de_rango`, `whatsapp_popup_bloqueado`, `gallery_open`.

**Pendiente en la cuenta de GA4:** marcar `cotizacion_submit`, `whatsapp_click` y
`phone_click` como *conversiones* (Admin → Eventos → marcar como conversión).
Sin eso no se puede optimizar campañas ni medir el retorno.

## Leads del cotizador

Cada envío se guarda antes de abrir WhatsApp: copia local en `localStorage` y POST
al backend. Por defecto va a **Netlify Forms** (form oculto `name="leads"` en cada
página). Para usar otro destino — Google Sheets vía Apps Script, Formspree, endpoint
propio — poner la URL en `LEADS_ENDPOINT`, en `site.js`.


## Deploy

### GitHub Pages
- Settings → Pages → Branch: `main`, root → Save
- En 1-2 min queda en `https://USUARIO.github.io/REPO/`

### Netlify
- Drag-and-drop la carpeta entera en https://app.netlify.com/drop

### Vercel
- `vercel` en la raíz, seguir prompts

### Hosting tradicional
- Subir todo el contenido vía FTP a la raíz del dominio

## Datos del negocio

- **Dirección:** Av. del Libertador 13054, Martínez · Buenos Aires
- **Teléfono:** 4792-8009
- **WhatsApp:** +54 11 6822-5209
- **Mail:** info@snackbowling.com.ar
- **Horario:** Dom a Jue · 08:30 – 02:00 · Vie y Sáb · 08:30 – 04:00
- **Carta digital:** https://menu.maxirest.com/408
- **Instagram:** [@snackbowling](https://www.instagram.com/snackbowling/)
- **Facebook:** [/SnackBowling](https://www.facebook.com/SnackBowling/)
- **LinkedIn:** [/company/snack-bowling](https://www.linkedin.com/company/snack-bowling)

---

© Snack Bowling · Est. 1967 · Martínez, Zona Norte
