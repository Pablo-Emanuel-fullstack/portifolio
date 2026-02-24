(function () {
  'use strict';

  // Rede interativa: partículas + linhas que reagem ao cursor
  (function initInteractiveBackground() {
    const canvas = document.getElementById('bgParticles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    let particles = [];
    const particleCount = 50;
    const connectDistance = 95;
    const mouseRadius = 140;
    const mouseStrength = 0.22;
    const mouseSmooth = 0.06;

    const mouse = { x: -9999, y: -9999, targetX: -9999, targetY: -9999, active: false };
    const colors = [
      'rgba(45, 212, 191, 0.35)',
      'rgba(148, 163, 184, 0.2)',
      'rgba(241, 245, 249, 0.12)'
    ];

    function setSize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }

    function createParticle() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: Math.random() * 1.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    }

    function setMouse(x, y) {
      mouse.targetX = x;
      mouse.targetY = y;
      mouse.active = true;
    }

    function updateMouse() {
      mouse.x += (mouse.targetX - mouse.x) * mouseSmooth;
      mouse.y += (mouse.targetY - mouse.y) * mouseSmooth;
    }

    function updateParticles() {
      particles.forEach(function (p) {
        if (mouse.active && mouse.x > -9000) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseRadius && dist > 0) {
            const force = (1 - dist / mouseRadius) * mouseStrength;
            const nx = dx / dist;
            const ny = dy / dist;
            p.vx += nx * force;
            p.vy += ny * force;
          }
        }
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) { p.vx *= -0.8; p.x = Math.max(0, Math.min(width, p.x)); }
        if (p.y < 0 || p.y > height) { p.vy *= -0.8; p.y = Math.max(0, Math.min(height, p.y)); }
      });
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > connectDistance) continue;
          const opacity = (1 - dist / connectDistance) * 0.35;
          let lineOpacity = opacity;
          if (mouse.active && mouse.x > -9000) {
            const toMouse = distToSegment(mouse.x, mouse.y, a.x, a.y, b.x, b.y);
            if (toMouse < mouseRadius) {
              lineOpacity = Math.min(0.7, opacity + 0.25 * (1 - toMouse / mouseRadius));
            }
          }
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = 'rgba(45, 212, 191, ' + lineOpacity + ')';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    function distToSegment(px, py, x1, y1, x2, y2) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
      let t = ((px - x1) * dx + (py - y1) * dy) / (len * len);
      t = Math.max(0, Math.min(1, t));
      const qx = x1 + t * dx;
      const qy = y1 + t * dy;
      return Math.sqrt((px - qx) ** 2 + (py - qy) ** 2);
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      updateMouse();
      updateParticles();
      drawConnections();
      particles.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }

    document.addEventListener('mousemove', function (e) {
      setMouse(e.clientX, e.clientY);
      hideInteractionHint();
    });
    document.addEventListener('mouseleave', function () {
      mouse.active = false;
    });
    document.addEventListener('touchstart', function (e) {
      if (e.touches[0]) setMouse(e.touches[0].clientX, e.touches[0].clientY);
      hideInteractionHint();
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (e.touches[0]) setMouse(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    window.addEventListener('resize', function () {
      setSize();
      particles.forEach(function (p) {
        p.x = Math.min(p.x, width);
        p.y = Math.min(p.y, height);
      });
    });

    function init() {
      setSize();
      particles = [];
      for (let i = 0; i < particleCount; i++) particles.push(createParticle());
    }

    init();
    draw();
  })();

  // Dica de interação (some no primeiro movimento)
  function hideInteractionHint() {
    const hint = document.getElementById('interactionHint');
    if (hint && !hint.classList.contains('is-hidden')) {
      hint.classList.add('is-hidden');
    }
  }

  // Animação ao rolar a página
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));

  // Menu mobile
  const toggle = document.querySelector('.nav__toggle');
  const links = document.querySelector('.nav__links');

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('is-open');
      links.classList.toggle('is-open');
      document.body.classList.toggle('nav-open', links.classList.contains('is-open'));
    });

    links.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        toggle.classList.remove('is-open');
        links.classList.remove('is-open');
        document.body.classList.remove('nav-open');
      });
    });
  }

  // Header com leve blur/opacidade ao rolar (opcional)
  const header = document.querySelector('.header');
  if (header) {
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const current = window.scrollY;
      if (current > 80) {
        header.style.background = 'rgba(12, 18, 34, 0.9)';
      } else {
        header.style.background = 'rgba(12, 18, 34, 0.7)';
      }
      lastScroll = current;
    }, { passive: true });
  }
})();
