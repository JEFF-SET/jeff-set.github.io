/* ============================================
   JEFF-SET — Main JavaScript
   Theme Toggle, Typing, Scroll Reveal,
   Ambient Kinetic Canvas, Cursor Glow,
   Burger Menu, ScrollSpy, Copy Email
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // THEME TOGGLE (SVG Button)
  // ============================================
  const toggleBtn = document.getElementById('toggle-dark');
  const THEME_KEY = 'theme';

  function setTheme(isDark) {
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-pressed', String(isDark));
      toggleBtn.setAttribute(
        'aria-label',
        isDark ? 'Switch to light mode' : 'Switch to dark mode'
      );
    }
  }

  const savedTheme = localStorage.getItem(THEME_KEY);
  const initialDark = savedTheme === null ? true : savedTheme === 'dark';
  setTheme(initialDark);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isCurrentlyDark = document.body.getAttribute('data-theme') === 'dark';
      setTheme(!isCurrentlyDark);
    });
  }

  // ============================================
  // TYPING ANIMATION
  // ============================================
  const typingEl = document.getElementById('typing-text');
  const phrases = [
    'Lead Systems Architect',
    'WordPress & Shopify Engineer',
    'Cloudflare Edge Specialist',
    'Cloud Infrastructure & DevOps',
    'Web Performance Architect'
  ];

  if (typingEl) {
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typeSpeed = 65;
    const deleteSpeed = 35;
    const pauseEnd = 2000;
    const pauseStart = 450;

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

    setTimeout(typeLoop, 600);
  }

  // ============================================
  // SCROLL REVEAL (IntersectionObserver)
  // ============================================
  const revealElements = document.querySelectorAll('.reveal, .stagger');

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
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  } else {
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
      { threshold: 0.2, rootMargin: '-80px 0px -45% 0px' }
    );

    sections.forEach((s) => spyObserver.observe(s));
  }

  // ============================================
  // BURGER MENU (Mobile)
  // ============================================
  const burger = document.querySelector('.burger');
  const mobileNav = document.querySelector('.mobile-nav');

  function closeMobileNav() {
    if (!burger || !mobileNav) return;
    mobileNav.classList.remove('open');
    burger.classList.remove('active');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.contains('open');
      if (isOpen) {
        closeMobileNav();
      } else {
        mobileNav.classList.add('open');
        burger.classList.add('active');
        burger.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      }
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMobileNav);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
        closeMobileNav();
      }
    });
  }

  // ============================================
  // FULL-PAGE AMBIENT KINETIC CANVAS
  // ============================================
  const canvas = document.querySelector('.bg-canvas');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  if (canvas && !prefersReducedMotion.matches) {
    const ctx = canvas.getContext('2d');
    let nodes = [];
    const mouse = { x: -9999, y: -9999 };
    let animFrame = null;

    function initNodes() {
      nodes = [];
      const area = window.innerWidth * window.innerHeight;
      const isMobile = window.innerWidth <= 768;
      const count = isMobile
        ? Math.min(30, Math.max(18, Math.floor(area / 22000)))
        : Math.min(68, Math.max(36, Math.floor(area / 20000)));

      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * (isMobile ? 0.42 : 0.58),
          vy: (Math.random() - 0.5) * (isMobile ? 0.42 : 0.58),
          radius: Math.random() * 1.9 + 1.3
        });
      }
    }

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initNodes();
    }

    function drawNetwork() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.body.getAttribute('data-theme') === 'dark';
      const dotColor = isDark ? 'rgba(166, 120, 245, 0.48)' : 'rgba(102, 51, 153, 0.34)';
      const lineRgb = isDark ? '166, 120, 245' : '102, 51, 153';
      const maxLinkDist = window.innerWidth <= 768 ? 130 : 170;
      const mouseDist = 200;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

        // Subtle pointer glow lines on desktop
        if (window.innerWidth > 768) {
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseDist && dist > 1) {
            const pull = (mouseDist - dist) / mouseDist;
            ctx.strokeStyle = `rgba(${lineRgb}, ${(pull * (isDark ? 0.42 : 0.28)).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = dotColor;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n.x - n2.x;
          const dy = n.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxLinkDist) {
            const alpha = (1 - dist / maxLinkDist) * (isDark ? 0.25 : 0.16);
            ctx.strokeStyle = `rgba(${lineRgb}, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.85;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      animFrame = requestAnimationFrame(drawNetwork);
    }

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (animFrame) cancelAnimationFrame(animFrame);
        resizeCanvas();
        drawNetwork();
      }, 150);
    });

    resizeCanvas();
    drawNetwork();
  }

  // ============================================
  // CURSOR GLOW (desktop only, preserved)
  // ============================================
  const cursorGlow = document.querySelector('.cursor-glow');

  if (cursorGlow && window.innerWidth > 768 && !prefersReducedMotion.matches) {
    let glowX = -400;
    let glowY = -400;
    let currentX = -400;
    let currentY = -400;

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

    animateGlow();
  } else if (cursorGlow) {
    cursorGlow.style.display = 'none';
  }

  // ============================================
  // COPY EMAIL BUTTON IN CONTACT TERMINAL
  // ============================================
  const copyEmailBtn = document.getElementById('copy-email-btn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', () => {
      const email = 'info@jeff-set.com';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(() => {
          copyEmailBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyEmailBtn.textContent = 'Copy Email';
          }, 2000);
        }).catch(() => {
          copyEmailBtn.textContent = email;
        });
      } else {
        copyEmailBtn.textContent = email;
      }
    });
  }
})();
