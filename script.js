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
  const heroBg = document.querySelector('.hero-bg-image');
  if (!heroBg) return;
  const img = new Image();
  const src = heroBg.style.backgroundImage.replace(/url\(['"]?(.+?)['"]?\)/i, '$1');
  img.onload = () => { heroBg.style.transition = 'opacity 1.2s ease'; };
  img.src = src;
})();

/* ── Hero scroll-driven canvas crossfade ── */
(function() {
  /*
   * Cómo funciona el cálculo del progreso:
   *
   * #hero-scroll tiene height: 300vh.
   * Cuando el usuario empieza a scrollear:
   *   - rect.top baja de 0 a -(300vh - 100vh) = -200vh
   *   - scrolled = -rect.top → va de 0 a 200vh
   *   - total = heroSection.offsetHeight - window.innerHeight = 200vh
   *   - progress = scrolled / total → de 0 a 1
   *
   * Cuando progress = 1, el usuario llegó al final de la sección sticky
   * y el resto de la página continúa en el flujo normal.
   */

  const heroSection = document.getElementById('hero-scroll');
  const canvas      = document.getElementById('hero-canvas');
  const heroText    = document.getElementById('hero-text');

  if (!heroSection || !canvas) return;

  const ctx      = canvas.getContext('2d');
  const emptyImg = new Image();
  const fullImg  = new Image();
  let imgW = 0, imgH = 0;
  let lastProgress = 0;

  /*
   * Cover geometry: calcula dónde y con qué tamaño dibujar la imagen
   * para que llene el canvas completo manteniendo el aspect ratio
   * (equivalente a CSS object-fit: cover).
   */
  function getCoverGeometry(srcW, srcH, dstW, dstH) {
    const srcAR = srcW / srcH;
    const dstAR = dstW / dstH;
    let drawW, drawH, offsetX, offsetY;

    if (srcAR > dstAR) {
      /* Imagen más ancha → anclar por altura */
      drawH   = dstH;
      drawW   = dstH * srcAR;
      offsetX = (dstW - drawW) / 2;
      offsetY = 0;
    } else {
      /* Imagen más alta → anclar por ancho */
      drawW   = dstW;
      drawH   = dstW / srcAR;
      offsetX = 0;
      offsetY = (dstH - drawH) / 2;
    }

    return { drawW, drawH, offsetX, offsetY };
  }

  function drawFrame(progress) {
    if (imgW === 0 || imgH === 0) return;

    /* Usamos dimensiones lógicas (CSS pixels) porque el ctx tiene scale(dpr,dpr) */
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const { drawW, drawH, offsetX, offsetY } = getCoverGeometry(imgW, imgH, cw, ch);

    /* Limpiar frame anterior (en coordenadas lógicas por el scale del ctx) */
    ctx.clearRect(0, 0, cw, ch);

    /* Capa base: auditorio vacío (opacidad 1 siempre) */
    ctx.globalAlpha = 1;
    ctx.drawImage(emptyImg, offsetX, offsetY, drawW, drawH);

    /* Capa superior: auditorio lleno, alpha = progress */
    if (progress > 0) {
      ctx.globalAlpha = progress;
      ctx.drawImage(fullImg, offsetX, offsetY, drawW, drawH);
      ctx.globalAlpha = 1;
    }
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    /* Asignamos el tamaño del buffer interno en píxeles físicos */
    canvas.width  = Math.round(window.innerWidth  * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    /*
     * Nota: asignar .width/.height resetea el contexto 2D automáticamente,
     * incluyendo cualquier transform previo. Por eso aplicamos scale aquí
     * cada vez que redimensionamos, antes de drawFrame.
     */
    ctx.scale(dpr, dpr);
    if (initialized) drawFrame(lastProgress);
  }

  function onScroll() {
    const rect     = heroSection.getBoundingClientRect();
    const scrolled = Math.max(0, -rect.top);
    const total    = heroSection.offsetHeight - window.innerHeight;
    const progress = total > 0 ? Math.min(1, scrolled / total) : 0;

    lastProgress = progress;
    drawFrame(progress);

    /* Fade out del texto:
       - progress 0 → 0.6: texto de opacity 1 a 0
       - progress > 0.6: texto invisible */
    if (heroText) {
      const textOpacity = Math.max(0, 1 - progress / 0.6);
      heroText.style.opacity = textOpacity;
    }
  }

  let initialized = false;

  function checkReady() {
    /* Solo inicializar una vez cuando ambas imágenes están listas */
    if (initialized) return;
    if (!emptyImg.complete || !emptyImg.naturalWidth) return;
    if (!fullImg.complete  || !fullImg.naturalWidth)  return;

    initialized = true;
    imgW = fullImg.naturalWidth;
    imgH = fullImg.naturalHeight;

    resizeCanvas();
    drawFrame(0);

    /* Trigger reveal de tipografía */
    requestAnimationFrame(() => {
      setTimeout(() => {
        const poster = document.getElementById('heroPoster');
        if (poster) poster.classList.add('revealed');
      }, 80);
    });
  }

  emptyImg.onload  = checkReady;
  emptyImg.onerror = () => console.warn('[hero] No se pudo cargar hero-render-empty.png');
  fullImg.onload   = checkReady;
  fullImg.onerror  = () => console.warn('[hero] No se pudo cargar hero-render.png');

  emptyImg.src = 'assets/hero-render-empty.png';
  fullImg.src  = 'assets/hero-render.png';

  /* Manejar imágenes ya cacheadas */
  setTimeout(checkReady, 0);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    resizeCanvas();
    onScroll();
  }, { passive: true });
})();
