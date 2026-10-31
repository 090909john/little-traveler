// 抵達煙火（Canvas）
const Fireworks = (() => {
  let raf = null;
  function start(canvas, ms = 4000) {
    const c = canvas.getContext('2d'); const dpr = window.devicePixelRatio || 1;
    const W = canvas.clientWidth, H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr; c.scale(dpr, dpr);
    const parts = []; const colors = ['#ff5a5f', '#ffd400', '#5ccf6b', '#7ec8f0', '#c77dff', '#ff9f1c'];
    const t0 = performance.now(); let lastBurst = 0;
    function burst() {
      const x = W * (.15 + Math.random() * .7), y = H * (.12 + Math.random() * .4), col = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 60; i++) { const a = Math.PI * 2 * i / 60, s = 2 + Math.random() * 4; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, col }); }
      Sound.play('pop');
    }
    cancelAnimationFrame(raf);
    function frame(now) {
      if (now - lastBurst > 450 && now - t0 < ms) { burst(); lastBurst = now; }
      c.clearRect(0, 0, W, H);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.06; p.vx *= .98; p.life -= 0.013;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        c.globalAlpha = p.life; c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, 3.5, 0, 7); c.fill();
      }
      c.globalAlpha = 1;
      if (now - t0 < ms || parts.length) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }
  return { start };
})();
