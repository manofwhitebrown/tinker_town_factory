// Tiny particle system: coin sparks and confetti on one full-screen canvas.
// It only runs while particles exist, so it costs nothing when idle.

const MAX = 160;
const CONFETTI = ['#f2b134', '#d6455d', '#2f7f79', '#6a4fb3', '#3b6fb6', '#4c8c3a'];

export function createFx(root, isEnabled) {
  const canvas = document.createElement('canvas');
  canvas.className = 'fx';
  canvas.setAttribute('aria-hidden', 'true');
  root.append(canvas);
  const g = canvas.getContext('2d');
  let parts = [];
  let raf = 0;
  let last = 0;
  let w = 0;
  let h = 0;
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }
  resize();
  window.addEventListener('resize', resize);

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    parts = parts.filter((p) => p.life > 0);
    for (const p of parts) {
      p.life -= dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      g.globalAlpha = Math.max(0, Math.min(1, p.life / p.fade));
      g.fillStyle = p.color;
      if (p.kind === 'coin') {
        g.beginPath();
        g.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = '#b9780b';
        g.lineWidth = 1.5;
        g.stroke();
      } else {
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.rot);
        g.fillRect(-p.size, -p.size / 2, p.size * 2, p.size);
        g.restore();
      }
    }
    g.globalAlpha = 1;
    if (parts.length) raf = requestAnimationFrame(frame);
    else { raf = 0; g.clearRect(0, 0, w, h); }
  }

  function add(p) {
    if (parts.length >= MAX) parts.shift();
    parts.push(p);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }

  const rand = (a, b) => a + Math.random() * (b - a);

  return {
    /** A few gold sparks flying up from a point. */
    coins(x, y, count = 6) {
      if (!isEnabled()) return;
      for (let i = 0; i < count; i++) {
        const life = rand(0.5, 0.9);
        add({
          kind: 'coin', x, y, vx: rand(-90, 90), vy: rand(-260, -120), gravity: 700,
          size: rand(3, 5), color: '#f2b134', life, fade: life, rot: 0, spin: 0,
        });
      }
    },
    coinsAt(el, count) {
      if (!isEnabled() || !el) return;
      const r = el.getBoundingClientRect();
      this.coins(r.left + r.width * 0.5, r.top + r.height * 0.4, count);
    },
    /** Colored paper from the top of the screen. */
    confetti(count = 70) {
      if (!isEnabled()) return;
      for (let i = 0; i < count; i++) {
        const life = rand(1.4, 2.4);
        add({
          kind: 'paper', x: rand(0, w), y: rand(-30, h * 0.25), vx: rand(-60, 60), vy: rand(60, 220),
          gravity: 160, size: rand(3, 6), color: CONFETTI[i % CONFETTI.length], life, fade: 0.6,
          rot: rand(0, 6), spin: rand(-8, 8),
        });
      }
    },
    clear() { parts = []; },
  };
}
