/* ============================================================
   TEDxPeninsulaHiroki 2026 — Script
   ============================================================ */

/* ── Nav: scroll ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ── Mobile menu ── */
const mobileMenu = document.getElementById('mobileMenu');
const hamburger  = document.getElementById('hamburger');

function toggleMenu() {
  const isOpen = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
  mobileMenu.setAttribute('aria-hidden', String(!isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeMenu() {
  mobileMenu.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  mobileMenu.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ── Smooth scroll ── */
function smoothScroll(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = 80;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
  closeMenu();
}

function navScroll(e, id) {
  e.preventDefault();
  smoothScroll(id);
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    e.preventDefault();
    smoothScroll(id);
  });
});

/* ── Hero poster reveal ──
   En el nuevo hero scroll-driven, el reveal se dispara desde el
   callback checkReady() del canvas, después de cargar ambas imágenes.
   Este bloque solo actúa si existe el hero legacy (ej: contact.html). */
(function() {
  const poster = document.querySelector('.hero-poster');
  if (!poster) return;
  /* Si el hero scroll ya está presente, el canvas se encarga */
  if (document.getElementById('hero-scroll')) return;
  requestAnimationFrame(() => {
    setTimeout(() => poster.classList.add('revealed'), 80);
  });
})();

/* ── Reveal on scroll ── */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal-fade').forEach(el => revealObs.observe(el));

/* ── Counter animation ── */
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

function animateCounter(el, target, suffix, duration) {
  const start = performance.now();
  (function tick(now) {
    const pct = Math.min((now - start) / duration, 1);
    const val = Math.round(easeOutCubic(pct) * target);
    el.textContent = val.toLocaleString('es-AR') + (pct >= 1 ? suffix : '');
    if (pct < 1) requestAnimationFrame(tick);
  })(performance.now());
}

const counterObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.querySelectorAll('[data-target]').forEach(el => {
      const t = parseInt(el.dataset.target, 10);
      const s = el.dataset.suffix || '';
      const d = t > 1000 ? 2000 : t > 100 ? 1600 : 1200;
      animateCounter(el, t, s, d);
    });
    counterObs.unobserve(entry.target);
  });
}, { threshold: 0.25 });

document.querySelectorAll('[data-target]').forEach(el => {
  const sec = el.closest('section');
  if (sec) counterObs.observe(sec);
});

/* ── FAQ accordion ── */
document.querySelectorAll('.faq-item').forEach(item => {
  const btn  = item.querySelector('.faq-q');
  const body = item.querySelector('.faq-a');

  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('.faq-item.open').forEach(other => {
      other.classList.remove('open');
      other.querySelector('.faq-a').style.maxHeight = '0';
      other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });

    if (!isOpen) {
      item.classList.add('open');
      body.style.maxHeight = body.scrollHeight + 'px';
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

/* ── Form card toggle ── */
function toggleForm(id) {
  const card = document.getElementById(id);
  if (!card) return;
  card.classList.toggle('open');
}

/* ── Inline form submit → Cloudflare Worker ── */
const WORKER_URL = 'https://tedx-forms.nqnguille.workers.dev';

async function handleSubmit(e, cardId, successMsg) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('[type="submit"]');
  const card = document.getElementById(cardId);

  // Honeypot
  const hp = form.querySelector('[name="_hp"]');
  if (hp && hp.value) return;

  btn.textContent = 'Enviando...';
  btn.disabled    = true;
  form.style.opacity       = '0.6';
  form.style.pointerEvents = 'none';

  const payload = { formType: cardId };
  new FormData(form).forEach((v, k) => { payload[k] = v; });

  try {
    const res = await fetch(WORKER_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (res.ok) {
      // Show success inline
      const formWrap = form.closest('.fc-form') || form.parentElement;
      formWrap.innerHTML = `
        <div class="fc-success visible" role="alert">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" stroke="#E62B1E" stroke-width="1.5"/>
            <path d="M9 16l5 5 9-9" stroke="#E62B1E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h4>Recibido.</h4>
          <p>${successMsg}</p>
        </div>`;
    } else {
      throw new Error('server');
    }
  } catch {
    form.style.opacity       = '1';
    form.style.pointerEvents = '';
    btn.disabled    = false;
    btn.textContent = 'Reintentar';

    let err = form.querySelector('.form-error-msg');
    if (!err) {
      err = document.createElement('p');
      err.className = 'form-error-msg';
      err.setAttribute('role', 'alert');
      form.appendChild(err);
    }
    err.textContent = 'Algo salió mal. Intentá de nuevo.';
  }
}

/* ── Hero bg image: fade in on load (legacy, kept for contact.html) ── */
(function() {
  var heroBg = document.querySelector('.hero-bg-image');
  if (!heroBg) return;
  var img = new Image();
  var src = heroBg.style.backgroundImage.replace(/url\(['"]?(.+?)['"]?\)/i, '$1');
  img.onload = function() { heroBg.style.transition = 'opacity 1.2s ease'; };
  img.src = src;
})();

/* ============================================================
   HERO SCROLL-DRIVEN — Opción A: crossfade entre dos renders
   ============================================================
   Dos imágenes reales: auditorio vacío y auditorio lleno.
   Canvas 2D mezcla los píxeles según el progreso del scroll:
     progress 0 → solo se ve hero-render-empty.png (sala vacía)
     progress 1 → solo se ve hero-render.png (sala llena)

   El crossfade usa globalAlpha sobre la capa superior (llena).
   Viñetas cinematic (gradientes en canvas) refuerzan el mood.
   Texto del hero se desvanece entre el 55% y el 82% del scroll.

   Estructura:
     #hero-scroll   = 300vh → total de scroll = 200vh
     progress 0→1   = recorrido completo del scroll
   ============================================================ */
(function() {
  var heroSection = document.getElementById('hero-scroll');
  var canvas      = document.getElementById('hero-canvas');
  var heroText    = document.getElementById('hero-text');

  if (!heroSection || !canvas) return;

  var ctx         = canvas.getContext('2d');
  var emptyImg    = new Image();
  var fullImg     = new Image();
  var imgW        = 0;
  var imgH        = 0;
  var lastProgress = 0;
  var imgsReady    = 0;
  var initialized  = false;
  var rafPending   = false;

  /*
   * Cover geometry: calcula dónde y con qué tamaño dibujar la imagen
   * para llenar el canvas manteniendo el aspect ratio
   * (equivalente a CSS object-fit: cover).
   */
  function getCoverGeometry(srcW, srcH, dstW, dstH) {
    var srcAR = srcW / srcH;
    var dstAR = dstW / dstH;
    var drawW, drawH, offsetX, offsetY;
    if (srcAR > dstAR) {
      /* imagen más ancha: anclar por altura */
      drawH   = dstH;
      drawW   = dstH * srcAR;
      offsetX = (dstW - drawW) / 2;
      offsetY = 0;
    } else {
      /* imagen más alta: anclar por ancho */
      drawW   = dstW;
      drawH   = dstW / srcAR;
      offsetX = 0;
      offsetY = (dstH - drawH) / 2;
    }
    return { drawW: drawW, drawH: drawH, offsetX: offsetX, offsetY: offsetY };
  }

  /*
   * Easing suave para el crossfade: hace que el llenado sea más natural.
   * Arranca lento (pocas personas primero), acelera al medio, vuelve a
   * desacelerar cuando la sala ya está casi llena.
   */
  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function drawFrame(progress) {
    if (!initialized || imgW === 0 || imgH === 0) return;

    var dpr     = window.devicePixelRatio || 1;
    var cw      = window.innerWidth;
    var ch      = window.innerHeight;
    var geo     = getCoverGeometry(imgW, imgH, cw, ch);
    var drawW   = geo.drawW, drawH   = geo.drawH;
    var offsetX = geo.offsetX, offsetY = geo.offsetY;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* 1. Imagen base: auditorio vacío (siempre visible a opacidad 1) */
    ctx.globalAlpha = 1;
    ctx.drawImage(emptyImg, offsetX, offsetY, drawW, drawH);

    /* 2. Imagen superior: auditorio lleno, alpha = progress con easing */
    var easedProgress = easeInOut(progress);
    if (easedProgress > 0) {
      ctx.globalAlpha = easedProgress;
      ctx.drawImage(fullImg, offsetX, offsetY, drawW, drawH);
    }

    /* 3. Viñeta superior: oscurece el techo/cielo para profundidad */
    ctx.globalAlpha = 1;
    var gradTop = ctx.createLinearGradient(0, 0, 0, ch * 0.30);
    gradTop.addColorStop(0, 'rgba(10,10,10,0.78)');
    gradTop.addColorStop(1, 'rgba(10,10,10,0.00)');
    ctx.fillStyle = gradTop;
    ctx.fillRect(0, 0, cw, ch * 0.30);

    /* 4. Viñeta inferior: zona del texto del hero */
    var gradBot = ctx.createLinearGradient(0, ch * 0.55, 0, ch);
    gradBot.addColorStop(0, 'rgba(10,10,10,0.00)');
    gradBot.addColorStop(1, 'rgba(10,10,10,0.92)');
    ctx.fillStyle = gradBot;
    ctx.fillRect(0, ch * 0.55, cw, ch * 0.45);

    ctx.restore();
  }

  function resizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    canvas.width  = Math.round(window.innerWidth  * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    if (initialized) drawFrame(lastProgress);
  }

  function onScroll() {
    var rect     = heroSection.getBoundingClientRect();
    var scrolled = Math.max(0, -rect.top);
    var total    = heroSection.offsetHeight - window.innerHeight;
    var progress = total > 0 ? Math.min(1, scrolled / total) : 0;
    lastProgress = progress;

    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(function() {
        rafPending = false;
        drawFrame(lastProgress);

        /* Fade out del texto: desaparece entre 55% y 82% del scroll */
        if (heroText) {
          var fadeStart = 0.55, fadeEnd = 0.82;
          var tP = Math.max(0, Math.min(1, (lastProgress - fadeStart) / (fadeEnd - fadeStart)));
          heroText.style.opacity = (1 - tP).toFixed(3);
        }
      });
    }
  }

  function onImageLoad() {
    imgsReady++;
    if (imgsReady < 2) return;

    initialized = true;
    imgW = fullImg.naturalWidth;
    imgH = fullImg.naturalHeight;

    resizeCanvas();
    drawFrame(0);

    /* Trigger reveal de tipografía del hero */
    requestAnimationFrame(function() {
      setTimeout(function() {
        var poster = document.getElementById('heroPoster');
        if (poster) poster.classList.add('revealed');
      }, 80);
    });
  }

  emptyImg.onload  = onImageLoad;
  fullImg.onload   = onImageLoad;

  emptyImg.onerror = function() {
    /*
     * Fallback: si el render vacío no carga, mostramos el lleno directamente.
     * Esto evita pantalla negra en caso de que el asset falte.
     */
    console.warn('[TEDx hero] hero-render-empty.png no disponible, usando fallback');
    emptyImg = fullImg; /* misma imagen, sin efecto visible pero sin pantalla negra */
    onImageLoad();
  };

  fullImg.onerror = function() {
    console.warn('[TEDx hero] No se pudo cargar hero-render.png');
  };

  emptyImg.src = 'assets/hero-render-empty.png';
  fullImg.src  = 'assets/hero-render.png';

  /* Manejar imágenes ya cacheadas al cargar el script */
  if (emptyImg.complete && emptyImg.naturalWidth) onImageLoad();
  if (fullImg.complete  && fullImg.naturalWidth)  onImageLoad();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function() {
    resizeCanvas();
    drawFrame(lastProgress);
  }, { passive: true });
})();
