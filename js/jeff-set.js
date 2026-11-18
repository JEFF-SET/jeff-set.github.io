/* ============================================
   JEFF-SET — Main JavaScript
   Vanilla JS: Theme, Typing, Scroll Reveal,
   Particles, Cursor Glow, Burger, ScrollSpy
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // THEME TOGGLE
  // ============================================
  const toggle = document.getElementById('toggle-dark');
  const THEME_KEY = 'theme';

  function setTheme(isDark) {
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }

  if (toggle) {
    toggle.addEventListener('change', () => setTheme(toggle.checked));
  }

  // Apply saved theme (default: dark)
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'dark' || saved === null) {
    if (toggle) toggle.checked = true;
    setTheme(true);
  } else {
    if (toggle) toggle.checked = false;
    setTheme(false);
  }

  // ============================================
  // TYPING ANIMATION
  // ============================================
  const typingEl = document.getElementById('typing-text');
  const phrases = [
    'Lead Systems Architect',
    'DevOps Engineer',
    'Cloud Infrastructure',
    'CDN Speed Optimization',
    'Web Performance Expert'
  ];

  if (typingEl) {
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typeSpeed = 70;
    const deleteSpeed = 40;
    const pauseEnd = 2000;
    const pauseStart = 500;

    function typeLoop() {
      const current = phrases[phraseIndex];
      if (!isDeleting) {
        typingEl.textContent = current.substring(0, charIndex + 1);
        charIndex++;
        if (charIndex === current.length) {
          isDeleting = true;
          setTimeout(typeLoop, pauseEnd);
          return;
        }
        setTimeout(typeLoop, typeSpeed);
      } else {
        typingEl.textContent = current.substring(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          setTimeout(typeLoop, pauseStart);
          return;
        }
        setTimeout(typeLoop, deleteSpeed);
      }
    }

    setTimeout(typeLoop, 800);
  }

  // ============================================
  // SCROLL REVEAL (IntersectionObserver)
  // ============================================
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
    // Fallback: show all
    revealElements.forEach((el) => el.classList.add('visible'));
  }

  // ============================================
  // SCROLL SPY — Active nav link
  // ============================================
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-nav a');

  function activateLink(id) {
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + id);
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    const spyObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activateLink(entry.target.id);
          }
        });
      },
      { threshold: 0.2, rootMargin: '-80px 0px -40% 0px' }
    );

    sections.forEach((s) => spyObserver.observe(s));
  }

  // ============================================
  // BURGER MENU
  // ============================================
  const burger = document.querySelector('.burger');
  const mobileNav = document.querySelector('.mobile-nav');

  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.contains('open');
      burger.classList.toggle('active');
      burger.setAttribute('aria-expanded', !isOpen);

      if (isOpen) {
        mobileNav.classList.remove('open');
        document.body.style.overflow = '';
      } else {
        mobileNav.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        burger.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // ============================================
  // PARTICLE GRID ON HERO CANVAS (desktop only)
  // ============================================
  const canvas = document.querySelector('.hero-canvas');

  if (canvas && window.innerWidth > 768) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: -1000, y: -1000 };
    let animFrame;

    function resizeCanvas() {
      const hero = canvas.parentElement;
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
      initParticles();
    }

    function initParticles() {
      particles = [];
      const spacing = 60;
      const cols = Math.ceil(canvas.width / spacing);
      const rows = Math.ceil(canvas.height / spacing);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          particles.push({
            x: i * spacing + spacing / 2,
            y: j * spacing + spacing / 2,
            baseX: i * spacing + spacing / 2,
            baseY: j * spacing + spacing / 2,
            size: 1.5,
          });
        }
      }
    }

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.body.getAttribute('data-theme') === 'dark';
      const dotColor = isDark ? 'rgba(102, 51, 153, 0.25)' : 'rgba(102, 51, 153, 0.1)';
      const glowColor = isDark ? 'rgba(102, 51, 153, 0.7)' : 'rgba(102, 51, 153, 0.35)';
      const lineColor = isDark ? 'rgba(102, 51, 153, 0.12)' : 'rgba(102, 51, 153, 0.05)';

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 150;

        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          p.x = p.baseX - dx * force * 0.3;
          p.y = p.baseY - dy * force * 0.3;
          ctx.fillStyle = glowColor;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size + force * 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          p.x += (p.baseX - p.x) * 0.08;
          p.y += (p.baseY - p.y) * 0.08;
          ctx.fillStyle = dotColor;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // Connect nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const d = Math.sqrt(
            (p.x - p2.x) * (p.x - p2.x) + (p.y - p2.y) * (p.y - p2.y)
          );
          if (d < 70) {
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animFrame = requestAnimationFrame(drawParticles);
    }

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!prefersReducedMotion.matches) {
      resizeCanvas();
      drawParticles();

      window.addEventListener('resize', () => {
        cancelAnimationFrame(animFrame);
        resizeCanvas();
        drawParticles();
      });
    }
  }

  // ============================================
  // CURSOR GLOW (desktop only)
  // ============================================
  const cursorGlow = document.querySelector('.cursor-glow');

  if (cursorGlow && window.innerWidth > 768) {
    let glowX = 0, glowY = 0;
    let currentX = 0, currentY = 0;

    document.addEventListener('mousemove', (e) => {
      glowX = e.clientX;
      glowY = e.clientY;
    });

    function animateGlow() {
      currentX += (glowX - currentX) * 0.15;
      currentY += (glowY - currentY) * 0.15;
      cursorGlow.style.left = currentX + 'px';
      cursorGlow.style.top = currentY + 'px';
      requestAnimationFrame(animateGlow);
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!prefersReducedMotion.matches) {
      animateGlow();
    }
  } else if (cursorGlow) {
    cursorGlow.style.display = 'none';
  }
})();
