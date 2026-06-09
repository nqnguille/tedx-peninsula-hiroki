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

/* ── Hero poster reveal ── */
(function() {
  const poster = document.querySelector('.hero-poster');
  if (!poster) return;
  // trigger after a brief paint delay
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

/* ── Hero bg image: fade in on load ── */
(function() {
  const heroBg = document.querySelector('.hero-bg-image');
  if (!heroBg) return;
  const img = new Image();
  const src = heroBg.style.backgroundImage.replace(/url\(['"]?(.+?)['"]?\)/i, '$1');
  img.onload = () => { heroBg.style.transition = 'opacity 1.2s ease'; };
  img.src = src;
})();
