/* =============================================
   MAGNETIC PARTICLES BACKGROUND
   ============================================= */
(function () {
  const canvas = document.getElementById('gridCanvas');
  const ctx    = canvas.getContext('2d');

  const PALETTE = [
    [8,   148, 255],
    [201, 89,  221],
    [255, 46,  84 ],
    [255, 144, 4  ],
  ];

  const N           = 110;   /* particle count */
  const LINK_DIST   = 140;   /* max distance to draw a link */
  const MOUSE_REP   = 180;   /* mouse repulsion radius */
  const MOUSE_STR   = 5500;  /* mouse repulsion force */
  const ATTRACT_STR = 0.012; /* soft attraction toward screen centre */
  const FRICTION    = 0.88;  /* velocity damping */
  const DRIFT       = 0.08;  /* random drift force */

  let W, H;
  let mouse  = { x: -9999, y: -9999 };
  let smooth = { x: -9999, y: -9999 };

  /* ---- Particle pool ---- */
  let pts = [];

  function spawn(i) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    return {
      x, y,
      ox: x, oy: y,   /* home position */
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      ci: i % 4,
      r:  1.2 + Math.random() * 1.0,
      phase: Math.random() * Math.PI * 2,
      lastPush: 0,
    };
  }

  function init() {
    pts = [];
    for (let i = 0; i < N; i++) pts.push(spawn(i));
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    init();
  }
  window.addEventListener('resize', resize, { passive: true });
  resize();

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
  }, { passive: true });
  window.addEventListener('mouseleave', () => {
    mouse.x = -9999; mouse.y = -9999;
  });

  /* ---- Spatial hash for neighbour queries (performance) ---- */
  const CELL = LINK_DIST;
  let grid = {};

  function gridKey(x, y) {
    return `${Math.floor(x / CELL)}_${Math.floor(y / CELL)}`;
  }

  function buildGrid() {
    grid = {};
    for (let i = 0; i < pts.length; i++) {
      const k = gridKey(pts[i].x, pts[i].y);
      if (!grid[k]) grid[k] = [];
      grid[k].push(i);
    }
  }

  function neighbours(x, y) {
    const cx = Math.floor(x / CELL);
    const cy = Math.floor(y / CELL);
    const out = [];
    for (let ox = -1; ox <= 1; ox++)
      for (let oy = -1; oy <= 1; oy++) {
        const k = `${cx+ox}_${cy+oy}`;
        if (grid[k]) for (const idx of grid[k]) out.push(idx);
      }
    return out;
  }

  let lastTs = 0;

  function draw(ts) {
    requestAnimationFrame(draw);
    const dt = Math.min(ts - lastTs, 32) / 16; /* normalised ~1 at 60fps */
    lastTs = ts;
    const t = ts * 0.001;

    /* Smooth mouse */
    if (smooth.x < 0) { smooth.x = mouse.x; smooth.y = mouse.y; }
    else {
      smooth.x += (mouse.x - smooth.x) * 0.07;
      smooth.y += (mouse.y - smooth.y) * 0.07;
    }

    /* Fade trail */
    ctx.fillStyle = 'rgba(10,10,18,0.22)';
    ctx.fillRect(0, 0, W, H);

    buildGrid();

    /* ---- Update physics ---- */
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];

      /* Random drift */
      p.vx += (Math.random() - 0.5) * DRIFT * dt;
      p.vy += (Math.random() - 0.5) * DRIFT * dt;

      /* Return-home attraction — kicks in after 2s without mouse push */
      const timeSincePush = t - p.lastPush;
      const homeStr = timeSincePush > 2 ? Math.min(1, (timeSincePush - 2) / 3) * 0.018 : 0;
      p.homeStr = homeStr; /* store for render pass */
      p.vx += (p.ox - p.x) * homeStr * dt;
      p.vy += (p.oy - p.y) * homeStr * dt;

      /* Mouse repulsion */
      if (smooth.x > 0) {
        const dx = p.x - smooth.x;
        const dy = p.y - smooth.y;
        const d2 = dx*dx + dy*dy;
        if (d2 < MOUSE_REP * MOUSE_REP && d2 > 0.1) {
          const d   = Math.sqrt(d2);
          const f   = MOUSE_STR / (d2 + 100);
          p.vx += (dx / d) * f * dt;
          p.vy += (dy / d) * f * dt;
          p.lastPush = t;
        }
      }

      /* Friction */
      p.vx *= FRICTION;
      p.vy *= FRICTION;

      /* Clamp max speed */
      const spd = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
      if (spd > 3.5) { p.vx = p.vx/spd*3.5; p.vy = p.vy/spd*3.5; }

      /* Integrate */
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      /* Bounce off edges */
      if (p.x < 0)   { p.x = 0;  p.vx *= -0.6; }
      if (p.x > W)   { p.x = W;  p.vx *= -0.6; }
      if (p.y < 0)   { p.y = 0;  p.vy *= -0.6; }
      if (p.y > H)   { p.y = H;  p.vy *= -0.6; }
    }

    /* ---- Draw links ---- */
    ctx.lineCap = 'round';
    const drawn = new Uint8Array(pts.length * pts.length); /* avoid double draw */

    for (let i = 0; i < pts.length; i++) {
      const p   = pts[i];
      const nb  = neighbours(p.x, p.y);
      const [r, g, b] = PALETTE[p.ci];

      for (const j of nb) {
        if (j <= i) continue;
        const q  = pts[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d > LINK_DIST) continue;

        /* Mouse proximity brightens links */
        let mBoost = 0;
        if (smooth.x > 0) {
          const mx = (p.x + q.x) * 0.5 - smooth.x;
          const my = (p.y + q.y) * 0.5 - smooth.y;
          const md = Math.sqrt(mx*mx + my*my);
          mBoost = Math.max(0, 1 - md / MOUSE_REP) * 0.5;
        }

        const alpha = (1 - d / LINK_DIST) * (0.025 + mBoost * 0.25);
        const [r2, g2, b2] = PALETTE[q.ci];

        /* Gradient link — colour A → colour B */
        const grad = ctx.createLinearGradient(p.x, p.y, q.x, q.y);
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha.toFixed(3)})`);
        grad.addColorStop(1, `rgba(${r2},${g2},${b2},${alpha.toFixed(3)})`);

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 0.7 + mBoost * 1.2;
        ctx.stroke();
      }
    }

    /* ---- Erase trails: bg-coloured eraser disc under returning particles ---- */
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      if (!p.homeStr || p.homeStr < 0.01) continue;
      const spd = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
      /* Erase strength = how hard we're pulling home × how fast we're moving */
      const eraseA = Math.min(0.92, p.homeStr * 18 * (0.2 + spd * 0.5));
      const eraseR = 6 + p.homeStr * 22;
      const eg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, eraseR);
      eg.addColorStop(0,   `rgba(10,10,18,${eraseA.toFixed(3)})`);
      eg.addColorStop(0.6, `rgba(10,10,18,${(eraseA * 0.5).toFixed(3)})`);
      eg.addColorStop(1,   'rgba(10,10,18,0)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, eraseR, 0, Math.PI * 2);
      ctx.fillStyle = eg;
      ctx.fill();
    }

    /* ---- Draw particles ---- */
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const [r, g, b] = PALETTE[p.ci];

      /* Mouse proximity boost */
      let mBoost = 0;
      if (smooth.x > 0) {
        const dx = p.x - smooth.x, dy = p.y - smooth.y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        mBoost = Math.max(0, 1 - d / MOUSE_REP);
      }

      /* Pulse via sine */
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + p.phase);
      const radius = p.r + pulse * 0.6 + mBoost * 3.5;
      const alpha  = 0.12 + pulse * 0.08 + mBoost * 0.18;

      /* Glow halo when near mouse */
      if (mBoost > 0.15) {
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 6);
        grd.addColorStop(0, `rgba(${r},${g},${b},${(mBoost * 0.10).toFixed(2)})`);
        grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 6, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      /* Core — radial gradient for depth */
      const shine = ctx.createRadialGradient(
        p.x - radius * 0.3, p.y - radius * 0.3, radius * 0.05,
        p.x, p.y, radius
      );
      shine.addColorStop(0, `rgba(255,255,255,${(alpha * 0.5).toFixed(2)})`);
      shine.addColorStop(0.5, `rgba(${r},${g},${b},${alpha.toFixed(2)})`);
      shine.addColorStop(1, `rgba(${Math.round(r*0.4)},${Math.round(g*0.4)},${Math.round(b*0.4)},${(alpha*0.3).toFixed(2)})`);

      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = shine;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  requestAnimationFrame(draw);
})();

/* =============================================
   TRANSLATIONS
   ============================================= */
const translations = {
  fr: {
    "nav.agency":   "L'Agence",
    "nav.services": "Nos services",
    "nav.team":     "Notre équipe",
    "nav.faq":      "FAQ",
    "nav.contact":  "Contact",
    "hero.eyebrow": "Studio créatif & digital",
    "hero.title":   "Nous transformons<br />vos idées en&nbsp;<span class=\"hero__accent\">réalités</span>.",
    "hero.sub":     "Stratégie, design et développement pour des marques qui veulent marquer les esprits.",
    "hero.cta":     "Démarrer un projet",
    "hero.work":    "Nos réalisations",
  },
  en: {
    "nav.agency":   "The Agency",
    "nav.services": "Our services",
    "nav.team":     "Our team",
    "nav.faq":      "FAQ",
    "nav.contact":  "Contact",
    "hero.eyebrow": "Creative & digital studio",
    "hero.title":   "We turn your ideas into&nbsp;<span class=\"hero__accent\">reality</span>.",
    "hero.sub":     "Strategy, design and development for brands that want to leave a lasting impression.",
    "hero.cta":     "Start a project",
    "hero.work":    "Our work",
  },
  es: {
    "nav.agency":   "La Agencia",
    "nav.services": "Nuestros servicios",
    "nav.team":     "Nuestro equipo",
    "nav.faq":      "FAQ",
    "nav.contact":  "Contacto",
    "hero.eyebrow": "Estudio creativo & digital",
    "hero.title":   "Transformamos tus ideas en&nbsp;<span class=\"hero__accent\">realidades</span>.",
    "hero.sub":     "Estrategia, diseño y desarrollo para marcas que quieren dejar huella.",
    "hero.cta":     "Iniciar un proyecto",
    "hero.work":    "Nuestros proyectos",
  },
  it: {
    "nav.agency":   "L'Agenzia",
    "nav.services": "I nostri servizi",
    "nav.team":     "Il nostro team",
    "nav.faq":      "FAQ",
    "nav.contact":  "Contatti",
    "hero.eyebrow": "Studio creativo & digitale",
    "hero.title":   "Trasformiamo le vostre idee in&nbsp;<span class=\"hero__accent\">realtà</span>.",
    "hero.sub":     "Strategia, design e sviluppo per brand che vogliono lasciare il segno.",
    "hero.cta":     "Avvia un progetto",
    "hero.work":    "I nostri lavori",
  },
  de: {
    "nav.agency":   "Die Agentur",
    "nav.services": "Unsere Leistungen",
    "nav.team":     "Unser Team",
    "nav.faq":      "FAQ",
    "nav.contact":  "Kontakt",
    "hero.eyebrow": "Kreativ- & Digitalstudio",
    "hero.title":   "Wir verwandeln Ihre Ideen in&nbsp;<span class=\"hero__accent\">Realität</span>.",
    "hero.sub":     "Strategie, Design und Entwicklung für Marken, die Eindruck hinterlassen wollen.",
    "hero.cta":     "Projekt starten",
    "hero.work":    "Unsere Projekte",
  },
};

/* =============================================
   LANGUAGE SWITCHER
   ============================================= */
const langSwitcher  = document.getElementById('langSwitcher');
const langFlag      = document.getElementById('langFlag');
const langToggle    = langSwitcher.querySelector('.lang__current');
const langOptions   = langSwitcher.querySelectorAll('.lang__option');

let currentLang = 'fr';

function applyLanguage(lang) {
  const dict = translations[lang];
  if (!dict) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) {
      el.innerHTML = dict[key];
    }
  });

  document.documentElement.lang = lang;
  langFlag.textContent = lang.toUpperCase();
  currentLang = lang;

  langOptions.forEach(opt => {
    opt.classList.toggle('lang__option--active', opt.dataset.lang === lang);
  });
}

langToggle.addEventListener('click', () => {
  const isOpen = langSwitcher.classList.toggle('open');
  langToggle.setAttribute('aria-expanded', isOpen);
});

langOptions.forEach(option => {
  option.addEventListener('click', () => {
    applyLanguage(option.dataset.lang);
    langSwitcher.classList.remove('open');
    langToggle.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('click', e => {
  if (!langSwitcher.contains(e.target)) {
    langSwitcher.classList.remove('open');
    langToggle.setAttribute('aria-expanded', 'false');
  }
});

/* =============================================
   HEADER SCROLL
   ============================================= */
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });
