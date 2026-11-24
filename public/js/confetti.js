/**
 * Zero-dependency Lightweight Confetti Engine
 * Smooth 60fps canvas particles in celebratory colors (Gold, Coral, Magenta, Sapphire, Cyan)
 * Fully respects prefers-reduced-motion
 */
(function(window) {
  'use strict';

  let canvas = null;
  let ctx = null;
  let particles = [];
  let animationId = null;

  const COLORS = [
    '#ffc83b', // Gold
    '#ff5364', // Coral
    '#ec4899', // Pink (Mysha)
    '#3b82f6', // Blue (Dharv)
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#10b981'  // Emerald
  ];

  function initCanvas() {
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '99999';
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d');
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
    }
  }

  function resizeCanvas() {
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  class Particle {
    constructor(x, y, vx, vy, color, shape, size) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.color = color;
      this.shape = shape || 'rect';
      this.size = size || (Math.random() * 6 + 6);
      this.rotation = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 8;
      this.alpha = 1;
      this.decay = Math.random() * 0.008 + 0.005;
      this.wobble = Math.random() * 10;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.22; // gravity
      this.vx *= 0.99; // drag
      this.rotation += this.rotSpeed;
      this.wobble += 0.1;
      this.alpha -= this.decay;
    }

    draw(context) {
      if (this.alpha <= 0) return;
      context.save();
      context.globalAlpha = Math.max(0, this.alpha);
      context.translate(this.x + Math.sin(this.wobble) * 2, this.y);
      context.rotate((this.rotation * Math.PI) / 180);
      context.fillStyle = this.color;

      if (this.shape === 'circle') {
        context.beginPath();
        context.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        context.fill();
      } else if (this.shape === 'star') {
        const spikes = 5;
        const outerRadius = this.size;
        const innerRadius = this.size / 2;
        let rot = (Math.PI / 2) * 3;
        let step = Math.PI / spikes;
        context.beginPath();
        context.moveTo(0, -outerRadius);
        for (let i = 0; i < spikes; i++) {
          context.lineTo(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius);
          rot += step;
          context.lineTo(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius);
          rot += step;
        }
        context.lineTo(0, -outerRadius);
        context.closePath();
        context.fill();
      } else {
        context.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
      }
      context.restore();
    }
  }

  function loop() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.alpha <= 0 || p.y > canvas.height + 20) {
        particles.splice(i, 1);
      }
    }

    if (particles.length > 0) {
      animationId = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  function launchConfetti(opts = {}) {
    if (prefersReducedMotion()) return;
    initCanvas();

    const count = opts.count || 60;
    const originX = opts.x !== undefined ? opts.x : canvas.width / 2;
    const originY = opts.y !== undefined ? opts.y : canvas.height * 0.4;
    const spread = opts.spread || 70;
    const shapes = ['rect', 'rect', 'circle', 'star'];

    for (let i = 0; i < count; i++) {
      const angle = (Math.random() - 0.5) * (spread * (Math.PI / 180)) - Math.PI / 2;
      const velocity = Math.random() * 12 + 6;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const size = Math.random() * 8 + 6;

      particles.push(new Particle(originX, originY, vx, vy, color, shape, size));
    }

    if (!animationId) {
      loop();
    }
  }

  function celebrate() {
    if (prefersReducedMotion()) return;
    // Multi-cannon burst for big celebrations
    launchConfetti({ x: window.innerWidth * 0.2, y: window.innerHeight * 0.6, count: 50, spread: 60 });
    launchConfetti({ x: window.innerWidth * 0.8, y: window.innerHeight * 0.6, count: 50, spread: 60 });
    setTimeout(() => {
      launchConfetti({ x: window.innerWidth * 0.5, y: window.innerHeight * 0.4, count: 70, spread: 90 });
    }, 250);
  }

  function gentleSparkle() {
    if (prefersReducedMotion()) return;
    // Subtle welcoming shower
    initCanvas();
    const count = 35;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * canvas.width;
      const y = -10 - Math.random() * 40;
      const vx = (Math.random() - 0.5) * 2;
      const vy = Math.random() * 3 + 2;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const shape = Math.random() > 0.4 ? 'star' : 'circle';
      particles.push(new Particle(x, y, vx, vy, color, shape, Math.random() * 6 + 5));
    }
    if (!animationId) loop();
  }

  window.PartyConfetti = {
    launch: launchConfetti,
    celebrate: celebrate,
    sparkle: gentleSparkle
  };
})(window);
