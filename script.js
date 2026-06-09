/* ============================================================
   TEDxPeninsulaHiroki 2026 — Script
   ============================================================ */

/* ── Site Loader ── */
(function() {
  var loader = document.getElementById('site-loader');
  if (!loader) return;

  document.documentElement.style.overflow = 'hidden';

  var heroReady = new Promise(function(resolve) {
    document.addEventListener('hero-canvas-ready', resolve, { once: true });
    setTimeout(resolve, 3000); // fallback por si el canvas no existe
  });

  var minTime = new Promise(function(resolve) {
    setTimeout(resolve, 2500);
  });

  Promise.all([heroReady, minTime]).then(function() {
    document.documentElement.style.overflow = '';
    loader.classList.add('sl-exit');
    loader.addEventListener('transitionend', function() {
      loader.style.display = 'none';
    }, { once: true });
  });
})();

/* ── Video territorio: primer play desde 0:20, loop nativo desde 0 ── */
(function() {
  var vid = document.getElementById('hiroki-video');
  if (!vid) return;
  vid.addEventListener('loadedmetadata', function() { vid.currentTime = 20; });
})();

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
  const card = document.getElementById(id);
  if (card && card.classList.contains('form-card') && !card.classList.contains('open')) {
    card.classList.add('open');
  }
  smoothScroll(id);
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    e.preventDefault();
    const target = document.getElementById(id);
    if (target && target.classList.contains('form-card') && !target.classList.contains('open')) {
      target.classList.add('open');
    }
    smoothScroll(id);
  });
});

/* ── Hero poster reveal ──
   Solo actúa si existe el hero legacy (ej: contact.html). */
(function() {
  const poster = document.querySelector('.hero-poster');
  if (!poster) return;
  if (document.getElementById('hero-sequence')) return;
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

function toggleCard(id) { toggleForm(id); }

function openForm(id) {
  const card = document.getElementById(id);
  if (!card) return;
  if (!card.classList.contains('open')) card.classList.add('open');
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
   HERO CINEMATIC SEQUENCE — 3 frames + intro negro
   ============================================================
   FASE 0 (p 0→0.14):   Negro total → bare aparece (fade in)
   FASE 1 (p 0.14→0.42): Bare visible
     - pt1 watermark "2026": sutil (0.14→0.40)
     - pt2 "Cultivando Conciencia": aparece (0.18→0.40), se va antes de las sillas
   FASE 2 (p 0.42→0.62): Bare → Empty (sillas se materializan)
   FASE 3 (p 0.62→1.0):  Empty → Full (gente aparece)
     - CTAs: aparecen desde p 0.80

   Scroll total = 350vh → section.offsetHeight - window.innerHeight
   progress = scrolled / total → 0..1
   ============================================================ */
(function() {
  var section  = document.getElementById('hero-sequence');
  var canvas   = document.getElementById('hero-canvas');
  var intro    = document.getElementById('hero-intro');

  if (!section || !canvas) return;

  var ctx        = canvas.getContext('2d', { willReadFrequently: true });
  var imgs       = [new Image(), new Image(), new Image()];
  var srcs       = [
    'assets/hero-render-bare.png',
    'assets/hero-render-empty.png',
    'assets/hero-render.png'
  ];
  var loaded     = 0;
  var ready      = false;
  var lastP      = 0;
  var rafPending = false;

  /* ── Geometría object-fit: cover ── */
  function coverGeo(srcW, srcH, dstW, dstH) {
    var sAR = srcW / srcH;
    var dAR = dstW / dstH;
    var dW, dH, ox, oy;
    if (sAR > dAR) {
      dH = dstH; dW = dstH * sAR;
      ox = (dstW - dW) / 2; oy = 0;
    } else {
      dW = dstW; dH = dstW / sAR;
      ox = 0; oy = (dstH - dH) / 2;
    }
    return { dW: dW, dH: dH, ox: ox, oy: oy };
  }

  /* ── Dibuja una imagen en cover ── */
  function coverDraw(img) {
    if (!img.naturalWidth) return;
    var cw = window.innerWidth, ch = window.innerHeight;
    var g = coverGeo(img.naturalWidth, img.naturalHeight, cw, ch);
    ctx.drawImage(img, g.ox, g.oy, g.dW, g.dH);
  }

  /* ── Crossfade A→B con t=0..1 ── */
  function crossfade(imgA, imgB, t) {
    coverDraw(imgA);
    ctx.globalAlpha = Math.max(0, Math.min(1, t));
    coverDraw(imgB);
    ctx.globalAlpha = 1;
  }

  /* ── Viñetas cinematográficas ── */
  function vignettes(p) {
    var cw = window.innerWidth, ch = window.innerHeight;

    /* Viñeta superior */
    var gTop = ctx.createLinearGradient(0, 0, 0, ch * 0.28);
    gTop.addColorStop(0, 'rgba(0,0,0,0.75)');
    gTop.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gTop;
    ctx.fillRect(0, 0, cw, ch * 0.28);

    /* Viñeta inferior */
    var gBot = ctx.createLinearGradient(0, ch * 0.6, 0, ch);
    gBot.addColorStop(0, 'rgba(0,0,0,0)');
    gBot.addColorStop(1, 'rgba(0,0,0,0.88)');
    ctx.fillStyle = gBot;
    ctx.fillRect(0, ch * 0.6, cw, ch * 0.4);

    /* Overlay central de legibilidad: activo cuando "Cultivando Conciencia" está visible (p 0.18→0.42) */
    var textOverlayAlpha = windowOpacity(p, 0.18, 0.42, 0.06) * 0.35;
    if (textOverlayAlpha > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + textOverlayAlpha.toFixed(3) + ')';
      ctx.fillRect(0, 0, cw, ch);
    }
  }

  /* ── Interpolación suave ── */
  function smoothstep(edge0, edge1, x) {
    var t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  /* ── Opacidad de texto: ventana [a,b] con rampas de w ── */
  function windowOpacity(p, a, b, w) {
    if (p < a || p > b) return 0;
    var fadeIn  = smoothstep(a, a + w, p);
    var fadeOut = 1 - smoothstep(b - w, b, p);
    return Math.min(fadeIn, fadeOut);
  }

  /* ── Redimensionar canvas al viewport ── */
  function resizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var W   = window.innerWidth;
    var H   = window.innerHeight;
    var targetW = Math.round(W * dpr);
    var targetH = Math.round(H * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width  = targetW;
      canvas.height = targetH;
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      /* ctx.scale se resetea al cambiar width/height, hay que reaplicarlo */
      ctx.scale(dpr, dpr);
    }
  }

  /* ── Frame principal ── */
  function drawFrame(p) {
    if (!ready) return;
    resizeCanvas();
    var cw = window.innerWidth, ch = window.innerHeight;
    ctx.clearRect(0, 0, cw, ch);

    /* Canvas negro como fondo base */
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, cw, ch);

    ctx.globalAlpha = 1;

    if (p < 0.14) {
      /* Fase 0: bare aparece desde negro */
      var tBare = smoothstep(0, 0.14, p);
      ctx.globalAlpha = tBare;
      coverDraw(imgs[0]);
      ctx.globalAlpha = 1;

    } else if (p < 0.42) {
      /* Fase 1: bare visible — "Cultivando Conciencia" aparece aquí */
      coverDraw(imgs[0]);

    } else if (p < 0.62) {
      /* Fase 2: bare → empty (sillas se materializan) */
      var tEmpty = smoothstep(0.42, 0.62, p);
      crossfade(imgs[0], imgs[1], tEmpty);

    } else {
      /* Fase 3: empty → full (personas llenan el auditorio) */
      var tFull = smoothstep(0.62, 1.0, p);
      crossfade(imgs[1], imgs[2], tFull);
    }

    vignettes(p);

    /* ── Intro: desaparece al scrollear ── */
    if (intro) {
      intro.style.opacity = (1 - smoothstep(0, 0.12, p)).toFixed(3);
    }

    /* ── Textos de fase ── */
    var pt1 = document.getElementById('phase-text-1');
    var pt2 = document.getElementById('phase-text-2');
    var pt4 = document.getElementById('hero-ctas');

    /* pt1 — watermark "2026": sutil durante la fase bare */
    if (pt1) pt1.style.opacity = windowOpacity(p, 0.14, 0.40, 0.08).toFixed(3);

    /* pt2 — "Cultivando Conciencia": aparece sobre el bare, se va ANTES de que arranquen las sillas */
    if (pt2) pt2.style.opacity = windowOpacity(p, 0.18, 0.40, 0.08).toFixed(3);

    if (pt4) {
      var ctaOpacity = smoothstep(0.80, 1.0, p);
      pt4.style.opacity = ctaOpacity.toFixed(3);
      if (ctaOpacity > 0.5) {
        pt4.classList.add('active');
      } else {
        pt4.classList.remove('active');
      }
    }
  }

  /* ── Scroll handler ── */
  function onScroll() {
    var rect     = section.getBoundingClientRect();
    var scrolled = Math.max(0, -rect.top);
    var total    = section.offsetHeight - window.innerHeight;
    lastP = total > 0 ? Math.min(1, scrolled / total) : 0;

    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(function() {
        rafPending = false;
        drawFrame(lastP);
      });
    }
  }

  /* ── Carga de imágenes ── */
  var loadedSet = [false, false, false];

  function onLoad(idx) {
    if (loadedSet[idx]) return;
    loadedSet[idx] = true;
    loaded++;
    if (loaded < 3) return;
    ready = true;
    resizeCanvas();
    drawFrame(lastP);
    document.dispatchEvent(new CustomEvent('hero-canvas-ready'));
  }

  srcs.forEach(function(src, i) {
    imgs[i].onload = function() { onLoad(i); };
    imgs[i].onerror = function() {
      console.warn('[TEDx hero] No se pudo cargar: ' + src);
      onLoad(i);
    };
    imgs[i].src = src;
    /* Si ya está cacheada al momento de asignar src */
    if (imgs[i].complete && imgs[i].naturalWidth) onLoad(i);
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function() {
    /* Forzar resize completo reseteando dimensiones */
    canvas.width  = 0;
    canvas.height = 0;
    resizeCanvas();
    drawFrame(lastP);
  }, { passive: true });
})();
