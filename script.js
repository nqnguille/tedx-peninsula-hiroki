/* ============================================
   TEDxPeninsulaHiroki 2026 — Script
   ============================================ */

/* ------------------------------------------
   NAV: scroll behavior
   ------------------------------------------ */
const nav = document.getElementById('nav');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

/* ------------------------------------------
   MOBILE MENU
   ------------------------------------------ */
const mobileMenu = document.getElementById('mobileMenu');
const hamburger  = document.getElementById('hamburger');

function toggleMenu() {
  const isOpen = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeMenu() {
  mobileMenu.classList.remove('open');
  hamburger.classList.remove('open');
  document.body.style.overflow = '';
}

/* ------------------------------------------
   SMOOTH SCROLL (offset for fixed nav)
   ------------------------------------------ */
function smoothScroll(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const offset = 72;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
  closeMenu();
}

/* ------------------------------------------
   REVEAL ON SCROLL
   ------------------------------------------ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
});

document.querySelectorAll('.reveal-up').forEach(el => revealObserver.observe(el));

/* ------------------------------------------
   COUNTER ANIMATION
   ------------------------------------------ */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateCounter(el, target, suffix, duration) {
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value    = Math.round(easeOutCubic(progress) * target);

    el.textContent = value.toLocaleString('es-AR') + (progress >= 1 ? suffix : '');

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    entry.target.querySelectorAll('[data-target]').forEach(el => {
      const target   = parseInt(el.dataset.target, 10);
      const suffix   = el.dataset.suffix || '';
      const duration = target > 1000 ? 2000 : target > 100 ? 1800 : target > 20 ? 1400 : 1000;
      animateCounter(el, target, suffix, duration);
    });

    counterObserver.unobserve(entry.target);
  });
}, { threshold: 0.25 });

document.querySelectorAll('[data-target]').forEach(el => {
  const section = el.closest('section');
  if (section) counterObserver.observe(section);
});

/* ------------------------------------------
   COUNTDOWN
   ------------------------------------------ */
const EVENT_DATE = new Date('2026-09-12T00:00:00-03:00');

function updateCountdown() {
  const now  = Date.now();
  const diff = EVENT_DATE.getTime() - now;

  if (diff <= 0) {
    document.getElementById('cd-dias').textContent  = '000';
    document.getElementById('cd-horas').textContent = '00';
    document.getElementById('cd-min').textContent   = '00';
    document.getElementById('cd-seg').textContent   = '00';
    return;
  }

  const dias  = Math.floor(diff / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const min   = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seg   = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById('cd-dias').textContent  = String(dias).padStart(3, '0');
  document.getElementById('cd-horas').textContent = String(horas).padStart(2, '0');
  document.getElementById('cd-min').textContent   = String(min).padStart(2, '0');
  document.getElementById('cd-seg').textContent   = String(seg).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* ------------------------------------------
   FAQ ACCORDION
   ------------------------------------------ */
document.querySelectorAll('.faq-item').forEach(item => {
  const trigger = item.querySelector('.faq-trigger');
  const body    = item.querySelector('.faq-body');

  trigger.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    // Cerrar todos los demás
    document.querySelectorAll('.faq-item.open').forEach(other => {
      other.classList.remove('open');
      other.querySelector('.faq-body').style.maxHeight = '0';
    });

    if (!isOpen) {
      item.classList.add('open');
      body.style.maxHeight = body.scrollHeight + 'px';
    }
  });
});

/* ------------------------------------------
   EXPANDABLE CARDS
   ------------------------------------------ */
function toggleExpand(id) {
  const card = document.getElementById(id);
  if (!card) return;
  card.classList.toggle('open');
}

/* ------------------------------------------
   INLINE FORM SUBMIT — POST to Cloudflare Worker
   ------------------------------------------ */
const WORKER_URL = 'https://tedx-forms.nqnguille.workers.dev';

async function handleInlineSubmit(e, cardId, successMsg) {
  e.preventDefault();

  const form   = e.target;
  const btn    = form.querySelector('[type="submit"]');
  const inner  = form.closest('.expand-inner');

  // Loading state
  btn.textContent         = 'Enviando...';
  btn.disabled            = true;
  form.style.opacity      = '0.6';
  form.style.pointerEvents = 'none';

  // Honeypot check (client-side)
  if (form.querySelector('[name="_hp"]') && form.querySelector('[name="_hp"]').value) {
    return;
  }

  const formData = new FormData(form);
  const payload  = {};
  formData.forEach((v, k) => { payload[k] = v; });
  payload.formType = cardId;

  try {
    const res = await fetch(WORKER_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (res.ok) {
      inner.innerHTML = `
        <div class="expand-success visible" role="alert">
          <div class="expand-success-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="#E62B1E" stroke-width="1.5"/>
              <path d="M8 14l4 4 8-8" stroke="#E62B1E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h4>Recibido.</h4>
          <p>${successMsg}</p>
        </div>`;
    } else {
      throw new Error('server error');
    }
  } catch {
    form.style.opacity      = '1';
    form.style.pointerEvents = '';
    btn.disabled            = false;
    btn.textContent         = 'Reintentar';

    const errEl = form.querySelector('.inline-form-error') || document.createElement('p');
    errEl.className   = 'inline-form-error';
    errEl.textContent = 'Algo salió mal. Intentá de nuevo.';
    errEl.setAttribute('role', 'alert');
    if (!form.querySelector('.inline-form-error')) form.appendChild(errEl);
  }
}

/* ------------------------------------------
   VIDEO BACKGROUNDS — fade in when ready
   ------------------------------------------ */
document.querySelectorAll('.hero-video, .section-video').forEach(video => {
  video.addEventListener('loadeddata', () => video.classList.add('loaded'));
  if (video.readyState >= 3) video.classList.add('loaded');
});

/* ------------------------------------------
   NAV LINKS: close menu on anchor click
   ------------------------------------------ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    e.preventDefault();
    smoothScroll(id);
  });
});
