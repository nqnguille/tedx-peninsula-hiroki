# PLAN — TEDxPeninsulaHiroki

<!-- /autoplan restore point: /home/guillenqn/.gstack/projects/guillenqn/HEAD-autoplan-restore-20260608-221616.md -->

**Fecha de plan:** 2026-06-08  
**Rama:** sin git (nuevo repo)  
**Stack:** HTML + CSS + JS puro, sin frameworks  
**Deploy:** Cloudflare Pages via `wrangler pages deploy`

---

## Contexto: lo que ya existe

Sitio estático con 5 archivos: `index.html`, `contact.html`, `style.css`, `script.js` + carpeta `capturas/`.

**Lo que funciona:**
- Hero con video Pexels de fondo
- 4 secciones de rol (Asistir / Speaker / Voluntario / Partner) con forms expandibles inline
- Stats animados con IntersectionObserver + counter
- Nav con hamburger mobile
- Scroll reveal con IntersectionObserver
- contact.html con form conectado a Formspree placeholder

**Lo que NO funciona:**
- `handleInlineSubmit` en index.html → `setTimeout` simulado, no hace POST real
- `handleSubmit` (modal en script.js) → también simulado, y nadie lo llama
- contact.html → `action="https://formspree.io/f/XXXXXXXX"` placeholder sin ID real
- Email en contact.html → `contacto@tedxpeninsulaHiroki.com` placeholder
- No hay countdown
- No hay sección FAQ
- No hay sección territorio/Patagonia
- Copy más genérico que el de la versión Lovable
- `modalOverlay/Panel/Body` referenciados en script.js pero no existen en el HTML → TypeErrors en consola en producción

---

## ITEM 0 — Limpieza previa (hacer primero)

Eliminar el modal system completo de `script.js` (~170 líneas):
- `modalConfig` object
- `buildForm()` function
- `openModal()` / `closeModal()` / `handleOverlayClick()` / `handleSubmit()` functions
- Event listener de ESC que llama `closeModal`

Esto elimina TypeErrors actuales y limpia el código antes de agregar el backend real.

---

## ITEM 1 — Backend de forms: Formspree con cuenta real

**Por qué Formspree en vez de Cloudflare Worker:**
Un Worker con MailChannels requiere SPF/DMARC en el dominio remitente propio. Sin dominio configurado, los emails llegan al spam. Formspree maneja deliverability de forma transparente.

**Límite Formspree free:** 50 submissions/mes por endpoint.

**Solución:** Crear 4 endpoints separados en Formspree (una cuenta, 4 forms):
- `form-waitlist` → submissions de audiencia/waitlist
- `form-speaker` → postulaciones speaker
- `form-voluntario` → postulaciones voluntario
- `form-partner` → consultas de partners
- `form-contacto` → form general de contact.html (ya configurado, solo reemplazar el ID)

**Cada endpoint recibe notificación por email a `nqnguille@gmail.com`.**

**Implementación en código:**
Reemplazar `handleInlineSubmit(event, cardId, successMsg)` con una función real que hace `fetch()` al endpoint de Formspree correspondiente.

---

## ITEM 2 — Copy mejorado

Cambios específicos sobre el HTML actual:

| Elemento | Estado actual | Estado nuevo |
|---|---|---|
| Hero title | "Ideas que merecen ser escuchadas." | Mantener (es bueno) |
| Hero subtitle | "Neuquén Capital, diciembre 2026." | Quitar el mes: "Neuquén Capital. 2026." |
| Hero eyebrow fecha | "Diciembre 2026" | "2026" — sin mes (FOMO) |
| Footer fecha | "Diciembre 2026" | "2026" |
| Meta description | "diciembre 2026" | "2026" |
| Footer tagline | "La Patagonia tiene algo para decir." | Mantener |
| Section label speaker | "03 — Ideas" | "02 — Ideas" (el orden de secciones es 01-Audiencia, 02-Equipo, 03-Ideas, 04-Partners — está correcto en el DOM pero la label estaba en 03) |

**Agregar en hero subtitle:** referencia al tema "Cultivando Conciencia" — subtexto editorial sin revelar fecha.

---

## ITEM 3 — Countdown en hero

**Target date:** `new Date('2026-09-12T00:00:00-03:00')` — fecha real del evento, definida en el código JS. El sitio público NO revela el mes; el countdown muestra números sin contexto de fecha.

**UI:** 4 bloques en fila, debajo del hero subtitle, encima del grid de CTAs.

```html
<div class="hero-countdown reveal-hero delay-2">
  <div class="cd-block">
    <div class="cd-num" id="cd-dias">000</div>
    <div class="cd-label">días</div>
  </div>
  <div class="cd-sep">:</div>
  <div class="cd-block">
    <div class="cd-num" id="cd-horas">00</div>
    <div class="cd-label">horas</div>
  </div>
  <div class="cd-sep">:</div>
  <div class="cd-block">
    <div class="cd-num" id="cd-min">00</div>
    <div class="cd-label">min</div>
  </div>
  <div class="cd-sep">:</div>
  <div class="cd-block">
    <div class="cd-num" id="cd-seg">00</div>
    <div class="cd-label">seg</div>
  </div>
</div>
```

**CSS:** Tipografía monospace o Inter weight 700, tamaño generoso (44px desktop / 28px mobile), color blanco, sin bordes ni sombras. Separadores `:` en rojo TED.

**JS:** `setInterval` cada 1000ms, calcular diff desde `Date.now()` hacia target.

---

## ITEM 4 — Sección Territorio

**Posición:** Entre sección Partner (id="partner") y sección "Qué es TEDx" (id="que-es").

**ID:** `id="territorio"`

**Contenido:**
```
SECTION LABEL: "El lugar"
H2: "Neuquén tiene algo para decir."
P1: La Patagonia no es solo paisaje. Es territorio de energía, innovación, cáñamo industrial, 
    investigación y comunidad. Neuquén Capital es una ciudad que crece con ideas propias.
P2: TEDxPeninsulaHiroki nace acá porque las ideas que se generan en los márgenes del mapa 
    suelen cambiar el centro. Eso es lo que queremos mostrar.
```

**Video de fondo:** Pexels patagonia/naturaleza. Mismo tratamiento que las otras secciones.

**Sin stats** — solo prosa, máximo 2 párrafos.

---

## ITEM 5 — Sección FAQ

**Posición:** Después de #territorio, antes del footer.

**ID:** `id="faq"`

**Preguntas y respuestas:**

1. ¿El evento es gratuito?
   Sí. Tanto la asistencia como las entradas son 100% gratuitas. El evento es posible gracias a partners y sponsors que comparten la visión.

2. ¿Necesito tener experiencia en TED para postularme como speaker?
   No hace falta. Buscamos ideas potentes, no oradores perfectos. El equipo acompaña cada etapa: preparación, ensayos y coaching antes del evento.

3. ¿Cuántas personas van al evento?
   Es un evento íntimo, hasta 100 personas. La selección de asistentes es curada para que cada persona en la sala tenga algo genuino que aportar.

4. ¿Dónde va a ser?
   En Neuquén Capital. El venue exacto se confirma a los seleccionados.

5. ¿Qué pasa si aplico y no quedé seleccionado?
   Te avisamos por email. Las postulaciones quedan en consideración para ediciones futuras.

6. ¿Puedo ir con niños?
   El evento está pensado para adultos. No hay espacio específico para niños.

**UI:** Accordion — cada pregunta es un trigger que expande/colapsa la respuesta. Sin librerías. CSS transition en `max-height` o `grid-rows`.

---

## ITEM 6 — Git + GitHub + Deploy en Cloudflare Pages

```bash
# 1. Init repo
cd /home/guillenqn/proyectos/tedx-peninsula-hiroki
git init
echo "node_modules/\n.env\n.DS_Store\ncapturas/" > .gitignore

# 2. Crear repo en GitHub
gh repo create nqnguille/tedx-peninsula-hiroki --public

# 3. Commit inicial
git add index.html contact.html style.css script.js robots.txt sitemap.xml .gitignore
git commit -m "feat: sitio completo TEDxPeninsulaHiroki v1"

# 4. Push
git remote add origin https://github.com/nqnguille/tedx-peninsula-hiroki.git
git push -u origin main

# 5. Deploy Cloudflare Pages
wrangler pages deploy . --project-name tedx-peninsula-hiroki
```

---

## ITEM 7 — Correcciones y completeness

- **robots.txt:** básico, permitir todo, apuntar sitemap
- **sitemap.xml:** index.html + contact.html
- **Meta OG image:** agregar `og:image` con placeholder de imagen del evento (o screenshot)
- **Honeypot anti-spam:** agregar `<input type="text" name="_gotcha" style="display:none">` a los 4 forms inline (contact.html ya lo tiene)
- **role="alert"** en todos los mensajes de success/error de forms
- **Loading state visual:** cuando el submit está en curso, agregar clase `loading` al form que aplica `opacity: 0.6; pointer-events: none` y cambia el cursor
- **Eliminar box-shadow decorativa** en `.btn-primary:hover` en style.css
- **Email contact.html:** reemplazar `contacto@tedxpeninsulaHiroki.com` por un email real a definir (o dejar `nqnguille@gmail.com` temporalmente)
- **Section label speaker:** verificar que diga "02 — Ideas" en el código final

---

## Orden de ejecución corregido

```
0. Limpiar modal muerto de script.js
1. git init + GitHub repo
2. Registrar cuenta Formspree, crear 4+1 endpoints
3. Conectar forms a Formspree (reemplazar handleInlineSubmit + handleContact)
4. Countdown en hero
5. Sección territorio (HTML + CSS + video)
6. FAQ accordion (HTML + CSS + JS)
7. Copy mejorado (fechas, tema, section labels)
8. Correcciones: box-shadow, role=alert, loading state, honeypots, robots.txt, sitemap.xml
9. wrangler pages deploy
10. Verificar todos los forms funcionan en prod
```

---

## Criterios de éxito

- Los 5 forms llegan a `nqnguille@gmail.com` como notificaciones de Formspree
- El countdown corre en real time sin bug de timezone
- El sitio carga < 2.5s LCP en mobile (sin cambios en el peso del sitio, el video ya estaba)
- Cero TypeErrors en consola
- El deploy en Cloudflare Pages es exitoso y la URL es pública

---

## Nota operativa: Formspree IDs

**Antes de ejecutar el Item 3 (conectar forms), Guillermo debe:**
1. Ir a formspree.io y crear cuenta con `nqnguille@gmail.com`
2. Crear 5 forms:
   - "TEDx Waitlist" → copiar el ID (ej: `xpwzabcd`)
   - "TEDx Speaker" → copiar el ID
   - "TEDx Voluntario" → copiar el ID
   - "TEDx Partner" → copiar el ID
   - "TEDx Contacto" → copiar el ID
3. Pegar los IDs en el código

O, si prefiere, crear una sola cuenta y un solo endpoint que reciba todos los forms con un campo hidden `formType` — más sencillo, pero agota el límite más rápido.

---

## GSTACK REVIEW REPORT

### CEO Review
- **Modo:** SELECTIVE EXPANSION
- **Status:** clean
- **Decisiones:** 4 auto-decididas
- **Premisa revisada:** Backend Formspree > Worker (deliverability)
- **Orden de ejecución:** corregido (backend antes que contenido)

### Design Review
- **Score inicial:** 7/10
- **Status:** issues_open (resueltos en el plan)
- **Issues:** 3 (sombra decorativa, role=alert, loading state visual)

### Eng Review
- **Status:** clean (todas las gaps documentadas y mitigadas)
- **Issues críticos:** 0 bloqueantes
- **Issues documentados:** 4 (timezone, Formspree límite, honeypot, modal muerto)
- **Arquitectura:** Formspree endpoints × 5, countdown con offset UTC-3, FAQ accordion nativo

### DX Review
- **Status:** skipped — sin scope developer-facing

---

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rechazado |
|---|-------|----------|-----------|-----------|----------|---------|
| 1 | CEO | Backend: Formspree real, no Worker | Mechanical | P3 (pragmatic) | MailChannels sin SPF → spam. Formspree tiene deliverability resuelta | Worker + MailChannels |
| 2 | CEO | Orden: Formspree config antes que contenido | Mechanical | P6 (action) | Forms no testeables hasta que el endpoint esté live | Deploy al final |
| 3 | CEO | Eliminar 170 líneas de modal muerto | Mechanical | P5 (explicit) | Código que no se llama = confusión + TypeErrors en consola | Dejarlo |
| 4 | CEO | Countdown sin revelar mes | Mechanical | P1 (completeness) | Consistencia con estrategia FOMO: "2026" en todo el copy | Mostrar mes |
| 5 | Design | Eliminar box-shadow en .btn-primary:hover | Mechanical | P5 flat design | Viola flat design rule del sistema de marca | Dejar sombra |
| 6 | Design | Agregar role="alert" a mensajes success/error | Mechanical | P1 completeness | Lectores de pantalla no anuncian el estado sin este rol | Ignorar a11y |
| 7 | Design | Loading state visual en submit (opacity + pointer-events) | Mechanical | P1 completeness | Estado textual "Enviando..." no distinguible visualmente | Solo texto |
| 8 | Eng | Date('2026-09-12T00:00:00-03:00') con offset explícito | Mechanical | P1 correctness | Sin offset → JavaScript → UTC → bug de día en Argentina | Sin offset |
| 9 | Eng | 4 endpoints Formspree separados (4×50=200/mes) | Mechanical | P5 explicit | Un endpoint único agota límite en día viral de lanzamiento | Un form único |
| 10 | Eng | Agregar honeypot a los 4 forms inline de index.html | Mechanical | P1 completeness | Solo contact.html lo tenía; forms principales vulnerables a bots | Sin honeypot |
| 11 | Eng | Eliminar modal muerto PRIMERO en el orden de ejecución | Mechanical | P2 boil lakes | Ya causa TypeErrors en producción; eliminar antes de agregar código | Dejarlo para después |
